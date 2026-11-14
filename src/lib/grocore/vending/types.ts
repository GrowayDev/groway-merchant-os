export type Country = 'ZA' | 'MW';
export type VendCommodity = 'airtime' | 'data' | 'electricity';

export interface VendRequest {
  /** Unique per delivery. Reusing it can never vend twice. */
  reference: string;
  country: Country;
  commodity: VendCommodity;
  amountMinor: bigint;
  currency: string;
  msisdn?: string;
  operator?: string;
  meterNumber?: string;
  municipality?: string;
  customerName?: string;
}

/** success: delivered. failed: definitely not delivered. unknown: we cannot tell, so never retry elsewhere; look it up. */
export type VendOutcome =
  | { status: 'success'; providerId: string; providerRef: string; token?: string; units?: string }
  | { status: 'failed'; providerId: string; code: string; message: string; retryable: boolean }
  | { status: 'unknown'; providerId: string; reason: string };

export interface MeterInfo { valid: boolean; name?: string; municipality?: string; raw?: unknown }

export interface VendingProvider {
  readonly id: string;
  supports(commodity: VendCommodity, country: Country): boolean;
  validateMeter?(meterNumber: string, country: Country, municipality?: string): Promise<MeterInfo>;
  vend(req: VendRequest): Promise<VendOutcome>;
  status(reference: string): Promise<VendOutcome>;
}
