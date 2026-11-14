'use client';

/**
 * Groway Consumer Wallet v2 — login screen.
 * Dark teal gradient, phone + PIN, demo autofill.
 */

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Phone, Sparkles, Wallet } from 'lucide-react';
import { login, setToken } from './api';
import { Spinner } from './ui';

const DEMO_PHONE = '+27 82 123 4567';
const DEMO_PIN = '1234';

export default function LoginScreen({ onLogin }: { onLogin: () => Promise<void> }) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fillDemo = () => {
    setPhone(DEMO_PHONE);
    setPin(DEMO_PIN);
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const trimmedPhone = phone.trim();
    const trimmedPin = pin.trim();
    if (!trimmedPhone || trimmedPin.length < 4) {
      setError('Enter your phone number and a 4–6 digit PIN');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Normalise for lookup: the API matches on the exact stored phone.
      const normalisedPhone = trimmedPhone.replace(/[\s()\u2013-]/g, '');
      const res = await login(normalisedPhone, trimmedPin);
      setToken(res.accessToken, res.user.firstName ?? undefined);
      await onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col overflow-y-auto bg-gradient-to-br from-[#004D40] via-[#00695C] to-[#00897B] sm:min-h-0 sm:flex-1">
      <div className="flex flex-1 flex-col justify-center px-6 py-10">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8 flex flex-col items-center gap-3 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Groway Wallet</h1>
            <p className="mt-1 text-sm text-teal-100/80">Township commerce, supercharged.</p>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          onSubmit={submit}
          className="space-y-4"
        >
          <div className="rounded-3xl bg-white p-5 shadow-xl">
            {/* Phone */}
            <label htmlFor="phone" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">
              Phone number
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="+27 82 123 4567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-3 text-sm font-semibold text-gray-900 outline-none transition-colors placeholder:font-normal placeholder:text-gray-400 focus:border-[#00897B] focus:bg-white"
              />
            </div>

            {/* PIN */}
            <label htmlFor="pin" className="mb-1.5 mt-4 block text-xs font-bold uppercase tracking-wide text-gray-500">
              PIN
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-gray-400" />
              <input
                id="pin"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="min-h-[48px] w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-12 font-mono text-lg tracking-[0.35em] text-gray-900 outline-none transition-colors focus:border-[#00897B] focus:bg-white"
              />
              <button
                type="button"
                aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                onClick={() => setShowPin((s) => !s)}
                className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                {showPin ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>

            {/* Error */}
            {error ? (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            {/* Submit */}
            <button
              type="submit"
              disabled={busy}
              className="mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#00897B] to-[#00695C] text-base font-bold text-white shadow-md transition-transform active:scale-[0.98] disabled:opacity-70"
            >
              {busy ? <Spinner className="h-5 w-5" /> : null}
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </div>

          {/* Demo hint */}
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 shrink-0 text-amber-300" />
              <p className="flex-1 text-xs font-medium text-teal-50">
                Demo: <span className="font-mono font-bold">{DEMO_PHONE}</span> · PIN{' '}
                <span className="font-mono font-bold">{DEMO_PIN}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={fillDemo}
              className="mt-2.5 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-white/15 text-sm font-bold text-white transition-colors hover:bg-white/25"
            >
              Use demo account
            </button>
          </div>
        </motion.form>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-teal-100/60">
          Groway — Township commerce, supercharged.
        </p>
      </div>
    </div>
  );
}
