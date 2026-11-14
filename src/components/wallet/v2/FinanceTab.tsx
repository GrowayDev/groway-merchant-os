'use client';

/**
 * Finance tab — the star tab: GrowScore, savings pockets, stokvels, BNPL,
 * earned wage access, SASSA, insurance and loans.
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Banknote,
  CalendarClock,
  ChevronRight,
  CreditCard,
  FileText,
  Landmark,
  PiggyBank,
  Plus,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  financeAction,
  formatFullDate,
  formatMoney,
  getFinance,
  type FinanceData,
  type SavingsPocket,
  type StokvelMembership,
} from './api';
import {
  Bar,
  Card,
  CardSkeleton,
  EmptyState,
  ErrorCard,
  Money,
  SectionTitle,
} from './ui';
import {
  EwaSheet,
  InsuranceSheet,
  LoanSheet,
  NewPocketSheet,
  PocketSheet,
  StokvelSheet,
} from './sheets/finance-sheets';

export default function FinanceTab() {
  const [finance, setFinance] = useState<FinanceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Sheets
  const [loanOpen, setLoanOpen] = useState(false);
  const [newPocketOpen, setNewPocketOpen] = useState(false);
  const [selectedPocket, setSelectedPocket] = useState<SavingsPocket | null>(null);
  const [pocketSheetOpen, setPocketSheetOpen] = useState(false);
  const [selectedStokvel, setSelectedStokvel] = useState<StokvelMembership | null>(null);
  const [stokvelSheetOpen, setStokvelSheetOpen] = useState(false);
  const [ewaSheetOpen, setEwaSheetOpen] = useState(false);
  const [insuranceOpen, setInsuranceOpen] = useState(false);
  const [payingInstalment, setPayingInstalment] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFinance(await getFinance());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your finances');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshAll = useCallback(async () => {
    await load();
  }, [load]);

  const payInstalment = async (instalmentId: string) => {
    setPayingInstalment(instalmentId);
    try {
      const res = await financeAction<{ completed: boolean; message: string }>({
        action: 'bnpl_pay',
        instalmentId,
      });
      toast.success(res.message);
      if (res.completed) toast('Plan complete! Limit fully restored.', { icon: '🎉' });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setPayingInstalment(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4 pb-6">
        <CardSkeleton lines={2} height="h-36" />
        <CardSkeleton lines={3} height="h-40" />
        <CardSkeleton lines={2} height="h-28" />
      </div>
    );
  }

  if (error || !finance) {
    return (
      <div className="p-4">
        <ErrorCard message={error ?? 'Something went wrong'} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 pb-6">
      <GrowScoreCard
        score={finance.credit.score}
        lastUpdated={finance.credit.lastUpdated}
        factors={finance.credit.factors}
        onGetLoan={() => setLoanOpen(true)}
      />

      <SavingsSection
        finance={finance}
        onNewPocket={() => setNewPocketOpen(true)}
        onOpenPocket={(p) => {
          setSelectedPocket(p);
          setPocketSheetOpen(true);
        }}
      />

      <StokvelSection
        finance={finance}
        onContribute={(m) => {
          setSelectedStokvel(m);
          setStokvelSheetOpen(true);
        }}
      />

      {finance.bnpl ? <BnplSection finance={finance} onPay={payInstalment} paying={payingInstalment} /> : null}

      {finance.ewa ? <EwaSection finance={finance} onOpen={() => setEwaSheetOpen(true)} /> : null}

      {finance.sassa && finance.sassa.grants.length > 0 ? <SassaSection finance={finance} /> : null}

      <InsuranceSection finance={finance} onAddCover={() => setInsuranceOpen(true)} />

      <LoansSection finance={finance} />

      {/* ---- Sheets ---- */}
      <LoanSheet
        open={loanOpen}
        onClose={() => setLoanOpen(false)}
        onDone={refreshAll}
      />
      <NewPocketSheet
        open={newPocketOpen}
        onClose={() => setNewPocketOpen(false)}
        onDone={refreshAll}
      />
      <PocketSheet
        pocket={pocketSheetOpen ? selectedPocket : null}
        onClose={() => setPocketSheetOpen(false)}
        onDone={refreshAll}
      />
      <StokvelSheet
        membership={stokvelSheetOpen ? selectedStokvel : null}
        onClose={() => setStokvelSheetOpen(false)}
        onDone={refreshAll}
      />
      <EwaSheet ewa={ewaSheetOpen ? finance.ewa : null} onClose={() => setEwaSheetOpen(false)} onDone={refreshAll} />
      <InsuranceSheet open={insuranceOpen} onClose={() => setInsuranceOpen(false)} onDone={refreshAll} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// GrowScore
// ---------------------------------------------------------------------------
function ScoreDial({ score }: { score: number }) {
  const R = 84;
  const CIRC = Math.PI * R; // semicircle length
  const min = 300;
  const max = 850;
  const pct = Math.max(0, Math.min(1, (score - min) / (max - min)));
  const id = `grow-score-grad-${score}`;

  return (
    <div className="relative mx-auto h-[110px] w-[200px]">
      <svg viewBox="0 0 200 110" className="h-full w-full">
        <defs>
          <linearGradient id={id} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00897B" />
            <stop offset="100%" stopColor="#7CB342" />
          </linearGradient>
        </defs>
        <path
          d="M 16 100 A 84 84 0 0 1 184 100"
          fill="none"
          stroke="#EEF2F1"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 16 100 A 84 84 0 0 1 184 100"
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${pct * CIRC} ${CIRC}`}
        />
      </svg>
      <div className="absolute inset-x-0 bottom-0 text-center">
        <p className="text-4xl font-bold tabular-nums text-gray-900">{score}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">GrowScore</p>
      </div>
      <p className="absolute bottom-0 left-0 text-[9px] font-semibold text-gray-400">300</p>
      <p className="absolute bottom-0 right-0 text-[9px] font-semibold text-gray-400">850</p>
    </div>
  );
}

function GrowScoreCard({
  score,
  lastUpdated,
  factors,
  onGetLoan,
}: {
  score: number | null;
  lastUpdated: string | null;
  factors: FinanceData['credit']['factors'];
  onGetLoan: () => void;
}) {
  const impactColor = (impact: string) =>
    impact === 'positive' ? '#7CB342' : impact === 'negative' ? '#E53935' : '#9E9E9E';

  return (
    <Card>
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <TrendingUp className="h-4 w-4 text-[#00897B]" /> GrowScore
        </h2>
        <span className="text-[11px] text-gray-400">Updated {lastUpdated ? formatFullDate(lastUpdated) : '—'}</span>
      </div>

      {score === null ? (
        <div className="py-6 text-center">
          <p className="text-lg font-bold text-gray-700">Score building…</p>
          <p className="mt-1 text-xs text-gray-400">
            Keep transacting on Groway — your score unlocks loans, BNPL and better rates.
          </p>
        </div>
      ) : (
        <ScoreDial score={score} />
      )}

      {factors.length > 0 ? (
        <div className="mt-2 space-y-2">
          {factors.map((f) => (
            <div key={f.name} className="flex items-start gap-2.5">
              <span
                className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: impactColor(f.impact) }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-800">{f.name}</p>
                  <span className="text-[10px] font-semibold text-gray-400">{Math.round(f.weight * 100)}%</span>
                </div>
                <p className="text-[11px] leading-snug text-gray-500">{f.detail}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onGetLoan}
        className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00897B] to-[#00695C] font-bold text-white"
      >
        <Banknote className="h-4 w-4" /> Get a loan
      </button>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Savings pockets
// ---------------------------------------------------------------------------
function SavingsSection({
  finance,
  onNewPocket,
  onOpenPocket,
}: {
  finance: FinanceData;
  onNewPocket: () => void;
  onOpenPocket: (p: SavingsPocket) => void;
}) {
  const { savings } = finance;
  return (
    <section>
      <SectionTitle
        title="Savings pockets"
        action="New pocket"
        onAction={onNewPocket}
      />
      <Card className="mt-2">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Total saved</p>
            <Money cents={savings.totalCents} className="text-2xl text-gray-900" />
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Interest earned</p>
            <p className="text-sm font-bold tabular-nums text-[#558B2F]">
              +{formatMoney(savings.totalInterestCents)}
            </p>
          </div>
        </div>

        {savings.pockets.length === 0 ? (
          <EmptyState
            icon={<PiggyBank className="h-6 w-6" />}
            title="No pockets yet"
            hint="Create a pocket to save for groceries, school or December"
          />
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {savings.pockets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onOpenPocket(p)}
                className="rounded-xl border border-gray-100 bg-gray-50/50 p-3 text-left transition-colors hover:border-teal-200"
              >
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color ?? '#00897B' }} />
                  <p className="truncate text-xs font-bold text-gray-800">{p.name}</p>
                </div>
                <Money cents={p.currentCents} className="mt-1 block text-sm text-gray-900" />
                {p.targetCents ? (
                  <p className="text-[10px] text-gray-400">of {formatMoney(p.targetCents)}</p>
                ) : (
                  <p className="text-[10px] text-gray-400">open goal</p>
                )}
                {p.progress !== null ? <Bar value={p.progress} color={p.color ?? '#00897B'} className="mt-2" /> : null}
                <div className="mt-2 flex items-center justify-between">
                  <span className="rounded-full bg-lime-50 px-1.5 py-0.5 text-[9px] font-black text-[#558B2F]">
                    +{(p.interestRate * 100).toFixed(1)}%
                  </span>
                  <span className="text-[9px] font-semibold tabular-nums text-gray-400">
                    +{formatMoney(p.interestEarnedCents)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Stokvels
// ---------------------------------------------------------------------------
function StokvelSection({
  finance,
  onContribute,
}: {
  finance: FinanceData;
  onContribute: (m: StokvelMembership) => void;
}) {
  const { stokvels } = finance;
  return (
    <section>
      <SectionTitle title="Stokvels" />
      <Card className="mt-2">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">You've contributed</p>
            <Money cents={stokvels.totalContributedCents} className="text-2xl text-gray-900" />
          </div>
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-[#00695C]">
            {stokvels.groups.length} {stokvels.groups.length === 1 ? 'group' : 'groups'}
          </span>
        </div>

        {stokvels.groups.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No stokvels yet"
            hint="Join a community savings group — pay monthly, take the payout"
          />
        ) : (
          <div className="mt-3 space-y-3">
            {stokvels.groups.map((m) => (
              <div key={m.membershipId} className="rounded-xl border border-gray-100 p-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[#00695C]">
                    <Users className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-gray-900">{m.group.name}</p>
                      <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        You're #{m.payoutPosition} in line
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500">
                      R{(Number(m.group.contributionCents) / 100).toFixed(0)}/month · Day{' '}
                      {m.group.contributionDay} · Cycle {m.group.currentCycle} · {m.group.memberCount} members
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px]">
                      <span className="text-gray-500">
                        Group saved: <b className="tabular-nums text-gray-700">{formatMoney(m.group.totalSavedCents)}</b>
                      </span>
                      <span className="text-gray-500">
                        You: <b className="tabular-nums text-gray-700">{formatMoney(m.totalContributedCents)}</b>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onContribute(m)}
                      className="mt-2.5 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg bg-[#00897B] text-xs font-bold text-white"
                    >
                      <Plus className="h-3.5 w-3.5" /> Contribute this month
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}

// ---------------------------------------------------------------------------
// BNPL
// ---------------------------------------------------------------------------
function BnplSection({
  finance,
  onPay,
  paying,
}: {
  finance: FinanceData;
  onPay: (instalmentId: string) => void;
  paying: string | null;
}) {
  const bnpl = finance.bnpl;
  if (!bnpl) return null;
  const usedPct = bnpl.limit > 0 ? bnpl.used / bnpl.limit : 0;

  return (
    <section>
      <SectionTitle title="Buy now, pay later" />
      <Card className="mt-2">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Available to spend</p>
            <p className="text-2xl font-bold tabular-nums text-gray-900">R{bnpl.available.toFixed(2)}</p>
          </div>
          <div className="text-right text-[11px] text-gray-500">
            <p>
              Limit <b className="tabular-nums">R{bnpl.limit.toFixed(0)}</b>
            </p>
            <p>
              Used <b className="tabular-nums">R{bnpl.used.toFixed(2)}</b>
            </p>
          </div>
        </div>
        <Bar value={usedPct} color="#F59E0B" className="mt-2" />
        <p className="mt-1.5 text-[11px] text-gray-400">Pay just now, later in 4 — zero interest.</p>

        <div className="mt-3 space-y-3">
          {bnpl.plans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">{plan.merchant}</p>
                <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-[#00695C]">
                  {plan.paidInstalments}/{plan.totalInstalments} paid
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {formatMoney(Math.round(plan.instalmentAmount * 100))} per instalment
                {plan.nextDueDate ? ` · next due ${formatFullDate(plan.nextDueDate)}` : ''}
              </p>
              {plan.pendingInstalments.length > 0 ? (
                <div className="mt-2 space-y-1.5">
                  {plan.pendingInstalments.map((inst) => (
                    <div key={inst.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <div>
                        <p className="text-xs font-bold text-gray-800">Instalment {inst.number}</p>
                        <p className="text-[10px] text-gray-500">due {formatFullDate(inst.dueDate)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold tabular-nums text-gray-900">
                          {formatMoney(Math.round(inst.amount * 100))}
                        </span>
                        <button
                          type="button"
                          disabled={paying === inst.id}
                          onClick={() => onPay(inst.id)}
                          className="min-h-[36px] rounded-full bg-[#00897B] px-3.5 text-xs font-bold text-white disabled:opacity-60"
                        >
                          {paying === inst.id ? 'Paying…' : 'Pay'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 rounded-lg bg-lime-50 px-3 py-1.5 text-[11px] font-semibold text-[#558B2F]">
                  All instalments paid — nicely done!
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

// ---------------------------------------------------------------------------
// EWA
// ---------------------------------------------------------------------------
function EwaSection({ finance, onOpen }: { finance: FinanceData; onOpen: () => void }) {
  const ewa = finance.ewa;
  if (!ewa) return null;

  return (
    <section>
      <SectionTitle title="Earned wage access" />
      <Card className="mt-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
              {ewa.employer ?? 'Your employer'}
            </p>
            <p className="text-sm font-semibold text-gray-700">
              Accrued so far <span className="tabular-nums">R{ewa.accruedSalary.toFixed(2)}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-gray-400">
              Next payday{' '}
              {ewa.nextPayDay
                ? formatFullDate(ewa.nextPayDay)
                : ewa.payDay
                  ? `day ${ewa.payDay} of the month`
                  : '—'}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
              ewa.eligible ? 'bg-lime-50 text-[#558B2F]' : 'bg-gray-100 text-gray-500'
            }`}
          >
            {ewa.eligible ? 'Eligible' : 'Not eligible'}
          </span>
        </div>

        <div className="mt-3 rounded-xl bg-gradient-to-r from-[#00695C] to-[#00897B] p-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-wider text-teal-100/80">Available now</p>
          <p className="text-3xl font-bold tabular-nums">R{ewa.availableAdvance.toFixed(2)}</p>
          <p className="mt-1 text-[11px] text-teal-100/80">
            Get your earned salary before payday · 2% fee · repay {ewa.nextPayDay ? formatFullDate(ewa.nextPayDay) : 'on payday'}
          </p>
        </div>

        <button
          type="button"
          disabled={!ewa.eligible || ewa.availableAdvance < 50}
          onClick={onOpen}
          className="mt-3 min-h-[48px] w-full rounded-xl bg-[#00897B] font-bold text-white disabled:opacity-50"
        >
          Withdraw advance
        </button>
      </Card>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SASSA
// ---------------------------------------------------------------------------
function SassaSection({ finance }: { finance: FinanceData }) {
  const sassa = finance.sassa;
  if (!sassa) return null;

  return (
    <section>
      <SectionTitle title="SASSA grants" />
      <Card className="mt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-[#00897B]" />
            <p className="text-sm font-bold text-gray-900">
              Monthly income <span className="tabular-nums">R{sassa.totalMonthlyIncome.toFixed(2)}</span>
            </p>
          </div>
          <span className="rounded-full bg-lime-50 px-2.5 py-1 text-[10px] font-bold uppercase text-[#558B2F]">
            Linked
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {sassa.grants.map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3.5 py-3">
              <div>
                <p className="text-sm font-bold text-gray-900">{g.grantName}</p>
                <p className="text-[11px] text-gray-500">
                  {g.beneficiaries} {g.beneficiaries === 1 ? 'beneficiary' : 'beneficiaries'} ·{' '}
                  {g.nextPayment ? `next ${formatFullDate(g.nextPayment)}` : 'schedule pending'}
                </p>
              </div>
              <Money cents={Math.round(g.totalAmount * 100)} className="text-sm text-gray-900" />
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Insurance
// ---------------------------------------------------------------------------
const PRODUCT_LABELS: Record<string, string> = {
  funeral: 'Funeral cover',
  hospital_cash: 'Hospital cash',
  savings_protector: 'Savings protector',
};

function InsuranceSection({ finance, onAddCover }: { finance: FinanceData; onAddCover: () => void }) {
  const { insurance } = finance;
  return (
    <section>
      <SectionTitle title="Insurance" action={insurance.policies.length === 0 ? 'Add cover' : undefined} onAction={onAddCover} />
      <Card className="mt-2">
        {insurance.policies.length === 0 ? (
          <>
            <EmptyState
              icon={<ShieldCheck className="h-6 w-6" />}
              title="No cover yet"
              hint="Funeral, hospital cash and savings protector from R79/month"
            />
            <button
              type="button"
              onClick={onAddCover}
              className="min-h-[44px] w-full rounded-xl border border-teal-100 bg-teal-50/60 font-bold text-[#00695C]"
            >
              Add cover
            </button>
          </>
        ) : (
          <>
            <div className="flex items-end justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#00897B]" />
                <p className="text-sm font-bold text-gray-900">
                  {insurance.policies.length} active {insurance.policies.length === 1 ? 'policy' : 'policies'}
                </p>
              </div>
              <p className="text-[11px] text-gray-500">
                <b className="tabular-nums text-gray-700">{formatMoney(insurance.monthlyPremiumCents)}</b>/month total
              </p>
            </div>

            <div className="mt-3 space-y-2">
              {insurance.policies.map((p) => (
                <div key={p.id} className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">{PRODUCT_LABELS[p.productType] ?? p.productType}</p>
                    <span className="rounded-full bg-lime-50 px-2 py-0.5 text-[10px] font-bold uppercase text-[#558B2F]">
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-x-3 text-[11px] text-gray-500">
                    <span>
                      Cover <b className="tabular-nums text-gray-700">{formatMoney(p.coverAmountCents)}</b>
                    </span>
                    <span>
                      <b className="tabular-nums text-gray-700">{formatMoney(p.premiumCents)}</b>/month
                    </span>
                    <span>next {formatFullDate(p.nextPaymentDate)}</span>
                  </div>
                  {p.provider ? <p className="mt-0.5 text-[10px] text-gray-400">Underwritten by {p.provider}</p> : null}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={onAddCover}
              className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-teal-100 bg-teal-50/60 font-bold text-[#00695C]"
            >
              <Plus className="h-4 w-4" /> Add cover
            </button>
          </>
        )}
      </Card>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Loans
// ---------------------------------------------------------------------------
function LoansSection({ finance }: { finance: FinanceData }) {
  const { loans, applications } = finance.credit;
  return (
    <section>
      <SectionTitle title="Loans" />
      <Card className="mt-2">
        {loans.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-6 w-6" />}
            title="No active loans"
            hint="Apply from your GrowScore card — instant decision"
          />
        ) : (
          <div className="space-y-2">
            {loans.map((l) => {
              const paidPct = l.termMonths > 0 ? (l.termMonths - l.monthsRemaining) / l.termMonths : 0;
              return (
                <div key={l.id} className="rounded-xl border border-gray-100 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-900">
                      {l.lenderName} · {l.loanType}
                    </p>
                    <span className="text-xs font-bold tabular-nums text-gray-900">
                      R{l.outstanding.toFixed(2)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-gray-500">
                    of R{l.amount.toFixed(2)} · R{l.monthlyPayment.toFixed(2)}/month · {l.interestRate.toFixed(1)}% ·{' '}
                    {l.monthsRemaining} of {l.termMonths} months left
                  </p>
                  <Bar value={paidPct} color="#00897B" className="mt-2" />
                </div>
              );
            })}
          </div>
        )}

        {applications.length > 0 ? (
          <div className="mt-3 border-t border-gray-100 pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">
              <FileText className="h-3.5 w-3.5" /> Recent applications
            </p>
            <div className="flex flex-wrap gap-2">
              {applications.map((a) => (
                <span
                  key={a.id}
                  className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5 text-[11px] font-semibold text-gray-600"
                >
                  <CalendarClock className="h-3 w-3 text-gray-400" />
                  R{a.amount.toFixed(0)} · {a.term}mo · {a.status}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-[11px] text-gray-400">
          <span>Groway Credit · responsible lending applies</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </div>
      </Card>
    </section>
  );
}
