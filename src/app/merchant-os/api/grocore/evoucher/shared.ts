import { LedgerService, InMemoryLedgerRepo } from '@/lib/grocore/ledger/ledger'
import { EVoucherService } from '@/lib/grocore/evoucher/service'

// SINGLE shared instance across all evoucher routes — in production this would
// be a database-backed service. For now, in-memory per process.
const globalForEVoucher = globalThis as unknown as {
  evoucherLedger?: LedgerService
  evoucherService?: EVoucherService
}

export const evoucherLedger = globalForEVoucher.evoucherLedger ?? new LedgerService(new InMemoryLedgerRepo())
export const evoucherService = globalForEVoucher.evoucherService ?? new EVoucherService(evoucherLedger)

if (process.env.NODE_ENV !== 'production') {
  globalForEVoucher.evoucherLedger = evoucherLedger
  globalForEVoucher.evoucherService = evoucherService
}
