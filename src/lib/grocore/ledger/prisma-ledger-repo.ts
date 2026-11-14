import type { Entry, LedgerRepo, OutboxEvent } from './ledger';

/** Minimal structural types so this adapter compiles without importing the generated Prisma client. */
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface GroCoreTx {
  grocoreJournalEntry: { findUnique(a: any): Promise<any>; create(a: any): Promise<any>; findMany(a: any): Promise<any[]> };
  grocoreAccount: { upsert(a: any): Promise<{ id: string }> };
  grocoreOutbox: { create(a: any): Promise<any> };
}
export interface GroCoreDb extends GroCoreTx { $transaction<T>(fn: (tx: GroCoreTx) => Promise<T>): Promise<T> }

const toEntry = (r: any): Entry => ({
  id: r.id, tenantId: r.tenantId, idempotencyKey: r.idempotencyKey, reason: r.reason,
  correlationId: r.correlationId, currency: r.currency, postedAt: r.postedAt,
  lines: r.lines.map((l: any) => ({ account: l.account.code, amount: BigInt(l.amountMinor) })),
});
const include = { lines: { include: { account: true } } };

/** Prisma-backed ledger. The entry, its lines and its outbox row commit in ONE transaction. */
export class PrismaLedgerRepo implements LedgerRepo {
  constructor(private readonly db: GroCoreDb) {}

  async findByKey(tenantId: string, key: string) {
    const r = await this.db.grocoreJournalEntry.findUnique({ where: { tenantId_idempotencyKey: { tenantId, idempotencyKey: key } }, include });
    return r ? toEntry(r) : undefined;
  }

  async appendWithOutbox(entry: Entry, event: OutboxEvent) {
    await this.db.$transaction(async (tx) => {
      const lines = [];
      for (const l of entry.lines) {
        const acc = await tx.grocoreAccount.upsert({
          where: { tenantId_code: { tenantId: entry.tenantId, code: l.account } },
          create: { id: `${entry.tenantId}:${l.account}`, tenantId: entry.tenantId, code: l.account, kind: l.account.split(':')[0], currency: entry.currency },
          update: {},
        });
        lines.push({ id: `${entry.id}:${lines.length}`, accountId: acc.id, amountMinor: l.amount, currency: entry.currency });
      }
      await tx.grocoreJournalEntry.create({
        data: { id: entry.id, tenantId: entry.tenantId, idempotencyKey: entry.idempotencyKey, reason: entry.reason,
          correlationId: entry.correlationId, currency: entry.currency, postedAt: entry.postedAt, lines: { create: lines } },
      });
      await tx.grocoreOutbox.create({ data: { id: event.id, tenantId: entry.tenantId, topic: event.topic, payload: Buffer.from(JSON.stringify(event.payload)) } });
    });
  }

  async entries(tenantId: string) {
    const rows = await this.db.grocoreJournalEntry.findMany({ where: { tenantId }, include, orderBy: { postedAt: 'asc' } });
    return rows.map(toEntry);
  }
}
