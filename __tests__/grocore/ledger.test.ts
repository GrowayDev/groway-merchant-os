/** @jest-environment node */
import { LedgerService, InMemoryLedgerRepo, LedgerError } from '../../src/lib/grocore/ledger/ledger';

const mk = () => { const repo = new InMemoryLedgerRepo(); return { repo, ledger: new LedgerService(repo) }; };
const base = { tenantId: 't1', correlationId: 'c1', currency: 'ZAR', reason: 'test' };

describe('ledger', () => {
  it('rejects unbalanced entries', async () => {
    const { ledger } = mk();
    await expect(ledger.post({ ...base, idempotencyKey: 'a', lines: [{ account: 'x', amount: 5n }, { account: 'y', amount: -4n }] }))
      .rejects.toMatchObject({ code: 'UNBALANCED' });
  });
  it('rejects zero lines, single lines and bad currency', async () => {
    const { ledger } = mk();
    await expect(ledger.post({ ...base, idempotencyKey: 'a', lines: [{ account: 'x', amount: 0n }, { account: 'y', amount: 0n }] })).rejects.toBeInstanceOf(LedgerError);
    await expect(ledger.post({ ...base, idempotencyKey: 'b', lines: [{ account: 'x', amount: 1n }] })).rejects.toMatchObject({ code: 'TOO_FEW_LINES' });
    await expect(ledger.post({ ...base, currency: 'rand', idempotencyKey: 'c', lines: [{ account: 'x', amount: 1n }, { account: 'y', amount: -1n }] })).rejects.toMatchObject({ code: 'BAD_CURRENCY' });
  });
  it('is idempotent and detects key reuse with different content', async () => {
    const { ledger, repo } = mk();
    const lines = [{ account: 'x', amount: 10n }, { account: 'y', amount: -10n }];
    const first = await ledger.post({ ...base, idempotencyKey: 'k', lines });
    const again = await ledger.post({ ...base, idempotencyKey: 'k', lines });
    expect(again.replayed).toBe(true);
    expect(again.entry.id).toBe(first.entry.id);
    expect(repo.outbox).toHaveLength(1);
    await expect(ledger.post({ ...base, idempotencyKey: 'k', lines: [{ account: 'x', amount: 11n }, { account: 'y', amount: -11n }] }))
      .rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT' });
  });
  it('keeps the trial balance at zero across 500 random balanced entries', async () => {
    const { ledger } = mk();
    const accts = ['a', 'b', 'c', 'd', 'e', 'f'];
    for (let i = 0; i < 500; i++) {
      const n = 2 + Math.floor(Math.random() * 3);
      const picked = [...accts].sort(() => Math.random() - 0.5).slice(0, n);
      const amounts = picked.slice(1).map(() => BigInt(1 + Math.floor(Math.random() * 100000)));
      const lines = [{ account: picked[0]!, amount: -amounts.reduce((s, x) => s + x, 0n) },
        ...amounts.map((a, j) => ({ account: picked[j + 1]!, amount: a }))];
      await ledger.post({ ...base, idempotencyKey: `r${i}`, lines });
    }
    expect(await ledger.trialBalanceTotal('t1')).toBe(0n);
  });
  it('isolates tenants', async () => {
    const { ledger } = mk();
    await ledger.post({ ...base, idempotencyKey: 'k', lines: [{ account: 'x', amount: 5n }, { account: 'y', amount: -5n }] });
    expect(await ledger.balance('t2', 'x')).toBe(0n);
  });
});
