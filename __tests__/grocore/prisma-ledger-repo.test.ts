/** @jest-environment node */
import { PrismaLedgerRepo, GroCoreDb, GroCoreTx } from '../../src/lib/grocore/ledger/prisma-ledger-repo';
import { LedgerService } from '../../src/lib/grocore/ledger/ledger';

/** Fake Prisma client: checks the adapter's call shapes and transaction boundary, not a real database. */
function fakeDb() {
  const entries: any[] = []; const accounts = new Map<string, any>(); const outbox: any[] = [];
  let failOutbox = false;
  const tx = (): GroCoreTx => ({
    grocoreAccount: { upsert: async ({ where, create }: any) => { const k = `${where.tenantId_code.tenantId}/${where.tenantId_code.code}`; if (!accounts.has(k)) accounts.set(k, create); return accounts.get(k); } },
    grocoreJournalEntry: {
      create: async ({ data }: any) => { entries.push({ ...data, lines: data.lines.create.map((l: any) => ({ ...l, account: [...accounts.values()].find((a) => a.id === l.accountId) })) }); },
      findUnique: async ({ where }: any) => entries.find((e) => e.tenantId === where.tenantId_idempotencyKey.tenantId && e.idempotencyKey === where.tenantId_idempotencyKey.idempotencyKey) ?? null,
      findMany: async ({ where }: any) => entries.filter((e) => e.tenantId === where.tenantId),
    },
    grocoreOutbox: { create: async ({ data }: any) => { if (failOutbox) throw new Error('outbox down'); outbox.push(data); } },
  });
  const db: GroCoreDb = {
    ...tx(),
    $transaction: async (fn) => { const snap = [entries.length, outbox.length]; try { return await fn(tx()); } catch (e) { entries.length = snap[0]!; outbox.length = snap[1]!; throw e; } },
  };
  return { db, entries, outbox, setFail: (v: boolean) => { failOutbox = v; } };
}
const b = { tenantId: 't1', correlationId: 'c', currency: 'ZAR', reason: 'x' };

describe('PrismaLedgerRepo', () => {
  it('round-trips entries, bigint amounts and idempotent replays', async () => {
    const f = fakeDb(); const ledger = new LedgerService(new PrismaLedgerRepo(f.db));
    const lines = [{ account: 'trust_bank', amount: 12345n }, { account: 'lender_funding', amount: -12345n }];
    const a = await ledger.post({ ...b, idempotencyKey: 'k1', lines });
    const again = await ledger.post({ ...b, idempotencyKey: 'k1', lines });
    expect(again.replayed).toBe(true);
    expect(again.entry.id).toBe(a.entry.id);
    expect(await ledger.balance('t1', 'trust_bank')).toBe(12345n);
    expect(await ledger.trialBalanceTotal('t1')).toBe(0n);
    expect(f.outbox).toHaveLength(1);
  });
  it('rolls the entry back when the outbox write fails', async () => {
    const f = fakeDb(); const ledger = new LedgerService(new PrismaLedgerRepo(f.db));
    f.setFail(true);
    await expect(ledger.post({ ...b, idempotencyKey: 'k2', lines: [{ account: 'a', amount: 5n }, { account: 'b', amount: -5n }] })).rejects.toThrow('outbox down');
    expect(f.entries).toHaveLength(0);
  });
});
