import { Country, MeterInfo, VendCommodity, VendOutcome, VendRequest, VendingProvider } from './types';

export interface HttpCall { method: 'GET' | 'POST'; path: string; body?: unknown }

/**
 * A provider integration is configuration: how to build each call and how to read each reply.
 * Onboarding a new aggregator means writing one config object once its partner documentation is in hand.
 */
export interface HttpAdapterConfig {
  id: string;
  baseUrl: string;
  headers: () => Record<string, string>;
  supported: { commodity: VendCommodity; country: Country }[];
  buildVend(req: VendRequest): HttpCall;
  mapVend(httpStatus: number, body: any, req: VendRequest): VendOutcome;
  buildStatus?(reference: string): HttpCall;
  mapStatus?(httpStatus: number, body: any, reference: string): VendOutcome;
  buildValidate?(meterNumber: string, country: Country, municipality?: string): HttpCall;
  mapValidate?(httpStatus: number, body: any): MeterInfo;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

export class HttpVendingAdapter implements VendingProvider {
  readonly id: string;
  constructor(private cfg: HttpAdapterConfig) { this.id = cfg.id; }

  supports(c: VendCommodity, country: Country) { return this.cfg.supported.some((s) => s.commodity === c && s.country === country); }

  private async call(c: HttpCall): Promise<{ status: number; body: any }> {
    const f = this.cfg.fetchImpl ?? fetch;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), this.cfg.timeoutMs ?? 15_000);
    try {
      const res = await f(this.cfg.baseUrl + c.path, {
        method: c.method, signal: ctl.signal,
        headers: { 'content-type': 'application/json', accept: 'application/json', ...this.cfg.headers() },
        body: c.body === undefined ? undefined : JSON.stringify(c.body),
      });
      let body: any = undefined;
      try { body = await res.json(); } catch { body = undefined; }
      return { status: res.status, body };
    } finally { clearTimeout(timer); }
  }

  /** No answer, a timeout or a server error means we cannot know whether it was delivered, so the result is unknown. */
  async vend(req: VendRequest): Promise<VendOutcome> {
    let r: { status: number; body: any };
    try { r = await this.call(this.cfg.buildVend(req)); }
    catch (e) { return { status: 'unknown', providerId: this.id, reason: `NO_RESPONSE: ${String(e)}` }; }
    if (r.status >= 500) return { status: 'unknown', providerId: this.id, reason: `HTTP_${r.status}` };
    if (r.status === 429) return { status: 'failed', providerId: this.id, code: 'RATE_LIMITED', message: 'rate limited', retryable: true };
    return this.cfg.mapVend(r.status, r.body, req);
  }

  async status(reference: string): Promise<VendOutcome> {
    if (!this.cfg.buildStatus || !this.cfg.mapStatus) return { status: 'unknown', providerId: this.id, reason: 'STATUS_ENDPOINT_NOT_CONFIGURED' };
    try { const r = await this.call(this.cfg.buildStatus(reference)); return this.cfg.mapStatus(r.status, r.body, reference); }
    catch (e) { return { status: 'unknown', providerId: this.id, reason: `NO_RESPONSE: ${String(e)}` }; }
  }

  async validateMeter(meterNumber: string, country: Country, municipality?: string): Promise<MeterInfo> {
    if (!this.cfg.buildValidate || !this.cfg.mapValidate) return { valid: false };
    const r = await this.call(this.cfg.buildValidate(meterNumber, country, municipality));
    return this.cfg.mapValidate(r.status, r.body);
  }
}
