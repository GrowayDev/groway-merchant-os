import { Money } from '../currency'
export type TopupProductCode = 'sa_airtime' | 'sa_data' | 'sa_electricity' | 'mw_airtime' | 'mw_electricity' | 'merchant_float'
export type FeeModel = { kind: 'flat'; fee: Money } | { kind: 'per_block'; block: Money; feePerBlock: Money } | { kind: 'percent'; percent: number }
export interface TopupProduct { code: TopupProductCode; market: 'ZA' | 'MW'; product: 'airtime' | 'data' | 'electricity' | 'merchant_float'; currency: 'ZAR' | 'MWK'; menu: Money[]; feeModel: FeeModel; recovery: 'full_first' | { cappedShare: number }; minTenureDays: number; minActiveMonths: number; minSpendPerMonth: Money; overdueDays: number; overdueAction: 'add_to_bill' | 'write_off' }
