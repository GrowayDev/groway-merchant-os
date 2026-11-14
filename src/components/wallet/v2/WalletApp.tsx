'use client';

/**
 * Groway Consumer Wallet v2 — app shell.
 * Auth gate, shared data context, 5-tab bottom navigation, phone frame.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { Home, LayoutGrid, QrCode, TrendingUp, User } from 'lucide-react';
import {
  UNAUTHORIZED_EVENT,
  clearToken,
  getOverview,
  getToken,
  type OverviewData,
} from './api';
import { ErrorCard, Spinner } from './ui';
import LoginScreen from './LoginScreen';
import HomeTab from './HomeTab';
import PayTab from './PayTab';
import FinanceTab from './FinanceTab';
import ServicesTab from './ServicesTab';
import ProfileTab from './ProfileTab';

// ---------------------------------------------------------------------------
// Navigation + shared data context
// ---------------------------------------------------------------------------
export type TabKey = 'home' | 'pay' | 'finance' | 'services' | 'profile';

export interface NavIntent {
  payMode?: 'receive' | 'scan' | 'send';
  serviceKey?: string;
}

interface WalletContextValue {
  data: OverviewData | null;
  loading: boolean;
  refresh: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  navigate: (tab: TabKey, intent?: NavIntent) => void;
}

const WalletDataContext = createContext<WalletContextValue | null>(null);

export function useWalletData(): WalletContextValue {
  const ctx = useContext(WalletDataContext);
  if (!ctx) throw new Error('useWalletData must be used inside WalletApp');
  return ctx;
}

// ---------------------------------------------------------------------------
// Bottom navigation
// ---------------------------------------------------------------------------
const NAV_ITEMS: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'pay', label: 'Pay', icon: QrCode },
  { key: 'finance', label: 'Finance', icon: TrendingUp },
  { key: 'services', label: 'Services', icon: LayoutGrid },
  { key: 'profile', label: 'Profile', icon: User },
];

function BottomNav({ tab, onChange }: { tab: TabKey; onChange: (t: TabKey) => void }) {
  return (
    <nav
      aria-label="Main navigation"
      className="relative z-30 border-t border-black/5 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="flex items-stretch justify-around px-1">
        {NAV_ITEMS.map((item) => {
          const active = tab === item.key;
          const center = item.key === 'pay';
          const Icon = item.icon;

          if (center) {
            return (
              <button
                key={item.key}
                type="button"
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                onClick={() => onChange(item.key)}
                className="relative -mt-5 flex w-16 flex-col items-center justify-start pt-0"
              >
                <motion.span
                  whileTap={{ scale: 0.92 }}
                  className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-colors ${
                    active
                      ? 'bg-[#00695C] text-white shadow-teal-900/25'
                      : 'bg-gradient-to-br from-[#00897B] to-[#00695C] text-white shadow-teal-800/30'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </motion.span>
                <span
                  className={`text-[10px] font-bold ${active ? 'text-[#00695C]' : 'text-gray-400'}`}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.key}
              type="button"
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              onClick={() => onChange(item.key)}
              className="flex min-h-[56px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5"
            >
              <Icon
                className={`h-[22px] w-[22px] ${active ? 'text-[#00897B]' : 'text-gray-400'}`}
                strokeWidth={active ? 2.4 : 2}
              />
              <span
                className={`text-[10px] font-bold ${
                  active ? 'text-[#00695C]' : 'text-gray-400'
                }`}
              >
                {item.label}
              </span>
              {active ? (
                <motion.span
                  layoutId="nav-dot"
                  className="h-1 w-4 rounded-full bg-[#00897B]"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Tab titles for the shell header (Home renders its own header)
// ---------------------------------------------------------------------------
const TAB_TITLES: Record<TabKey, string> = {
  home: '',
  pay: 'Pay',
  finance: 'Finance',
  services: 'Services',
  profile: 'Profile',
};

// ---------------------------------------------------------------------------
// WalletApp
// ---------------------------------------------------------------------------
export default function WalletApp() {
  const [booting, setBooting] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [data, setData] = useState<OverviewData | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabKey>('home');
  const [intent, setIntent] = useState<NavIntent | undefined>(undefined);
  const requestId = useRef(0);

  const fetchOverview = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const d = await getOverview();
      if (id === requestId.current) {
        setData(d);
        setLoadError(null);
        setAuthenticated(true);
      }
    } catch (e) {
      if (id === requestId.current) {
        setLoadError(e instanceof Error ? e.message : 'Failed to load wallet');
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // Boot: check stored token
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setBooting(false);
      setAuthenticated(false);
      return;
    }
    fetchOverview().finally(() => setBooting(false));
  }, [fetchOverview]);

  // Global 401 handler
  useEffect(() => {
    const onUnauthorized = () => {
      clearToken();
      setData(null);
      setAuthenticated(false);
      setTab('home');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, []);

  const refresh = useCallback(async () => {
    await fetchOverview();
  }, [fetchOverview]);

  const refreshBalance = useCallback(async () => {
    try {
      const d = await getOverview();
      setData(d);
    } catch {
      /* non-fatal — balance refresh only */
    }
  }, []);

  const navigate = useCallback((next: TabKey, opts?: NavIntent) => {
    setIntent(opts);
    setTab(next);
  }, []);

  const ctx = useMemo<WalletContextValue>(
    () => ({ data, loading, refresh, refreshBalance, navigate }),
    [data, loading, refresh, refreshBalance, navigate],
  );

  if (booting) return <BootScreen />;

  if (!authenticated) {
    return (
      <Frame>
        <LoginScreen
          onLogin={async () => {
            await fetchOverview();
          }}
        />
      </Frame>
    );
  }

  if (loadError && !data) {
    return (
      <Frame>
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 sm:min-h-0 sm:flex-1">
          <p className="text-sm font-semibold text-gray-500">Groway Wallet</p>
          <ErrorCard message={loadError} onRetry={() => fetchOverview()} />
        </div>
      </Frame>
    );
  }

  return (
    <WalletDataContext.Provider value={ctx}>
      <Frame>
        <div className="flex h-full flex-col">
          {/* Shell header (non-home tabs) */}
          {tab !== 'home' ? (
            <header className="flex items-center gap-2 border-b border-black/5 bg-white px-4 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00897B]">
                <QrCode className="h-4 w-4 text-white" />
              </span>
              <h1 className="text-base font-bold text-gray-900">{TAB_TITLES[tab]}</h1>
              {loading ? <Spinner className="ml-auto text-[#00897B]" /> : null}
            </header>
          ) : null}

          {/* Scrollable content */}
          <main className="flex-1 overflow-y-auto overscroll-contain">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="min-h-full"
              >
                {tab === 'home' ? <HomeTab /> : null}
                {tab === 'pay' ? <PayTab intent={intent} onIntentConsumed={() => setIntent(undefined)} /> : null}
                {tab === 'finance' ? <FinanceTab /> : null}
                {tab === 'services' ? <ServicesTab intent={intent} onIntentConsumed={() => setIntent(undefined)} /> : null}
                {tab === 'profile' ? <ProfileTab /> : null}
              </motion.div>
            </AnimatePresence>
          </main>

          <BottomNav
            tab={tab}
            onChange={(t) => {
              setIntent(undefined);
              setTab(t);
            }}
          />
        </div>
        <Toaster position="top-center" richColors closeButton />
      </Frame>
    </WalletDataContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Phone frame wrapper — full-screen on mobile, centred device on desktop
// ---------------------------------------------------------------------------
function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen justify-center bg-gradient-to-b from-[#E2EFEC] via-[#EDF4F2] to-[#DCE9E6] sm:items-center sm:py-6">
      <div className="relative flex h-[100dvh] w-full max-w-md flex-col overflow-hidden bg-[#F4F7F6] sm:h-[min(880px,94vh)] sm:rounded-[2.5rem] sm:border sm:border-black/10 sm:shadow-2xl">
        {children}
      </div>
    </div>
  );
}

function BootScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#004D40] via-[#00695C] to-[#00897B]">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur"
      >
        <WalletGlyph />
      </motion.div>
      <p className="text-lg font-bold tracking-tight text-white">Groway Wallet</p>
      <Spinner className="h-5 w-5 text-white/70" />
    </div>
  );
}

export function WalletGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className ?? 'h-8 w-8 text-white'}>
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}
