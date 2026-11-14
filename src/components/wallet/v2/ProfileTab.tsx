'use client';

/**
 * Profile tab — identity, virtual cards (freeze + toggles), security, limits,
 * sign out.
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  BadgeCheck,
  ChevronDown,
  CreditCard,
  Gauge,
  LogOut,
  MonitorSmartphone,
  ShieldCheck,
  Wifi,
  Landmark,
  Globe,
  Nfc,
} from 'lucide-react';
import {
  formatMoney,
  getCards,
  logout,
  patchCard,
  type CardData,
} from './api';
import { useWalletData } from './WalletApp';
import { Bar, Card, CardSkeleton, ErrorCard, ListSkeleton, Money, SectionTitle } from './ui';

export default function ProfileTab() {
  const { data } = useWalletData();
  if (!data) return <div className="p-4"><CardSkeleton lines={3} /></div>;

  const { user, wallet } = data;

  return (
    <div className="space-y-5 p-4 pb-6">
      {/* Header card */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#00897B] text-lg font-bold text-white shadow-sm">
            {user.initials || 'G'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-gray-900">
              {`${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()}
            </p>
            <p className="text-sm tabular-nums text-gray-500">{user.phone}</p>
          </div>
          {user.kycStatus === 'verified' ? (
            <span className="flex items-center gap-1 rounded-full bg-lime-50 px-2.5 py-1 text-[10px] font-bold text-[#558B2F]">
              <BadgeCheck className="h-3.5 w-3.5" /> KYC Level {user.kycLevel} · Verified
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
              Verification pending
            </span>
          )}
        </div>
      </Card>

      <CardsSection />

      {/* Limits */}
      <section>
        <SectionTitle title="Spending limits" />
        <Card className="mt-2 space-y-4">
          <LimitRow
            icon={Gauge}
            label="Daily limit"
            spent={Number(wallet.dailySpentCents)}
            limit={Number(wallet.dailyLimitCents ?? 0)}
          />
          <LimitRow
            icon={Gauge}
            label="Monthly limit"
            spent={Number(wallet.monthlySpentCents)}
            limit={Number(wallet.monthlyLimitCents ?? 0)}
          />
          <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
            <div className="rounded-xl bg-lime-50/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#558B2F]">Total received</p>
              <Money cents={wallet.totalReceivedCents} className="text-sm text-[#33691E]" />
            </div>
            <div className="rounded-xl bg-amber-50/70 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Total sent</p>
              <Money cents={wallet.totalSentCents} className="text-sm text-amber-800" />
            </div>
          </div>
        </Card>
      </section>

      {/* Security */}
      <section>
        <SectionTitle title="Security" />
        <Card className="mt-2 space-y-1">
          <button
            type="button"
            onClick={() => toast.info('PIN change requires verification — coming soon')}
            className="flex min-h-[52px] w-full items-center gap-3 rounded-xl px-1 text-left hover:bg-gray-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-[#00695C]">
              <ShieldCheck className="h-4.5 w-4.5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-gray-900">Change PIN</span>
              <span className="block text-[11px] text-gray-400">Verify with SMS to set a new PIN</span>
            </span>
            <ChevronDown className="h-4 w-4 -rotate-90 text-gray-300" />
          </button>

          <div className="flex min-h-[52px] items-center gap-3 px-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-[#00695C]">
              <MonitorSmartphone className="h-4.5 w-4.5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold text-gray-900">This device</span>
              <span className="block text-[11px] text-gray-400">Browser session · Active now</span>
            </span>
            <span className="rounded-full bg-lime-50 px-2 py-0.5 text-[10px] font-bold text-[#558B2F]">Active</span>
          </div>
        </Card>
      </section>

      {/* Sign out */}
      <button
        type="button"
        onClick={() => {
          logout();
        }}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50/70 font-bold text-[#E53935] transition-colors hover:bg-red-50"
      >
        <LogOut className="h-4.5 w-4.5" /> Sign out
      </button>

      {/* Footer */}
      <footer className="pb-2 pt-4 text-center">
        <p className="text-[11px] font-semibold text-gray-400">
          Groway Consumer Wallet v2.0 · Built for South African commerce
        </p>
        <p className="mt-1 text-[11px] text-gray-300">
          Part of the Groway platform ·{' '}
          <span className="font-semibold text-teal-600">Merchant OS</span>
        </p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
function LimitRow({
  icon: Icon,
  label,
  spent,
  limit,
}: {
  icon: typeof Gauge;
  label: string;
  spent: number;
  limit: number;
}) {
  const pct = limit > 0 ? Math.min(1, spent / limit) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
          <Icon className="h-3.5 w-3.5 text-[#00897B]" /> {label}
        </span>
        <span className="text-xs tabular-nums text-gray-500">
          {formatMoney(spent)} <span className="text-gray-300">/</span> {limit > 0 ? formatMoney(limit) : 'No limit'}
        </span>
      </div>
      {limit > 0 ? <Bar value={pct} color={pct > 0.85 ? '#E53935' : '#00897B'} /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Virtual cards
// ---------------------------------------------------------------------------
function CardsSection() {
  const [cards, setCards] = useState<CardData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingPatch, setPendingPatch] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await getCards();
      setCards(res.cards);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load cards');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = async (
    card: CardData,
    body: { status?: 'active' | 'frozen'; toggles?: Partial<CardData> },
    successMsg: string,
  ) => {
    setPendingPatch(card.id);
    // optimistic
    setCards((prev) =>
      prev
        ? prev.map((c) =>
            c.id === card.id
              ? {
                  ...c,
                  ...(body.status ? { status: body.status } : {}),
                  ...(body.toggles ?? {}),
                }
              : c,
          )
        : prev,
    );
    try {
      await patchCard({ cardId: card.id, status: body.status, toggles: body.toggles });
      toast.success(successMsg);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Card update failed');
      await load();
    } finally {
      setPendingPatch(null);
    }
  };

  if (error) return <ErrorCard message={error} onRetry={load} />;

  return (
    <section>
      <SectionTitle title="Virtual cards" />
      {cards === null ? (
        <Card className="mt-2">
          <ListSkeleton rows={2} />
        </Card>
      ) : cards.length === 0 ? (
        <Card className="mt-2">
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <CreditCard className="h-8 w-8 text-gray-300" />
            <p className="text-sm font-semibold text-gray-600">No cards yet</p>
            <p className="text-xs text-gray-400">Order a virtual card from Groway to pay online.</p>
          </div>
        </Card>
      ) : (
        <div className="mt-2 space-y-4">
          {cards.map((card) => (
            <div key={card.id}>
              <CardVisual card={card} />
              <div className="mt-2 flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-2.5 shadow-sm">
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {card.status === 'frozen' ? 'Frozen' : 'Active'} · •••• {card.lastFour}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {card.cardCategory} · exp {card.expiry}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={card.status === 'active'}
                  aria-label={card.status === 'active' ? 'Freeze card' : 'Unfreeze card'}
                  disabled={pendingPatch === card.id}
                  onClick={() =>
                    patch(
                      card,
                      { status: card.status === 'active' ? 'frozen' : 'active' },
                      card.status === 'active' ? 'Card frozen' : 'Card unfrozen',
                    )
                  }
                  className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
                    card.status === 'active' ? 'bg-[#00897B]' : 'bg-gray-300'
                  }`}
                >
                  <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                    className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow ${
                      card.status === 'active' ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Toggles */}
              <div className="mt-1 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => setExpanded((e) => (e === card.id ? null : card.id))}
                  className="flex min-h-[48px] w-full items-center justify-between px-4 text-sm font-bold text-gray-700"
                >
                  Card settings
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${expanded === card.id ? 'rotate-180' : ''}`}
                  />
                </button>
                {expanded === card.id ? (
                  <div className="divide-y divide-gray-50 border-t border-gray-50 px-4">
                    <CardToggle
                      icon={Wifi}
                      label="Online payments"
                      checked={card.onlineEnabled}
                      disabled={pendingPatch === card.id || card.status === 'frozen'}
                      onChange={(v) => patch(card, { toggles: { online: v } }, `Online ${v ? 'enabled' : 'disabled'}`)}
                    />
                    <CardToggle
                      icon={Nfc}
                      label="Contactless"
                      checked={card.contactlessEnabled}
                      disabled={pendingPatch === card.id || card.status === 'frozen'}
                      onChange={(v) =>
                        patch(card, { toggles: { contactless: v } }, `Contactless ${v ? 'enabled' : 'disabled'}`)
                      }
                    />
                    <CardToggle
                      icon={Landmark}
                      label="ATM withdrawals"
                      checked={card.atmEnabled}
                      disabled={pendingPatch === card.id || card.status === 'frozen'}
                      onChange={(v) => patch(card, { toggles: { atm: v } }, `ATM ${v ? 'enabled' : 'disabled'}`)}
                    />
                    <CardToggle
                      icon={Globe}
                      label="International"
                      checked={card.internationalEnabled}
                      disabled={pendingPatch === card.id || card.status === 'frozen'}
                      onChange={(v) =>
                        patch(card, { toggles: { international: v } }, `International ${v ? 'enabled' : 'disabled'}`)
                      }
                    />
                    {card.spendingLimitDailyCents ? (
                      <div className="flex items-center justify-between py-3 text-xs text-gray-500">
                        <span>Daily spend limit</span>
                        <b className="tabular-nums text-gray-800">{formatMoney(card.spendingLimitDailyCents)}</b>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function CardVisual({ card }: { card: CardData }) {
  const frozen = card.status === 'frozen';
  const gradient =
    card.cardDesign === 'groway-classic'
      ? 'from-[#263238] via-[#37474F] to-[#546E7A]'
      : 'from-[#004D40] via-[#00695C] to-[#00897B]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-lg ${
        frozen ? 'opacity-60 saturate-50' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="h-7 w-9 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 opacity-90" />
        <span className="text-[11px] font-black uppercase tracking-widest">
          {card.cardCategory === 'virtual' ? 'Virtual' : card.cardType}
        </span>
      </div>
      <p className="mt-4 font-mono text-base tracking-[0.2em] tabular-nums">•••• •••• •••• {card.lastFour}</p>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-[8px] uppercase tracking-widest text-white/60">Cardholder</p>
          <p className="text-xs font-bold uppercase">{card.cardholderName}</p>
        </div>
        <div className="text-right">
          <p className="text-[8px] uppercase tracking-widest text-white/60">Expires</p>
          <p className="font-mono text-xs font-bold tabular-nums">{card.expiry}</p>
        </div>
        <span className="text-sm font-black italic tracking-tight">
          {card.cardType === 'mastercard' ? 'Mastercard' : 'VISA'}
        </span>
      </div>
      {frozen ? (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold backdrop-blur">
          FROZEN
        </span>
      ) : null}
    </motion.div>
  );
}

function CardToggle({
  icon: Icon,
  label,
  checked,
  disabled,
  onChange,
}: {
  icon: typeof Wifi;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex min-h-[52px] items-center justify-between py-2">
      <span className="flex items-center gap-2.5 text-sm font-semibold text-gray-800">
        <Icon className="h-4 w-4 text-[#00897B]" /> {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          checked ? 'bg-[#00897B]' : 'bg-gray-300'
        }`}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ${
            checked ? 'right-1' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}
