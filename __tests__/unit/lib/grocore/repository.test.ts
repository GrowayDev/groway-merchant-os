/**
 * Unit tests for the GroCore InMemoryRepository implementation.
 */

import {
  InMemoryRepository,
  LedgerAccount,
  LedgerEntryInput,
  ConsentRecord,
  TopupAdvance,
  Voucher,
  CapitalSource,
  GoPayCapture,
  DeviceContract,
  money,
  debit,
  credit,
  balancedPair,
} from '@/lib/grocore'
import { rand, kwacha } from './_helpers'

function makeAccount(overrides: Partial<LedgerAccount> = {}): LedgerAccount {
  return {
    id: 'acc-1',
    tenantId: 't1',
    code: '1000',
    name: 'Cash',
    kind: 'asset',
    subKind: 'cash',
    currency: 'ZAR',
    active: true,
    ...overrides,
  }
}

function makeConsent(overrides: Partial<ConsentRecord> = {}): ConsentRecord {
  return {
    id: 'consent-1',
    tenantId: 't1',
    subjectId: 'subj-1',
    subjectType: 'customer',
    purpose: 'credit_use',
    status: 'active',
    grantedAt: new Date('2024-01-01T00:00:00Z'),
    revokedAt: null,
    expiresAt: null,
    policyVersion: 'v1',
    evidence: 'ip:1.2.3.4',
    ...overrides,
  }
}

function makeAdvance(overrides: Partial<TopupAdvance> = {}): TopupAdvance {
  return {
    id: 'adv-1',
    tenantId: 't1',
    subjectId: 'subj-1',
    product: 'sa_airtime',
    principal: rand(2000n),
    fee: rand(240n),
    totalDue: rand(2240n),
    paid: rand(0n),
    currency: 'ZAR',
    status: 'open',
    dueAt: new Date('2024-06-08T00:00:00Z'),
    createdAt: new Date('2024-06-01T00:00:00Z'),
    recoveredAt: null,
    writtenOffAt: null,
    deliveryMethod: 'direct_recharge',
    voucherSerial: null,
    decisionId: null,
    ...overrides,
  }
}

function makeVoucher(overrides: Partial<Voucher> = {}): Voucher {
  return {
    id: 'vch-1',
    tenantId: 't1',
    serial: 'GC-AIRTIME-20240615-ABCD1234',
    product: 'airtime',
    supplier: 'vodacom',
    faceValue: rand(1000n),
    cost: rand(900n),
    recipientMsisdn: null,
    meterNumber: null,
    status: 'issued',
    deliveryMethod: 'direct_recharge',
    redeemedAt: null,
    advanceId: null,
    qrPayload: null,
    pin: null,
    createdAt: new Date('2024-06-15T00:00:00Z'),
    ...overrides,
  }
}

function makeCapitalSource(overrides: Partial<CapitalSource> = {}): CapitalSource {
  return {
    id: 'src-1',
    tenantId: 't1',
    name: 'Lender A',
    type: 'lender',
    currency: 'ZAR',
    committed: rand(100000n),
    deployed: rand(0n),
    costRateBps: 100,
    status: 'active',
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: null,
    ...overrides,
  }
}

function makeCapture(overrides: Partial<GoPayCapture> = {}): GoPayCapture {
  return {
    id: 'cap-1',
    tenantId: 't1',
    merchantId: 'm1',
    captureId: 'cap-1',
    amount: rand(10000n),
    fee: rand(1000n),
    paymentMethod: 'qr',
    liveMode: true,
    status: 'captured',
    settlementId: null,
    createdAt: new Date('2024-06-01T00:00:00Z'),
    ...overrides,
  }
}

function makeDeviceContract(overrides: Partial<DeviceContract> = {}): DeviceContract {
  return {
    id: 'ctr-1',
    tenantId: 't1',
    customerId: 'cust-1',
    productId: 'prod-1',
    deviceName: 'Solar Kit',
    deviceImei: null,
    principal: rand(10000n),
    paid: rand(0n),
    dailyPayment: rand(1000n),
    currency: 'ZAR',
    totalDays: 10,
    daysPaid: 0,
    status: 'active',
    locked: true,
    unlockedAt: null,
    dueAt: null,
    createdAt: new Date('2024-06-01T00:00:00Z'),
    updatedAt: new Date('2024-06-01T00:00:00Z'),
    ...overrides,
  }
}

describe('repository.InMemoryRepository — accounts', () => {
  it('upsertAccount then getAccount returns the same record', async () => {
    const repo = new InMemoryRepository()
    const account = makeAccount()
    await repo.upsertAccount(account)
    const fetched = await repo.getAccount('t1', '1000')
    expect(fetched).toEqual(account)
  })

  it('listAccounts filters by tenantId', async () => {
    const repo = new InMemoryRepository()
    await repo.upsertAccount(makeAccount({ id: 'a1', tenantId: 't1', code: '1000' }))
    await repo.upsertAccount(makeAccount({ id: 'a2', tenantId: 't1', code: '2000' }))
    await repo.upsertAccount(makeAccount({ id: 'a3', tenantId: 't2', code: '1000' }))
    const t1Accounts = await repo.listAccounts('t1')
    expect(t1Accounts).toHaveLength(2)
    expect(t1Accounts.every((a) => a.tenantId === 't1')).toBe(true)
  })
})

describe('repository.InMemoryRepository — entries', () => {
  it('postEntry then getEntry returns the entry with lines', async () => {
    const repo = new InMemoryRepository()
    await repo.upsertAccount(makeAccount({ id: 'acc-1', code: '1000' }))
    await repo.upsertAccount(makeAccount({ id: 'acc-2', code: '2000' }))
    const entry: LedgerEntryInput = {
      tenantId: 't1',
      entryId: 'e1',
      sourceType: 'test',
      sourceId: 's1',
      description: 'balanced entry',
      lines: balancedPair('1000', '2000', money(1000n, 'ZAR')),
    }
    const lines = [
      { accountId: 'acc-1', amountCents: 1000n, currency: 'ZAR' },
      { accountId: 'acc-2', amountCents: -1000n, currency: 'ZAR' },
    ]
    const posted = await repo.postEntry(entry, lines)
    expect(posted.entry.entryId).toBe('e1')
    expect(posted.lines).toHaveLength(2)
    const fetched = await repo.getEntry('t1', 'e1')
    expect(fetched).not.toBeNull()
    expect(fetched!.entry.entryId).toBe('e1')
    expect(fetched!.lines).toHaveLength(2)
  })

  it('postEntry is idempotent (calling twice returns the same entryId)', async () => {
    const repo = new InMemoryRepository()
    await repo.upsertAccount(makeAccount({ id: 'acc-1', code: '1000' }))
    await repo.upsertAccount(makeAccount({ id: 'acc-2', code: '2000' }))
    const entry: LedgerEntryInput = {
      tenantId: 't1',
      entryId: 'e1',
      sourceType: 'test',
      sourceId: 's1',
      description: 'balanced entry',
      lines: balancedPair('1000', '2000', money(1000n, 'ZAR')),
    }
    const lines = [
      { accountId: 'acc-1', amountCents: 1000n, currency: 'ZAR' },
      { accountId: 'acc-2', amountCents: -1000n, currency: 'ZAR' },
    ]
    const first = await repo.postEntry(entry, lines)
    const second = await repo.postEntry(entry, lines)
    // Same entryId, same postedAt (idempotent replay returns the original)
    expect(second.entry.id).toBe(first.entry.id)
    expect(second.entry.postedAt).toBe(first.entry.postedAt)
    expect(second.entry.entryId).toBe(first.entry.entryId)
  })

  it('listLinesForAccount returns only lines for that account', async () => {
    const repo = new InMemoryRepository()
    await repo.upsertAccount(makeAccount({ id: 'acc-1', code: '1000' }))
    await repo.upsertAccount(makeAccount({ id: 'acc-2', code: '2000' }))
    const lines = [
      { accountId: 'acc-1', amountCents: 1000n, currency: 'ZAR' },
      { accountId: 'acc-2', amountCents: -1000n, currency: 'ZAR' },
    ]
    await repo.postEntry(
      {
        tenantId: 't1',
        entryId: 'e1',
        sourceType: 'test',
        sourceId: 's1',
        description: 'entry 1',
        lines: balancedPair('1000', '2000', money(1000n, 'ZAR')),
      },
      lines,
    )
    await repo.postEntry(
      {
        tenantId: 't1',
        entryId: 'e2',
        sourceType: 'test',
        sourceId: 's2',
        description: 'entry 2',
        lines: balancedPair('1000', '2000', money(500n, 'ZAR')),
      },
      [
        { accountId: 'acc-1', amountCents: 500n, currency: 'ZAR' },
        { accountId: 'acc-2', amountCents: -500n, currency: 'ZAR' },
      ],
    )
    const acc1Lines = await repo.listLinesForAccount('t1', 'acc-1')
    expect(acc1Lines).toHaveLength(2)
    expect(acc1Lines.every((l) => l.accountId === 'acc-1')).toBe(true)
  })
})

describe('repository.InMemoryRepository — consent', () => {
  it('saveConsent then getConsent returns the record', async () => {
    const repo = new InMemoryRepository()
    const consent = makeConsent()
    await repo.saveConsent(consent)
    const fetched = await repo.getConsent('t1', 'subj-1', 'credit_use')
    expect(fetched).toEqual(consent)
  })

  it('getConsent returns null when not found', async () => {
    const repo = new InMemoryRepository()
    const fetched = await repo.getConsent('t1', 'subj-1', 'credit_use')
    expect(fetched).toBeNull()
  })
})

describe('repository.InMemoryRepository — decisions', () => {
  it('saveDecision assigns an ID', async () => {
    const repo = new InMemoryRepository()
    const result = await repo.saveDecision({
      tenantId: 't1',
      subjectId: 'subj-1',
      subjectType: 'customer',
      product: 'topup_airtime',
      amountCents: 5000n,
      currency: 'ZAR',
      outcome: 'approve',
      approvedLimitCents: 5000n,
      reasonCodes: ['APPROVED'],
      counterfactual: null,
      traceJson: '{}',
      policyVersion: 'v1',
      modelVersion: 'm1',
    })
    expect(result.id).toBeTruthy()
    expect(result.id).toMatch(/^d-/)
  })

  it('listDecisions filters by tenantId and subjectId', async () => {
    const repo = new InMemoryRepository()
    await repo.saveDecision({
      tenantId: 't1',
      subjectId: 'subj-1',
      subjectType: 'customer',
      product: 'topup_airtime',
      amountCents: 5000n,
      currency: 'ZAR',
      outcome: 'approve',
      approvedLimitCents: 5000n,
      reasonCodes: ['APPROVED'],
      counterfactual: null,
      traceJson: '{}',
      policyVersion: 'v1',
      modelVersion: 'm1',
    })
    await repo.saveDecision({
      tenantId: 't1',
      subjectId: 'subj-2',
      subjectType: 'customer',
      product: 'topup_airtime',
      amountCents: 3000n,
      currency: 'ZAR',
      outcome: 'decline',
      approvedLimitCents: null,
      reasonCodes: ['IDENTITY_NOT_VERIFIED'],
      counterfactual: null,
      traceJson: '{}',
      policyVersion: 'v1',
      modelVersion: 'm1',
    })
    const t1 = await repo.listDecisions('t1')
    expect(t1).toHaveLength(2)
    const subj1 = await repo.listDecisions('t1', 'subj-1')
    expect(subj1).toHaveLength(1)
    expect(subj1[0].subjectId).toBe('subj-1')
  })
})

describe('repository.InMemoryRepository — advances', () => {
  it('saveAdvance then getOpenAdvanceBySubject finds it', async () => {
    const repo = new InMemoryRepository()
    const advance = makeAdvance({ status: 'open' })
    await repo.saveAdvance(advance)
    const open = await repo.getOpenAdvanceBySubject('t1', 'subj-1')
    expect(open).toEqual(advance)
  })

  it('getOpenAdvanceBySubject returns null when the advance is not open', async () => {
    const repo = new InMemoryRepository()
    await repo.saveAdvance(makeAdvance({ status: 'recovered' }))
    const open = await repo.getOpenAdvanceBySubject('t1', 'subj-1')
    expect(open).toBeNull()
  })

  it('saveAdvance then getAdvance returns the same record', async () => {
    const repo = new InMemoryRepository()
    const advance = makeAdvance()
    await repo.saveAdvance(advance)
    const fetched = await repo.getAdvance('t1', 'adv-1')
    expect(fetched).toEqual(advance)
  })
})

describe('repository.InMemoryRepository — vouchers', () => {
  it('saveVoucher then getVoucher returns it', async () => {
    const repo = new InMemoryRepository()
    const voucher = makeVoucher()
    await repo.saveVoucher(voucher)
    const fetched = await repo.getVoucher('t1', 'GC-AIRTIME-20240615-ABCD1234')
    expect(fetched).toEqual(voucher)
  })

  it('listVouchers filters by status', async () => {
    const repo = new InMemoryRepository()
    await repo.saveVoucher(makeVoucher({ id: 'v1', serial: 'S1', status: 'issued' }))
    await repo.saveVoucher(makeVoucher({ id: 'v2', serial: 'S2', status: 'redeemed' }))
    const issued = await repo.listVouchers('t1', { status: 'issued' })
    expect(issued).toHaveLength(1)
    expect(issued[0].serial).toBe('S1')
  })
})

describe('repository.InMemoryRepository — capital sources', () => {
  it('saveCapitalSource then listCapitalSources returns them', async () => {
    const repo = new InMemoryRepository()
    await repo.saveCapitalSource(makeCapitalSource({ id: 's1', tenantId: 't1' }))
    await repo.saveCapitalSource(makeCapitalSource({ id: 's2', tenantId: 't1' }))
    await repo.saveCapitalSource(makeCapitalSource({ id: 's3', tenantId: 't2' }))
    const t1Sources = await repo.listCapitalSources('t1')
    expect(t1Sources).toHaveLength(2)
    expect(t1Sources.every((s) => s.tenantId === 't1')).toBe(true)
  })

  it('getCapitalSource returns null when not found', async () => {
    const repo = new InMemoryRepository()
    const fetched = await repo.getCapitalSource('t1', 'missing')
    expect(fetched).toBeNull()
  })
})

describe('repository.InMemoryRepository — GoPay captures', () => {
  it('saveGoPayCapture then listGoPayCaptures returns them', async () => {
    const repo = new InMemoryRepository()
    await repo.saveGoPayCapture(makeCapture({ id: 'c1', captureId: 'c1', merchantId: 'm1' }))
    await repo.saveGoPayCapture(makeCapture({ id: 'c2', captureId: 'c2', merchantId: 'm1' }))
    await repo.saveGoPayCapture(makeCapture({ id: 'c3', captureId: 'c3', merchantId: 'm2' }))
    const m1Captures = await repo.listGoPayCaptures('t1', 'm1')
    expect(m1Captures).toHaveLength(2)
    const allCaptures = await repo.listGoPayCaptures('t1')
    expect(allCaptures).toHaveLength(3)
  })
})

describe('repository.InMemoryRepository — device contracts', () => {
  it('saveDeviceContract then getDeviceContract returns it', async () => {
    const repo = new InMemoryRepository()
    const contract = makeDeviceContract()
    await repo.saveDeviceContract(contract)
    const fetched = await repo.getDeviceContract('t1', 'ctr-1')
    expect(fetched).toEqual(contract)
  })

  it('listDeviceContracts filters by customerId', async () => {
    const repo = new InMemoryRepository()
    await repo.saveDeviceContract(
      makeDeviceContract({ id: 'c1', customerId: 'cust-1' }),
    )
    await repo.saveDeviceContract(
      makeDeviceContract({ id: 'c2', customerId: 'cust-2' }),
    )
    const cust1 = await repo.listDeviceContracts('t1', 'cust-1')
    expect(cust1).toHaveLength(1)
    expect(cust1[0].customerId).toBe('cust-1')
  })
})

// Quiet the linter about unused imports in some test scenarios.
void debit
void credit
void kwacha
