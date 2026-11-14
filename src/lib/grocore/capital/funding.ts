import { LedgerService } from '../ledger/ledger';
import { mulBps } from '../shared/money';

/**
 * Funding is a mesh of facilities, not one lender. Each facility has its own currency, scope, limit, price and
 * performance triggers, all held as data, so a new funder (bank, development lender, pension fund, impact
 * fund or a digital-native source) is added by configuration. Funding is matched to the currency of the asset,
 * so a kwacha advance is never funded from a rand facility.
 */
export interface Facility {
  id: string; funder: string; countries: ('ZA' | 'MW')[]; currency: string; products: string[] | '*';
  limitMinor: bigint; drawnMinor: bigint;
  /** Lower number is used first. */
  priority: number;
  /** Funder's cost on each advance, in basis points of principal (a flat simplification). */
  costBps: number;
  /** Performance triggers: breaching either suspends new draws. */
  minRecoveryRateBps?: number; maxChargeOffBps?: number;
  status: 'active' | 'suspended' | 'amortising';
}
export interface Allocation { requestId: string; facilityId: string; principalMinor: bigint; costBps: number; repaidMinor: bigint }

export interface FacilityRepo {
  list(): Promise<Facility[]>;
  save(f: Facility): Promise<void>;
  allocation(requestId: string): Promise<Allocation | undefined>;
  saveAllocation(a: Allocation): Promise<void>;
}
export class InMemoryFacilityRepo implements FacilityRepo {
  private f = new Map<string, Facility>(); private a = new Map<string, Allocation>();
  constructor(facilities: Facility[] = []) { facilities.forEach((x) => this.f.set(x.id, { ...x })); }
  async list() { return [...this.f.values()]; }
  async save(x: Facility) { this.f.set(x.id, x); }
  async allocation(r: string) { return this.a.get(r); }
  async saveAllocation(x: Allocation) { this.a.set(x.requestId, x); }
}

export class FundingError extends Error { constructor(public readonly code: string, m: string) { super(m); } }

export const fundingAcct = {
  supplier: (commodity: string) => `supplier_payable:${commodity}`,
  funder: (facilityId: string) => `funder_payable:${facilityId}`,
  cost: 'funding_cost_expense',
  clearing: 'collections_clearing',
};

/** Peak float needed: daily advances times the days they stay outstanding, plus a safety buffer. */
export function estimateFloat(p: { dailyAdvancesMinor: bigint; avgDaysOutstanding: number; bufferBps: number }): bigint {
  if (p.avgDaysOutstanding < 0 || p.bufferBps < 0) throw new RangeError('inputs must be non-negative');
  return (p.dailyAdvancesMinor * BigInt(Math.ceil(p.avgDaysOutstanding)) * BigInt(10000 + p.bufferBps)) / 10000n;
}

export class FundingService {
  constructor(private ledger: LedgerService, private repo: FacilityRepo) {}

  /** Choose a facility for an advance and move the obligation from the supplier to the funder. Idempotent per request. */
  async allocate(a: { tenantId: string; requestId: string; productId: string; country: 'ZA' | 'MW'; currency: string; commodity: string; principalMinor: bigint }) {
    const prior = await this.repo.allocation(a.requestId);
    if (prior) return { facilityId: prior.facilityId, replayed: true };
    const eligible = (await this.repo.list())
      .filter((f) => f.status === 'active' && f.currency === a.currency && f.countries.includes(a.country)
        && (f.products === '*' || f.products.includes(a.productId)) && f.limitMinor - f.drawnMinor >= a.principalMinor)
      .sort((x, y) => x.priority - y.priority || Number((x.drawnMinor * 10000n) / (x.limitMinor || 1n) - (y.drawnMinor * 10000n) / (y.limitMinor || 1n)));
    const f = eligible[0];
    if (!f) throw new FundingError('FUNDING_UNAVAILABLE', 'no facility can fund this advance');
    await this.ledger.post({
      tenantId: a.tenantId, idempotencyKey: `${a.requestId}:funded`, reason: 'advance_funded', correlationId: a.requestId, currency: a.currency,
      lines: [{ account: fundingAcct.supplier(a.commodity), amount: a.principalMinor }, { account: fundingAcct.funder(f.id), amount: -a.principalMinor }],
    });
    f.drawnMinor += a.principalMinor; await this.repo.save(f);
    await this.repo.saveAllocation({ requestId: a.requestId, facilityId: f.id, principalMinor: a.principalMinor, costBps: f.costBps, repaidMinor: 0n });
    return { facilityId: f.id, replayed: false };
  }

  /** Funding fell through (delivery failed): release the draw. */
  async release(a: { tenantId: string; requestId: string; currency: string; commodity: string }) {
    const al = await this.repo.allocation(a.requestId);
    if (!al || al.repaidMinor > 0n) return;
    await this.ledger.post({
      tenantId: a.tenantId, idempotencyKey: `${a.requestId}:funding_released`, reason: 'advance_funding_released', correlationId: a.requestId, currency: a.currency,
      lines: [{ account: fundingAcct.funder(al.facilityId), amount: al.principalMinor }, { account: fundingAcct.supplier(a.commodity), amount: -al.principalMinor }],
    });
    const f = (await this.repo.list()).find((x) => x.id === al.facilityId)!;
    f.drawnMinor -= al.principalMinor; await this.repo.save(f);
    await this.repo.saveAllocation({ ...al, repaidMinor: al.principalMinor });
  }

  /** Pay the funder its principal share, plus its cost, out of what was recovered from the customer. */
  async repayFromRecovery(a: { tenantId: string; requestId: string; topupRef: string; currency: string; takenMinor: bigint; principalMinor: bigint; feeMinor: bigint }) {
    const al = await this.repo.allocation(a.requestId);
    if (!al) return { paid: 0n };
    const share = (a.takenMinor * a.principalMinor) / (a.principalMinor + a.feeMinor);
    const principalPart = share > al.principalMinor - al.repaidMinor ? al.principalMinor - al.repaidMinor : share;
    if (principalPart <= 0n) return { paid: 0n };
    const cost = mulBps(principalPart, BigInt(al.costBps));
    const lines = [{ account: fundingAcct.funder(al.facilityId), amount: principalPart }, { account: fundingAcct.clearing, amount: -(principalPart + cost) }];
    if (cost > 0n) lines.splice(1, 0, { account: fundingAcct.cost, amount: cost });
    await this.ledger.post({ tenantId: a.tenantId, idempotencyKey: `${a.topupRef}:funder`, reason: 'funder_repaid', correlationId: a.topupRef, currency: a.currency, lines });
    const f = (await this.repo.list()).find((x) => x.id === al.facilityId)!;
    f.drawnMinor -= principalPart; await this.repo.save(f);
    await this.repo.saveAllocation({ ...al, repaidMinor: al.repaidMinor + principalPart });
    return { paid: principalPart + cost };
  }

  /** Performance triggers as code: suspend new draws on a breach, resume when performance recovers. */
  async applyPerformance(stats: { recoveryRateBps: number; chargeOffBps: number }) {
    for (const f of await this.repo.list()) {
      if (f.status === 'amortising') continue;
      const breach = (f.minRecoveryRateBps !== undefined && stats.recoveryRateBps < f.minRecoveryRateBps)
        || (f.maxChargeOffBps !== undefined && stats.chargeOffBps > f.maxChargeOffBps);
      const next = breach ? 'suspended' : 'active';
      if (next !== f.status) { f.status = next; await this.repo.save(f); }
    }
  }

  async headroom(currency: string) {
    return (await this.repo.list()).filter((f) => f.status === 'active' && f.currency === currency).reduce((s, f) => s + (f.limitMinor - f.drawnMinor), 0n);
  }
}
