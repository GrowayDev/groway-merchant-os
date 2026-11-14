'use client';

/**
 * Pay tab — Receive (my QR) | Scan (QR payload resolver) | Send (p2p transfer).
 */

import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Copy,
  CornerDownLeft,
  QrCode,
  ScanLine,
  Send,
  Store,
  UserPlus,
} from 'lucide-react';
import {
  computeSendFee,
  copyText,
  formatMoney,
  getQr,
  parseAmountToCents,
  resolveQr,
  walletOp,
  type QrData,
  type QrIntent,
} from './api';
import { useWalletData } from './WalletApp';
import {
  AmountInput,
  Card,
  ErrorCard,
  FeeRow,
  ListSkeleton,
  Money,
  Segmented,
  SuccessCheck,
} from './ui';

type PayMode = 'receive' | 'scan' | 'send';

/**
 * Demo scan payload. NOTE: intentionally targets a seeded *other* wallet user
 (the originally specified payload pointed at the logged-in demo user herself,
 which the backend correctly rejects with "You cannot send money to yourself").
 Sipho is a registered demo wallet user, so the end-to-end scan→confirm→send
 flow succeeds. The "demo" signature is intentionally invalid server-side —
 the UI falls back to parsing the JSON payload locally (per spec).
 */
const DEMO_QR_PAYLOAD = JSON.stringify({
  v: 'groway-qr-2',
  userId: 'consumer-demo-sipho',
  phone: '+27827654321',
  name: 'Sipho Mkhize',
  type: 'receive',
  currency: 'ZAR',
  ts: 1,
  sig: 'demo',
});

const QUICK_BENEFICIARIES = [
  { name: 'Sipho', phone: '+27 82 765 4321' },
  { name: 'Mama Ntombi', phone: '+27 83 111 2233' },
  { name: 'Nomsa Dlamini', phone: '+278211111111' },
  { name: 'Busi Nkosi', phone: '+278211133333' },
];

export default function PayTab({
  intent,
  onIntentConsumed,
}: {
  intent?: { payMode?: 'receive' | 'scan' | 'send' };
  onIntentConsumed?: () => void;
}) {
  const [localMode, setLocalMode] = useState<PayMode>('receive');
  // External nav intents force the mode; manual segmented taps clear the intent.
  const mode = intent?.payMode ?? localMode;
  const changeMode = (m: PayMode) => {
    onIntentConsumed?.();
    setLocalMode(m);
  };

  return (
    <div className="space-y-4 p-4 pb-6">
      <Segmented<PayMode>
        options={[
          { value: 'receive', label: 'Receive' },
          { value: 'scan', label: 'Scan' },
          { value: 'send', label: 'Send' },
        ]}
        value={mode}
        onChange={changeMode}
      />
      {mode === 'receive' ? <ReceivePanel /> : null}
      {mode === 'scan' ? <ScanPanel /> : null}
      {mode === 'send' ? <SendPanel /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Receive — my static QR
// ---------------------------------------------------------------------------
function ReceivePanel() {
  const [qr, setQr] = useState<QrData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setQr(await getQr());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your QR code');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Card className="flex items-center justify-center py-10">
        <ListSkeleton rows={3} />
      </Card>
    );
  }
  if (error) return <ErrorCard message={error} onRetry={load} />;
  if (!qr) return null;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}>
      <Card className="flex flex-col items-center gap-4 py-6">
        <div className="rounded-2xl border-4 border-[#00897B]/15 bg-white p-3 shadow-inner">
          <QRCodeSVG value={qr.qrString} size={180} includeMargin style={{ color: '#004D40' }} />
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-gray-900">{qr.profile.name}</p>
          <p className="text-sm tabular-nums text-gray-500">{qr.profile.phone}</p>
        </div>
        <p className="max-w-[240px] text-center text-xs text-gray-400">
          Show this code to receive payment — anyone with a Groway wallet can scan it.
        </p>
        <button
          type="button"
          onClick={async () => {
            const ok = await copyText(qr.profile.phone);
            if (ok) toast.success('Phone number copied');
          }}
          className="flex min-h-[44px] items-center gap-2 rounded-full border border-teal-100 bg-teal-50/60 px-4 text-sm font-semibold text-[#00695C]"
        >
          <Copy className="h-4 w-4" /> Copy my number
        </button>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Scan — paste payload (dev simulator) → intent → confirm
// ---------------------------------------------------------------------------
function ScanPanel() {
  const { refresh } = useWalletData();
  const [payload, setPayload] = useState('');
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intent, setIntent] = useState<QrIntent | null>(null);
  const [sendDone, setSendDone] = useState<{ reference?: string | null } | null>(null);

  const resolve = async (raw?: string) => {
    const value = (raw ?? payload).trim();
    if (!value) {
      toast.error('Paste a QR payload first');
      return;
    }
    setResolving(true);
    setError(null);
    setIntent(null);
    setSendDone(null);
    try {
      const res = await resolveQr(value);
      setIntent(res.intent);
    } catch {
      // Demo / unsigned QR: gracefully parse the JSON payload client-side.
      try {
        const parsed = JSON.parse(value) as {
          userId?: string;
          phone?: string;
          name?: string;
          type?: string;
          merchantId?: string;
          merchantName?: string;
          amountCents?: number;
        };
        if (parsed.type === 'receive' && (parsed.phone || parsed.userId)) {
          setIntent({
            kind: 'p2p_send',
            counterpartyUserId: parsed.userId ?? '',
            name: parsed.name ?? 'Groway user',
            phone: parsed.phone ?? '',
          });
        } else if (parsed.merchantId) {
          setIntent({
            kind: 'merchant_payment',
            merchantId: parsed.merchantId,
            merchantName: parsed.merchantName ?? 'Merchant',
            amountCents: parsed.amountCents ? String(parsed.amountCents) : null,
            reference: null,
          });
        } else {
          setError('Invalid or tampered QR code');
        }
      } catch {
        setError('Invalid or tampered QR code');
      }
    } finally {
      setResolving(false);
    }
  };

  const back = () => {
    setIntent(null);
    setSendDone(null);
    setPayload('');
  };

  if (sendDone) {
    return (
      <Card>
        <SuccessCheck label="Payment sent" />
        {sendDone.reference ? (
          <p className="mb-1 text-center font-mono text-xs text-gray-500">Ref {sendDone.reference}</p>
        ) : null}
        <p className="mb-4 text-center text-sm text-gray-500">Your balance has been updated.</p>
        <button
          type="button"
          onClick={back}
          className="min-h-[48px] w-full rounded-xl bg-[#00897B] font-bold text-white"
        >
          Scan another code
        </button>
      </Card>
    );
  }

  if (intent) {
    return <IntentConfirmCard intent={intent} onBack={back} onSent={(ref) => {
      setSendDone({ reference: ref });
      void refresh();
    }} />;
  }

  return (
    <Card>
      <div className="flex flex-col items-center gap-3">
        {/* Scan frame visual */}
        <div className="relative flex h-44 w-44 items-center justify-center">
          <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-4 border-t-4 border-[#00897B]" />
          <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-4 border-t-4 border-[#00897B]" />
          <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 border-[#00897B]" />
          <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-4 border-r-4 border-[#00897B]" />
          <QrCode className="h-16 w-16 text-teal-700/40" />
          <motion.span
            className="absolute inset-x-4 h-0.5 bg-[#7CB342]"
            animate={{ top: ['12%', '86%', '12%'] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <p className="text-center text-xs text-gray-500">
          Point your camera at a Groway QR code — or paste a payload below to simulate a scan.
        </p>

        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          rows={3}
          placeholder='{"v":"groway-qr-2", …}'
          aria-label="QR payload"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-700 outline-none focus:border-[#00897B] focus:bg-white"
        />

        {error ? (
          <div className="w-full rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid w-full grid-cols-2 gap-2">
          <button
            type="button"
            disabled={resolving}
            onClick={() => resolve()}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#00897B] text-sm font-bold text-white disabled:opacity-60"
          >
            <CornerDownLeft className="h-4 w-4" /> {resolving ? 'Resolving…' : 'Resolve'}
          </button>
          <button
            type="button"
            onClick={() => {
              setPayload(DEMO_QR_PAYLOAD);
              void resolve(DEMO_QR_PAYLOAD);
            }}
            className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-teal-100 bg-teal-50/60 text-sm font-bold text-[#00695C]"
          >
            <ScanLine className="h-4 w-4" /> Load demo QR
          </button>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Intent confirm (p2p or merchant)
// ---------------------------------------------------------------------------
function IntentConfirmCard({
  intent,
  onBack,
  onSent,
}: {
  intent: QrIntent;
  onBack: () => void;
  onSent: (reference?: string | null) => void;
}) {
  const [amount, setAmount] = useState(
    intent.kind === 'merchant_payment' && intent.amountCents
      ? (Number(intent.amountCents) / 100).toFixed(2)
      : '',
  );
  const [busy, setBusy] = useState(false);

  const cents = parseAmountToCents(amount);
  const fee = computeSendFee(cents);

  const pay = async () => {
    if (cents <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setBusy(true);
    try {
      if (intent.kind === 'p2p_send') {
        const res = await walletOp({
          action: 'send',
          amountCents: cents,
          counterpartyUserId: intent.counterpartyUserId || undefined,
          counterpartyPhone: intent.phone || undefined,
        });
        toast.success(res.message);
        onSent(res.transaction?.reference ?? null);
      } else {
        // Merchant QR: payment capture happens on the merchant's POS terminal;
        // the wallet records it automatically when the merchant processes it.
        toast.info(
          `Merchant ${intent.merchantName} is ready to bill ${formatMoney(cents)} — confirm the amount with the cashier at the till.`,
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex min-h-[44px] items-center gap-1 text-sm font-semibold text-gray-500"
        >
          <ArrowLeft className="h-4 w-4" /> Back to scanner
        </button>

        <div className="flex items-center gap-3 rounded-xl bg-teal-50/60 p-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#00897B] text-white">
            {intent.kind === 'p2p_send' ? <UserPlus className="h-5 w-5" /> : <Store className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">
              {intent.kind === 'p2p_send' ? intent.name : intent.merchantName}
            </p>
            <p className="truncate text-xs tabular-nums text-gray-500">
              {intent.kind === 'p2p_send' ? intent.phone : `Merchant · ${intent.merchantId}`}
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs font-bold uppercase tracking-wide text-gray-400">Amount</p>
        <AmountInput value={amount} onChange={setAmount} />

        {cents > 0 ? (
          <div className="mt-2 rounded-xl bg-gray-50 px-4 py-2">
            <FeeRow label="Amount" value={formatMoney(cents)} />
            <FeeRow label="Fee" value={fee === 0 ? 'Free' : formatMoney(fee)} />
            <FeeRow label="Total" value={formatMoney(cents + fee)} strong />
          </div>
        ) : null}

        <button
          type="button"
          disabled={busy || cents <= 0}
          onClick={pay}
          className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#00897B] font-bold text-white disabled:opacity-60"
        >
          <Send className="h-4 w-4" /> {busy ? 'Paying…' : 'Confirm payment'}
        </button>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Send — manual form
// ---------------------------------------------------------------------------
function SendPanel() {
  const { refresh } = useWalletData();
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ name: string; amountCents: number; reference?: string | null } | null>(null);

  const cents = parseAmountToCents(amount);
  const fee = computeSendFee(cents);
  const validPhone = phone.trim().replace(/\s/g, '').length >= 9;

  const submit = async () => {
    if (!validPhone) {
      toast.error('Enter the recipient’s Groway phone number');
      return;
    }
    if (cents <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setBusy(true);
    try {
      const res = await walletOp({
        action: 'send',
        amountCents: cents,
        counterpartyPhone: phone.trim().replace(/\s/g, ''),
        note: note.trim() || undefined,
      });
      toast.success(res.message);
      setDone({
        name: res.transaction && 'counterpartyName' in res.transaction
          ? String((res.transaction as { counterpartyName?: string }).counterpartyName ?? 'Recipient')
          : 'Recipient',
        amountCents: cents,
        reference: res.transaction?.reference ?? null,
      });
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Card>
        <SuccessCheck label={`${formatMoney(done.amountCents)} sent to ${done.name}`} />
        {done.reference ? (
          <p className="mb-1 text-center font-mono text-xs text-gray-500">Ref {done.reference}</p>
        ) : null}
        <p className="mb-4 text-center text-sm text-gray-500">Balance updated.</p>
        <button
          type="button"
          onClick={() => {
            setDone(null);
            setPhone('');
            setAmount('');
            setNote('');
          }}
          className="min-h-[48px] w-full rounded-xl border border-teal-100 bg-teal-50/60 font-bold text-[#00695C]"
        >
          Send another
        </button>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card>
        <label htmlFor="send-phone" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
          Recipient phone
        </label>
        <input
          id="send-phone"
          type="tel"
          inputMode="tel"
          placeholder="+27 82 000 0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm font-semibold tabular-nums text-gray-900 outline-none focus:border-[#00897B] focus:bg-white"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_BENEFICIARIES.map((b) => (
            <button
              key={b.phone}
              type="button"
              onClick={() => setPhone(b.phone)}
              className="min-h-[36px] rounded-full bg-teal-50/70 px-3 text-xs font-semibold text-[#00695C] hover:bg-teal-100"
            >
              {b.name} <span className="tabular-nums text-teal-700/60">{b.phone}</span>
            </button>
          ))}
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-wide text-gray-400">Amount</p>
        <AmountInput value={amount} onChange={setAmount} />

        <label htmlFor="send-note" className="mb-1.5 mt-3 block text-xs font-bold uppercase tracking-wide text-gray-500">
          Note (optional)
        </label>
        <input
          id="send-note"
          type="text"
          maxLength={60}
          placeholder="e.g. Groceries money"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-900 outline-none focus:border-[#00897B] focus:bg-white"
        />

        {cents > 0 ? (
          <div className="mt-3 rounded-xl bg-gray-50 px-4 py-2">
            <FeeRow label="Fee" value={fee === 0 ? 'Free under R50' : formatMoney(fee)} />
            <FeeRow label="They receive" value={formatMoney(cents)} />
            <FeeRow label="Total debit" value={formatMoney(cents + fee)} strong />
          </div>
        ) : null}

        <button
          type="button"
          disabled={busy || !validPhone || cents <= 0}
          onClick={submit}
          className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#00897B] font-bold text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> {busy ? 'Sending…' : 'Send money'}
        </button>
        <p className="mt-2 text-center text-[11px] text-gray-400">
          Free under R50 · 1% fee above R50, capped at R10
        </p>
      </Card>
    </motion.div>
  );
}
