/**
 * Groway Consumer Wallet v2 — typed API client.
 * All money values are integer CENTS transported as strings in JSON.
 */

// ---------------------------------------------------------------------------
// Token storage
// ---------------------------------------------------------------------------
export const TOKEN_KEY = 'groway_wallet_token';
export const USER_NAME_KEY = 'groway_wallet_user_name';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string, firstName?: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  if (firstName) window.localStorage.setItem(USER_NAME_KEY, firstName);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_NAME_KEY);
}

export function getStoredFirstName(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(USER_NAME_KEY);
}

// ---------------------------------------------------------------------------
// Fetch wrapper
// ---------------------------------------------------------------------------
export const UNAUTHORIZED_EVENT = 'wallet:unauthorized';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

interface FetchOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
}

/** apiFetch — adds Bearer auth, unwraps { success, data, error } envelope. */
export async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(path, {
      method: options.method ?? 'GET',
      headers,
      cache: 'no-store',
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError('Network error — check your connection', 0);
  }

  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
    }
    throw new ApiError('Session expired — please sign in again', 401, 'AUTH_REQUIRED');
  }

  let json: { success?: boolean; data?: T; error?: string; code?: string };
  try {
    json = await res.json();
  } catch {
    throw new ApiError(`Unexpected server response (${res.status})`, res.status);
  }

  if (!res.ok || json.success === false) {
    throw new ApiError(json.error ?? `Request failed (${res.status})`, res.status, json.code);
  }
  return json.data as T;
}

// ---------------------------------------------------------------------------
// Formatting utilities
// ---------------------------------------------------------------------------
const zarFormatter = new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' });

/** Format integer cents as South African Rand, e.g. "R 12 345,67". */
export function formatMoney(cents: string | number | null | undefined): string {
  const value = Number(cents ?? 0) / 100;
  return zarFormatter.format(value).replace(/\u00A0/g, ' ');
}

/** Signed money for a transaction direction: credit is +, debit −. */
export function signedMoney(direction: 'debit' | 'credit', cents: string | number): string {
  return `${direction === 'credit' ? '+' : '−'} ${formatMoney(cents)}`;
}

export function formatDate(s: string | Date | null | undefined): string {
  if (!s) return '—';
  const d = new Date(s);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
}

export function formatFullDate(s: string | Date | null | undefined): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** send_money fee rule: free under R50 (5000c), else 1% capped at R10 (1000c). */
export function computeSendFee(amountCents: number): number {
  if (amountCents <= 0) return 0;
  if (amountCents <= 5000) return 0;
  return Math.min(Math.round(amountCents * 0.01), 1000);
}

export function parseAmountToCents(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, '');
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.round(value * 100);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------
export type Tier = 'bronze' | 'silver' | 'gold' | 'diamond';
export type Direction = 'debit' | 'credit';

export interface UserInfo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  initials: string;
  phone: string;
  kycLevel: number;
  kycStatus: string;
}

export interface WalletInfo {
  balanceCents: string;
  reservedCents: string;
  pendingCents: string;
  currency: string;
  dailyLimitCents: string | null;
  dailySpentCents: string;
  monthlyLimitCents: string | null;
  monthlySpentCents: string;
  totalReceivedCents: string;
  totalSentCents: string;
}

export interface LoyaltyInfo {
  tier: Tier;
  points: number;
  pointsToNextTier: number | null;
  tierProgress: number;
}

export interface CategorySpend {
  category: string;
  cents: number;
}

export interface Txn {
  id: string;
  type: string;
  direction: Direction;
  amountCents: string;
  feeCents: string;
  status: string;
  description: string | null;
  category: string | null;
  counterpartyName?: string | null;
  counterpartyPhone?: string | null;
  merchantName?: string | null;
  paymentMethod?: string | null;
  reference?: string | null;
  voucherToken?: string | null;
  meterNumber?: string | null;
  unitsPurchased?: string | null;
  createdAt: string;
}

export interface UpcomingItem {
  type: 'bnpl' | 'sassa' | 'salary';
  label: string;
  amountCents: string;
  dueDate: string;
}

export interface WalletStats {
  savingsTotalCents: string;
  pocketsCount: number;
  stokvelsCount: number;
  activeLoans: number;
  bnplPlans: number;
  insurancePolicies: number;
  activeCards: number;
  ewaAvailable: number;
}

export interface OverviewData {
  user: UserInfo;
  wallet: WalletInfo;
  loyalty: LoyaltyInfo;
  insights: { monthIncomeCents: number; monthSpendCents: number; topCategories: CategorySpend[] };
  recent: Txn[];
  stats: WalletStats;
  upcoming: UpcomingItem[];
}

export interface TxnPage {
  transactions: Txn[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ----------------------------- Finance types -------------------------------
export interface SavingsPocket {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  targetCents: string | null;
  currentCents: string;
  progress: number | null;
  interestRate: number;
  interestEarnedCents: string;
  autoSaveRule: { amount?: number; frequency?: string } | null;
  targetDate: string | null;
}

export interface StokvelMembership {
  membershipId: string;
  role: string;
  payoutPosition: number;
  totalContributedCents: string;
  totalReceivedCents: string;
  group: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    contributionCents: string;
    contributionDay: number;
    currentCycle: number;
    totalSavedCents: string;
    memberCount: number;
  };
}

export interface CreditFactor {
  name: string;
  impact: 'positive' | 'neutral' | 'negative';
  weight: number;
  detail: string;
}

export interface ScorePoint {
  month: string;
  score: number;
}

export interface ActiveLoan {
  id: string;
  lenderName: string;
  loanType: string;
  amount: number;
  outstanding: number;
  monthlyPayment: number;
  interestRate: number;
  termMonths: number;
  monthsRemaining: number;
}

export interface LoanApplication {
  id: string;
  amount: number;
  term: number;
  status: string;
  lenderName: string;
  createdAt: string;
}

export interface BnplInstalment {
  id: string;
  number: number;
  amount: number;
  dueDate: string;
}

export interface BnplPlan {
  id: string;
  merchant: string;
  purchaseAmount: number;
  instalmentAmount: number;
  paidInstalments: number;
  totalInstalments: number;
  nextDueDate: string | null;
  status: string;
  pendingInstalments: BnplInstalment[];
}

export interface BnplData {
  eligible: boolean;
  creditScore: number | null;
  limit: number;
  used: number;
  available: number;
  plans: BnplPlan[];
}

export interface EwaTransaction {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  reason: string | null;
  status: string;
  requestedAt: string;
}

export interface EwaData {
  employer: string | null;
  monthlySalary: number;
  payDay: number | null;
  accruedSalary: number;
  availableAdvance: number;
  usedThisMonth: number;
  limit: number;
  eligible: boolean;
  nextPayDay: string | null;
  transactions: EwaTransaction[];
}

export interface SassaGrant {
  id: string;
  grantType: string;
  grantName: string;
  amount: number;
  beneficiaries: number;
  totalAmount: number;
  status: string;
  nextPayment: string | null;
  lastPayment: string | null;
}

export interface SassaData {
  linked: boolean;
  status: string;
  totalMonthlyIncome: number;
  grants: SassaGrant[];
}

export interface InsurancePolicy {
  id: string;
  productType: string;
  provider: string;
  coverAmountCents: string;
  premiumCents: string;
  startDate: string;
  nextPaymentDate: string;
  status: string;
  beneficiaries: { name: string; relationship: string; share: number }[];
}

export interface FinanceData {
  savings: {
    totalCents: string;
    totalInterestCents: string;
    pockets: SavingsPocket[];
  };
  stokvels: {
    totalContributedCents: string;
    groups: StokvelMembership[];
  };
  credit: {
    score: number | null;
    lastUpdated: string | null;
    factors: CreditFactor[];
    history: ScorePoint[];
    loans: ActiveLoan[];
    applications: LoanApplication[];
  };
  bnpl: BnplData | null;
  ewa: EwaData | null;
  sassa: SassaData | null;
  insurance: {
    policies: InsurancePolicy[];
    monthlyPremiumCents: string;
  };
}

export interface LoanDecision {
  approved: boolean;
  score: number;
  interestRate: number;
  monthlyPayment: number;
  totalRepayment: number;
  totalInterest: number;
  initiationFee?: number;
}

// ----------------------------- Services types ------------------------------
export interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  accountLabel: string;
  accountFormat: string;
  minAmountCents: string;
  maxAmountCents: string;
  feeCents: string;
  processingTime: string;
}

export interface ServiceResult {
  id: string;
  type: string;
  amountCents: string;
  feeCents: string;
  netAmountCents: string;
  description: string | null;
  reference: string | null;
  voucherToken: string | null;
  voucherExpiry: string | null;
  meterNumber: string | null;
  unitsPurchased: string | null;
  createdAt: string;
}

// ----------------------------- Cards types ---------------------------------
export interface CardData {
  id: string;
  cardType: string;
  cardCategory: string;
  cardDesign: string;
  lastFour: string;
  expiry: string;
  cardholderName: string;
  status: 'active' | 'frozen';
  spendingLimitDailyCents: string | null;
  onlineEnabled: boolean;
  contactlessEnabled: boolean;
  atmEnabled: boolean;
  internationalEnabled: boolean;
  issuedAt: string;
}

// ----------------------------- QR types ------------------------------------
export interface QrData {
  qrString: string;
  profile: { name: string; phone: string };
  wallet: { balanceCents: string };
}

export type QrIntent =
  | { kind: 'p2p_send'; counterpartyUserId: string; name: string; phone: string }
  | {
      kind: 'merchant_payment';
      merchantId: string;
      merchantName: string;
      amountCents: string | null;
      reference: string | null;
    };

// ---------------------------------------------------------------------------
// Endpoint helpers
// ---------------------------------------------------------------------------
export function getOverview(): Promise<OverviewData> {
  return apiFetch<OverviewData>('/api/consumer/v2/overview');
}

export function refreshWalletOnly(): Promise<{ wallet: WalletInfo }> {
  return apiFetch<{ wallet: WalletInfo }>('/api/consumer/v2/overview', { method: 'POST' });
}

export type WalletOpBody =
  | { action: 'topup'; amountCents: number; method: 'card' | 'eft' | 'cash_at_pos' }
  | {
      action: 'send';
      amountCents: number;
      counterpartyPhone?: string;
      counterpartyUserId?: string;
      note?: string;
      idempotencyKey?: string;
    }
  | { action: 'withdraw'; amountCents: number; bankName?: string; accountNumber?: string };

export interface WalletOpResult {
  transaction: { id: string; reference?: string | null; [k: string]: unknown };
  message: string;
}

export function walletOp(body: WalletOpBody): Promise<WalletOpResult> {
  return apiFetch<WalletOpResult>('/api/consumer/v2/wallet', { method: 'POST', body });
}

export interface TxnQuery {
  limit?: number;
  cursor?: string | null;
  category?: string | null;
  direction?: string | null;
  days?: number | null;
}

export function getTransactions(q: TxnQuery = {}): Promise<TxnPage> {
  const sp = new URLSearchParams();
  if (q.limit) sp.set('limit', String(q.limit));
  if (q.cursor) sp.set('cursor', q.cursor);
  if (q.category) sp.set('category', q.category);
  if (q.direction) sp.set('direction', q.direction);
  if (q.days) sp.set('days', String(q.days));
  const qs = sp.toString();
  return apiFetch<TxnPage>(`/api/consumer/v2/transactions${qs ? `?${qs}` : ''}`);
}

export function getProviders(category?: string): Promise<{ providers: ServiceProvider[] }> {
  return apiFetch<{ providers: ServiceProvider[] }>(
    `/api/consumer/v2/services${category ? `?category=${encodeURIComponent(category)}` : ''}`,
  );
}

export type ServicePurchaseBody = {
  serviceType: 'airtime' | 'data' | 'electricity' | 'water' | 'bill' | 'tv' | 'transport' | 'voucher';
  amountCents: number;
  providerId?: string;
  providerName?: string;
  accountNumber?: string;
  recipientPhone?: string;
  bundle?: string;
  voucherBrand?: string;
  idempotencyKey?: string;
};

export function purchaseService(
  body: ServicePurchaseBody,
): Promise<{ transaction: ServiceResult; message: string }> {
  return apiFetch<{ transaction: ServiceResult; message: string }>('/api/consumer/v2/services', {
    method: 'POST',
    body,
  });
}

export function getFinance(): Promise<FinanceData> {
  return apiFetch<FinanceData>('/api/consumer/v2/finance');
}

export type FinanceActionBody =
  | { action: 'savings_deposit'; pocketId: string; amountCents: number }
  | { action: 'savings_withdraw'; pocketId: string; amountCents: number }
  | { action: 'savings_create'; name: string; targetCents?: number; icon?: string; color?: string }
  | { action: 'stokvel_contribute'; membershipId: string; amountCents: number }
  | { action: 'loan_apply'; amount: number; term: number; purpose?: string }
  | { action: 'bnpl_pay'; instalmentId: string }
  | { action: 'ewa_withdraw'; amount: number; reason?: string }
  | {
      action: 'insurance_subscribe';
      productType: 'funeral' | 'hospital_cash' | 'savings_protector';
      coverAmountCents: number;
      beneficiaries?: { name: string; relationship: string; share: number }[];
    };

export interface LoanApplyResult {
  applicationId: string;
  loanId: string;
  decision: LoanDecision;
  transaction: { id: string; reference: string | null };
  message: string;
}

export function financeAction<T = { message: string }>(body: FinanceActionBody): Promise<T> {
  return apiFetch<T>('/api/consumer/v2/finance', { method: 'POST', body });
}

export function getQr(): Promise<QrData> {
  return apiFetch<QrData>('/api/consumer/v2/qr');
}

export function resolveQr(qrString: string): Promise<{ intent: QrIntent }> {
  return apiFetch<{ intent: QrIntent }>('/api/consumer/v2/qr', { method: 'POST', body: { qrString } });
}

export function getCards(): Promise<{ cards: CardData[] }> {
  return apiFetch<{ cards: CardData[] }>('/api/consumer/v2/cards');
}

export interface CardPatchBody {
  cardId: string;
  status?: 'active' | 'frozen';
  toggles?: { online?: boolean; contactless?: boolean; atm?: boolean; international?: boolean };
}

export function patchCard(body: CardPatchBody): Promise<{ card: Partial<CardData>; message: string }> {
  return apiFetch<{ card: Partial<CardData>; message: string }>('/api/consumer/v2/cards', {
    method: 'PATCH',
    body,
  });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export interface LoginResponse {
  accessToken: string;
  user: { id: string; firstName: string | null; lastName: string | null; kycLevel: number; kycStatus: string };
  wallet: { balanceCents: string };
  loyalty: { tier: Tier; points: number };
}

export async function login(phone: string, pin: string): Promise<LoginResponse> {
  // Login does not use apiFetch (no token yet) but keeps the same envelope handling.
  const res = await fetch('/api/consumer/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, pin }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: LoginResponse;
    error?: string;
  };
  if (!res.ok || !json.success || !json.data) {
    throw new ApiError(json.error ?? 'Login failed — check your phone and PIN', res.status);
  }
  return json.data;
}

export function logout(): void {
  clearToken();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(UNAUTHORIZED_EVENT));
  }
}
