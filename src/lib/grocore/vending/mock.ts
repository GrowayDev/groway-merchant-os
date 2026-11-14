import { Country, MeterInfo, VendCommodity, VendOutcome, VendRequest, VendingProvider } from './types';

export type MockMode = 'success' | 'fail' | 'fail_retryable' | 'timeout' | 'throw';

/** Sandbox provider for development and tests. Delivers nothing real. */
export class MockVendingProvider implements VendingProvider {
  calls: VendRequest[] = [];
  private done = new Map<string, VendOutcome>();
  constructor(public readonly id: string, public mode: MockMode = 'success',
              private scope: { commodities?: VendCommodity[]; countries?: Country[] } = {}) {}
  supports(c: VendCommodity, country: Country) {
    return (this.scope.commodities ?? ['airtime', 'data', 'electricity']).includes(c) && (this.scope.countries ?? ['ZA', 'MW']).includes(country);
  }
  async validateMeter(meterNumber: string): Promise<MeterInfo> { return { valid: /^\d{11}$/.test(meterNumber), name: 'Sandbox customer' }; }
  async vend(req: VendRequest): Promise<VendOutcome> {
    this.calls.push(req);
    if (this.mode === 'throw') throw new Error('network down');
    if (this.mode === 'timeout') { const o: VendOutcome = { status: 'unknown', providerId: this.id, reason: 'TIMEOUT' }; return o; }
    if (this.mode === 'fail') return { status: 'failed', providerId: this.id, code: 'DECLINED', message: 'declined', retryable: false };
    if (this.mode === 'fail_retryable') return { status: 'failed', providerId: this.id, code: 'BUSY', message: 'try elsewhere', retryable: true };
    const o: VendOutcome = { status: 'success', providerId: this.id, providerRef: `${this.id}-${req.reference}`,
      token: req.commodity === 'electricity' ? '1234-5678-9012-3456-7890' : undefined };
    this.done.set(req.reference, o);
    return o;
  }
  /** Tests can mark a timed-out delivery as having actually succeeded. */
  settle(reference: string, outcome: VendOutcome) { this.done.set(reference, outcome); }
  async status(reference: string): Promise<VendOutcome> {
    return this.done.get(reference) ?? { status: 'unknown', providerId: this.id, reason: 'NO_RECORD' };
  }
}
