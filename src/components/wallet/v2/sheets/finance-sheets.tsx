'use client';

/**
 * Finance action sheets — savings pockets, loans, stokvels, EWA, insurance.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowDownToLine, ArrowUpFromLine, PiggyBank, Plus, ShieldCheck, TrendingUp } from 'lucide-react';
import {
  financeAction,
  formatFullDate,
  formatMoney,
  parseAmountToCents,
  type EwaData,
  type LoanApplyResult,
  type LoanDecision,
  type SavingsPocket,
  type StokvelMembership,
} from '../api';
import { AmountInput, Card, FeeRow, Sheet, SuccessCheck } from '../ui';

// ---------------------------------------------------------------------------
// Savings pocket deposit / withdraw
// ---------------------------------------------------------------------------
export function PocketSheet({
  pocket,
  onClose,
  onDone,
}: {
  pocket: SavingsPocket | null;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  if (!pocket) return null;
  const cents = parseAmountToCents(amount);
  const currentCents = Number(pocket.currentCents);

  const submit = async () => {
    if (cents <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if (mode === 'withdraw' && cents > currentCents) {
      toast.error('Withdrawal exceeds pocket balance');
      return;
    }
    setBusy(true);
    try {
      const res = await financeAction({
        action: mode === 'deposit' ? 'savings_deposit' : 'savings_withdraw',
        pocketId: pocket.id,
        amountCents: cents,
      });
      toast.success(res.message);
      setDone(res.message);
      await onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Savings action failed');
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    onClose();
    setTimeout(() => {
      setDone(null);
      setAmount('');
      setMode('deposit');
    }, 250);
  };

  const quickChips = mode === 'deposit' ? ['50', '100', '250', '500'] : ['50', '100', '250'];

  return (
    <Sheet open={!!pocket} onClose={close} title={pocket.name}>
      {done ? (
        <>
          <SuccessCheck label={done} />
          <button type="button" onClick={close} className="min-h-[48px] w-full rounded-xl bg-[#00897B] font-bold text-white">
            Done
          </button>
        </>
      ) : (
        <>
          <div className="rounded-xl bg-teal-50/60 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Saved so far</p>
                <p className="text-xl font-bold tabular-nums text-[#00695C]">{formatMoney(pocket.currentCents)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Interest earned</p>
                <p className="text-sm font-bold tabular-nums text-[#558B2F]">
                  +{formatMoney(pocket.interestEarnedCents)}
                </p>
              </div>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-[#00897B]"
                style={{ width: `${Math.min(100, (pocket.progress ?? 0) * 100)}%` }}
              />
            </div>
            {pocket.targetCents ? (
              <p className="mt-1 text-[11px] text-gray-500">
                Goal {formatMoney(pocket.targetCents)}
                {pocket.targetDate ? ` · by ${formatFullDate(pocket.targetDate)}` : ''}
              </p>
            ) : null}
          </div>

          {/* Mode toggle */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('deposit')}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border text-sm font-bold ${
                mode === 'deposit' ? 'border-[#00897B] bg-[#00897B] text-white' : 'border-gray-200 text-gray-600'
              }`}
            >
              <ArrowDownToLine className="h-4 w-4" /> Save
            </button>
            <button
              type="button"
              onClick={() => setMode('withdraw')}
              className={`flex min-h-[44px] items-center justify-center gap-2 rounded-xl border text-sm font-bold ${
                mode === 'withdraw' ? 'border-[#F59E0B] bg-[#F59E0B] text-white' : 'border-gray-200 text-gray-600'
              }`}
            >
              <ArrowUpFromLine className="h-4 w-4" /> Withdraw
            </button>
          </div>

          <AmountInput value={amount} onChange={setAmount} />
          <div className="flex flex-wrap gap-2">
            {quickChips.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v)}
                className={`min-h-[36px] rounded-full border px-3.5 text-xs font-bold ${
                  amount === v ? 'border-[#00897B] bg-[#00897B] text-white' : 'border-gray-200 bg-white text-gray-600'
                }`}
              >
                R{v}
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={busy || cents <= 0}
            onClick={submit}
            className={`mt-4 min-h-[48px] w-full rounded-xl font-bold text-white disabled:opacity-50 ${
              mode === 'deposit' ? 'bg-[#00897B]' : 'bg-[#F59E0B]'
            }`}
          >
            {busy ? 'Processing…' : mode === 'deposit' ? `Save ${formatMoney(cents)}` : `Withdraw ${formatMoney(cents)}`}
          </button>
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Earning {(pocket.interestRate * 100).toFixed(1)}% per year, paid monthly.
          </p>
        </>
      )}
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// New pocket
// ---------------------------------------------------------------------------
export function NewPocketSheet({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [color, setColor] = useState('#00897B');
  const [busy, setBusy] = useState(false);

  const colors = ['#00897B', '#7CB342', '#F59E0B', '#26C6DA', '#8D6E63', '#E53935'];
  const targetCents = parseAmountToCents(target);

  const submit = async () => {
    if (!name.trim()) {
      toast.error('Give your pocket a name');
      return;
    }
    setBusy(true);
    try {
      const res = await financeAction({
        action: 'savings_create',
        name: name.trim(),
        targetCents: targetCents > 0 ? targetCents : undefined,
        color,
      });
      toast.success(res.message);
      await onDone();
      onClose();
      setName('');
      setTarget('');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create pocket');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onClose={onClose} title="New savings pocket">
      <label htmlFor="pocket-name" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
        Pocket name
      </label>
      <input
        id="pocket-name"
        value={name}
        maxLength={40}
        placeholder="e.g. December groceries"
        onChange={(e) => setName(e.target.value)}
        className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold text-gray-900 outline-none focus:border-[#00897B] focus:bg-white"
      />

      <label htmlFor="pocket-target" className="mb-1.5 mt-4 block text-xs font-bold uppercase tracking-wide text-gray-500">
        Target (optional)
      </label>
      <AmountInput value={target} onChange={setTarget} />

      <p className="mb-2 mt-2 text-xs font-bold uppercase tracking-wide text-gray-500">Colour</p>
      <div className="flex gap-2">
        {colors.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Colour ${c}`}
            onClick={() => setColor(c)}
            className={`h-11 w-11 rounded-full border-2 transition-transform ${
              color === c ? 'scale-110 border-gray-900' : 'border-transparent'
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={submit}
        className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#00897B] font-bold text-white disabled:opacity-60"
      >
        <Plus className="h-4 w-4" /> {busy ? 'Creating…' : 'Create pocket'}
      </button>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Loan application
// ---------------------------------------------------------------------------
const LOAN_AMOUNTS = [500, 1000, 2500, 5000];
const LOAN_TERMS = [3, 6, 12, 24];

export function LoanSheet({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [amountRands, setAmountRands] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [term, setTerm] = useState<number>(6);
  const [purpose, setPurpose] = useState('');
  const [busy, setBusy] = useState(false);
  const [decision, setDecision] = useState<LoanDecision | null>(null);
  const [declinedMsg, setDeclinedMsg] = useState<string | null>(null);

  const effectiveAmount = customAmount ? Math.round(Number(customAmount.replace(/[^0-9.]/g, '')) || 0) : amountRands;

  const submit = async () => {
    if (effectiveAmount < 500) {
      toast.error('Minimum loan is R500');
      return;
    }
    setBusy(true);
    setDeclinedMsg(null);
    try {
      const res = await financeAction<LoanApplyResult>({
        action: 'loan_apply',
        amount: effectiveAmount,
        term,
        purpose: purpose.trim() || undefined,
      });
      setDecision(res.decision);
      toast.success(res.message);
      await onDone();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Loan application failed';
      setDeclinedMsg(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    onClose();
    setTimeout(() => {
      setDecision(null);
      setDeclinedMsg(null);
      setCustomAmount('');
      setPurpose('');
    }, 250);
  };

  if (decision) {
    return (
      <Sheet open={open} onClose={close} title="Loan approved">
        <SuccessCheck label={`${formatMoney(Math.round(effectiveAmount * 100))} paid into your wallet`} />
        <Card className="mt-2">
          <FeeRow label="Interest rate" value={`${decision.interestRate.toFixed(1)}% p.a.`} />
          <FeeRow label="Monthly payment" value={formatMoney(Math.round(decision.monthlyPayment * 100))} />
          <FeeRow label="Total repayment" value={formatMoney(Math.round(decision.totalRepayment * 100))} />
          <FeeRow label="Total interest" value={formatMoney(Math.round(decision.totalInterest * 100))} />
          {decision.initiationFee ? (
            <FeeRow label="Initiation fee (once-off)" value={formatMoney(Math.round(decision.initiationFee * 100))} />
          ) : null}
          <FeeRow label="Your GrowScore" value={String(decision.score)} />
        </Card>
        <button type="button" onClick={close} className="mt-4 min-h-[48px] w-full rounded-xl bg-[#00897B] font-bold text-white">
          Done
        </button>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onClose={close} title="Get a loan">
      <div className="flex items-start gap-2 rounded-xl bg-teal-50/60 p-3 text-xs text-[#00695C]">
        <TrendingUp className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Instant decision using your GrowScore. Approved cash lands in your wallet immediately — 14%–24% p.a.,
          R500 to R50,000.
        </p>
      </div>

      <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-gray-500">How much?</p>
      <div className="flex flex-wrap gap-2">
        {LOAN_AMOUNTS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => {
              setAmountRands(a);
              setCustomAmount('');
            }}
            className={`min-h-[44px] rounded-full border px-4 text-sm font-bold ${
              !customAmount && amountRands === a
                ? 'border-[#00897B] bg-[#00897B] text-white'
                : 'border-gray-200 text-gray-700'
            }`}
          >
            R{a.toLocaleString('en-ZA')}
          </button>
        ))}
      </div>
      <input
        value={customAmount}
        inputMode="numeric"
        placeholder="Custom amount (R500 – R50,000)"
        onChange={(e) => setCustomAmount(e.target.value)}
        className="mt-2 min-h-[48px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold text-gray-900 outline-none focus:border-[#00897B] focus:bg-white"
      />

      <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-gray-500">Repay over</p>
      <div className="flex flex-wrap gap-2">
        {LOAN_TERMS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTerm(t)}
            className={`min-h-[44px] rounded-full border px-4 text-sm font-bold ${
              term === t ? 'border-[#00897B] bg-[#00897B] text-white' : 'border-gray-200 text-gray-700'
            }`}
          >
            {t} months
          </button>
        ))}
      </div>

      <label htmlFor="loan-purpose" className="mb-1.5 mt-4 block text-xs font-bold uppercase tracking-wide text-gray-500">
        Purpose (optional)
      </label>
      <input
        id="loan-purpose"
        value={purpose}
        maxLength={60}
        placeholder="e.g. Stock for my spaza"
        onChange={(e) => setPurpose(e.target.value)}
        className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-900 outline-none focus:border-[#00897B] focus:bg-white"
      />

      {declinedMsg ? (
        <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {declinedMsg}
        </div>
      ) : null}

      <button
        type="button"
        disabled={busy}
        onClick={submit}
        className="mt-4 min-h-[48px] w-full rounded-xl bg-[#00897B] font-bold text-white disabled:opacity-60"
      >
        {busy ? 'Checking…' : `Apply for R${effectiveAmount.toLocaleString('en-ZA')}`}
      </button>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Stokvel contribution
// ---------------------------------------------------------------------------
export function StokvelSheet({
  membership,
  onClose,
  onDone,
}: {
  membership: StokvelMembership | null;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [initialised, setInitialised] = useState<string | null>(null);

  if (membership && initialised !== membership.membershipId) {
    setInitialised(membership.membershipId);
    setAmount((Number(membership.group.contributionCents) / 100).toFixed(0));
  }
  if (!membership) return null;

  const cents = parseAmountToCents(amount);

  const submit = async () => {
    if (cents <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setBusy(true);
    try {
      const res = await financeAction({
        action: 'stokvel_contribute',
        membershipId: membership.membershipId,
        amountCents: cents,
      });
      toast.success(res.message);
      setDone(res.message);
      await onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Contribution failed');
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    onClose();
    setTimeout(() => {
      setDone(null);
      setInitialised(null);
      setAmount('');
    }, 250);
  };

  return (
    <Sheet open onClose={close} title={membership.group.name}>
      {done ? (
        <>
          <SuccessCheck label={done} />
          <button type="button" onClick={close} className="min-h-[48px] w-full rounded-xl bg-[#00897B] font-bold text-white">
            Done
          </button>
        </>
      ) : (
        <>
          <div className="rounded-xl bg-teal-50/60 p-3 text-xs text-[#00695C]">
            <p className="font-bold">{membership.group.name}</p>
            <p className="mt-0.5">
              R{(Number(membership.group.contributionCents) / 100).toFixed(0)}/month · Day{' '}
              {membership.group.contributionDay} · Cycle {membership.group.currentCycle} ·{' '}
              {membership.group.memberCount} members
            </p>
          </div>

          <p className="mb-1 mt-4 text-center text-xs font-bold uppercase tracking-wide text-gray-400">
            Contribution amount
          </p>
          <AmountInput value={amount} onChange={setAmount} />

          <button
            type="button"
            disabled={busy || cents <= 0}
            onClick={submit}
            className="mt-4 min-h-[48px] w-full rounded-xl bg-[#00897B] font-bold text-white disabled:opacity-50"
          >
            {busy ? 'Contributing…' : `Contribute ${formatMoney(cents)}`}
          </button>
        </>
      )}
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Earned Wage Access
// ---------------------------------------------------------------------------
export function EwaSheet({
  ewa,
  onClose,
  onDone,
}: {
  ewa: EwaData | null;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  if (!ewa) return null;

  const maxRands = Math.floor(ewa.availableAdvance);
  const rands = Math.floor(Number(amount.replace(/[^0-9.]/g, '')) || 0);
  const fee = Math.round(rands * 2) / 100;
  const net = Math.max(0, rands - fee);

  const submit = async () => {
    if (rands < 50) {
      toast.error('Minimum advance is R50');
      return;
    }
    if (rands > ewa.availableAdvance) {
      toast.error(`Maximum available is R${ewa.availableAdvance.toFixed(2)}`);
      return;
    }
    setBusy(true);
    try {
      const res = await financeAction<{ netAmount: number; fee: number; message: string }>({
        action: 'ewa_withdraw',
        amount: rands,
      });
      toast.success(res.message);
      setDone(res.message);
      await onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Advance failed');
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
    <Sheet open onClose={close} title="Access earned wages">
      {done ? (
        <>
          <SuccessCheck label={done} />
          <button type="button" onClick={close} className="min-h-[48px] w-full rounded-xl bg-[#00897B] font-bold text-white">
            Done
          </button>
        </>
      ) : (
        <>
          <div className="rounded-xl bg-teal-50/60 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              Accrued so far — {ewa.employer ?? 'Employer'}
            </p>
            <p className="text-xl font-bold tabular-nums text-[#00695C]">
              R{ewa.accruedSalary.toFixed(2)}
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Available now R{ewa.availableAdvance.toFixed(2)} · 2% advance fee
            </p>
          </div>

          <p className="mb-1 mt-4 text-center text-xs font-bold uppercase tracking-wide text-gray-400">
            Advance amount
          </p>
          <AmountInput value={amount} onChange={setAmount} />

          <div className="flex flex-wrap justify-center gap-2">
            {[250, 500, 1000].map((v) => (
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
            <button
              type="button"
              onClick={() => setAmount(String(maxRands))}
              className="min-h-[44px] rounded-full border border-teal-200 bg-teal-50 px-4 text-sm font-bold text-[#00695C]"
            >
              Max R{maxRands.toLocaleString('en-ZA')}
            </button>
          </div>

          {rands >= 50 ? (
            <div className="mt-3 rounded-xl bg-gray-50 px-4 py-2">
              <FeeRow label="Advance" value={formatMoney(Math.round(rands * 100))} />
              <FeeRow label="Fee (2%)" value={`− ${formatMoney(Math.round(fee * 100))}`} />
              <FeeRow label="To your wallet" value={formatMoney(Math.round(net * 100))} strong />
            </div>
          ) : null}

          <button
            type="button"
            disabled={busy || rands < 50}
            onClick={submit}
            className="mt-4 min-h-[48px] w-full rounded-xl bg-[#00897B] font-bold text-white disabled:opacity-50"
          >
            {busy ? 'Transferring…' : 'Get my money now'}
          </button>
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Repaid automatically from your salary on {ewa.nextPayDay ? formatFullDate(ewa.nextPayDay) : 'pay day'}.
          </p>
        </>
      )}
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Insurance subscribe
// ---------------------------------------------------------------------------
type ProductKey = 'funeral' | 'hospital_cash' | 'savings_protector';

const INSURANCE_PRODUCTS: {
  key: ProductKey;
  name: string;
  blurb: string;
  options: { coverCents: number; premiumCents: number }[];
}[] = [
  {
    key: 'funeral',
    name: 'Funeral Cover',
    blurb: 'Cash payout within 24h for you or family members.',
    options: [
      { coverCents: 5000000, premiumCents: 18900 },
      { coverCents: 10000000, premiumCents: 34500 },
      { coverCents: 25000000, premiumCents: 78900 },
    ],
  },
  {
    key: 'hospital_cash',
    name: 'Hospital Cash',
    blurb: 'Daily cash for every night in hospital.',
    options: [
      { coverCents: 3000000, premiumCents: 9900 },
      { coverCents: 6000000, premiumCents: 18900 },
    ],
  },
  {
    key: 'savings_protector',
    name: 'Savings Protector',
    blurb: 'Keeps your stokvel & pocket contributions going if you can’t.',
    options: [
      { coverCents: 2000000, premiumCents: 7900 },
      { coverCents: 5000000, premiumCents: 17500 },
    ],
  },
];

export function InsuranceSheet({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => Promise<void>;
}) {
  const [product, setProduct] = useState<ProductKey>('funeral');
  const [optionIdx, setOptionIdx] = useState(0);
  const [beneficiary, setBeneficiary] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const spec = INSURANCE_PRODUCTS.find((p) => p.key === product) ?? INSURANCE_PRODUCTS[0];
  const option = spec.options[Math.min(optionIdx, spec.options.length - 1)];

  const submit = async () => {
    setBusy(true);
    try {
      const beneficiaries = beneficiary.trim()
        ? [{ name: beneficiary.trim(), relationship: 'family', share: 100 }]
        : undefined;
      const res = await financeAction<{ policyId: string; message: string }>({
        action: 'insurance_subscribe',
        productType: product,
        coverAmountCents: option.coverCents,
        beneficiaries,
      });
      toast.success(res.message);
      setDone(res.message);
      await onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not activate cover');
    } finally {
      setBusy(false);
    }
  };

  const close = () => {
    onClose();
    setTimeout(() => setDone(null), 250);
  };

  return (
    <Sheet open={open} onClose={close} title="Add cover">
      {done ? (
        <>
          <SuccessCheck label={done} />
          <button type="button" onClick={close} className="min-h-[48px] w-full rounded-xl bg-[#00897B] font-bold text-white">
            Done
          </button>
        </>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {INSURANCE_PRODUCTS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setProduct(p.key);
                  setOptionIdx(0);
                }}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl border p-2 text-[11px] font-bold leading-tight ${
                  product === p.key ? 'border-[#00897B] bg-teal-50 text-[#00695C]' : 'border-gray-200 text-gray-500'
                }`}
              >
                <ShieldCheck className="h-4 w-4" />
                {p.name}
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs text-gray-500">{spec.blurb}</p>

          <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-gray-500">Cover amount</p>
          <div className="space-y-2">
            {spec.options.map((o, i) => (
              <button
                key={o.coverCents}
                type="button"
                onClick={() => setOptionIdx(i)}
                className={`flex min-h-[52px] w-full items-center justify-between rounded-xl border px-4 ${
                  optionIdx === i ? 'border-[#00897B] bg-teal-50' : 'border-gray-200'
                }`}
              >
                <span className="text-sm font-bold text-gray-900">{formatMoney(o.coverCents)}</span>
                <span className="text-xs font-semibold tabular-nums text-[#00695C]">
                  {formatMoney(o.premiumCents)}/month
                </span>
              </button>
            ))}
          </div>

          <label htmlFor="ins-ben" className="mb-1.5 mt-4 block text-xs font-bold uppercase tracking-wide text-gray-500">
            Beneficiary (optional)
          </label>
          <input
            id="ins-ben"
            value={beneficiary}
            maxLength={40}
            placeholder="Full name"
            onChange={(e) => setBeneficiary(e.target.value)}
            className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-900 outline-none focus:border-[#00897B] focus:bg-white"
          />

          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="mt-4 min-h-[48px] w-full rounded-xl bg-[#00897B] font-bold text-white disabled:opacity-60"
          >
            {busy ? 'Activating…' : `Activate for ${formatMoney(option.premiumCents)}/month`}
          </button>
          <p className="mt-2 flex items-center justify-center gap-1 text-center text-[11px] text-gray-400">
            <PiggyBank className="h-3 w-3" /> First premium debits today · underwritten by Groway Protect
          </p>
        </>
      )}
    </Sheet>
  );
}
