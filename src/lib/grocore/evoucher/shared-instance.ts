// Shared singleton instance for evoucher service across all API routes
import { LedgerService, InMemoryLedgerRepo } from '@/lib/grocore/ledger/ledger'
import { EVoucherService } from '@/lib/grocore/evoucher/service'

const globalForEVoucher = globalThis as unknown as { evoucherLedger?: LedgerService; evoucherService?: EVoucherService }

if (!globalForEVoucher.evoucherLedger) {
  globalForEVoucher.evoucherLedger = new LedgerService(new InMemoryLedgerRepo())
}
if (!globalForEVoucher.evoucherService) {
  globalForEVoucher.evoucherService = new EVoucherService(globalForEVoucher.evoucherLedger)
}

export const evoucherLedger = globalForEVoucher.evoucherLedger
export const evoucherService = globalForEVoucher.evoucherService
