import { CurrencyCode, Money, SignedMoney, debit, credit, signed } from './currency'
import { GroCoreError } from './errors'
export type AccountKind = 'asset' | 'liability' | 'equity' | 'income' | 'expense'
export type AccountSubKind = 'advance_receivable' | 'supplier_payable' | 'fee_income' | 'trust' | 'merchant_settlement' | 'consumer_wallet' | 'capital' | 'cash' | 'bad_debt' | 'collections_clearing' | 'billed_amount' | 'fx' | 'device_receivable' | 'repayment_income'
export interface LedgerAccount { id: string; tenantId: string; code: string; name: string; kind: AccountKind; subKind: AccountSubKind; currency: CurrencyCode; active: boolean; metaJson?: string }
export interface LedgerLineInput { accountCode: string; amount: SignedMoney }
export interface LedgerLine extends LedgerLineInput { accountId: string; currency: CurrencyCode; amountCents: bigint }
export interface LedgerEntryInput { tenantId: string; entryId: string; sourceType: string; sourceId: string; description: string; lines: LedgerLineInput[] }
export interface LedgerEntry extends LedgerEntryInput { id: string; postedAt: Date }
export function validateBalanced(input: LedgerEntryInput): Record<string, bigint> {
  if (input.lines.length === 0) throw new GroCoreError('LEDGER_NOT_BALANCED', 'Entry has no lines')
  const nets: Record<string, bigint> = {}
  for (const line of input.lines) {
    if (line.amount.signedCents === 0n) throw new GroCoreError('LEDGER_ZERO_LINE', 'Zero-value line not allowed')
    const cur = line.amount.currency; nets[cur] = (nets[cur] ?? 0n) + line.amount.signedCents
  }
  for (const [cur, total] of Object.entries(nets)) { if (total !== 0n) throw new GroCoreError('LEDGER_NOT_BALANCED', `Entry does not balance for ${cur}: net ${total}`) }
  return nets
}
export function balancedPair(debitAccount: string, creditAccount: string, amount: Money): LedgerLineInput[] {
  return [{ accountCode: debitAccount, amount: debit(amount) }, { accountCode: creditAccount, amount: credit(amount) }]
}
export function reverseEntry(original: LedgerEntryInput, newEntryId: string, description: string): LedgerEntryInput {
  return { tenantId: original.tenantId, entryId: newEntryId, sourceType: `${original.sourceType}_reversal`, sourceId: original.sourceId, description, lines: original.lines.map((l) => ({ accountCode: l.accountCode, amount: signed(-l.amount.signedCents, l.amount.currency) })) }
}
export interface TrialBalanceRow { accountCode: string; accountName: string; currency: CurrencyCode; balanceCents: bigint }
export function trialBalance(accounts: LedgerAccount[], lines: { accountId: string; currency: CurrencyCode; amountCents: bigint }[]): TrialBalanceRow[] {
  const byAccount = new Map<string, bigint>()
  for (const l of lines) byAccount.set(l.accountId, (byAccount.get(l.accountId) ?? 0n) + l.amountCents)
  return accounts.filter(a => (byAccount.get(a.id) ?? 0n) !== 0n).map(a => ({ accountCode: a.code, accountName: a.name, currency: a.currency, balanceCents: byAccount.get(a.id) ?? 0n })).sort((a, b) => a.accountCode.localeCompare(b.accountCode))
}
