import { VendRequest } from '../vending/types';
import { VendingRouter } from '../vending/router';
import { History } from './products';
import { TopUpCredit } from './service';

export type DeliveryResult =
  | { status: 'delivered'; token?: string; providerRef: string; replayed: boolean }
  | { status: 'pending'; reason: string }
  | { status: 'cancelled'; code: string }
  | { status: 'declined'; code: string };

export interface AdvanceRequest {
  tenantId: string; subjectId: string; productId: string; amountMinor: bigint; requestId: string; history: History; now?: Date;
  /** Where to deliver: msisdn for airtime and data, meterNumber for electricity. */
  target: Pick<VendRequest, 'msisdn' | 'operator' | 'meterNumber' | 'municipality' | 'customerName'>;
}

/** Issue the advance, deliver the airtime or token, and keep the books right whatever the delivery outcome. */
export class AdvanceDelivery {
  constructor(private credit: TopUpCredit, private router: VendingRouter) {}

  async request(a: AdvanceRequest): Promise<DeliveryResult> {
    const p = this.credit.getProduct(a.productId);
    let issued;
    try { issued = await this.credit.issue(a); }
    catch (e: any) { return { status: 'declined', code: e?.code ?? 'ERROR' }; }

    const out = await this.router.vend({
      reference: a.requestId, country: p.jurisdiction, commodity: p.commodity, amountMinor: a.amountMinor, currency: p.currency, ...a.target,
    });
    if (out.status === 'success') return { status: 'delivered', token: out.token, providerRef: out.providerRef, replayed: issued.replayed };
    if (out.status === 'failed') { await this.credit.cancel(a.tenantId, a.requestId); return { status: 'cancelled', code: out.code }; }
    await this.credit.markPending(a.tenantId, a.requestId);
    return { status: 'pending', reason: out.reason };
  }

  /** Daily job and manual tool: look up deliveries whose outcome was unknown and settle them. */
  async settlePending(tenantId: string, requestId: string): Promise<DeliveryResult> {
    const out = await this.router.resolve(requestId);
    if (out.status === 'success') { await this.credit.confirm(tenantId, requestId); return { status: 'delivered', token: out.token, providerRef: out.providerRef, replayed: false }; }
    if (out.status === 'failed') { await this.credit.cancel(tenantId, requestId); return { status: 'cancelled', code: out.code }; }
    return { status: 'pending', reason: out.reason };
  }
}
