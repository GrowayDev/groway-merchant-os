import { Voucher, VoucherProduct, VoucherSale, DeliveryType } from './types'
import { DEFAULT_VOUCHER_PRODUCTS, DEFAULT_DEVICE_PRODUCTS, DeviceFinanceProduct, DeviceFinanceContract } from './catalogue'
import { LedgerService } from '../ledger/ledger'
import { uuidv7 } from '../shared/ids'

// SINGLE shared instance across the entire process
const globalForEVoucher = globalThis as unknown as { evoucherLedger?: LedgerService; evoucherService?: EVoucherService }
export const evoucherLedger = globalForEVoucher.evoucherLedger ?? new LedgerService(new InMemoryLedgerRepo())
export const evoucherService = globalForEVoucher.evoucherService ?? new EVoucherService(evoucherLedger)
if (process.env.NODE_ENV !== 'production') { globalForEVoucher.evoucherLedger = evoucherLedger; globalForEVoucher.evoucherService = evoucherService }


export class EVoucherService {
  private products: Map<string, VoucherProduct>
  private deviceProducts: Map<string, DeviceFinanceProduct>
  private vouchers: Map<string, Voucher> = new Map()
  private sales: VoucherSale[] = []
  private contracts: DeviceFinanceContract[] = []

  constructor(private ledger: LedgerService) {
    this.products = new Map(DEFAULT_VOUCHER_PRODUCTS.map(p => [p.id, p]))
    this.deviceProducts = new Map(DEFAULT_DEVICE_PRODUCTS.map(p => [p.id, p]))
  }

  listProducts(filter?: { country?: string; category?: string; provider?: string }) {
    let r = [...this.products.values()].filter(p => p.active)
    if (filter?.country) r = r.filter(p => p.country === filter.country)
    if (filter?.category) r = r.filter(p => p.category === filter.category)
    if (filter?.provider) r = r.filter(p => p.provider === filter.provider)
    return r
  }

  listDeviceProducts(filter?: { country?: string; category?: string }) {
    let r = [...this.deviceProducts.values()].filter(p => p.active)
    if (filter?.country) r = r.filter(p => p.country === filter.country)
    if (filter?.category) r = r.filter(p => p.category === filter.category)
    return r
  }

  getProviders() { return [...new Set([...this.products.values()].map(p => ({ id: p.provider, name: p.providerName, country: p.country })))] }

  generateStock(productId: string, count: number, expiryDays = 365) {
    const product = this.products.get(productId)
    if (!product) throw new Error('Unknown product')
    if (product.stockType !== 'pin') throw new Error('Only pin-based products can be pre-generated')
    const batchId = `batch_${uuidv7()}`
    const expiry = new Date(); expiry.setDate(expiry.getDate() + expiryDays)
    for (let i = 0; i < count; i++) {
      const v: Voucher = {
        id: `vch_${uuidv7()}`, productId, pin: this.generatePin(), serial: `SN${Date.now()}${String(i).padStart(4,'0')}`,
        qrCode: this.generateQR(productId, i), status: 'available', batchId, faceValueMinor: product.faceValueMinor,
        currency: product.currency, expiryDate: expiry, createdAt: new Date(), reference: `gen_${batchId}_${i}`,
        deliveryType: product.deliveryType,
      }
      this.vouchers.set(v.id, v)
    }
    return { batchId, count, faceValue: product.faceValueMinor, currency: product.currency }
  }

  async sell(a: { productId: string; customerMsisdn: string; meterNumber?: string; paymentMethod?: string; channel?: string; tenantId: string }) {
    const product = this.products.get(a.productId)
    if (!product) throw new Error('Unknown product: ' + a.productId)
    const salePrice = product.faceValueMinor
    const cost = product.costMinor
    const profit = salePrice - cost
    const reference = `sale_${uuidv7()}`
    let voucherId: string | undefined
    let pin: string | undefined
    let token: string | undefined
    let qrCode: string | undefined
    let serial: string = `SN${Date.now()}`
    let deliveryType = product.deliveryType

    if (product.stockType === 'pin') {
      // Try to find available pre-generated stock
      const available = [...this.vouchers.values()].find(v => v.productId === a.productId && v.status === 'available')
      if (available) {
        available.status = 'sold'; available.soldAt = new Date(); available.customerMsisdn = a.customerMsisdn
        voucherId = available.id; pin = available.pin; serial = available.serial; qrCode = available.qrCode
      } else {
        // Generate a new voucher on-the-fly
        pin = this.generatePin(); serial = `SN${Date.now()}${Math.floor(Math.random()*1000)}`
        qrCode = this.generateQR(a.productId, Math.floor(Math.random()*10000))
        const v: Voucher = {
          id: `vch_${uuidv7()}`, productId, pin, serial, qrCode, status: 'sold', batchId: `ondemand_${uuidv7()}`,
          faceValueMinor: product.faceValueMinor, currency: product.currency,
          expiryDate: new Date(Date.now() + 365 * 86400000), createdAt: new Date(), soldAt: new Date(),
          customerMsisdn: a.customerMsisdn, reference, deliveryType,
        }
        this.vouchers.set(v.id, v); voucherId = v.id
      }
    } else if (product.stockType === 'token') {
      // Electricity: generate a meter token
      token = this.generateMeterToken(a.meterNumber || '00000000000')
      serial = `TKN${Date.now()}`
    } else {
      // Direct top-up: generate a delivery reference
      token = `DIRECT-${uuidv7()}`
      serial = `DRCT${Date.now()}`
    }

    // Always generate a QR code for evidence
    if (!qrCode) qrCode = this.generateQR(a.productId, Date.now())

    const sale: VoucherSale = {
      id: `sale_${uuidv7()}`, voucherId: voucherId || `direct_${uuidv7()}`, productId: a.productId,
      customerMsisdn: a.customerMsisdn, meterNumber: a.meterNumber, faceValueMinor: product.faceValueMinor,
      salePriceMinor: salePrice, costMinor: cost, profitMinor: profit, currency: product.currency,
      paymentMethod: (a.paymentMethod as any) || 'wallet', reference, soldAt: new Date(),
      channel: a.channel || 'grocore_app', serial, pin, token, qrCode, deliveryType,
      productName: product.name, providerName: product.providerName,
    }
    this.sales.push(sale)

    // Post to ledger
    try {
      await this.ledger.post({
        tenantId: a.tenantId, idempotencyKey: `${reference}:sale`, reason: 'voucher_sale', correlationId: reference, currency: product.currency,
        lines: [
          { account: 'collections_clearing', amount: salePrice },
          { account: `voucher_inventory:${product.provider}`, amount: -cost },
          { account: 'voucher_profit', amount: -profit },
        ],
      })
    } catch (e) { console.error('Ledger post failed:', e) }

    return {
      reference, productId: a.productId, productName: product.name, providerName: product.providerName,
      pin, token, qrCode, serial, faceValue: product.faceValueMinor, currency: product.currency,
      channel: sale.channel, deliveryType, customerMsisdn: a.customerMsisdn, meterNumber: a.meterNumber,
      salePriceMinor: salePrice.toString(), costMinor: cost.toString(), profitMinor: profit.toString(),
      soldAt: sale.soldAt.toISOString(),
    }
  }

  // Device Finance (M-KOPA model)
  async createDeviceContract(a: { productId: string; customerMsisdn: string; customerName: string; customerNationalId?: string; depositMinor: bigint; tenantId: string }) {
    const product = this.deviceProducts.get(a.productId)
    if (!product) throw new Error('Unknown device product: ' + a.productId)
    if (a.depositMinor < product.depositMinor) throw new Error(`Minimum deposit is ${product.depositMinor} ${product.currency}`)

    const startDate = new Date()
    const expectedEnd = new Date(); expectedEnd.setDate(expectedEnd.getDate() + product.termDays)
    const outstanding = product.retailPriceMinor - a.depositMinor
    const contractNumber = `DFC-${new Date().getFullYear()}-${String(this.contracts.length + 1).padStart(5, '0')}`

    const contract: DeviceFinanceContract = {
      id: `dfc_${uuidv7()}`, productId: a.productId, productName: product.name, brand: product.brand,
      customerMsisdn: a.customerMsisdn, customerName: a.customerName, customerNationalId: a.customerNationalId,
      depositPaidMinor: a.depositMinor, dailyPaymentMinor: product.dailyPaymentMinor,
      termDays: product.termDays, daysPaid: 0, totalPaidMinor: a.depositMinor, outstandingMinor: outstanding,
      status: 'active', startDate, expectedEndDate: expectedEnd, locked: false, contractNumber,
    }
    this.contracts.push(contract)

    try {
      await this.ledger.post({
        tenantId: a.tenantId, idempotencyKey: `${contract.id}:deposit`, reason: 'device_finance_deposit', correlationId: contract.id, currency: product.currency,
        lines: [
          { account: 'collections_clearing', amount: a.depositMinor },
          { account: `device_inventory:${product.brand}`, amount: -product.retailPriceMinor },
          { account: `device_receivable:${a.customerMsisdn}`, amount: outstanding },
        ],
      })
    } catch (e) { console.error('Ledger post failed:', e) }

    return {
      contractId: contract.id, contractNumber, device: product.name, brand: product.brand,
      dailyPayment: product.dailyPaymentMinor, termDays: product.termDays, outstanding,
      currency: product.currency, startDate: startDate.toISOString(), expectedEndDate: expectedEnd.toISOString(),
    }
  }

  async dailyDevicePayment(a: { contractId: string; amountMinor: bigint; tenantId: string }) {
    const contract = this.contracts.find(c => c.id === a.contractId)
    if (!contract) throw new Error('Contract not found')
    if (contract.status !== 'active') throw new Error(`Contract is ${contract.status}`)
    const product = this.deviceProducts.get(contract.productId)!

    contract.totalPaidMinor += a.amountMinor
    contract.outstandingMinor -= a.amountMinor
    contract.daysPaid += 1
    contract.lastPaymentDate = new Date()
    contract.locked = false
    if (contract.outstandingMinor <= 0n) { contract.status = 'completed'; contract.outstandingMinor = 0n }

    try {
      await this.ledger.post({
        tenantId: a.tenantId, idempotencyKey: `${contract.id}:daily_${contract.daysPaid}`, reason: 'device_finance_daily_payment', correlationId: contract.id, currency: product.currency,
        lines: [{ account: 'collections_clearing', amount: a.amountMinor }, { account: `device_receivable:${contract.customerMsisdn}`, amount: -a.amountMinor }],
      })
    } catch (e) { console.error('Ledger post failed:', e) }

    return { daysPaid: contract.daysPaid, outstanding: contract.outstandingMinor, status: contract.status, locked: contract.locked, contractNumber: contract.contractNumber }
  }

  lockOverdueDevices(overdueDays = 3) {
    const now = new Date()
    for (const c of this.contracts) {
      if (c.status !== 'active') continue
      if (c.lastPaymentDate) { const d = Math.floor((now.getTime() - c.lastPaymentDate.getTime()) / 86400000); c.locked = d > overdueDays }
    }
  }

  listContracts(msisdn?: string) { return msisdn ? this.contracts.filter(c => c.customerMsisdn === msisdn) : this.contracts }
  listSales(limit = 20) { return this.sales.slice(-limit).reverse() }
  listLedgerEntries() { return this.ledger.repo.entries ? this.ledger.repo.entries('all') : Promise.resolve([]) }

  stats() {
    const totalSales = this.sales.length
    const totalProfit = this.sales.reduce((s, sale) => s + sale.profitMinor, 0n)
    const totalStock = [...this.vouchers.values()].filter(v => v.status === 'available').length
    const activeContracts = this.contracts.filter(c => c.status === 'active').length
    const totalOutstanding = this.contracts.filter(c => c.status === 'active').reduce((s, c) => s + c.outstandingMinor, 0n)
    return { totalSales, totalProfit: totalProfit.toString(), totalStock, activeContracts, totalOutstanding: totalOutstanding.toString(), productCount: this.products.size, deviceProductCount: this.deviceProducts.size }
  }

  private generatePin(): string { const c = '0123456789ABCDEF'; let p = ''; for (let i = 0; i < 16; i++) p += c[Math.floor(Math.random() * c.length)]; return p }
  private generateMeterToken(meter: string): string { return `${meter}-${Date.now()}-${Math.floor(Math.random() * 9999)}` }
  private generateQR(productId: string, seed: number): string { return `GROCORE-${productId.toUpperCase()}-${Date.now()}-${seed}` }
}
