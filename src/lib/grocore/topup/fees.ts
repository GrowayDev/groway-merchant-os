import { Money, add } from '../currency'
import { FeeModel, TopupProduct } from './products'
export interface FeeQuote { principal: Money; fee: Money; totalDue: Money }
export function quoteFee(amount: Money, model: FeeModel): Money { switch (model.kind) { case 'flat': return { cents: model.fee.cents, currency: amount.currency }; case 'per_block': const blocks = amount.cents / model.block.cents + (amount.cents % model.block.cents === 0n ? 0n : 1n); return { cents: blocks * model.feePerBlock.cents, currency: amount.currency }; case 'percent': return { cents: (amount.cents * BigInt(Math.round(model.percent * 1000))) / 100000n, currency: amount.currency } } }
export function quote(amount: Money, product: TopupProduct): FeeQuote { if (!product.menu.some(m => m.cents === amount.cents)) throw new Error(`Amount not in menu`); const fee = quoteFee(amount, product.feeModel); return { principal: amount, fee, totalDue: add(amount, fee) } }
