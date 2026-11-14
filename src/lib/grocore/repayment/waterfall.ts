import { mulBps, minOf } from '../shared/money';

export interface Bucket { name: string; due: bigint }

/** Allocate a payment across buckets in the configured order. Order is product config approved by compliance. */
export function allocateWaterfall(amount: bigint, buckets: Bucket[]) {
  if (amount < 0n) throw new RangeError('amount must be non-negative');
  let left = amount;
  const allocations: Record<string, bigint> = {};
  for (const b of buckets) {
    const take = minOf(left, b.due < 0n ? 0n : b.due);
    allocations[b.name] = take;
    left -= take;
  }
  return { allocations, unapplied: left };
}

/** GoPay settlement split: share of net sale, never more than the amount outstanding. */
export function splitAtSettlement(net: bigint, shareBps: number, outstanding: bigint): bigint {
  if (shareBps < 0 || shareBps > 10000) throw new RangeError('shareBps out of range');
  if (outstanding <= 0n || net <= 0n) return 0n;
  return minOf(outstanding, mulBps(net, BigInt(shareBps)));
}
