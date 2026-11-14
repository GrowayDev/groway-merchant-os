'use client';

/**
 * Home tab — balance hero, quick actions, loyalty, insights, upcoming, recent.
 */

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  ChevronRight,
  Eye,
  EyeOff,
  Landmark,
  Plus,
  QrCode,
  Send,
  Wallet as WalletIcon,
  Zap,
} from 'lucide-react';
import {
  formatMoney,
  getTransactions,
  parseAmountToCents,
  walletOp,
  type Txn,
  type TxnPage,
  type UpcomingItem,
} from './api';
import { useWalletData } from './WalletApp';
import {
  AmountInput,
  Bar,
  Card,
  CardSkeleton,
  CategoryIcon,
  Chip,
  EmptyState,
  ErrorCard,
  ListSkeleton,
  Money,
  SectionTitle,
  Segmented,
  Sheet,
  SuccessCheck,
  TIER_COLORS,
  TIER_ORDER,
  TxRow,
  UpcomingIcon,
} from './ui';

const CATEGORY_FILTERS = [
  { value: '', label: 'All' },
  { value: 'transfer', label: 'Sent' },
  { value: 'topup', label: 'Top-ups' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'airtime', label: 'Airtime' },
  { value: 'savings', label: 'Savings' },
  { value: 'stokvel', label: 'Stokvel' },
  { value: 'bnpl', label: 'BNPL' },
  { value: 'shopping', label: 'Shopping' },
];

export default function HomeTab() {
  const { data, loading, refresh, navigate } = useWalletData();
  const [hideBalance, setHideBalance] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [txSheetOpen, setTxSheetOpen] = useState(false);

  if (!data) {
    return (
      <div className="space-y-4 p-4">
        <CardSkeleton lines={3} height="h-40" />
        <CardSkeleton lines={2} />
        <CardSkeleton lines={4} />
      </div>
    );
  }

  const { user, wallet, loyalty, insights, recent, upcoming, stats } = data;
  const firstName = user.firstName ?? 'there';
  const nextTierIdx = TIER_ORDER.indexOf(loyalty.tier) + 1;
  const nextTier = TIER_ORDER[nextTierIdx] ?? null;
  const catTotal = insights.topCategories.reduce((s, c) => s + c.cents, 0) || 1;

  return (
    <div className="pb-6">
      {/* ---------- Header ---------- */}
      <header className="flex items-center gap-3 px-4 pb-3 pt-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00897B] text-sm font-bold text-white shadow-sm">
          {user.initials || (user.firstName?.[0] ?? 'G')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-gray-900">
            Molo, {firstName}
            <span aria-hidden> 👋</span>
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {user.kycStatus === 'verified' ? (
              <>
                <BadgeCheck className="h-3.5 w-3.5 text-[#00897B]" />
                <span className="font-semibold text-[#00695C]">Verified</span>
                <span>· KYC Level {user.kycLevel}</span>
              </>
            ) : (
              <span className="font-semibold text-amber-600">KYC verification pending</span>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label="Transaction history"
          onClick={() => setTxSheetOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
        >
          <Banknote className="h-5 w-5" />
        </button>
      </header>

      {/* ---------- Balance hero ---------- */}
      <section className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl bg-gradient-to-br from-[#004D40] via-[#00695C] to-[#00897B] p-5 text-white shadow-lg shadow-teal-900/15"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-100/80">
              Available balance
            </p>
            <button
              type="button"
              aria-label={hideBalance ? 'Show balance' : 'Hide balance'}
              onClick={() => setHideBalance((h) => !h)}
              className="flex h-9 w-9 items-center justify-center rounded-full text-teal-100/80 hover:bg-white/10"
            >
              {hideBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight">
            {hideBalance ? 'R ••••••' : formatMoney(wallet.balanceCents)}
          </p>

          <div className="mt-4 flex gap-6">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                <ArrowDownLeft className="h-3.5 w-3.5 text-lime-300" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-teal-100/70">In this month</p>
                <p className="text-sm font-bold tabular-nums text-lime-300">
                  {hideBalance ? '••••' : formatMoney(insights.monthIncomeCents)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
                <ArrowUpRight className="h-3.5 w-3.5 text-amber-300" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-teal-100/70">Out this month</p>
                <p className="text-sm font-bold tabular-nums text-amber-300">
                  {hideBalance ? '••••' : formatMoney(insights.monthSpendCents)}
                </p>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-5 grid grid-cols-4 gap-2">
            <QuickAction icon={Plus} label="Top Up" onClick={() => setTopUpOpen(true)} />
            <QuickAction icon={Send} label="Send" onClick={() => navigate('pay', { payMode: 'send' })} />
            <QuickAction icon={QrCode} label="Scan QR" onClick={() => navigate('pay', { payMode: 'scan' })} />
            <QuickAction icon={Zap} label="Electricity" onClick={() => navigate('services', { serviceKey: 'electricity' })} />
          </div>
        </motion.div>
      </section>

      {/* ---------- Snapshot chips ---------- */}
      <section className="mt-4 grid grid-cols-4 gap-2 px-4">
        <MiniStat icon={WalletIcon} label="Savings" value={formatMoney(stats.savingsTotalCents)} />
        <MiniStat icon={Landmark} label="Stokvels" value={String(stats.stokvelsCount)} />
        <MiniStat icon={BadgeCheck} label="Cards" value={String(stats.activeCards)} />
        <MiniStat icon={Zap} label="EWA" value={`R${Math.floor(stats.ewaAvailable)}`} />
      </section>

      {/* ---------- Loyalty ---------- */}
      <section className="mt-4 px-4">
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black uppercase text-white"
                style={{ backgroundColor: TIER_COLORS[loyalty.tier] }}
              >
                {loyalty.tier[0]}
              </span>
              <div>
                <p className="text-sm font-bold capitalize text-gray-900">{loyalty.tier} member</p>
                <p className="text-xs text-gray-500">{loyalty.points} points earned</p>
              </div>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white"
              style={{ backgroundColor: TIER_COLORS[loyalty.tier] }}
            >
              {loyalty.tier}
            </span>
          </div>
          <Bar value={loyalty.tierProgress} color={TIER_COLORS[loyalty.tier]} className="mt-3" />
          <p className="mt-2 text-xs text-gray-500">
            {nextTier && loyalty.pointsToNextTier
              ? `${loyalty.pointsToNextTier} points to ${nextTier}`
              : 'Top tier unlocked — enjoy the perks'}
          </p>
        </Card>
      </section>

      {/* ---------- Insights ---------- */}
      <section className="mt-4 px-4">
        <SectionTitle title="This month" />
        <Card className="mt-2">
          <div className="flex items-stretch gap-3">
            <div className="flex-1 rounded-xl bg-lime-50 p-3">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-[#558B2F]">
                <ArrowDownLeft className="h-3 w-3" /> In
              </p>
              <Money cents={insights.monthIncomeCents} className="mt-0.5 text-base text-[#33691E]" />
            </div>
            <div className="flex-1 rounded-xl bg-amber-50 p-3">
              <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                <ArrowUpRight className="h-3 w-3" /> Out
              </p>
              <Money cents={insights.monthSpendCents} className="mt-0.5 text-base text-amber-800" />
            </div>
          </div>

          {insights.topCategories.length > 0 ? (
            <div className="mt-4 space-y-2.5">
              {insights.topCategories.slice(0, 3).map((c) => (
                <div key={c.category}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold capitalize text-gray-700">
                      <CategoryIcon category={c.category} className="h-3.5 w-3.5 text-gray-400" />
                      {c.category}
                    </span>
                    <span className="tabular-nums font-semibold text-gray-500">{formatMoney(c.cents)}</span>
                  </div>
                  <Bar value={c.cents / catTotal} color="#00897B" />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-gray-400">No spending recorded yet this month.</p>
          )}
        </Card>
      </section>

      {/* ---------- Upcoming ---------- */}
      {upcoming.length > 0 ? (
        <section className="mt-4 px-4">
          <SectionTitle title="Upcoming payments" />
          <Card className="mt-2 space-y-1">
            {upcoming.slice(0, 4).map((u, i) => (
              <UpcomingRow key={`${u.type}-${i}`} item={u} />
            ))}
          </Card>
        </section>
      ) : null}

      {/* ---------- Recent activity ---------- */}
      <section className="mt-4 px-4">
        <SectionTitle title="Recent activity" action="See all" onAction={() => setTxSheetOpen(true)} />
        <Card className="mt-2">
          {loading && recent.length === 0 ? (
            <ListSkeleton rows={4} />
          ) : recent.length === 0 ? (
            <EmptyState
              icon={<WalletIcon className="h-6 w-6" />}
              title="No transactions yet"
              hint="Top up your wallet or buy airtime to get started"
            />
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.slice(0, 8).map((t) => (
                <TxRow key={t.id} txn={t} compact />
              ))}
            </div>
          )}
        </Card>
      </section>

      {/* ---------- Sheets ---------- */}
      <TopUpSheet open={topUpOpen} onClose={() => setTopUpOpen(false)} onSuccess={refresh} />
      <TransactionsSheet open={txSheetOpen} onClose={() => setTxSheetOpen(false)} />
    </div>
  );
}

// ---------------------------------------------------------------------------
function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Plus;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className="flex min-h-[44px] flex-col items-center gap-1.5"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur transition-colors hover:bg-white/25">
        <Icon className="h-5 w-5 text-white" />
      </span>
      <span className="text-[10px] font-bold text-teal-50">{label}</span>
    </motion.button>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof WalletIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-black/5 bg-white p-2.5 text-center shadow-sm">
      <Icon className="mx-auto h-4 w-4 text-[#00897B]" />
      <p className="mt-1 truncate text-[11px] font-bold tabular-nums text-gray-900">{value}</p>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
    </div>
  );
}

function UpcomingRow({ item }: { item: UpcomingItem }) {
  const due = new Date(item.dueDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[#00695C]">
        <UpcomingIcon type={item.type} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{item.label}</p>
        <p className="text-xs text-gray-500">due {due}</p>
      </div>
      <Money cents={item.amountCents} className="text-sm text-gray-900" />
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top-up sheet
// ---------------------------------------------------------------------------
const TOPUP_METHODS: { value: 'card' | 'eft' | 'cash_at_pos'; label: string }[] = [
  { value: 'card', label: 'Debit card' },
  { value: 'eft', label: 'Bank EFT' },
  { value: 'cash_at_pos', label: 'Cash at spaza' },
];

function TopUpSheet({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'card' | 'eft' | 'cash_at_pos'>('card');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ message: string } | null>(null);

  const cents = parseAmountToCents(amount);

  const submit = async () => {
    if (cents <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setBusy(true);
    try {
      const res = await walletOp({ action: 'topup', amountCents: cents, method });
      setDone({ message: res.message });
      toast.success(res.message);
      await onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Top-up failed');
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    onClose();
    setTimeout(() => {
      setDone(null);
      setAmount('');
    }, 250);
  };

  return (
    <Sheet open={open} onClose={close} title="Top up wallet">
      {done ? (
        <>
          <SuccessCheck label={done.message} />
          <button
            type="button"
            onClick={close}
            className="mt-3 min-h-[48px] w-full rounded-xl bg-[#00897B] font-bold text-white"
          >
            Done
          </button>
        </>
      ) : (
        <>
          <AmountInput value={amount} onChange={setAmount} autoFocus />
          <div className="mt-2 flex flex-wrap gap-2">
            {['50', '100', '200', '500'].map((v) => (
              <Chip key={v} label={`R${v}`} active={amount === v} onClick={() => setAmount(v)} />
            ))}
          </div>
          <p className="mb-1.5 mt-4 text-xs font-bold uppercase tracking-wide text-gray-500">Method</p>
          <Segmented options={TOPUP_METHODS} value={method} onChange={setMethod} />
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#00897B] font-bold text-white disabled:opacity-60"
          >
            {busy ? 'Processing…' : `Top up ${cents > 0 ? formatMoney(cents) : ''}`}
          </button>
        </>
      )}
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Transactions sheet — full history with cursor pagination + filters
// ---------------------------------------------------------------------------
function TransactionsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [txns, setTxns] = useState<Txn[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingPage, setLoadingPage] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('');

  const loadPage = useCallback(
    async (nextCursor: string | null, cat: string, append: boolean) => {
      setLoadingPage(true);
      setError(null);
      try {
        const page: TxnPage = await getTransactions({
          limit: 25,
          cursor: nextCursor,
          category: cat || undefined,
        });
        setTxns((prev) => (append ? [...prev, ...page.transactions] : page.transactions));
        setCursor(page.nextCursor);
        setHasMore(page.hasMore);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load transactions');
      } finally {
        setLoadingPage(false);
        setInitialLoaded(true);
      }
    },
    [],
  );

  useEffect(() => {
    if (open) {
      setTxns([]);
      setCursor(null);
      setInitialLoaded(false);
      void loadPage(null, category, false);
    }
  }, [open]);

  const changeCategory = (c: string) => {
    setCategory(c);
    setTxns([]);
    setCursor(null);
    void loadPage(null, c, false);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Transactions">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {CATEGORY_FILTERS.map((f) => (
          <div key={f.value} className="shrink-0">
            <Chip label={f.label} active={category === f.value} onClick={() => changeCategory(f.value)} />
          </div>
        ))}
      </div>

      {error ? (
        <ErrorCard message={error} onRetry={() => loadPage(null, category, false)} />
      ) : !initialLoaded ? (
        <ListSkeleton rows={6} />
      ) : txns.length === 0 ? (
        <EmptyState
          icon={<Banknote className="h-6 w-6" />}
          title="No transactions found"
          hint="Try a different filter or check back later"
        />
      ) : (
        <div className="divide-y divide-gray-50">
          {txns.map((t) => (
            <TxRow key={t.id} txn={t} />
          ))}
        </div>
      )}

      {hasMore ? (
        <button
          type="button"
          disabled={loadingPage}
          onClick={() => loadPage(cursor, category, true)}
          className="mt-3 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-teal-100 bg-teal-50/50 font-bold text-[#00695C] disabled:opacity-60"
        >
          {loadingPage ? 'Loading…' : 'Load more'}
        </button>
      ) : null}
    </Sheet>
  );
}
