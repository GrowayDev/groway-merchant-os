'use client';

/**
 * Groway Consumer Wallet v2 — shared UI primitives.
 * Teal brand system, mobile-first, framer-motion micro-interactions.
 */

import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeftRight,
  Banknote,
  Bus,
  CalendarClock,
  Check,
  ChevronDown,
  Circle,
  CreditCard,
  Landmark,
  Loader2,
  PiggyBank,
  RefreshCw,
  ShieldCheck,
  ShoppingBasket,
  Smartphone,
  Tv,
  Users,
  Wallet as WalletIcon,
  Zap,
  X,
} from 'lucide-react';
import { formatDate, formatMoney, signedMoney, type Txn } from './api';

// ---------------------------------------------------------------------------
// Brand constants
// ---------------------------------------------------------------------------
export const TIER_COLORS: Record<string, string> = {
  bronze: '#A1887F',
  silver: '#9E9E9E',
  gold: '#F59E0B',
  diamond: '#26C6DA',
};

export const TIER_ORDER = ['bronze', 'silver', 'gold', 'diamond'];

function Receipt(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h5" />
    </svg>
  );
}

export function CategoryIcon({ category, className }: { category?: string | null; className?: string }) {
  const cls = className ?? 'h-4 w-4';
  switch (category) {
    case 'groceries':
    case 'shopping':
      return <ShoppingBasket className={cls} />;
    case 'credit':
      return <CreditCard className={cls} />;
    case 'entertainment':
      return <Tv className={cls} />;
    case 'airtime':
      return <Smartphone className={cls} />;
    case 'utilities':
      return <Zap className={cls} />;
    case 'savings':
      return <PiggyBank className={cls} />;
    case 'transport':
      return <Bus className={cls} />;
    case 'transfer':
      return <ArrowLeftRight className={cls} />;
    case 'stokvel':
      return <Users className={cls} />;
    case 'insurance':
      return <ShieldCheck className={cls} />;
    case 'bnpl':
      return <CalendarClock className={cls} />;
    case 'income':
    case 'topup':
      return <WalletIcon className={cls} />;
    case 'withdrawal':
      return <Banknote className={cls} />;
    case 'bills':
      return <Receipt className={cls} />;
    default:
      return <Circle className={cls} />;
  }
}

// ---------------------------------------------------------------------------
// Money + transaction row
// ---------------------------------------------------------------------------
export function Money({
  cents,
  className,
  signed,
}: {
  cents: string | number | null | undefined;
  className?: string;
  signed?: 'debit' | 'credit';
}) {
  return (
    <span className={`tabular-nums font-bold ${className ?? ''}`}>
      {signed ? signedMoney(signed, cents ?? 0) : formatMoney(cents)}
    </span>
  );
}

export function TxIcon({ txn, size = 'md' }: { txn: Pick<Txn, 'category' | 'direction'>; size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]';
  const isCredit = txn.direction === 'credit';
  return (
    <div
      className={`${box} shrink-0 rounded-full flex items-center justify-center ${
        isCredit ? 'bg-lime-100 text-[#558B2F]' : 'bg-teal-50 text-[#00695C]'
      }`}
    >
      <CategoryIcon category={txn.category} className={icon} />
    </div>
  );
}

export function TxRow({ txn, compact }: { txn: Txn; compact?: boolean }) {
  const isCredit = txn.direction === 'credit';
  return (
    <div className={`flex items-center gap-3 ${compact ? 'py-2' : 'py-2.5'}`}>
      <TxIcon txn={txn} size={compact ? 'sm' : 'md'} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{txn.description ?? txn.type}</p>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span>{formatDate(txn.createdAt)}</span>
          {txn.voucherToken ? (
            <span className="rounded bg-amber-50 px-1 py-px font-mono text-[10px] text-amber-700">
              token
            </span>
          ) : null}
        </div>
      </div>
      <Money
        cents={txn.amountCents}
        signed={txn.direction}
        className={`text-sm ${isCredit ? 'text-[#558B2F]' : 'text-gray-900'}`}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bottom sheet
// ---------------------------------------------------------------------------
export function Sheet({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

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
          <button
            aria-label="Close sheet"
            className="absolute inset-0 bg-black/45"
            onClick={onClose}
            type="button"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title ?? 'Sheet'}
            className={`absolute inset-x-0 bottom-0 mx-auto ${maxWidth} w-full`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
          >
            <div className="max-h-[88vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl">
              <div className="sticky top-0 z-10 rounded-t-3xl bg-white px-5 pb-2 pt-3">
                <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-gray-200" />
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900">{title}</h3>
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

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------
export function Chip({
  label,
  active,
  onClick,
  color,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  color?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold transition-colors ${
        active
          ? 'border-[#00897B] bg-[#00897B] text-white shadow-sm'
          : 'border-gray-200 bg-white text-gray-700 hover:border-teal-300 hover:bg-teal-50/50'
      }`}
      style={active && color ? { backgroundColor: color, borderColor: color } : undefined}
    >
      {label}
    </button>
  );
}

export function SectionTitle({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500">{title}</h2>
      {action ? (
        <button
          type="button"
          onClick={onAction}
          className="text-sm font-semibold text-[#00897B] hover:underline"
        >
          {action}
        </button>
      ) : null}
    </div>
  );
}

/** Big centred amount input with R prefix. */
export function AmountInput({
  value,
  onChange,
  autoFocus,
  placeholder = '0.00',
}: {
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex items-center justify-center gap-1 py-2">
      <span className="text-4xl font-bold text-gray-400">R</span>
      <input
        inputMode="decimal"
        autoComplete="off"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'))}
        placeholder={placeholder}
        aria-label="Amount in rands"
        className="w-full max-w-[220px] border-none bg-transparent text-center text-4xl font-bold tabular-nums text-gray-900 outline-none placeholder:text-gray-300"
      />
    </div>
  );
}

/** Thin progress bar with custom colour. */
export function Bar({
  value,
  color = '#00897B',
  className,
}: {
  value: number;
  color?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value || 0)) * 100;
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-gray-100 ${className ?? ''}`}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-[#00897B]">
        {icon}
      </div>
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      {hint ? <p className="max-w-[260px] text-xs text-gray-400">{hint}</p> : null}
    </div>
  );
}

export function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-5 text-center">
      <AlertTriangle className="h-6 w-6 text-[#E53935]" />
      <p className="text-sm font-medium text-red-700">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="flex min-h-[44px] items-center gap-2 rounded-full bg-[#00897B] px-5 text-sm font-semibold text-white"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      ) : null}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={`h-4 w-4 animate-spin ${className ?? ''}`} />;
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-gray-100" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 w-3/5 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-2/5 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="h-3.5 w-16 animate-pulse rounded bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ lines = 3, height = 'h-24' }: { lines?: number; height?: string }) {
  return (
    <div className={`space-y-3 rounded-2xl border border-black/5 bg-white p-4 ${height}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3.5 animate-pulse rounded bg-gray-100" style={{ width: `${90 - i * 18}%` }} />
      ))}
    </div>
  );
}

/** Animated success checkmark (scale-in). */
export function SuccessCheck({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-4">
      <motion.div
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 16 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-[#7CB342] text-white shadow-lg shadow-lime-200"
      >
        <Check className="h-8 w-8" strokeWidth={3} />
      </motion.div>
      {label ? <p className="text-sm font-semibold text-gray-700">{label}</p> : null}
    </div>
  );
}

/** Segmented control (Receive | Scan | Send etc). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-full border border-gray-200 bg-gray-50 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`relative min-h-[40px] flex-1 rounded-full text-sm font-semibold transition-colors ${
            value === opt.value ? 'text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          {value === opt.value ? (
            <motion.span
              layoutId={`seg-${options.map((o) => o.value).join('-')}`}
              className="absolute inset-0 rounded-full bg-[#00897B]"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          ) : null}
          <span className="relative z-10">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

/** Fee summary row used across confirm screens. */
export function FeeRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`tabular-nums font-semibold text-gray-900 ${strong ? 'font-bold' : ''}`}>{value}</span>
    </div>
  );
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  right,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  right?: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-gray-100 pt-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex min-h-[44px] flex-1 items-center gap-1.5 text-sm font-bold text-gray-800"
        >
          {title}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
        {right}
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pb-1 pt-2">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Standard white card. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-black/5 bg-white p-4 shadow-sm ${className ?? ''}`}>{children}</div>
  );
}

/** Icon-by-type for upcoming payments. */
export function UpcomingIcon({ type }: { type: 'bnpl' | 'sassa' | 'salary' }) {
  if (type === 'bnpl') return <CalendarClock className="h-[18px] w-[18px]" />;
  if (type === 'sassa') return <Landmark className="h-[18px] w-[18px]" />;
  return <Banknote className="h-[18px] w-[18px]" />;
}
