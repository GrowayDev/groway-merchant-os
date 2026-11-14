import { HttpAdapterConfig, HttpVendingAdapter } from './http-adapter';
import { VendOutcome, VendRequest } from './types';

/** Tambala to the decimal string the provider expects, e.g. 100000n -> '1000', 150n -> '1.50'. */
export function minorToDecimal(minor: bigint): string {
  const whole = minor / 100n; const frac = (minor % 100n).toString().padStart(2, '0');
  return frac === '00' ? whole.toString() : `${whole}.${frac}`;
}
/** +265991234567 -> 0991234567. The provider's examples use the local form. CONFIRM in the sandbox. */
export function toLocalMsisdn(msisdn: string): string {
  const d = msisdn.replace(/[^\d]/g, '');
  return d.startsWith('265') ? `0${d.slice(3)}` : d;
}

const ok = (b: any) => b?.status === 'success' || b?.status === 'successful' || b?.success === true;

/**
 * PayChangu bill payments for Malawi (airtime on Airtel and TNM, ESCOM prepaid tokens), built from the public
 * documentation. Response bodies are not fully documented, so anything unrecognised is reported as UNKNOWN,
 * never as success. CONFIRM every response shape and the status endpoint in the provider sandbox.
 */
export function paychanguConfig(opts: { secretKey: () => string; baseUrl?: string; statusPath?: (ref: string) => string; fetchImpl?: typeof fetch }): HttpAdapterConfig {
  const id = 'paychangu';
  return {
    id, baseUrl: opts.baseUrl ?? 'https://api.paychangu.com', fetchImpl: opts.fetchImpl,
    headers: () => ({ Authorization: `Bearer ${opts.secretKey()}` }),
    supported: [{ commodity: 'airtime', country: 'MW' }, { commodity: 'data', country: 'MW' }, { commodity: 'electricity', country: 'MW' }],
    buildVend(req: VendRequest) {
      if (req.commodity === 'electricity') {
        if (!req.meterNumber) throw new Error('meterNumber is required for electricity');
        return { method: 'POST', path: '/bills/pay', body: { biller: 'escom', account: req.meterNumber, amount: minorToDecimal(req.amountMinor), customer_name: req.customerName, reference: req.reference } };
      }
      if (!req.msisdn) throw new Error('msisdn is required for airtime');
      return { method: 'POST', path: '/bills/buy-airtime', body: { phone: toLocalMsisdn(req.msisdn), amount: minorToDecimal(req.amountMinor), reference: req.reference } };
    },
    mapVend(httpStatus, body, req): VendOutcome {
      if (httpStatus >= 200 && httpStatus < 300 && ok(body)) {
        return { status: 'success', providerId: id, providerRef: String(body?.data?.reference ?? body?.data?.id ?? req.reference),
          token: body?.data?.token ? String(body.data.token) : undefined, units: body?.data?.units ? String(body.data.units) : undefined };
      }
      if (httpStatus >= 400 && httpStatus < 500) return { status: 'failed', providerId: id, code: `HTTP_${httpStatus}`, message: String(body?.message ?? 'rejected'), retryable: false };
      return { status: 'unknown', providerId: id, reason: 'UNRECOGNISED_RESPONSE' };
    },
    buildStatus: opts.statusPath ? (ref) => ({ method: 'GET', path: opts.statusPath!(ref) }) : undefined,
    mapStatus: opts.statusPath ? (s, b, ref): VendOutcome => (s < 300 && ok(b)
      ? { status: 'success', providerId: id, providerRef: String(b?.data?.reference ?? ref), token: b?.data?.token ? String(b.data.token) : undefined }
      : { status: 'unknown', providerId: id, reason: 'STATUS_NOT_FINAL' }) : undefined,
    buildValidate: (meter) => ({ method: 'POST', path: '/bills/validate', body: { biller: 'escom', account: meter } }),
    mapValidate: (s, b) => ({ valid: s < 300 && ok(b), name: b?.data?.name ?? b?.data?.customer_name, raw: b }),
  };
}

export const createPayChanguProvider = (opts: Parameters<typeof paychanguConfig>[0]) => new HttpVendingAdapter(paychanguConfig(opts));
