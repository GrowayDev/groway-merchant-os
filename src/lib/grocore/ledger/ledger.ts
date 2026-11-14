import { uuidv7 } from '../shared/ids';

/** Signed amounts: debit positive, credit negative. Every entry must sum to zero. */
export interface Line { account: string; amount: bigint }
export interface EntryInput {
  tenantId: string;
  idempotencyKey: string;
  reason: string;
  correlationId: string;
  currency: string;
  lines: Line[];
}
export interface Entry extends EntryInput { id: string; postedAt: Date }
export interface OutboxEvent { id: string; topic: string; payload: unknown }

/** Port. A Postgres/Prisma adapter must write the entry and outbox row in ONE transaction. */
export interface LedgerRepo {
  findByKey(tenantId: string, key: string): Promise<Entry | undefined>;
  appendWithOutbox(entry: Entry, event: OutboxEvent): Promise<void>;
  entries(tenantId: string): Promise<readonly Entry[]>;
}

export class LedgerError extends Error {
  constructor(public readonly code: string, message: string) { super(message); }
}

const fingerprint = (i: EntryInput) =>
  [i.reason, i.currency, ...i.lines.map((l) => `${l.account}:${l.amount}`)].join('|');

export class InMemoryLedgerRepo implements LedgerRepo {
  private byKey = new Map<string, Entry>();
  private byTenant = new Map<string, Entry[]>();
  readonly outbox: OutboxEvent[] = [];

  async findByKey(t: string, k: string) { return this.byKey.get(`${t}/${k}`); }
  async appendWithOutbox(e: Entry, ev: OutboxEvent) {
    this.byKey.set(`${e.tenantId}/${e.idempotencyKey}`, e);
    const list = this.byTenant.get(e.tenantId) ?? [];
    list.push(e);
    this.byTenant.set(e.tenantId, list);
    this.outbox.push(ev);
  }
  async entries(t: string) { return this.byTenant.get(t) ?? []; }
}

export class LedgerService {
  constructor(private readonly repo: LedgerRepo) {}

  async post(input: EntryInput): Promise<{ entry: Entry; replayed: boolean }> {
    if (!/^[A-Z]{3}$/.test(input.currency)) throw new LedgerError('BAD_CURRENCY', 'currency must be ISO 4217');
    if (input.lines.length < 2) throw new LedgerError('TOO_FEW_LINES', 'an entry needs at least two lines');
    let sum = 0n;
    for (const l of input.lines) {
      if (!l.account) throw new LedgerError('NO_ACCOUNT', 'every line needs an account');
      if (l.amount === 0n) throw new LedgerError('ZERO_AMOUNT', 'zero-amount lines are not allowed');
      sum += l.amount;
    }
    if (sum !== 0n) throw new LedgerError('UNBALANCED', `entry sums to ${sum}, expected 0`);

    const existing = await this.repo.findByKey(input.tenantId, input.idempotencyKey);
    if (existing) {
      if (fingerprint(existing) !== fingerprint(input)) {
        throw new LedgerError('IDEMPOTENCY_CONFLICT', 'same key reused with different content');
      }
      return { entry: existing, replayed: true };
    }
    const entry: Entry = { ...input, id: uuidv7(), postedAt: new Date() };
    await this.repo.appendWithOutbox(entry, {
      id: uuidv7(),
      topic: 'ledger.entry.posted',
      payload: { entryId: entry.id, tenantId: entry.tenantId, reason: entry.reason, correlationId: entry.correlationId },
    });
    return { entry, replayed: false };
  }

  async get(tenantId: string, key: string) { return this.repo.findByKey(tenantId, key); }

  async balance(tenantId: string, account: string): Promise<bigint> {
    let b = 0n;
    for (const e of await this.repo.entries(tenantId)) for (const l of e.lines) if (l.account === account) b += l.amount;
    return b;
  }

  /** Sum of all lines across the tenant. Must always be zero. */
  async trialBalanceTotal(tenantId: string): Promise<bigint> {
    let t = 0n;
    for (const e of await this.repo.entries(tenantId)) for (const l of e.lines) t += l.amount;
    return t;
  }
}
