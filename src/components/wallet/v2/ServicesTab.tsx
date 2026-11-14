'use client';

/**
 * Services tab — airtime, data, electricity, water, TV, transport, vouchers, bills.
 * Shared purchase-sheet pattern with provider validation, fee preview and
 * token receipts for electricity / voucher purchases.
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Bus,
  Copy,
  Droplets,
  Gift,
  Receipt,
  Signal,
  Tv,
  Wifi,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import {
  copyText,
  formatMoney,
  getProviders,
  parseAmountToCents,
  purchaseService,
  type ServiceProvider,
  type ServiceResult,
} from './api';
import { useWalletData } from './WalletApp';
import { AmountInput, EmptyState, ErrorCard, FeeRow, ListSkeleton, SuccessCheck } from './ui';

type ServiceKey = 'airtime' | 'data' | 'electricity' | 'water' | 'tv' | 'transport' | 'voucher' | 'bill';

interface ServiceSpec {
  key: ServiceKey;
  title: string;
  blurb: string;
  icon: LucideIcon;
  /** fixed provider id (single-provider services) */
  fixedProviderId?: string;
  fixedProviderName?: string;
  /** category to fetch providers for (water, bill, tv, transport, electricity) */
  providerCategory?: string;
  /** hardcoded provider name options (airtime, data) */
  providerNames?: string[];
  accountLabel?: string;
  needsPhone?: boolean;
  amountChips: number[];
  bundles?: { label: string; rands: number }[];
}

const SERVICES: ServiceSpec[] = [
  {
    key: 'airtime',
    title: 'Airtime',
    blurb: 'Instant top-up for any SA network.',
    icon: Signal,
    providerNames: ['Vodacom', 'MTN', 'Telkom Mobile', 'Cell C'],
    needsPhone: true,
    amountChips: [5, 10, 29, 50, 100],
  },
  {
    key: 'data',
    title: 'Data',
    blurb: 'Once-off data bundles, no contract.',
    icon: Wifi,
    providerNames: ['Vodacom', 'MTN', 'Telkom Mobile', 'Cell C'],
    bundles: [
      { label: '1GB', rands: 99 },
      { label: '2GB', rands: 199 },
      { label: '5GB', rands: 399 },
    ],
    amountChips: [],
  },
  {
    key: 'electricity',
    title: 'Electricity',
    blurb: 'Prepaid tokens for Eskom meters.',
    icon: Zap,
    fixedProviderId: 'prov-eskom',
    providerCategory: 'electricity',
    accountLabel: 'Meter number',
    amountChips: [50, 100, 200, 500],
  },
  {
    key: 'water',
    title: 'Water',
    blurb: 'Municipal water accounts.',
    icon: Droplets,
    providerCategory: 'water',
    amountChips: [100, 200, 300, 500],
  },
  {
    key: 'tv',
    title: 'TV',
    blurb: 'DStv subscriptions.',
    icon: Tv,
    fixedProviderId: 'prov-dstv',
    providerCategory: 'tv',
    accountLabel: 'Customer number',
    bundles: [
      { label: 'Access R129', rands: 129 },
      { label: 'Family R299', rands: 299 },
      { label: 'Compact R449', rands: 449 },
    ],
    amountChips: [],
  },
  {
    key: 'transport',
    title: 'Transport',
    blurb: 'Gautrain card top-ups.',
    icon: Bus,
    fixedProviderId: 'prov-gautrain',
    providerCategory: 'transport',
    accountLabel: 'Card number',
    amountChips: [50, 100, 200, 500],
  },
  {
    key: 'voucher',
    title: 'Vouchers',
    blurb: 'Gift vouchers for the big stores.',
    icon: Gift,
    providerNames: ['Checkers', 'Shoprite', 'Pick n Pay', 'Takealot'],
    amountChips: [50, 100, 200, 500],
  },
  {
    key: 'bill',
    title: 'Bills',
    blurb: 'Accounts, rates, store cards & more.',
    icon: Receipt,
    providerCategory: undefined, // all providers
    amountChips: [100, 200, 500, 1000],
  },
];

const TILE_ORDER: ServiceKey[] = [
  'airtime',
  'data',
  'electricity',
  'water',
  'tv',
  'transport',
  'voucher',
  'bill',
];

export default function ServicesTab({
  intent,
  onIntentConsumed,
}: {
  intent?: { serviceKey?: string };
  onIntentConsumed?: () => void;
}) {
  const [localKey, setLocalKey] = useState<ServiceKey | null>(null);
  // External nav intents force the open sheet; manual tile taps clear the intent.
  const intentKey = intent?.serviceKey as ServiceKey | undefined;
  const openKey = intentKey && TILE_ORDER.includes(intentKey) ? intentKey : localKey;

  const setOpenKey = (key: ServiceKey | null) => {
    onIntentConsumed?.();
    setLocalKey(key);
  };

  return (
    <div className="p-4 pb-6">
      <p className="mb-3 text-xs text-gray-500">Pay for everyday services straight from your wallet.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TILE_ORDER.map((key) => {
          const spec = SERVICES.find((s) => s.key === key);
          if (!spec) return null;
          const Icon = spec.icon;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setOpenKey(key)}
              className="flex min-h-[96px] flex-col items-center justify-center gap-2 rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition-all hover:border-teal-200 hover:shadow-md active:scale-[0.98]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-teal-50 text-[#00897B]">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold text-gray-800">{spec.title}</span>
            </button>
          );
        })}
      </div>

      <ServiceSheet spec={openKey ? SERVICES.find((s) => s.key === openKey) ?? null : null} onClose={() => setOpenKey(null)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Purchase sheet
// ---------------------------------------------------------------------------
function ServiceSheet({ spec, onClose }: { spec: ServiceSpec | null; onClose: () => void }) {
  const { data: overview, refreshBalance } = useWalletData();

  const [providers, setProviders] = useState<ServiceProvider[] | null>(null);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [providersError, setProvidersError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [selectedProviderName, setSelectedProviderName] = useState<string>('');
  const [account, setAccount] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [bundle, setBundle] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ServiceResult | null>(null);
  const [resultMessage, setResultMessage] = useState('');

  const needsProviders = !spec ? false : spec.providerCategory !== undefined || spec.key === 'bill';

  const loadProviders = useCallback(async (spec: ServiceSpec) => {
    setProvidersLoading(true);
    setProvidersError(null);
    try {
      const res = await getProviders(spec.providerCategory);
      setProviders(res.providers);
      if (spec.fixedProviderId) {
        setSelectedProvider(res.providers.find((p) => p.id === spec.fixedProviderId) ?? null);
      }
    } catch (e) {
      setProvidersError(e instanceof Error ? e.message : 'Could not load providers');
    } finally {
      setProvidersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!spec) return;
    // reset per-open state
    setProviders(null);
    setSelectedProvider(null);
    setSelectedProviderName('');
    setAccount('');
    setPhone(overview?.user.phone ?? '');
    setAmount('');
    setBundle(null);
    setResult(null);
    setResultMessage('');
    if (spec.providerCategory !== undefined || spec.key === 'bill') {
      void loadProviders(spec);
    }
  }, [spec]);

  const cents = parseAmountToCents(amount);
  const effectiveProvider: ServiceProvider | null =
    selectedProvider ??
    (spec?.fixedProviderId && providers
      ? providers.find((p) => p.id === spec.fixedProviderId) ?? null
      : null);

  const feeCents = useMemo(() => {
    if (!spec) return 0;
    if (spec.key === 'electricity') return 215;
    if (effectiveProvider) return Number(effectiveProvider.feeCents);
    if (spec.key === 'bill') return 250;
    return 0;
  }, [spec, effectiveProvider]);

  const minCents = effectiveProvider ? Number(effectiveProvider.minAmountCents) : 0;
  const maxCents = effectiveProvider ? Number(effectiveProvider.maxAmountCents) : 500000;

  const canSubmit = useMemo(() => {
    if (!spec || busy || cents <= 0) return false;
    if (spec.key === 'data' && !bundle) return false;
    if (spec.providerNames && !selectedProviderName) return false;
    if (spec.key === 'voucher' && !selectedProviderName) return false;
    if (spec.accountLabel && !account.trim()) return false;
    if (spec.needsPhone && phone.trim().length < 9) return false;
    if (effectiveProvider && (cents < minCents || cents > maxCents)) return false;
    return true;
  }, [
    spec,
    busy,
    cents,
    bundle,
    selectedProviderName,
    account,
    phone,
    effectiveProvider,
    minCents,
    maxCents,
  ]);

  const submit = async () => {
    if (!spec) return;
    if (effectiveProvider && (cents < minCents || cents > maxCents)) {
      toast.error(`Amount must be between ${formatMoney(minCents)} and ${formatMoney(maxCents)}`);
      return;
    }
    if (cents > 500000) {
      toast.error('Maximum purchase is R5,000');
      return;
    }
    setBusy(true);
    try {
      const res = await purchaseService({
        serviceType: spec.key,
        amountCents: cents,
        providerId: effectiveProvider?.id,
        providerName: effectiveProvider?.name ?? (selectedProviderName || undefined),
        accountNumber: spec.accountLabel ? account.trim() : undefined,
        recipientPhone: spec.needsPhone ? phone.trim() : undefined,
        bundle: spec.key === 'data' ? bundle ?? undefined : undefined,
        voucherBrand: spec.key === 'voucher' ? selectedProviderName : undefined,
      });
      setResult(res.transaction);
      setResultMessage(res.message);
      toast.success(res.message);
      await refreshBalance();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Purchase failed');
    } finally {
      setBusy(false);
    }
  };

  if (!spec) return null;

  const close = () => {
    onClose();
  };

  const Icon = spec.icon;

  return (
    <SheetLike open onClose={close} title={spec.title} icon={<Icon className="h-5 w-5 text-[#00897B]" />}>
      {result ? (
        <ServiceReceipt result={result} message={resultMessage} onClose={close} />
      ) : providersLoading ? (
        <div className="py-6">
          <ListSkeleton rows={3} />
        </div>
      ) : providersError ? (
        <ErrorCard message={providersError} onRetry={() => loadProviders(spec)} />
      ) : (
        <>
          <p className="text-xs text-gray-500">{spec.blurb}</p>

          {/* Provider selection — bills: full provider list */}
          {spec.key === 'bill' || spec.key === 'water' ? (
            <div className="mt-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Choose provider</p>
              {(providers ?? []).length === 0 ? (
                <EmptyState icon={<Icon className="h-5 w-5" />} title="No providers available" />
              ) : (
                <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
                  {(providers ?? []).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedProvider(p);
                        setAccount('');
                      }}
                      className={`flex min-h-[48px] w-full items-center justify-between rounded-xl border px-3.5 text-left ${
                        effectiveProvider?.id === p.id ? 'border-[#00897B] bg-teal-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.accountLabel}</p>
                      </div>
                      {Number(p.feeCents) > 0 ? (
                        <span className="shrink-0 text-[10px] font-semibold text-gray-400">
                          fee {formatMoney(p.feeCents)}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Provider chips — airtime / data / voucher */}
          {spec.providerNames ? (
            <div className="mt-3">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                {spec.key === 'voucher' ? 'Brand' : 'Network'}
              </p>
              <div className="flex flex-wrap gap-2">
                {spec.providerNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedProviderName(name)}
                    className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold ${
                      selectedProviderName === name
                        ? 'border-[#00897B] bg-[#00897B] text-white'
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Recipient phone (airtime) */}
          {spec.needsPhone ? (
            <div className="mt-3">
              <label htmlFor="svc-phone" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                Recipient number
              </label>
              <input
                id="svc-phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+27 82 000 0000"
                className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold tabular-nums text-gray-900 outline-none focus:border-[#00897B] focus:bg-white"
              />
            </div>
          ) : null}

          {/* Account number */}
          {(spec.accountLabel || effectiveProvider) && spec.key !== 'voucher' && spec.key !== 'airtime' && spec.key !== 'data' ? (
            <div className="mt-3">
              <label htmlFor="svc-account" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
                {effectiveProvider?.accountLabel ?? spec.accountLabel ?? 'Account number'}
              </label>
              <input
                id="svc-account"
                value={account}
                inputMode="numeric"
                onChange={(e) => setAccount(e.target.value)}
                placeholder={effectiveProvider?.accountFormat ? formatHint(effectiveProvider.accountFormat) : ''}
                className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 font-mono text-sm text-gray-900 outline-none focus:border-[#00897B] focus:bg-white"
              />
            </div>
          ) : null}

          {/* Bundles */}
          {spec.bundles ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Choose option</p>
              <div className="grid grid-cols-3 gap-2">
                {spec.bundles.map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => {
                      setBundle(b.label);
                      setAmount(String(b.rands));
                    }}
                    className={`flex min-h-[64px] flex-col items-center justify-center rounded-xl border p-2 ${
                      bundle === b.label ? 'border-[#00897B] bg-teal-50' : 'border-gray-200'
                    }`}
                  >
                    <span className="text-xs font-black text-gray-900">{b.label}</span>
                    <span className="text-[11px] font-bold tabular-nums text-[#00695C]">R{b.rands}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* Amount */}
          {spec.amountChips.length > 0 || !spec.bundles ? (
            <>
              <p className="mb-0.5 mt-4 text-center text-xs font-bold uppercase tracking-wide text-gray-400">Amount</p>
              <AmountInput value={amount} onChange={setAmount} />
              {spec.amountChips.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {spec.amountChips.map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setAmount(String(v))}
                      className={`min-h-[44px] rounded-full border px-4 text-sm font-bold ${
                        amount === String(v) ? 'border-[#00897B] bg-[#00897B] text-white' : 'border-gray-200 text-gray-700'
                      }`}
                    >
                      R{v}
                    </button>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}

          {/* Fee + validation */}
          {cents > 0 ? (
            <div className="mt-3 rounded-xl bg-gray-50 px-4 py-2">
              <FeeRow label="Amount" value={formatMoney(cents)} />
              <FeeRow
                label="Fee"
                value={feeCents === 0 ? 'Free' : formatMoney(feeCents)}
              />
              <FeeRow label="Total" value={formatMoney(cents + feeCents)} strong />
              {effectiveProvider ? (
                <p className="pt-1 text-[10px] text-gray-400">
                  Min {formatMoney(minCents)} · Max {formatMoney(maxCents)} ·{' '}
                  {effectiveProvider.processingTime}
                </p>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className="mt-4 min-h-[48px] w-full rounded-xl bg-[#00897B] font-bold text-white disabled:opacity-50"
          >
            {busy ? 'Processing…' : cents > 0 ? `Pay ${formatMoney(cents + feeCents)}` : 'Buy now'}
          </button>
        </>
      )}
    </SheetLike>
  );
}

/** Render the accountFormat hint (e.g. "######" → 6 digits) */
function formatHint(format: string): string {
  const count = (format.match(/#/g) ?? []).length;
  return count > 0 ? `${count} digits` : '';
}

// ---------------------------------------------------------------------------
// Receipt (incl. electricity token)
// ---------------------------------------------------------------------------
function ServiceReceipt({
  result,
  message,
  onClose,
}: {
  result: ServiceResult;
  message: string;
  onClose: () => void;
}) {
  const token = result.voucherToken;
  const isToken = !!token && !!result.unitsPurchased;

  return (
    <div>
      <SuccessCheck label={message} />
      <p className="mb-3 text-center text-sm text-gray-500">{result.description}</p>

      {token ? (
        <div
          className={`rounded-2xl border p-4 text-center ${
            isToken ? 'border-amber-200 bg-amber-50/70' : 'border-teal-100 bg-teal-50/70'
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
            {isToken ? 'Prepaid token' : 'Voucher PIN'}
          </p>
          <p className="mt-1 break-all font-mono text-lg font-bold tracking-wider text-gray-900">{token}</p>
          <button
            type="button"
            onClick={async () => {
              const ok = await copyText(token);
              if (ok) toast.success('Copied to clipboard');
              else toast.error('Copy failed — long-press to copy');
            }}
            className="mt-2.5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-white font-bold text-[#00695C] shadow-sm"
          >
            <Copy className="h-4 w-4" /> Copy {isToken ? 'token' : 'PIN'}
          </button>
        </div>
      ) : null}

      <div className="mt-3 rounded-xl bg-gray-50 px-4 py-2">
        <FeeRow label="Amount" value={formatMoney(result.amountCents)} />
        {Number(result.feeCents) > 0 ? <FeeRow label="Fee" value={formatMoney(result.feeCents)} /> : null}
        {result.unitsPurchased ? <FeeRow label="Units purchased" value={result.unitsPurchased} /> : null}
        {result.meterNumber ? <FeeRow label="Meter" value={result.meterNumber} /> : null}
        {result.reference ? <FeeRow label="Reference" value={result.reference} /> : null}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-4 min-h-[48px] w-full rounded-xl bg-[#00897B] font-bold text-white"
      >
        Done
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Minimal local sheet wrapper (same look as ui.Sheet, keeps this file standalone)
// ---------------------------------------------------------------------------
function SheetLike({
  open,
  onClose,
  title,
  icon,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[70]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <button aria-label="Close sheet" type="button" className="absolute inset-0 bg-black/45" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="absolute inset-x-0 bottom-0 mx-auto max-w-md w-full"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <div className="max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl">
              <div className="sticky top-0 z-10 rounded-t-3xl bg-white px-5 pb-2 pt-3">
                <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-gray-200" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="text-base font-bold text-gray-900">{title}</h3>
                  </div>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={onClose}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-1">{children}</div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
