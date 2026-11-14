/**
 * Unit tests for the GroCore double-entry ledger.
 */

import {
  validateBalanced,
  balancedPair,
  reverseEntry,
  trialBalance,
  balanceFromLines,
  debit,
  credit,
  signed,
  money,
  GroCoreError,
  LedgerEntryInput,
  LedgerAccount,
} from '@/lib/grocore'

describe('ledger.validateBalanced', () => {
  it('accepts a zero-net entry with a single currency', () => {
    const input: LedgerEntryInput = {
      tenantId: 't1',
      entryId: 'e1',
      sourceType: 'test',
      sourceId: 's1',
      description: 'balanced',
      lines: [
        { accountCode: 'A', amount: debit(money(1000n, 'ZAR')) },
        { accountCode: 'B', amount: credit(money(1000n, 'ZAR')) },
      ],
    }
    const nets = validateBalanced(input)
    expect(nets['ZAR']).toBe(0n)
  })

  it('accepts a zero-net entry with multiple currencies', () => {
    const input: LedgerEntryInput = {
      tenantId: 't1',
      entryId: 'e2',
      sourceType: 'test',
      sourceId: 's1',
      description: 'multi-currency balanced',
      lines: [
        { accountCode: 'A', amount: debit(money(1000n, 'ZAR')) },
        { accountCode: 'B', amount: credit(money(1000n, 'ZAR')) },
        { accountCode: 'C', amount: debit(money(50000n, 'MWK')) },
        { accountCode: 'D', amount: credit(money(50000n, 'MWK')) },
      ],
    }
    const nets = validateBalanced(input)
    expect(nets['ZAR']).toBe(0n)
    expect(nets['MWK']).toBe(0n)
  })

  it('rejects entries that do not net to zero per currency', () => {
    const input: LedgerEntryInput = {
      tenantId: 't1',
      entryId: 'e3',
      sourceType: 'test',
      sourceId: 's1',
      description: 'unbalanced',
      lines: [
        { accountCode: 'A', amount: debit(money(1000n, 'ZAR')) },
        { accountCode: 'B', amount: credit(money(900n, 'ZAR')) },
      ],
    }
    let caught: GroCoreError | null = null
    try {
      validateBalanced(input)
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('LEDGER_NOT_BALANCED')
  })

  it('rejects zero-value lines', () => {
    const input: LedgerEntryInput = {
      tenantId: 't1',
      entryId: 'e4',
      sourceType: 'test',
      sourceId: 's1',
      description: 'has a zero line',
      lines: [
        { accountCode: 'A', amount: debit(money(1000n, 'ZAR')) },
        { accountCode: 'B', amount: credit(money(1000n, 'ZAR')) },
        { accountCode: 'C', amount: signed(0n, 'ZAR') },
      ],
    }
    let caught: GroCoreError | null = null
    try {
      validateBalanced(input)
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('LEDGER_ZERO_LINE')
  })

  it('rejects entries with no lines', () => {
    const input: LedgerEntryInput = {
      tenantId: 't1',
      entryId: 'e5',
      sourceType: 'test',
      sourceId: 's1',
      description: 'empty',
      lines: [],
    }
    let caught: GroCoreError | null = null
    try {
      validateBalanced(input)
    } catch (e) {
      caught = e as GroCoreError
    }
    expect(caught).toBeInstanceOf(GroCoreError)
    expect(caught?.code).toBe('LEDGER_NOT_BALANCED')
  })
})

describe('ledger.balancedPair', () => {
  it('produces matching debit and credit of equal magnitude', () => {
    const lines = balancedPair('A', 'B', money(500n, 'ZAR'))
    expect(lines).toHaveLength(2)
    expect(lines[0].accountCode).toBe('A')
    expect(lines[0].amount.signedCents).toBe(500n)
    expect(lines[1].accountCode).toBe('B')
    expect(lines[1].amount.signedCents).toBe(-500n)
    // Net is zero
    const net = lines.reduce((s, l) => s + l.amount.signedCents, 0n)
    expect(net).toBe(0n)
  })

  it('passes validateBalanced', () => {
    const input: LedgerEntryInput = {
      tenantId: 't1',
      entryId: 'e6',
      sourceType: 'test',
      sourceId: 's1',
      description: 'balanced pair',
      lines: balancedPair('A', 'B', money(500n, 'ZAR')),
    }
    expect(() => validateBalanced(input)).not.toThrow()
  })
})

describe('ledger.reverseEntry', () => {
  it('flips signs and uses a fresh entryId', () => {
    const original: LedgerEntryInput = {
      tenantId: 't1',
      entryId: 'orig-1',
      sourceType: 'topup',
      sourceId: 's1',
      description: 'original',
      lines: balancedPair('A', 'B', money(500n, 'ZAR')),
    }
    const reversed = reverseEntry(original, 'rev-1', 'reversal of orig-1')
    expect(reversed.entryId).toBe('rev-1')
    expect(reversed.description).toBe('reversal of orig-1')
    expect(reversed.sourceType).toBe('topup_reversal')
    // Signs flipped relative to original
    expect(reversed.lines[0].amount.signedCents).toBe(-500n)
    expect(reversed.lines[1].amount.signedCents).toBe(500n)
    // Still balances
    expect(() => validateBalanced(reversed)).not.toThrow()
  })
})

describe('ledger.trialBalance', () => {
  it('aggregates per account and sorts by account code', () => {
    const accounts: LedgerAccount[] = [
      {
        id: 'acc-1',
        tenantId: 't1',
        code: '2000',
        name: 'Payables',
        kind: 'liability',
        subKind: 'supplier_payable',
        currency: 'ZAR',
        active: true,
      },
      {
        id: 'acc-2',
        tenantId: 't1',
        code: '1000',
        name: 'Cash',
        kind: 'asset',
        subKind: 'cash',
        currency: 'ZAR',
        active: true,
      },
      {
        id: 'acc-3',
        tenantId: 't1',
        code: '4000',
        name: 'Fee Income',
        kind: 'income',
        subKind: 'fee_income',
        currency: 'ZAR',
        active: true,
      },
    ]
    const lines = [
      { accountId: 'acc-2', currency: 'ZAR' as const, amountCents: 1000n },
      { accountId: 'acc-1', currency: 'ZAR' as const, amountCents: -1000n },
    ]
    const rows = trialBalance(accounts, lines)
    // Only accounts with non-zero balances are included
    expect(rows).toHaveLength(2)
    // Sorted by account code ascending
    expect(rows[0].accountCode).toBe('1000')
    expect(rows[0].accountName).toBe('Cash')
    expect(rows[0].balanceCents).toBe(1000n)
    expect(rows[1].accountCode).toBe('2000')
    expect(rows[1].balanceCents).toBe(-1000n)
  })

  it('omits accounts with zero net balance', () => {
    const accounts: LedgerAccount[] = [
      {
        id: 'acc-1',
        tenantId: 't1',
        code: '1000',
        name: 'Cash',
        kind: 'asset',
        subKind: 'cash',
        currency: 'ZAR',
        active: true,
      },
    ]
    const lines = [
      { accountId: 'acc-1', currency: 'ZAR' as const, amountCents: 1000n },
      { accountId: 'acc-1', currency: 'ZAR' as const, amountCents: -1000n },
    ]
    const rows = trialBalance(accounts, lines)
    expect(rows).toHaveLength(0)
  })
})

describe('ledger.balanceFromLines', () => {
  it('returns per-currency totals', () => {
    const lines = [
      { currency: 'ZAR' as const, amountCents: 1000n },
      { currency: 'ZAR' as const, amountCents: -500n },
      { currency: 'MWK' as const, amountCents: 2000n },
      { currency: 'MWK' as const, amountCents: -2000n },
    ]
    const totals = balanceFromLines(lines)
    expect(totals['ZAR']).toBe(500n)
    expect(totals['MWK']).toBe(0n)
  })

  it('returns an empty object for no lines', () => {
    expect(balanceFromLines([])).toEqual({})
  })
})
