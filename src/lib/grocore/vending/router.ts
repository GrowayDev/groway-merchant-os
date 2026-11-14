import { VendOutcome, VendRequest, VendingProvider } from './types';

export interface VendStore {
  get(reference: string): Promise<{ outcome: VendOutcome } | undefined>;
  put(reference: string, outcome: VendOutcome): Promise<void>;
}
export class InMemoryVendStore implements VendStore {
  private m = new Map<string, { outcome: VendOutcome }>();
  async get(r: string) { return this.m.get(r); }
  async put(r: string, outcome: VendOutcome) { this.m.set(r, { outcome }); }
}

export interface RoutedProvider { provider: VendingProvider; priority: number }
export interface RouterOptions { failureThreshold?: number; cooldownMs?: number; now?: () => number }

/**
 * Routes a delivery to the best available provider and fails over ONLY when the first provider definitely
 * did not deliver. An unknown outcome (timeout, unreadable reply) stops the chain: the item might have been
 * delivered, so it is looked up, never sent to a second provider.
 */
export class VendingRouter {
  private health = new Map<string, { failures: number; openUntil: number }>();
  private threshold: number; private cooldown: number; private now: () => number;
  constructor(private providers: RoutedProvider[], private store: VendStore, opts: RouterOptions = {}) {
    this.threshold = opts.failureThreshold ?? 3; this.cooldown = opts.cooldownMs ?? 60_000; this.now = opts.now ?? Date.now;
  }

  private circuitOpen(id: string) { const h = this.health.get(id); return !!h && h.openUntil > this.now(); }
  private record(id: string, ok: boolean) {
    const h = this.health.get(id) ?? { failures: 0, openUntil: 0 };
    if (ok) { h.failures = 0; h.openUntil = 0; } else if (++h.failures >= this.threshold) h.openUntil = this.now() + this.cooldown;
    this.health.set(id, h);
  }

  async vend(req: VendRequest): Promise<VendOutcome> {
    const prior = await this.store.get(req.reference);
    if (prior) return prior.outcome.status === 'unknown' ? this.resolve(req.reference) : prior.outcome;

    const candidates = this.providers
      .filter((p) => p.provider.supports(req.commodity, req.country) && !this.circuitOpen(p.provider.id))
      .sort((a, b) => a.priority - b.priority);
    let last: VendOutcome = { status: 'failed', providerId: 'router', code: 'NO_PROVIDER', message: 'no available provider', retryable: false };

    for (const { provider } of candidates) {
      let out: VendOutcome;
      try { out = await provider.vend(req); }
      catch (e) { out = { status: 'unknown', providerId: provider.id, reason: String(e) }; }
      if (out.status === 'success') { this.record(provider.id, true); await this.store.put(req.reference, out); return out; }
      if (out.status === 'unknown') { this.record(provider.id, false); await this.store.put(req.reference, out); return out; }
      this.record(provider.id, false);
      last = out;
      if (!out.retryable) break;
    }
    await this.store.put(req.reference, last);
    return last;
  }

  /** Look up an unknown delivery with the provider that took it. */
  async resolve(reference: string): Promise<VendOutcome> {
    const prior = await this.store.get(reference);
    if (!prior) return { status: 'failed', providerId: 'router', code: 'NOT_FOUND', message: 'no such delivery', retryable: false };
    if (prior.outcome.status !== 'unknown') return prior.outcome;
    const p = this.providers.find((x) => x.provider.id === prior.outcome.providerId)?.provider;
    if (!p) return prior.outcome;
    let out: VendOutcome;
    try { out = await p.status(reference); } catch (e) { return prior.outcome; }
    if (out.status !== 'unknown') await this.store.put(reference, out);
    return out.status === 'unknown' ? prior.outcome : out;
  }

  async validateMeter(meterNumber: string, country: 'ZA' | 'MW', municipality?: string) {
    for (const { provider } of [...this.providers].sort((a, b) => a.priority - b.priority)) {
      if (provider.validateMeter && provider.supports('electricity', country)) return provider.validateMeter(meterNumber, country, municipality);
    }
    return { valid: false } as const;
  }
}
