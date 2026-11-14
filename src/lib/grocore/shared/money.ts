/** All money is integer minor units (cents) held as bigint. Never floating point. */
export type Minor = bigint;

/** amount * bps / 10_000, rounded half-up. Amounts must be non-negative. */
export function mulBps(amount: Minor, bps: bigint): Minor {
  if (amount < 0n || bps < 0n) throw new RangeError('mulBps expects non-negative inputs');
  return (amount * bps + 5000n) / 10000n;
}

export const minOf = (a: Minor, b: Minor): Minor => (a < b ? a : b);

export function fmtRand(c: Minor): string {
  const neg = c < 0n;
  const abs = neg ? -c : c;
  const whole = (abs / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${neg ? '-' : ''}R${whole}.${(abs % 100n).toString().padStart(2, '0')}`;
}
