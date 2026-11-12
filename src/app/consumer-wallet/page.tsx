'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  Home, CreditCard, ShoppingBag, Diamond, User, QrCode, Send, 
  Download, Plus, Smartphone, Zap, Droplets, Globe, Ticket, 
  Shield, TrendingUp, ChevronRight, Bell, Eye, EyeOff, 
  Settings, HelpCircle, FileText, Lock, LogOut,
  Plane, Train, Bus, Coffee, ShoppingCart, Gift, Percent,
  Wallet, Building, Phone, Mail, Users, Clock, Star, Award,
  Check, AlertCircle, MoreHorizontal, X, Search, ArrowLeft,
  Copy, Share2, CheckCircle, Loader2, Minus, PlusCircle,
  RefreshCw, CreditCard as CardIcon, Landmark, Bus as BusIcon,
  Utensils, Sparkles, Heart, Baby, Car, Home as HomeIcon,
  Briefcase, GraduationCap, Stethoscope, PlaneTakeoff, WalletCards,
  Menu, MessageCircle, PiggyBank, BadgeCheck, HandCoins,
  Calendar, Filter, ArrowUpRight, ArrowDownLeft, FileDown, FileSpreadsheet,
  AlertTriangle, ChevronDown, ChevronUp, Receipt, Unlock, Camera, Fingerprint
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  VisuallyHidden,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// Design Tokens
const colors = {
  teal: '#00897B',
  tealDark: '#00695C',
  tealLight: '#4DB6AC',
  green: '#43A047',
  greenDark: '#2E7D32',
  greenLight: '#81C784',
  cardText: '#0A3D30',
  cardBgWhite: '#FFFFFF',
  cardBgMid: '#E8F8F0',
  cardBgEnd: '#C0EDDA',
  amber: '#FF9800',
  purple: '#9C27B0',
  blue: '#1565C0',
  red: '#D32F2F',
};

// Format currency as South African Rand
const formatCurrency = (amount: number): string => {
  return `R ${amount.toLocaleString('en-ZA', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  }).replace(/,/g, ' ')}`;
};

// Simple QR Code component for tickets
function TicketQRCode({ data, size = 120 }: { data: string; size?: number }) {
  // Generate a deterministic pattern based on the data string
  const generatePattern = (str: string) => {
    const pattern: boolean[][] = [];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    
    // Create a 21x21 grid (small QR code)
    const gridSize = 21;
    for (let row = 0; row < gridSize; row++) {
      pattern[row] = [];
      for (let col = 0; col < gridSize; col++) {
        // Add position patterns (corners)
        const isCorner = 
          (row < 7 && col < 7) || 
          (row < 7 && col >= gridSize - 7) || 
          (row >= gridSize - 7 && col < 7);
        
        if (isCorner) {
          // Position pattern
          const inCornerOuter = row < 7 && col < 7;
          const inCornerTR = row < 7 && col >= gridSize - 7;
          const inCornerBL = row >= gridSize - 7 && col < 7;
          
          let r = row, c = col;
          if (inCornerTR) { r = row; c = col - (gridSize - 7); }
          if (inCornerBL) { r = row - (gridSize - 7); c = col; }
          
          if (r === 0 || r === 6 || c === 0 || c === 6) {
            pattern[row][col] = true;
          } else if (r >= 2 && r <= 4 && c >= 2 && c <= 4) {
            pattern[row][col] = true;
          } else {
            pattern[row][col] = false;
          }
        } else {
          // Data area - use hash to determine
          const seed = (hash + row * gridSize + col) % 100;
          pattern[row][col] = seed < 45;
        }
      }
    }
    return pattern;
  };

  const pattern = generatePattern(data || 'default');
  const cellSize = size / 21;

  return (
    <div className="bg-white p-2 rounded-lg inline-block">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {pattern.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <rect
              key={`${rowIndex}-${colIndex}`}
              x={colIndex * cellSize}
              y={rowIndex * cellSize}
              width={cellSize}
              height={cellSize}
              fill={cell ? '#000000' : '#ffffff'}
            />
          ))
        )}
      </svg>
    </div>
  );
}

// IATA Aztec Barcode Component for Boarding Passes
function AztecBarcode({ 
  data, 
  size = 150 
}: { 
  data: {
    passengerName: string;
    pnr: string;
    from: string;
    to: string;
    flightNumber: string;
    date: string;
    seat?: string;
    class: string;
    seq?: string;
  }; 
  size?: number;
}) {
  // Generate Aztec-style pattern (IATA BCBP standard)
  // Aztec has a central finder pattern (bullseye) and data layers around it
  const generateAztecPattern = () => {
    const gridSize = 23; // Standard Aztec compact
    const pattern: boolean[][] = [];
    const center = Math.floor(gridSize / 2);
    
    // Create hash from data
    let hash = 0;
    const dataStr = `${data.passengerName}${data.pnr}${data.flightNumber}${data.from}${data.to}${data.date}`;
    for (let i = 0; i < dataStr.length; i++) {
      hash = ((hash << 5) - hash) + dataStr.charCodeAt(i);
      hash = hash & hash;
    }

    for (let row = 0; row < gridSize; row++) {
      pattern[row] = [];
      for (let col = 0; col < gridSize; col++) {
        const distFromCenter = Math.max(Math.abs(row - center), Math.abs(col - center));
        
        // Central bullseye finder pattern (Aztec style)
        if (distFromCenter <= 4) {
          // Concentric rings
          if (distFromCenter <= 1) {
            pattern[row][col] = true; // Center solid
          } else if (distFromCenter === 2) {
            pattern[row][col] = false; // White ring
          } else if (distFromCenter === 3) {
            pattern[row][col] = true; // Black ring
          } else {
            pattern[row][col] = false; // White ring
          }
        } else {
          // Data area - deterministic based on position and hash
          const seed = (hash + row * gridSize + col + distFromCenter * 7) % 100;
          pattern[row][col] = seed < 48;
        }
      }
    }
    return pattern;
  };

  const pattern = generateAztecPattern();
  const cellSize = size / 23;

  // Generate IATA BCBP data string
  const bcbpData = `M${data.passengerName.toUpperCase().substring(0, 20).padEnd(20)}${data.pnr.padEnd(7)}${data.from}${data.to}${data.flightNumber.padEnd(6)}${data.date}${data.class}${data.seat || '000'}${data.seq || '001'}`;

  return (
    <div className="bg-white p-3 rounded-lg inline-block">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {pattern.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <rect
              key={`${rowIndex}-${colIndex}`}
              x={colIndex * cellSize}
              y={rowIndex * cellSize}
              width={cellSize}
              height={cellSize}
              fill={cell ? '#000000' : '#ffffff'}
            />
          ))
        )}
      </svg>
      <p className="text-[6px] text-gray-400 mt-1 font-mono text-center break-all max-w-[150px]">{bcbpData.substring(0, 40)}...</p>
    </div>
  );
}

// Types
type TabType = 'home' | 'pay' | 'services' | 'offers' | 'profile';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  absoluteAmount?: number;
  category: string;
  description: string;
  merchant: string;
  merchantName?: string;
  counterpartyName?: string;
  timestamp: string;
  date?: string;
  time?: string;
  status: string;
  reference?: string;
  transactionType?: string;
  fee?: number;
  paymentMethod?: string;
  cardLastFour?: string;
  // Voucher/Token information for traceability
  voucherToken?: string;
  voucherExpiry?: string;
  meterNumber?: string;
  unitsPurchased?: string;
}

interface WalletData {
  balance: number;
  currency: string;
  lastUpdated: string;
  recentTransactions?: Transaction[];
  dailySpent?: number;
  monthlySpent?: number;
}

interface LoyaltyInfo {
  points: number;
  tier: string;
  tierName: string;
  pointsToNextTier: number;
  nextTier: string;
}

interface LoyaltyData {
  loyalty: LoyaltyInfo;
  offers: Offer[];
  flashSales: FlashSale[];
  tiers: any[];
}

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  merchant: string;
  clipped: boolean;
}

interface FlashSale {
  id: string;
  title: string;
  discount: string;
  timeLeft: number;
  merchant: string;
}

// Apple Phone Wrapper Component
function ApplePhoneWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-2 sm:p-4">
      {/* Phone Frame */}
      <div className="relative w-full max-w-[375px] h-[812px] bg-[#1A1A1A] rounded-[3rem] p-2 shadow-2xl">
        {/* Dynamic Island / Notch */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-gray-800 mr-2"></div>
          <div className="w-2 h-2 rounded-full bg-gray-700"></div>
        </div>
        
        {/* Screen */}
        <div className="bg-white rounded-[2.25rem] overflow-hidden h-full relative">
          {/* Status Bar */}
          <div className="h-11 flex items-end justify-between px-6 pb-1 text-xs font-semibold bg-white">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" />
              <span className="text-[10px] font-normal">5G</span>
              <div className="flex items-center gap-0.5 ml-1">
                <div className="w-5 h-2.5 border border-current rounded-sm relative">
                  <div className="absolute inset-0.5 right-1 bg-current rounded-sm"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* App Content */}
          <div className="h-[calc(100%-44px)] overflow-hidden">
            {children}
          </div>
        </div>
        
        {/* Side Buttons (visual only) */}
        <div className="absolute left-0 top-28 w-1 h-7 bg-gray-700 rounded-l-sm"></div>
        <div className="absolute left-0 top-40 w-1 h-14 bg-gray-700 rounded-l-sm"></div>
        <div className="absolute left-0 top-60 w-1 h-14 bg-gray-700 rounded-l-sm"></div>
        <div className="absolute right-0 top-40 w-1 h-16 bg-gray-700 rounded-r-sm"></div>
      </div>
    </div>
  );
}

// Main Consumer Wallet Component
export default function ConsumerWallet() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showBalance, setShowBalance] = useState(true);
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch wallet data from real API
  useEffect(() => {
    const fetchWalletData = async () => {
      try {
        setLoading(true);
        const [walletRes, loyaltyRes] = await Promise.all([
          fetch('/api/wallet'),
          fetch('/api/loyalty')
        ]);
        
        const walletJson = await walletRes.json();
        const loyaltyJson = await loyaltyRes.json();
        
        if (walletJson.success) {
          setWalletData(walletJson.data);
          setTransactions(walletJson.data.recentTransactions || []);
        }
        if (loyaltyJson.success) {
          setLoyaltyData(loyaltyJson.data);
        }
      } catch (error) {
        console.error('Failed to fetch wallet data:', error);
        toast.error('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, []);

  // Refresh wallet data
  const refreshWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet');
      const json = await res.json();
      if (json.success) {
        setWalletData(json.data);
        setTransactions(json.data.recentTransactions || []);
        toast.success('Wallet refreshed');
      }
    } catch (error) {
      console.error('Failed to refresh wallet:', error);
      toast.error('Failed to refresh wallet');
    }
  }, []);

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab 
            showBalance={showBalance} 
            setShowBalance={setShowBalance} 
            walletData={walletData}
            transactions={transactions}
            loyaltyData={loyaltyData}
            loading={loading}
            refreshWallet={refreshWallet}
            setActiveTab={setActiveTab}
          />
        );
      case 'pay':
        return <PayTab walletData={walletData} refreshWallet={refreshWallet} />;
      case 'services':
        return <ServicesTab />;
      case 'offers':
        return <OffersTab loyaltyData={loyaltyData} />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <HomeTab showBalance={showBalance} setShowBalance={setShowBalance} walletData={walletData} transactions={transactions} loyaltyData={loyaltyData} loading={loading} refreshWallet={refreshWallet} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <ApplePhoneWrapper>
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 px-4 py-2.5">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              {/* Clean Logo Circle with GRW */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00897B] to-[#43A047] flex items-center justify-center shadow-md shadow-[#00897B]/20 group-hover:shadow-lg group-hover:shadow-[#00897B]/30 transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-xs tracking-tight">GRW</span>
              </div>
              {/* Wallet Text */}
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-gray-900">Groway</span>
                <span className="text-sm font-normal text-[#00897B]">Wallet</span>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#00897B]/10" onClick={refreshWallet}>
                <RefreshCw className="w-4 h-4 text-[#00897B]" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#00897B]/10 relative">
                <Bell className="w-4 h-4 text-[#00897B]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-16">
          {renderTabContent()}
        </main>

        {/* Bottom Tab Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex items-center justify-around px-1 pb-5 pt-2">
          <TabButton icon={Home} label="Home" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
          <TabButton icon={CreditCard} label="Pay" isActive={activeTab === 'pay'} onClick={() => setActiveTab('pay')} />
          <TabButton icon={ShoppingBag} label="Services" isActive={activeTab === 'services'} onClick={() => setActiveTab('services')} />
          <TabButton icon={Diamond} label="Offers" isActive={activeTab === 'offers'} onClick={() => setActiveTab('offers')} />
          <TabButton icon={User} label="Profile" isActive={activeTab === 'profile'} onClick={() => setActiveTab('profile')} />
        </div>
      </div>
    </ApplePhoneWrapper>
  );
}

// Tab Button Component
function TabButton({ icon: Icon, label, isActive, onClick }: { 
  icon: React.ElementType; 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-14 py-1 transition-all ${
        isActive 
          ? 'text-[#00897B]' 
          : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
      <span className={`text-[10px] mt-0.5 ${isActive ? 'font-semibold' : ''}`}>{label}</span>
    </button>
  );
}

// ==================== HOME TAB ====================
function HomeTab({ showBalance, setShowBalance, walletData, transactions, loyaltyData, loading, refreshWallet, setActiveTab }: {
  showBalance: boolean;
  setShowBalance: (show: boolean) => void;
  walletData: WalletData | null;
  transactions: Transaction[];
  loyaltyData: LoyaltyData | null;
  loading: boolean;
  refreshWallet: () => void;
  setActiveTab: (tab: TabType) => void;
}) {
  const [showSendModal, setShowSendModal] = useState(false);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);

  const quickActions = [
    { icon: Send, label: 'Send', color: colors.teal, action: () => setShowSendModal(true) },
    { icon: Download, label: 'Receive', color: colors.green, action: () => setShowQRModal(true) },
    { icon: QrCode, label: 'Scan', color: colors.purple, action: () => setShowQRModal(true) },
    { icon: Plus, label: 'Top Up', color: colors.blue, action: () => setShowTopupModal(true) },
  ];

  // Envelope pocket services - Grant+ and Pay+ get special treatment
  const envelopePockets = [
    { 
      icon: HandCoins, 
      label: 'Grant+', 
      subtitle: 'SASSA Advance',
      color: '#00897B', 
      service: 'sassa',
      description: 'Get an advance on your grant',
      badge: 'NCA Compliant'
    },
    { 
      icon: Zap, 
      label: 'Pay+', 
      subtitle: 'Early Wage Access',
      color: '#FF9800', 
      service: 'payplus',
      description: 'Access your earned wages early',
      badge: 'Instant'
    },
  ];

  // COMPREHENSIVE services list - all features (excluding envelope pockets)
  const services = [
    { icon: Smartphone, label: 'Airtime', color: '#E91E63', service: 'airtime' },
    { icon: Zap, label: 'Power', color: '#FF9800', service: 'electricity' },
    { icon: Droplets, label: 'Water', color: '#2196F3', service: 'water' },
    { icon: Globe, label: 'Transfer', color: '#9C27B0', service: 'transfers' },
    { icon: Ticket, label: 'Bills', color: '#00BCD4', service: 'bills' },
    { icon: Shield, label: 'Insurance', color: '#4CAF50', service: 'insurance' },
    { icon: TrendingUp, label: 'Credit', color: '#FF5722', service: 'credit' },
    { icon: CreditCard, label: 'BNPL', color: '#E91E63', service: 'bnpl' },
    { icon: PiggyBank, label: 'Laybye', color: '#009688', service: 'laybye' },
    { icon: Wallet, label: 'Savings', color: '#3F51B5', service: 'savings' },
  ];

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ElementType> = {
      'Airtime & Data': Smartphone,
      'Groceries': ShoppingCart,
      'Transfer': Wallet,
      'Electricity': Zap,
      'default': Wallet
    };
    return icons[category] || icons['default'];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#00897B]" />
      </div>
    );
  }

  return (
    <div className="px-3 py-3">
      {/* User Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#00897B] to-[#43A047] flex items-center justify-center text-white font-bold text-sm">
            TM
          </div>
          <div>
            <p className="text-gray-500 text-[10px]">Good morning,</p>
            <p className="text-gray-900 font-semibold text-sm">Thabo Molefe</p>
          </div>
        </div>
      </div>

      {/* Envelope Balance Card - All Green with Tier Status */}
      <Card className="mb-3 overflow-hidden border-0 shadow-xl rounded-2xl">
        <div 
          className="relative text-white"
          style={{ 
            background: `linear-gradient(145deg, #00897B 0%, #43A047 50%, #2E7D32 100%)`,
          }}
        >
          {/* Envelope Flap Effect */}
          <div className="absolute top-0 left-0 right-0 h-12 overflow-hidden">
            <div 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[110%] h-16 bg-[#00695C] rounded-b-[50%]"
              style={{ transform: 'translateX(-50%)' }}
            />
          </div>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white transform"></div>
            <div className="absolute bottom-12 left-4 w-16 h-16 rounded-full bg-white transform"></div>
            <div className="absolute bottom-4 right-8 w-12 h-12 rounded-full bg-white transform"></div>
          </div>

          {/* Main Content */}
          <div className="relative z-10 p-4 pt-6">
            {/* Balance Row */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-white/70 text-[10px] uppercase tracking-wide">Available Balance</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-2xl font-bold tracking-tight">
                    {showBalance ? formatCurrency(walletData?.balance || 0) : 'R •••• ••'}
                  </p>
                  <button 
                    onClick={() => setShowBalance(!showBalance)} 
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {showBalance ? <Eye className="w-3.5 h-3.5 text-white/80" /> : <EyeOff className="w-3.5 h-3.5 text-white/80" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Tier Status Section */}
            {loyaltyData && (
              <div className="bg-white/15 rounded-xl p-2.5 mb-3 backdrop-blur-sm border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shadow-lg">
                      <Award className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-white">{loyaltyData.loyalty.tierName}</span>
                        <span className="text-[9px] text-white/60">Member</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Star className="w-3 h-3 text-amber-300 fill-amber-300" />
                        <span className="text-[10px] font-bold text-white">{loyaltyData.loyalty.points.toLocaleString()} pts</span>
                        <span className="text-[9px] text-white/60">• {loyaltyData.loyalty.pointsToNextTier} to {loyaltyData.loyalty.nextTier}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-12 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${Math.min(100, ((3000 - loyaltyData.loyalty.pointsToNextTier) / 3000) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-2">
              {quickActions.map((action, idx) => (
                <button key={idx} className="flex flex-col items-center group" onClick={action.action}>
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-1 group-hover:bg-white/25 transition-all shadow-lg backdrop-blur-sm border border-white/10">
                    <action.icon className="w-4.5 h-4.5 text-white" />
                  </div>
                  <span className="text-[9px] text-white font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Envelope Bottom Fold Effect */}
          <div className="h-3 bg-gradient-to-b from-transparent to-[#00695C]/30" />
        </div>
      </Card>

      {/* Virtual Card Section */}
      <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowCardModal(true)}>
        <CardContent className="py-2.5 px-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                <WalletCards className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700">Virtual Card</p>
                <p className="text-[10px] text-gray-500">Visa •••• 4567</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200">Active</Badge>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Services Grid - COMPREHENSIVE */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm">Services</h3>
          <button className="text-xs text-[#00897B] font-medium" onClick={() => setActiveTab('services')}>See all</button>
        </div>
        
        {/* Envelope Pockets - Grant+ and Pay+ */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          {envelopePockets.map((pocket, idx) => (
            <ServiceModalWrapper key={idx} service={pocket.service}>
              <div className="relative overflow-hidden rounded-xl cursor-pointer group">
                <div 
                  className="p-3 text-white"
                  style={{ 
                    background: pocket.service === 'sassa' 
                      ? 'linear-gradient(145deg, #00897B 0%, #43A047 100%)'
                      : 'linear-gradient(145deg, #FF9800 0%, #F57C00 100%)'
                  }}
                >
                  {/* Envelope flap effect */}
                  <div className="absolute top-0 left-0 right-0 h-6 overflow-hidden opacity-30">
                    <div 
                      className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-8 rounded-b-[50%]"
                      style={{ backgroundColor: pocket.service === 'sassa' ? '#00695C' : '#E65100' }}
                    />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        pocket.service === 'sassa' ? 'bg-white/20' : 'bg-white/20'
                      }`}>
                        <pocket.icon className="w-4 h-4 text-white" />
                      </div>
                      <Badge className="bg-white/20 text-white text-[8px] px-1.5 py-0">{pocket.badge}</Badge>
                    </div>
                    <p className="font-semibold text-white text-xs">{pocket.label}</p>
                    <p className="text-white/80 text-[10px]">{pocket.subtitle}</p>
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            </ServiceModalWrapper>
          ))}
        </div>
        
        {/* Regular Services Grid */}
        <div className="grid grid-cols-5 gap-1.5">
          {services.map((service, idx) => (
            <ServiceModalWrapper key={idx} service={service.service}>
              <div className="flex flex-col items-center p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center mb-0.5"
                  style={{ backgroundColor: `${service.color}15` }}
                >
                  <service.icon className="w-4 h-4" style={{ color: service.color }} />
                </div>
                <span className="text-[9px] text-gray-600 text-center font-medium">{service.label}</span>
              </div>
            </ServiceModalWrapper>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm">Recent Transactions</h3>
          <button className="text-xs text-[#00897B] font-medium" onClick={() => setShowTransactionHistory(true)}>See all</button>
        </div>
        {transactions.length > 0 ? (
          <div className="space-y-1.5">
            {transactions.slice(0, 5).map((tx, idx) => {
              const Icon = getCategoryIcon(tx.category);
              return (
                <Card key={idx} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-2 px-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-xs truncate">{tx.description}</p>
                        <p className="text-[10px] text-gray-500">{tx.category}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold text-xs ${tx.amount >= 0 ? 'text-green-600' : 'text-gray-900'}`}>
                          {tx.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                        </p>
                        <p className="text-[10px] text-gray-400">{new Date(tx.timestamp).toLocaleDateString('en-ZA')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6 text-center">
              <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent transactions</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      {showSendModal && <SendModal onClose={() => setShowSendModal(false)} onSuccess={refreshWallet} />}
      {showTopupModal && <TopupModal onClose={() => setShowTopupModal(false)} onSuccess={refreshWallet} />}
      {showQRModal && <QRModal onClose={() => setShowQRModal(false)} onSuccess={refreshWallet} />}
      {showTransactionHistory && <TransactionHistoryModal onClose={() => setShowTransactionHistory(false)} />}
      {showCardModal && <WalletCardModal onClose={() => setShowCardModal(false)} />}
    </div>
  );
}

// Service Modal Wrapper - handles opening the right modal
function ServiceModalWrapper({ service, children }: { service: string; children: React.ReactNode }) {
  const [activeService, setActiveService] = useState<string | null>(null);

  return (
    <>
      <div onClick={() => setActiveService(service)}>
        {children}
      </div>
      {activeService === 'airtime' && <AirtimeModal onClose={() => setActiveService(null)} />}
      {activeService === 'electricity' && <ElectricityModal onClose={() => setActiveService(null)} />}
      {activeService === 'water' && <WaterModal onClose={() => setActiveService(null)} />}
      {activeService === 'bills' && <BillsModal onClose={() => setActiveService(null)} />}
      {activeService === 'transfers' && <TransfersModal onClose={() => setActiveService(null)} />}
      {activeService === 'sassa' && <GrantPlusModal onClose={() => setActiveService(null)} />}
      {activeService === 'insurance' && <InsuranceModal onClose={() => setActiveService(null)} />}
      {activeService === 'credit' && <CreditModal onClose={() => setActiveService(null)} />}
      {activeService === 'bnpl' && <BNPLModal onClose={() => setActiveService(null)} />}
      {activeService === 'payplus' && <PayPlusModal onClose={() => setActiveService(null)} />}
      {activeService === 'laybye' && <LaybyeModal onClose={() => setActiveService(null)} />}
      {activeService === 'savings' && <SavingsModal onClose={() => setActiveService(null)} />}
      {activeService === 'gautrain' && <GautrainModal onClose={() => setActiveService(null)} />}
      {activeService === 'bus' && <BusModal onClose={() => setActiveService(null)} />}
      {activeService === 'flights' && <FlightsModal onClose={() => setActiveService(null)} />}
      {activeService === 'events' && <EventsModal onClose={() => setActiveService(null)} />}
      {activeService === 'vouchers' && <VouchersModal onClose={() => setActiveService(null)} />}
    </>
  );
}

// ==================== PAY TAB ====================
function PayTab({ walletData, refreshWallet }: { walletData: WalletData | null; refreshWallet: () => void }) {
  const [selectedMethod, setSelectedMethod] = useState('payshap');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [recentRecipients, setRecentRecipients] = useState<any[]>([]);

  // Fetch recent recipients
  useEffect(() => {
    const fetchRecipients = async () => {
      try {
        const res = await fetch('/api/send-money?action=recipients');
        const data = await res.json();
        if (data.success) setRecentRecipients(data.data);
      } catch (error) {
        console.error('Failed to fetch recipients:', error);
      }
    };
    fetchRecipients();
  }, []);

  const paymentMethods = [
    { id: 'payshap', label: 'PayShap', desc: 'Instant bank transfer', icon: Zap },
    { id: 'gopay', label: 'GoPay', desc: 'Instant EFT', icon: CreditCard },
    { id: 'wallet', label: 'Wallet', desc: walletData ? formatCurrency(walletData.balance) : 'R 0.00', icon: Wallet },
    { id: 'card', label: 'Card', desc: '**** 4567', icon: CreditCard },
  ];

  const quickActions = [
    { icon: QrCode, label: 'Scan', color: colors.teal, action: () => setShowQRModal(true) },
    { icon: Send, label: 'Send', color: colors.green, action: () => setShowSendModal(true) },
    { icon: Download, label: 'Request', color: colors.purple, action: () => setShowRequestModal(true) },
    { icon: Users, label: 'Split', color: colors.blue, action: () => setShowSplitModal(true) },
  ];

  // Display recipients (use fetched or fallback to demo)
  const displayRecipients = recentRecipients.length > 0 
    ? recentRecipients.slice(0, 4).map(r => ({
        name: r.name.split(' ')[0],
        initials: r.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2),
        color: colors.teal,
        phone: r.phone,
      }))
    : [
        { name: 'Thabo', initials: 'TS', color: colors.teal },
        { name: 'Lerato', initials: 'LM', color: colors.purple },
        { name: 'Sipho', initials: 'SK', color: colors.amber },
        { name: 'Nomsa', initials: 'ND', color: colors.blue },
      ];

  return (
    <div className="px-3 py-3">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-lg font-bold text-gray-900">Pay Hub</h1>
        <p className="text-xs text-gray-500">Send and receive money instantly</p>
      </div>

      {/* QR Code Section */}
      <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowQRModal(true)}>
        <CardContent className="py-3">
          <div className="flex flex-col items-center">
            <div className="w-28 h-28 bg-gradient-to-br from-[#00897B]/10 to-[#43A047]/10 rounded-2xl flex items-center justify-center mb-2 border-2 border-dashed border-[#00897B]/30">
              <QrCode className="w-16 h-16 text-[#00897B]/60" />
            </div>
            <p className="text-xs font-medium text-[#00897B]">Tap to show your QR code</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Receive payments instantly</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {quickActions.map((action, idx) => (
          <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow" onClick={action.action}>
            <CardContent className="py-2.5 flex flex-col items-center">
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-0.5"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <action.icon className="w-4 h-4" style={{ color: action.color }} />
              </div>
              <span className="text-[10px] text-gray-600 font-medium">{action.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Methods */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm">Payment Method</h3>
          <span className="text-[10px] text-gray-400">Tap to select</span>
        </div>
        <div className="space-y-1.5">
          {paymentMethods.map((method) => {
            const MethodIcon = method.icon;
            return (
              <Card 
                key={method.id} 
                className={`cursor-pointer transition-all ${selectedMethod === method.id ? 'border-[#00897B] border-2 bg-[#00897B]/5' : ''}`}
                onClick={() => setSelectedMethod(method.id)}
              >
                <CardContent className="py-2 px-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedMethod === method.id ? 'border-[#00897B]' : 'border-gray-300'
                    }`}>
                      {selectedMethod === method.id && <div className="w-2 h-2 rounded-full bg-[#00897B]"></div>}
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                      <MethodIcon className="w-3.5 h-3.5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-xs">{method.label}</p>
                      <p className="text-[10px] text-gray-500">{method.desc}</p>
                    </div>
                    {method.id === 'wallet' && walletData && (
                      <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Recipients */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm">Recent Recipients</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {displayRecipients.map((recipient, idx) => (
            <button key={idx} className="flex flex-col items-center" onClick={() => setShowSendModal(true)}>
              <div 
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm mb-1 shadow-sm"
                style={{ backgroundColor: recipient.color }}
              >
                {recipient.initials}
              </div>
              <span className="text-xs text-gray-600">{recipient.name}</span>
            </button>
          ))}
          {/* Add new recipient button */}
          <button 
            className="flex flex-col items-center" 
            onClick={() => setShowSendModal(true)}
          >
            <div className="w-11 h-11 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-1">
              <Plus className="w-4 h-4 text-gray-400" />
            </div>
            <span className="text-xs text-gray-400">New</span>
          </button>
        </div>
      </div>

      {/* PayShap Info Card */}
      <Card className="border-[#00897B]/20 bg-gradient-to-r from-[#00897B]/5 to-[#43A047]/5">
        <CardContent className="py-2.5 px-3">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#00897B]/10 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-[#00897B]" />
            </div>
            <div>
              <p className="font-medium text-gray-800 text-xs">PayShap is now available!</p>
              <p className="text-[10px] text-gray-600 mt-0.5">Send up to R3,000 instantly to any SA bank account using just a phone number. Free transfers!</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      {showSendModal && <SendModal onClose={() => setShowSendModal(false)} onSuccess={refreshWallet} />}
      {showQRModal && <QRModal onClose={() => setShowQRModal(false)} onSuccess={refreshWallet} />}
      {showRequestModal && <RequestModal onClose={() => setShowRequestModal(false)} walletData={walletData} />}
      {showSplitModal && <SplitModal onClose={() => setShowSplitModal(false)} walletData={walletData} />}
    </div>
  );
}

// Request Money Modal
function RequestModal({ onClose, walletData }: { onClose: () => void; walletData: WalletData | null }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [requesterName] = useState('Thabo Molefe');
  const [loading, setLoading] = useState(false);
  const [requestLink, setRequestLink] = useState('');
  const [copied, setCopied] = useState(false);

  const generateRequest = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    // Simulate generating a payment request
    setTimeout(() => {
      const link = `https://pay.groway.co.za/req/${Date.now().toString(36)}`;
      setRequestLink(link);
      setLoading(false);
    }, 1000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(requestLink);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Request Money</DialogTitle>
          <DialogDescription>Generate a payment request link</DialogDescription>
        </DialogHeader>
        
        {!requestLink ? (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Amount (R)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-9 text-sm mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Note (optional)</Label>
              <Input
                placeholder="What's this for?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="h-9 text-sm mt-1"
              />
            </div>
            <div className="p-2.5 rounded-lg bg-gray-50">
              <p className="text-[10px] text-gray-500">
                A payment link will be generated that you can share with anyone. They can pay using PayShap, card, or EFT.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-center">
              <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-gray-900 text-sm">Request Created</p>
              <p className="text-lg font-bold text-[#00897B] mt-1">{formatCurrency(parseFloat(amount))}</p>
              {note && <p className="text-xs text-gray-500 mt-0.5">"{note}"</p>}
            </div>
            <div>
              <Label className="text-xs">Payment Link</Label>
              <div className="flex gap-1.5 mt-1">
                <Input
                  value={requestLink}
                  readOnly
                  className="h-9 text-xs"
                />
                <Button size="sm" onClick={copyLink} className="shrink-0">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <QrCode className="w-3.5 h-3.5 mr-1.5" />
                QR Code
              </Button>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          {!requestLink && (
            <Button size="sm" onClick={generateRequest} disabled={loading} className="bg-[#00897B] hover:bg-[#00695C]">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
              Generate Link
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Split Payment Modal
function SplitModal({ onClose, walletData }: { onClose: () => void; walletData: WalletData | null }) {
  const [totalAmount, setTotalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [participants, setParticipants] = useState([
    { name: '', phone: '', amount: '' }
  ]);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [loading, setLoading] = useState(false);

  const addParticipant = () => {
    setParticipants([...participants, { name: '', phone: '', amount: '' }]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index: number, field: 'name' | 'phone' | 'amount', value: string) => {
    const updated = [...participants];
    updated[index][field] = value;
    setParticipants(updated);
  };

  // Calculate split amounts for display (derived state, not stored)
  const calculatedSplits = useMemo(() => {
    if (splitType === 'equal') {
      const total = parseFloat(totalAmount) || 0;
      const split = participants.length > 0 ? total / participants.length : 0;
      return participants.map(() => split.toFixed(2));
    }
    return participants.map(p => p.amount);
  }, [splitType, totalAmount, participants]);

  const handleSplit = async () => {
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const validParticipants = participants.filter(p => p.name && p.phone);
    if (validParticipants.length === 0) {
      toast.error('Please add at least one participant');
      return;
    }

    setLoading(true);
    // Simulate split request
    setTimeout(() => {
      toast.success(`Split request sent to ${validParticipants.length} participants`);
      setLoading(false);
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Split Payment</DialogTitle>
          <DialogDescription>Split a bill with friends</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3">
          {/* Total Amount */}
          <div>
            <Label className="text-xs">Total Amount (R)</Label>
            <Input
              type="number"
              placeholder="0.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="h-9 text-sm mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs">Description</Label>
            <Input
              placeholder="e.g., Dinner at Spur"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-9 text-sm mt-1"
            />
          </div>

          {/* Split Type */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={splitType === 'equal' ? 'default' : 'outline'}
              onClick={() => setSplitType('equal')}
              className={`flex-1 text-xs ${splitType === 'equal' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}`}
            >
              Split Equally
            </Button>
            <Button
              size="sm"
              variant={splitType === 'custom' ? 'default' : 'outline'}
              onClick={() => setSplitType('custom')}
              className={`flex-1 text-xs ${splitType === 'custom' ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}`}
            >
              Custom Amounts
            </Button>
          </div>

          {/* Participants */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label className="text-xs">Participants</Label>
              <span className="text-[10px] text-gray-500">
                {splitType === 'equal' && totalAmount && `R${(parseFloat(totalAmount) / participants.length).toFixed(2)} each`}
              </span>
            </div>
            <div className="space-y-2">
              {participants.map((p, i) => (
                <div key={i} className="p-2 rounded-lg border border-gray-200 space-y-1.5">
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Name"
                      value={p.name}
                      onChange={(e) => updateParticipant(i, 'name', e.target.value)}
                      className="h-8 text-xs flex-1"
                    />
                    <Input
                      placeholder="Phone"
                      value={p.phone}
                      onChange={(e) => updateParticipant(i, 'phone', e.target.value)}
                      className="h-8 text-xs flex-1"
                    />
                  </div>
                  {splitType === 'equal' ? (
                    <div className="px-2 py-1.5 bg-gray-50 rounded text-xs text-gray-600">
                      Amount: R{calculatedSplits[i] || '0.00'}
                    </div>
                  ) : (
                    <Input
                      placeholder="Amount"
                      value={p.amount}
                      onChange={(e) => updateParticipant(i, 'amount', e.target.value)}
                      className="h-8 text-xs"
                    />
                  )}
                  {participants.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeParticipant(i)}
                      className="w-full h-7 text-xs text-red-600"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addParticipant}
              className="w-full mt-2 text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Participant
            </Button>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSplit} disabled={loading} className="bg-[#00897B] hover:bg-[#00695C]">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
            Send Requests
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== SERVICES TAB ====================
function ServicesTab() {
  const [activeService, setActiveService] = useState<string | null>(null);

  const financialServices = [
    { icon: TrendingUp, label: 'Credit Market', desc: 'Personal & Business loans', color: '#E91E63', service: 'credit' },
    { icon: Shield, label: 'Insurance', desc: 'Life, Funeral, Health', color: '#4CAF50', service: 'insurance' },
    { icon: CreditCard, label: 'BNPL', desc: 'Buy Now, Pay Later', color: '#9C27B0', service: 'bnpl' },
    { icon: ShoppingCart, label: 'Laybye', desc: 'Reserve & pay later', color: '#00BCD4', service: 'laybye' },
    { icon: PiggyBank, label: 'Savings Goals', desc: 'Goal-based savings', color: '#2196F3', service: 'savings' },
  ];

  const paymentsServices = [
    { icon: Building, label: 'Bill Payments', desc: '35+ providers', color: '#607D8B', service: 'bills' },
    { icon: Globe, label: 'Int\'l Transfer', desc: '50+ countries', color: '#3F51B5', service: 'transfers' },
    { icon: Phone, label: 'Airtime & Data', desc: 'All SA networks', color: '#E91E63', service: 'airtime' },
    { icon: Zap, label: 'Electricity', desc: 'Prepaid tokens', color: '#FF9800', service: 'electricity' },
    { icon: Droplets, label: 'Water', desc: 'Municipal water', color: '#2196F3', service: 'water' },
  ];

  const travelServices = [
    { icon: Train, label: 'Gautrain', desc: 'Train tickets', color: '#009688', service: 'gautrain' },
    { icon: Bus, label: 'Bus Tickets', desc: 'Intercape, Greyhound', color: '#795548', service: 'bus' },
    { icon: Plane, label: 'Flights', desc: 'FlySafair, more', color: '#03A9F4', service: 'flights' },
    { icon: Ticket, label: 'Events', desc: 'Concerts, shows', color: '#9C27B0', service: 'events' },
  ];

  const voucherServices = [
    { icon: Gift, label: 'Gift Cards', desc: 'Shoprite, Netflix, more', color: '#E91E63', service: 'vouchers' },
    { icon: Ticket, label: 'Vouchers', desc: '1Voucher, OTT, Blu', color: '#FF5722', service: 'vouchers' },
  ];

  return (
    <div className="px-3 py-3">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-lg font-bold text-gray-900">Services</h1>
        <p className="text-xs text-gray-500">All your financial services</p>
      </div>

      {/* Envelope Pockets - Grant+ and Pay+ */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {/* Grant+ Envelope Pocket */}
        <div 
          className="relative overflow-hidden rounded-xl cursor-pointer group"
          onClick={() => setActiveService('sassa')}
        >
          <div 
            className="p-3 text-white"
            style={{ background: 'linear-gradient(145deg, #00897B 0%, #43A047 100%)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-6 overflow-hidden opacity-30">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-8 bg-[#00695C] rounded-b-[50%]" />
            </div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <HandCoins className="w-4 h-4 text-white" />
                </div>
                <Badge className="bg-white/20 text-white text-[8px] px-1.5 py-0">NCA</Badge>
              </div>
              <p className="font-semibold text-white text-xs">Grant+</p>
              <p className="text-white/80 text-[10px]">SASSA Advance</p>
            </div>
          </div>
        </div>
        
        {/* Pay+ Envelope Pocket */}
        <div 
          className="relative overflow-hidden rounded-xl cursor-pointer group"
          onClick={() => setActiveService('payplus')}
        >
          <div 
            className="p-3 text-white"
            style={{ background: 'linear-gradient(145deg, #FF9800 0%, #F57C00 100%)' }}
          >
            <div className="absolute top-0 left-0 right-0 h-6 overflow-hidden opacity-30">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-8 bg-[#E65100] rounded-b-[50%]" />
            </div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <Badge className="bg-white/20 text-white text-[8px] px-1.5 py-0">Instant</Badge>
              </div>
              <p className="font-semibold text-white text-xs">Pay+</p>
              <p className="text-white/80 text-[10px]">Early Wage Access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Services */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-[#00897B]" />
          Financial Services
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {financialServices.map((service, idx) => (
            <Card 
              key={idx} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveService(service.service)}
            >
              <CardContent className="py-2.5 px-2.5">
                <div className="flex items-start gap-2">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${service.color}15` }}
                  >
                    <service.icon className="w-4 h-4" style={{ color: service.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-xs">{service.label}</p>
                    <p className="text-[10px] text-gray-500">{service.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payments & Transfers */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-1">
          <CreditCard className="w-4 h-4 text-[#00897B]" />
          Payments & Transfers
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {paymentsServices.map((service, idx) => (
            <Card 
              key={idx}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveService(service.service)}
            >
              <CardContent className="py-2.5 px-2.5">
                <div className="flex items-start gap-2">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${service.color}15` }}
                  >
                    <service.icon className="w-4 h-4" style={{ color: service.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-xs">{service.label}</p>
                    <p className="text-[10px] text-gray-500">{service.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Transport & Travel */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-1">
          <Train className="w-4 h-4 text-[#00897B]" />
          Transport & Travel
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {travelServices.map((service, idx) => (
            <Card 
              key={idx}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveService(service.service)}
            >
              <CardContent className="py-2.5 px-2.5">
                <div className="flex items-start gap-2">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${service.color}15` }}
                  >
                    <service.icon className="w-4 h-4" style={{ color: service.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-xs">{service.label}</p>
                    <p className="text-[10px] text-gray-500">{service.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Vouchers & Gift Cards */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-1">
          <Gift className="w-4 h-4 text-[#00897B]" />
          Vouchers & Gift Cards
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {voucherServices.map((service, idx) => (
            <Card 
              key={idx}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveService(service.service)}
            >
              <CardContent className="py-2.5 px-2.5">
                <div className="flex items-start gap-2">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${service.color}15` }}
                  >
                    <service.icon className="w-4 h-4" style={{ color: service.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-xs">{service.label}</p>
                    <p className="text-[10px] text-gray-500">{service.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Service Modals */}
      {activeService === 'bills' && <BillsModal onClose={() => setActiveService(null)} />}
      {activeService === 'airtime' && <AirtimeModal onClose={() => setActiveService(null)} />}
      {activeService === 'electricity' && <ElectricityModal onClose={() => setActiveService(null)} />}
      {activeService === 'water' && <WaterModal onClose={() => setActiveService(null)} />}
      {activeService === 'transfers' && <TransfersModal onClose={() => setActiveService(null)} />}
      {activeService === 'sassa' && <GrantPlusModal onClose={() => setActiveService(null)} />}
      {activeService === 'insurance' && <InsuranceModal onClose={() => setActiveService(null)} />}
      {activeService === 'credit' && <CreditModal onClose={() => setActiveService(null)} />}
      {activeService === 'bnpl' && <BNPLModal onClose={() => setActiveService(null)} />}
      {activeService === 'payplus' && <PayPlusModal onClose={() => setActiveService(null)} />}
      {activeService === 'laybye' && <LaybyeModal onClose={() => setActiveService(null)} />}
      {activeService === 'savings' && <SavingsModal onClose={() => setActiveService(null)} />}
      {activeService === 'gautrain' && <GautrainModal onClose={() => setActiveService(null)} />}
      {activeService === 'bus' && <BusModal onClose={() => setActiveService(null)} />}
      {activeService === 'flights' && <FlightsModal onClose={() => setActiveService(null)} />}
      {activeService === 'events' && <EventsModal onClose={() => setActiveService(null)} />}
      {activeService === 'vouchers' && <VouchersModal onClose={() => setActiveService(null)} />}
    </div>
  );
}

// ==================== OFFERS TAB ====================
function OffersTab({ loyaltyData }: { loyaltyData: LoyaltyData | null }) {
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [clippingOffer, setClippingOffer] = useState<string | null>(null);

  useEffect(() => {
    if (loyaltyData?.offers) {
      setOffers(loyaltyData.offers);
    }
  }, [loyaltyData]);

  if (!loyaltyData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#00897B]" />
      </div>
    );
  }

  const formatTimeLeft = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const handleClipOffer = async (offerId: string) => {
    setClippingOffer(offerId);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setOffers(prev => prev.map(o => o.id === offerId ? {...o, clipped: true} : o));
      toast.success('Offer clipped! Use it at checkout.');
    } catch (error) {
      toast.error('Failed to clip offer');
    } finally {
      setClippingOffer(null);
    }
  };

  const handleUseFlashSale = (sale: FlashSale) => {
    toast.success(`"${sale.title}" activated! Discount applied at ${sale.merchant}`);
  };

  return (
    <div className="px-3 py-3">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-lg font-bold text-gray-900">Offers</h1>
        <p className="text-xs text-gray-500">Personalised just for you</p>
      </div>

      {/* Loyalty Status */}
      <Card className="mb-3">
        <CardContent className="py-2.5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">{loyaltyData.loyalty.tierName} Member</p>
              <p className="text-xs text-gray-600">{loyaltyData.loyalty.points.toLocaleString()} points • {loyaltyData.loyalty.pointsToNextTier} to {loyaltyData.loyalty.nextTier}</p>
            </div>
          </div>
          <div className="bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-gradient-to-r from-gray-400 to-gray-500 h-1.5 rounded-full" 
              style={{ width: `${((loyaltyData.loyalty.points % 3000) / 3000) * 100}%` }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Flash Sales */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-1">
          <Zap className="w-4 h-4 text-amber-500" />
          Flash Sales
        </h3>
        <div className="space-y-1.5">
          {loyaltyData.flashSales.map((sale, idx) => (
            <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleUseFlashSale(sale)}>
              <CardContent className="py-2 px-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-base">
                    🛒
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-xs">{sale.title}</p>
                    <p className="text-sm font-bold text-[#00897B]">{sale.discount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500">Ends in</p>
                    <p className="text-xs font-medium text-amber-600">{formatTimeLeft(sale.timeLeft)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Personalized Offers */}
      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 text-sm mb-2">For You</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {offers.slice(0, 4).map((offer, idx) => (
            <Card 
              key={idx} 
              className={`min-w-[110px] cursor-pointer transition-all ${offer.clipped ? 'bg-[#00897B]/5 border-[#00897B]/30' : 'hover:shadow-md'}`}
              onClick={() => !offer.clipped && handleClipOffer(offer.id)}
            >
              <CardContent className="py-2.5 flex flex-col items-center text-center">
                <div 
                  className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 ${offer.clipped ? 'bg-[#00897B]' : ''}`}
                  style={{ backgroundColor: offer.clipped ? undefined : `${colors.green}20` }}
                >
                  {offer.clipped ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Percent className="w-3.5 h-3.5" style={{ color: colors.green }} />
                  )}
                </div>
                <p className="font-medium text-gray-900 text-xs">{offer.title}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{offer.clipped ? 'Clipped!' : 'Tap to clip'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Clipped Offers */}
      <div>
        <h3 className="font-semibold text-gray-900 text-sm mb-2">Clipped Offers ({offers.filter(o => o.clipped).length})</h3>
        <div className="space-y-1.5">
          {offers.filter(o => o.clipped).map((offer, idx) => (
            <Card key={idx} className="bg-[#00897B]/5 border-[#00897B]/20">
              <CardContent className="py-2 px-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#00897B] flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-xs">{offer.merchant}</p>
                    <p className="text-[10px] text-gray-500">{offer.description}</p>
                  </div>
                  <Badge className="bg-[#00897B] text-white text-[10px]">{offer.discount}% off</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {offers.filter(o => o.clipped).length === 0 && (
            <Card>
              <CardContent className="py-6 text-center">
                <Ticket className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No clipped offers yet</p>
                <p className="text-[10px] text-gray-400 mt-1">Tap offers above to clip them</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== PROFILE TAB ====================
function ProfileTab() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const menuItems = [
    { 
      section: 'Account',
      items: [
        { icon: User, label: 'Personal Details', desc: 'Name, email, phone', action: 'personal' },
        { icon: FileText, label: 'KYC/FICA Documents', desc: 'ID, proof of address', action: 'kyc' },
        { icon: Building, label: 'Linked Accounts', desc: 'Banks, cards', action: 'accounts' },
      ]
    },
    { 
      section: 'Security',
      items: [
        { icon: Lock, label: 'Change PIN', desc: 'Update your PIN', action: 'pin' },
        { icon: Smartphone, label: 'Biometric Settings', desc: 'Face ID, fingerprint', action: 'biometric' },
        { icon: Shield, label: 'Login Activity', desc: 'Recent logins', action: 'logins' },
      ]
    },
    { 
      section: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help Centre', desc: 'FAQs and guides', action: 'help' },
        { icon: MessageCircle, label: 'Chat Support', desc: 'Talk to an agent', action: 'chat' },
        { icon: Bell, label: 'Notifications', desc: 'Alerts and updates', action: 'notifications' },
      ]
    },
  ];

  return (
    <div className="px-3 py-3">
      {/* User Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#00897B] to-[#43A047] flex items-center justify-center text-white font-bold text-lg">
          TM
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">Thabo Molefe</p>
          <p className="text-xs text-gray-500">+27 82 123 4567</p>
          <p className="text-xs text-gray-500">thabo.molefe@example.com</p>
        </div>
      </div>

      {/* Menu Sections */}
      {menuItems.map((section, idx) => (
        <div key={idx} className="mb-3">
          <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{section.section}</h3>
          <Card>
            <CardContent className="py-0">
              {section.items.map((item, itemIdx) => (
                <button 
                  key={itemIdx} 
                  onClick={() => setActiveModal(item.action)}
                  className={`flex items-center gap-2 w-full py-2.5 ${itemIdx < section.items.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
                    <item.icon className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 text-xs">{item.label}</p>
                    <p className="text-[10px] text-gray-500">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Logout Button */}
      <Button variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50 text-xs">
        <LogOut className="w-3.5 h-3.5 mr-2" />
        Sign Out
      </Button>

      {/* App Version */}
      <p className="text-center text-[10px] text-gray-400 mt-3">Version 2.1.0</p>

      {/* Modals */}
      {activeModal === 'personal' && <PersonalDetailsModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'kyc' && <KYCModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'accounts' && <LinkedAccountsModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'pin' && <ChangePINModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'biometric' && <BiometricModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'logins' && <LoginActivityModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'help' && <HelpCentreModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'chat' && <ChatSupportModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'notifications' && <NotificationsModal onClose={() => setActiveModal(null)} />}
    </div>
  );
}

// ==================== MODALS ====================

// Send Money Modal Types
type SendMethod = 'payshap' | 'momo' | 'wallet';
type SendStep = 'method' | 'details' | 'confirm' | 'success';

// Comprehensive Send Money Modal with PayShap and MTN MoMo
function SendModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<SendStep>('method');
  const [method, setMethod] = useState<SendMethod>('payshap');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientBank, setRecipientBank] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState<any[]>([]);
  const [recentRecipients, setRecentRecipients] = useState<any[]>([]);
  const [estimate, setEstimate] = useState<any>(null);
  const [transactionResult, setTransactionResult] = useState<any>(null);

  // Fetch banks and recent recipients on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [banksRes, recipientsRes] = await Promise.all([
          fetch('/api/send-money?action=banks'),
          fetch('/api/send-money?action=recipients'),
        ]);
        
        const banksData = await banksRes.json();
        const recipientsData = await recipientsRes.json();
        
        if (banksData.success) setBanks(banksData.data);
        if (recipientsData.success) setRecentRecipients(recipientsData.data);
      } catch (error) {
        console.error('Failed to fetch send money data:', error);
      }
    };
    
    fetchData();
  }, []);

  // Calculate estimate when amount or method changes
  useEffect(() => {
    const calculateEstimate = async () => {
      if (!amount || parseFloat(amount) <= 0) {
        setEstimate(null);
        return;
      }
      
      try {
        const res = await fetch(`/api/send-money?action=estimate&method=${method}&amount=${amount}`);
        const data = await res.json();
        if (data.success) setEstimate(data.data);
      } catch (error) {
        console.error('Failed to calculate estimate:', error);
      }
    };
    
    calculateEstimate();
  }, [amount, method]);

  // Get method config
  const getMethodConfig = () => {
    switch (method) {
      case 'payshap':
        return {
          name: 'PayShap',
          description: 'Instant bank transfer',
          icon: Zap,
          color: '#00897B',
          maxAmount: 3000,
          fee: 0,
        };
      case 'momo':
        return {
          name: 'MTN MoMo',
          description: 'Mobile Money transfer',
          icon: Smartphone,
          color: '#FFCC00',
          maxAmount: 5000,
          fee: estimate?.fee || 0,
        };
      case 'wallet':
        return {
          name: 'Wallet Transfer',
          description: 'Instant wallet-to-wallet',
          icon: Wallet,
          color: '#9C27B0',
          maxAmount: 50000,
          fee: 0,
        };
    }
  };

  const handleContinue = () => {
    if (step === 'method') {
      if (!method) {
        toast.error('Please select a transfer method');
        return;
      }
      setStep('details');
    } else if (step === 'details') {
      if (!recipientName || !amount) {
        toast.error('Please fill in recipient name and amount');
        return;
      }
      if ((method === 'payshap' || method === 'momo' || method === 'wallet') && !recipientPhone) {
        toast.error('Phone number is required');
        return;
      }
      if (parseFloat(amount) <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }
      if (estimate && !estimate.withinLimits) {
        toast.error(`Amount must be between R${estimate.limits.min} and R${estimate.limits.max}`);
        return;
      }
      setStep('confirm');
    }
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/send-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          amount: parseFloat(amount),
          recipientName,
          recipientPhone,
          recipientBank,
          note,
          pin,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setTransactionResult(data.data);
        setStep('success');
        onSuccess();
      } else {
        toast.error(data.error || 'Failed to send money');
      }
    } catch (error) {
      toast.error('Failed to send money');
    } finally {
      setLoading(false);
    }
  };

  const selectRecipient = (recipient: any) => {
    setRecipientName(recipient.name);
    if (recipient.phone) setRecipientPhone(recipient.phone);
    if (recipient.bank) setRecipientBank(recipient.bank);
  };

  const config = getMethodConfig();
  const ConfigIcon = config.icon;

  // Render method selection step
  const renderMethodStep = () => (
    <div className="space-y-3">
      <DialogDescription className="text-xs">Choose how you want to send money</DialogDescription>
      
      {/* Transfer Methods */}
      <div className="space-y-2">
        {[
          { id: 'payshap' as SendMethod, name: 'PayShap', desc: 'Instant bank transfer • Free', icon: Zap, color: '#00897B' },
          { id: 'momo' as SendMethod, name: 'MTN MoMo', desc: 'Mobile Money transfer • Low fees', icon: Smartphone, color: '#FFCC00' },
          { id: 'wallet' as SendMethod, name: 'Wallet Transfer', desc: 'Instant wallet-to-wallet • Free', icon: Wallet, color: '#9C27B0' },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={`w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
              method === m.id ? 'border-[#00897B] bg-[#00897B]/5' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${m.color}20` }}
            >
              <m.icon className="w-5 h-5" style={{ color: m.color }} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-gray-900 text-sm">{m.name}</p>
              <p className="text-[10px] text-gray-500">{m.desc}</p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
              method === m.id ? 'border-[#00897B]' : 'border-gray-300'
            }`}>
              {method === m.id && <div className="w-2 h-2 rounded-full bg-[#00897B]" />}
            </div>
          </button>
        ))}
      </div>

      {/* Quick info */}
      <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
        <p className="text-[10px] text-gray-600">
          <span className="font-medium">PayShap</span> allows instant transfers to any SA bank account using just a phone number. 
          <span className="font-medium"> MTN MoMo</span> sends money directly to MTN Mobile Money wallets.
        </p>
      </div>
    </div>
  );

  // Render details step
  const renderDetailsStep = () => (
    <div className="space-y-3">
      <button onClick={() => setStep('method')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-3 h-3" /> Back
      </button>
      
      {/* Selected method badge */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${config.color}20` }}
        >
          <ConfigIcon className="w-4 h-4" style={{ color: config.color }} />
        </div>
        <div>
          <p className="font-medium text-gray-900 text-xs">{config.name}</p>
          <p className="text-[10px] text-gray-500">{config.description}</p>
        </div>
      </div>

      {/* Recent Recipients */}
      {recentRecipients.length > 0 && (
        <div>
          <Label className="text-[10px] text-gray-500">Recent Recipients</Label>
          <div className="flex gap-2 overflow-x-auto py-1.5 -mx-1 px-1">
            {recentRecipients.slice(0, 4).map((r, i) => (
              <button
                key={i}
                onClick={() => selectRecipient(r)}
                className="flex flex-col items-center min-w-[50px] p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#00897B] flex items-center justify-center text-white text-xs font-medium">
                  {r.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </div>
                <span className="text-[9px] text-gray-600 mt-0.5 truncate w-full text-center">{r.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recipient Name */}
      <div>
        <Label htmlFor="recipientName" className="text-xs">Recipient Name</Label>
        <Input
          id="recipientName"
          placeholder="Enter recipient's name"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          className="h-9 text-sm mt-1"
        />
      </div>

      {/* Phone Number */}
      <div>
        <Label htmlFor="phone" className="text-xs">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+27 XX XXX XXXX"
          value={recipientPhone}
          onChange={(e) => setRecipientPhone(e.target.value)}
          className="h-9 text-sm mt-1"
        />
      </div>

      {/* Bank Selection for PayShap */}
      {method === 'payshap' && banks.length > 0 && (
        <div>
          <Label className="text-xs">Recipient's Bank (Optional)</Label>
          <Select value={recipientBank} onValueChange={setRecipientBank}>
            <SelectTrigger className="h-9 text-sm mt-1">
              <SelectValue placeholder="Select bank" />
            </SelectTrigger>
            <SelectContent>
              {banks.map((bank) => (
                <SelectItem key={bank.id} value={bank.id}>
                  {bank.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Amount */}
      <div>
        <Label htmlFor="amount" className="text-xs">Amount (R)</Label>
        <Input
          id="amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-9 text-sm mt-1"
        />
        {estimate && (
          <p className={`text-[10px] mt-1 ${estimate.withinLimits ? 'text-green-600' : 'text-red-600'}`}>
            Limit: R{estimate.limits.min} - R{estimate.limits.max} per transaction
          </p>
        )}
      </div>

      {/* Note */}
      <div>
        <Label htmlFor="note" className="text-xs">Note (optional)</Label>
        <Input
          id="note"
          placeholder="What's this for?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="h-9 text-sm mt-1"
        />
      </div>
    </div>
  );

  // Render confirm step
  const renderConfirmStep = () => (
    <div className="space-y-3">
      <button onClick={() => setStep('details')} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-3 h-3" /> Back
      </button>
      
      {/* Transaction Summary */}
      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Method</span>
          <div className="flex items-center gap-1.5">
            <ConfigIcon className="w-3.5 h-3.5" style={{ color: config.color }} />
            <span className="text-xs font-medium">{config.name}</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">To</span>
          <span className="text-xs font-medium">{recipientName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500">Phone</span>
          <span className="text-xs font-medium">{recipientPhone}</span>
        </div>
        {recipientBank && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Bank</span>
            <span className="text-xs font-medium">{banks.find(b => b.id === recipientBank)?.name}</span>
          </div>
        )}
        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Amount</span>
            <span className="text-sm font-semibold">{formatCurrency(parseFloat(amount))}</span>
          </div>
          {config.fee > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Fee</span>
              <span className="text-xs text-gray-600">{formatCurrency(config.fee)}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-medium text-gray-700">Total</span>
            <span className="text-sm font-bold text-[#00897B]">{formatCurrency(parseFloat(amount) + config.fee)}</span>
          </div>
        </div>
      </div>

      {/* PIN Entry */}
      <div>
        <Label htmlFor="pin" className="text-xs">Enter PIN to confirm</Label>
        <Input
          id="pin"
          type="password"
          placeholder="••••"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="h-9 text-sm mt-1 text-center tracking-widest"
          maxLength={4}
        />
      </div>

      {/* Security Note */}
      <div className="flex items-start gap-2 p-2 rounded-lg bg-amber-50 border border-amber-100">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-[10px] text-amber-700">
          {method === 'payshap' 
            ? 'PayShap transfers are instant and cannot be reversed. Please verify the recipient details.'
            : method === 'momo'
            ? 'MTN MoMo transfers are instant. Ensure the phone number is registered with MTN Mobile Money.'
            : 'Wallet transfers are instant and cannot be reversed.'}
        </p>
      </div>
    </div>
  );

  // Render success step
  const renderSuccessStep = () => (
    <div className="text-center py-4 space-y-4">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Money Sent!</h3>
        <p className="text-xs text-gray-500 mt-1">
          {formatCurrency(parseFloat(amount))} sent to {recipientName}
        </p>
      </div>
      
      {transactionResult && (
        <div className="p-3 rounded-lg bg-gray-50 text-left space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Reference</span>
            <span className="font-mono text-gray-700">{transactionResult.transaction.reference}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Method</span>
            <span className="text-gray-700">{config.name}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">New Balance</span>
            <span className="font-medium text-[#00897B]">{formatCurrency(transactionResult.newBalance)}</span>
          </div>
        </div>
      )}

      <Button onClick={onClose} className="w-full bg-[#00897B] hover:bg-[#00695C]">
        Done
      </Button>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {step === 'success' ? 'Transfer Complete' : 'Send Money'}
          </DialogTitle>
          {step !== 'success' && (
            <DialogDescription>
              {step === 'method' && 'Choose your transfer method'}
              {step === 'details' && 'Enter recipient details'}
              {step === 'confirm' && 'Review and confirm'}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {step === 'method' && renderMethodStep()}
        {step === 'details' && renderDetailsStep()}
        {step === 'confirm' && renderConfirmStep()}
        {step === 'success' && renderSuccessStep()}
        
        {step !== 'success' && (
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            {step !== 'confirm' ? (
              <Button size="sm" onClick={handleContinue} className="bg-[#00897B] hover:bg-[#00695C]">
                Continue
              </Button>
            ) : (
              <Button size="sm" onClick={handleSend} disabled={loading || pin.length !== 4} className="bg-[#00897B] hover:bg-[#00695C]">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                Send {formatCurrency(parseFloat(amount) + config.fee)}
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Top Up Modal
function TopupModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  const quickAmounts = ['50', '100', '200', '500'];

  const handleTopup = async () => {
    if (!amount) {
      toast.error('Please enter an amount');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'topup',
          amount: parseFloat(amount),
          paymentMethod: method,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to top up');
      }
    } catch (error) {
      toast.error('Failed to top up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Top Up Wallet</DialogTitle>
          <DialogDescription>Add money to your wallet</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Quick Amounts</Label>
            <div className="grid grid-cols-4 gap-1.5 mt-1.5">
              {quickAmounts.map((amt) => (
                <Button
                  key={amt}
                  variant={amount === amt ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAmount(amt)}
                  className={`h-8 text-xs ${amount === amt ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}`}
                >
                  R{amt}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="amount" className="text-xs">Custom Amount (R)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Payment Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="mt-1.5 h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="eft">EFT</SelectItem>
                <SelectItem value="cash">Cash at Agent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleTopup} disabled={loading} className="bg-[#00897B] hover:bg-[#00695C]">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
            Top Up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// QR Modal
// QR View Types
type QRViewType = 'main' | 'scan' | 'generate' | 'payment' | 'success' | 'nfc';

// QR Modal - Comprehensive QR Pay Module
function QRModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  const [view, setView] = useState<QRViewType>('main');
  const [loading, setLoading] = useState(false);
  const [qrData, setQRData] = useState<any>(null);
  const [scannedData, setScannedData] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [pin, setPin] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [transactionResult, setTransactionResult] = useState<any>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [nfcSimulating, setNfcSimulating] = useState(false);
  const [dynamicAmount, setDynamicAmount] = useState('');

  // Fetch static QR on mount
  useEffect(() => {
    fetchStaticQR();
  }, []);

  const fetchStaticQR = async () => {
    try {
      const res = await fetch('/api/qr?action=static');
      const data = await res.json();
      if (data.success) {
        setQRData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch QR:', error);
    }
  };

  // Generate dynamic QR with amount
  const generateDynamicQR = async () => {
    if (!dynamicAmount || parseFloat(dynamicAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/qr?action=dynamic&amount=${dynamicAmount}&tip=${tipAmount || 0}`);
      const data = await res.json();
      if (data.success) {
        setQRData(data.data);
        setView('generate');
      } else {
        toast.error(data.error || 'Failed to generate QR');
      }
    } catch (error) {
      toast.error('Failed to generate QR');
    } finally {
      setLoading(false);
    }
  };

  // Simulate camera scanning
  const startCamera = async () => {
    setCameraActive(true);
    setView('scan');
  };

  // Simulate QR scan result
  const simulateScan = async () => {
    setLoading(true);
    try {
      // Simulate scanning delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate scanned QR data (merchant QR)
      const mockQRData = generateMockMerchantQR();
      
      // Validate with API
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'validate', qrData: mockQRData.qrData }),
      });
      
      const data = await res.json();
      if (data.success) {
        setScannedData(data.data);
        if (!data.data.amount) {
          // Static QR - need amount input
          setView('payment');
        } else {
          // Dynamic QR - amount already set
          setAmount((data.data.amount).toString());
          setView('payment');
        }
      } else {
        toast.error(data.error || 'Invalid QR code');
        setView('main');
      }
    } catch (error) {
      toast.error('Failed to scan QR code');
      setView('main');
    } finally {
      setLoading(false);
      setCameraActive(false);
    }
  };

  // Generate mock merchant QR for simulation
  const generateMockMerchantQR = () => {
    const merchants = [
      { name: 'Nando\'s Rosebank', amount: 185.50 },
      { name: 'Shoprite Sandton', amount: null },
      { name: 'Uber Eats', amount: 95.00 },
      { name: 'Spur Sunnyside', amount: null },
    ];
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    return {
      qrData: `00020101021226580014ZA.GROWAY0102${merchant.name.replace(/\s/g, '').substring(0, 10)}5303710${merchant.amount ? `54${merchant.amount.toFixed(2).length.toString().padStart(2, '0')}${merchant.amount.toFixed(2)}` : ''}5802ZA59${merchant.name.length.toString().padStart(2, '0')}${merchant.name}6010Johannesburg6304ABCD`,
      merchantName: merchant.name,
      amount: merchant.amount,
    };
  };

  // Process payment
  const processPayment = async () => {
    if (!scannedData) return;
    
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!pin && !biometricEnabled) {
      toast.error('Please enter PIN or enable biometric');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay',
          qrId: scannedData.qrId,
          amount: paymentAmount,
          tipAmount: tipAmount ? parseFloat(tipAmount) : 0,
          paymentMethod,
          pin,
          biometric: biometricEnabled,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTransactionResult(data.data);
        setView('success');
        onSuccess?.();
      } else {
        toast.error(data.error || 'Payment failed');
      }
    } catch (error) {
      toast.error('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  // Simulate NFC tap
  const simulateNFC = async () => {
    setNfcSimulating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate NFC scan result
      const mockNFCToken = `NFC${Date.now()}`;
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'nfc-tap', nfcToken: mockNFCToken }),
      });

      const data = await res.json();
      if (data.success) {
        setScannedData(data.data);
        if (data.data.amount) {
          setAmount(data.data.amount.toString());
        }
        setView('payment');
      } else {
        toast.error(data.error || 'NFC tap failed');
      }
    } catch (error) {
      toast.error('NFC tap failed');
    } finally {
      setNfcSimulating(false);
    }
  };

  // Render QR code visual representation
  const renderQRCode = (data: string) => {
    // Simple visual QR representation (actual QR generation would use a library)
    return (
      <div className="relative w-48 h-48 bg-white p-3 rounded-xl shadow-inner">
        <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden">
          {/* QR Pattern Simulation */}
          <div className="absolute inset-2 grid grid-cols-8 gap-0.5">
            {Array.from({ length: 64 }).map((_, i) => (
              <div
                key={i}
                className={`aspect-square rounded-sm ${
                  Math.random() > 0.5 ? 'bg-gray-800' : 'bg-white'
                }`}
              />
            ))}
          </div>
          {/* Corner markers */}
          <div className="absolute top-1 left-1 w-8 h-8 border-4 border-gray-800 rounded-sm bg-white" />
          <div className="absolute top-1 right-1 w-8 h-8 border-4 border-gray-800 rounded-sm bg-white" />
          <div className="absolute bottom-1 left-1 w-8 h-8 border-4 border-gray-800 rounded-sm bg-white" />
          {/* Center logo */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00897B] to-[#43A047] flex items-center justify-center">
              <span className="text-white font-bold text-xs">G</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render main view
  const renderMainView = () => (
    <div className="space-y-4">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={startCamera}
          className="p-4 rounded-xl bg-gradient-to-br from-[#00897B] to-[#43A047] text-white flex flex-col items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <QrCode className="w-8 h-8" />
          <span className="font-medium text-sm">Scan to Pay</span>
        </button>
        <button
          onClick={() => setView('generate')}
          className="p-4 rounded-xl border-2 border-[#00897B] text-[#00897B] flex flex-col items-center gap-2 hover:bg-[#00897B]/5 transition-colors"
        >
          <Download className="w-8 h-8" />
          <span className="font-medium text-sm">Show QR</span>
        </button>
      </div>

      {/* NFC Tap */}
      <button
        onClick={simulateNFC}
        disabled={nfcSimulating}
        className="w-full p-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center gap-3 hover:opacity-90 transition-opacity"
      >
        {nfcSimulating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">Tapping...</span>
          </>
        ) : (
          <>
            <Smartphone className="w-5 h-5" />
            <span className="font-medium">Tap to Pay (NFC)</span>
          </>
        )}
      </button>

      {/* My QR Code Preview */}
      {qrData && (
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">My Static QR</span>
            <Badge variant="outline" className="text-[10px]">Active</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border">
              <QrCode className="w-10 h-10 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{qrData.merchantName}</p>
              <p className="text-xs text-gray-500">Permanent receive code</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('generate')}
              className="text-[#00897B]"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Recent Activity</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Received</p>
              <p className="text-xs text-gray-500">Nando's Rosebank</p>
            </div>
            <span className="text-sm font-semibold text-green-600">+R 185.50</span>
          </div>
          <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Paid</p>
              <p className="text-xs text-gray-500">Shoprite Sandton</p>
            </div>
            <span className="text-sm font-semibold text-gray-900">-R 325.00</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render scan view
  const renderScanView = () => (
    <div className="space-y-4">
      <div className="relative w-full aspect-square bg-black rounded-xl overflow-hidden">
        {/* Camera simulation */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
          {cameraActive ? (
            <div className="relative">
              {/* Scanner frame */}
              <div className="w-56 h-56 border-2 border-white/50 rounded-xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#00897B] rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#00897B] rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#00897B] rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#00897B] rounded-br-xl"></div>
                
                {/* Scanning line animation */}
                <div className="absolute left-0 right-0 h-0.5 bg-[#00897B] animate-pulse top-1/2"></div>
              </div>
              
              {/* Instructions */}
              <p className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/80 text-xs whitespace-nowrap">
                Align QR code within frame
              </p>
            </div>
          ) : (
            <div className="text-center">
              <Camera className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Camera unavailable</p>
            </div>
          )}
        </div>
      </div>

      {/* Simulate scan button (for demo) */}
      <Button
        onClick={simulateScan}
        disabled={loading}
        className="w-full bg-[#00897B] hover:bg-[#00695C]"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Scanning...
          </>
        ) : (
          <>
            <QrCode className="w-4 h-4 mr-2" />
            Simulate Scan (Demo)
          </>
        )}
      </Button>

      <Button variant="outline" onClick={() => setView('main')} className="w-full">
        Cancel
      </Button>
    </div>
  );

  // Render generate view
  const renderGenerateView = () => (
    <div className="space-y-4">
      {/* QR Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={qrData?.staticCode ? 'default' : 'outline'}
          size="sm"
          onClick={fetchStaticQR}
          className={`flex-1 ${qrData?.staticCode ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}`}
        >
          Static QR
        </Button>
        <Button
          variant={!qrData?.staticCode ? 'default' : 'outline'}
          size="sm"
          onClick={() => setQRData({ ...qrData, staticCode: false })}
          className={`flex-1 ${!qrData?.staticCode ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}`}
        >
          Dynamic QR
        </Button>
      </div>

      {/* Dynamic Amount Input */}
      {!qrData?.staticCode && (
        <div className="space-y-2">
          <Label className="text-xs">Request Amount</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R</span>
              <Input
                type="number"
                placeholder="0.00"
                value={dynamicAmount}
                onChange={(e) => setDynamicAmount(e.target.value)}
                className="pl-8 h-11"
              />
            </div>
            <Input
              type="number"
              placeholder="Tip"
              value={tipAmount}
              onChange={(e) => setTipAmount(e.target.value)}
              className="w-24 h-11"
            />
          </div>
          <Button
            onClick={generateDynamicQR}
            disabled={loading}
            size="sm"
            className="w-full bg-[#00897B] hover:bg-[#00695C]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate QR'}
          </Button>
        </div>
      )}

      {/* QR Code Display */}
      <div className="flex flex-col items-center py-4">
        {qrData && renderQRCode(qrData.qrData)}
        
        <div className="mt-4 text-center">
          <p className="font-semibold text-gray-900">{qrData?.merchantName}</p>
          {qrData?.amountCents && (
            <p className="text-2xl font-bold text-[#00897B]">
              {formatCurrency(qrData.amountCents / 100)}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {qrData?.staticCode ? 'Permanent receive code' : `Expires in 15 minutes`}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Copy className="w-4 h-4 mr-2" />
          Copy
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
      </div>

      {/* NFC Enabled Badge */}
      {qrData?.nfcEnabled && (
        <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-purple-50 border border-purple-200">
          <Smartphone className="w-4 h-4 text-purple-600" />
          <span className="text-xs font-medium text-purple-700">NFC Tap to Pay enabled</span>
        </div>
      )}

      <Button variant="ghost" onClick={() => setView('main')} className="w-full">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
    </div>
  );

  // Render payment confirmation view
  const renderPaymentView = () => (
    <div className="space-y-4">
      {/* Merchant Info */}
      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00897B] to-[#43A047] flex items-center justify-center text-white font-bold">
            {scannedData?.merchantName?.charAt(0) || 'M'}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{scannedData?.merchantName || 'Merchant'}</p>
            <p className="text-xs text-gray-500">Verified Business</p>
          </div>
          <BadgeCheck className="w-5 h-5 text-[#00897B] ml-auto" />
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <Label className="text-xs">Amount</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl font-medium">R</span>
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={!!scannedData?.amount}
            className="pl-10 h-14 text-2xl font-bold text-center"
          />
        </div>
      </div>

      {/* Tip */}
      <div className="space-y-2">
        <Label className="text-xs">Add Tip (Optional)</Label>
        <div className="flex gap-2">
          {['0', '5', '10', '15'].map((tip) => (
            <Button
              key={tip}
              variant={tipAmount === tip ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTipAmount(tip)}
              className={`flex-1 ${tipAmount === tip ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}`}
            >
              {tip === '0' ? 'No Tip' : `${tip}%`}
            </Button>
          ))}
        </div>
        {tipAmount && tipAmount !== '0' && amount && (
          <p className="text-xs text-gray-500 text-center">
            Tip amount: R {(parseFloat(amount) * parseFloat(tipAmount) / 100).toFixed(2)}
          </p>
        )}
      </div>

      {/* Payment Method */}
      <div className="space-y-2">
        <Label className="text-xs">Payment Method</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'wallet', label: 'Wallet', icon: Wallet },
            { id: 'card', label: 'Card', icon: CreditCard },
            { id: 'payshap', label: 'PayShap', icon: Zap },
          ].map((method) => (
            <button
              key={method.id}
              onClick={() => setPaymentMethod(method.id)}
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                paymentMethod === method.id
                  ? 'border-[#00897B] bg-[#00897B]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <method.icon className={`w-5 h-5 ${paymentMethod === method.id ? 'text-[#00897B]' : 'text-gray-500'}`} />
              <span className={`text-xs font-medium ${paymentMethod === method.id ? 'text-[#00897B]' : 'text-gray-600'}`}>
                {method.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Authentication */}
      <div className="space-y-3">
        <Label className="text-xs">Authenticate Payment</Label>
        
        {/* Biometric Toggle */}
        <button
          onClick={() => setBiometricEnabled(!biometricEnabled)}
          className={`w-full p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
            biometricEnabled
              ? 'border-[#00897B] bg-[#00897B]/5'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            biometricEnabled ? 'bg-[#00897B] text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            <Smartphone className="w-5 h-5" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-gray-900 text-sm">Biometric</p>
            <p className="text-xs text-gray-500">Face ID / Fingerprint</p>
          </div>
          {biometricEnabled && <Check className="w-5 h-5 text-[#00897B]" />}
        </button>

        {/* PIN Input */}
        {!biometricEnabled && (
          <div className="relative">
            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={4}
              className="h-12 text-center text-2xl tracking-widest"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              Demo: 1234
            </span>
          </div>
        )}
      </div>

      {/* Total */}
      {amount && (
        <div className="p-3 rounded-xl bg-gradient-to-r from-[#00897B] to-[#43A047] text-white">
          <div className="flex justify-between items-center">
            <span className="text-white/80">Total Amount</span>
            <span className="text-xl font-bold">
              {formatCurrency(
                parseFloat(amount) + (tipAmount && tipAmount !== '0' 
                  ? parseFloat(amount) * parseFloat(tipAmount) / 100 
                  : 0)
              )}
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setView('main')} className="flex-1">
          Cancel
        </Button>
        <Button
          onClick={processPayment}
          disabled={loading || !amount || (!pin && !biometricEnabled)}
          className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Pay Now
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // Render success view
  const renderSuccessView = () => (
    <div className="flex flex-col items-center py-6 space-y-4">
      {/* Success Animation */}
      <div className="relative">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#00897B] to-[#43A047] flex items-center justify-center animate-pulse">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <div className="absolute inset-0 rounded-full border-4 border-[#00897B] animate-ping opacity-25"></div>
      </div>

      {/* Success Message */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900">Payment Successful!</h3>
        <p className="text-gray-500 text-sm mt-1">Your payment has been processed</p>
      </div>

      {/* Transaction Details */}
      {transactionResult && (
        <div className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Amount</span>
            <span className="font-bold text-gray-900">{formatCurrency(transactionResult.amount)}</span>
          </div>
          {transactionResult.tipAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-500 text-sm">Tip</span>
              <span className="font-medium text-gray-900">{formatCurrency(transactionResult.tipAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Merchant</span>
            <span className="font-medium text-gray-900">{transactionResult.merchantName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">Reference</span>
            <span className="font-mono text-xs text-gray-700">{transactionResult.reference}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 text-sm">New Balance</span>
            <span className="font-bold text-[#00897B]">{formatCurrency(transactionResult.newBalance)}</span>
          </div>
        </div>
      )}

      {/* Points Earned */}
      <div className="w-full p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3">
        <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
        <div>
          <p className="font-medium text-gray-900 text-sm">+{Math.round((transactionResult?.amount || 0) * 15)} Points Earned</p>
          <p className="text-xs text-gray-500">Keep using QR Pay to earn more!</p>
        </div>
      </div>

      {/* Actions */}
      <div className="w-full space-y-2">
        <Button variant="outline" className="w-full">
          <Receipt className="w-4 h-4 mr-2" />
          View Receipt
        </Button>
        <Button onClick={onClose} className="w-full bg-[#00897B] hover:bg-[#00695C]">
          Done
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {view !== 'main' && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setView('main')}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <DialogTitle>
              {view === 'main' && 'QR Pay'}
              {view === 'scan' && 'Scan QR Code'}
              {view === 'generate' && 'My QR Code'}
              {view === 'payment' && 'Confirm Payment'}
              {view === 'success' && 'Payment Complete'}
              {view === 'nfc' && 'NFC Tap to Pay'}
            </DialogTitle>
          </div>
          <DialogDescription>
            {view === 'main' && 'Scan, generate, or tap to pay'}
            {view === 'scan' && 'Point your camera at a QR code'}
            {view === 'generate' && 'Show this QR to receive payments'}
            {view === 'payment' && 'Review and confirm your payment'}
            {view === 'success' && 'Your transaction was successful'}
          </DialogDescription>
        </DialogHeader>

        {view === 'main' && renderMainView()}
        {view === 'scan' && renderScanView()}
        {view === 'generate' && renderGenerateView()}
        {view === 'payment' && renderPaymentView()}
        {view === 'success' && renderSuccessView()}
      </DialogContent>
    </Dialog>
  );
}

// Airtime Modal - Comprehensive Transaction Flow
function AirtimeModal({ onClose }: { onClose: () => void }) {
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'amount' | 'confirm' | 'success'>('select');
  const [transactionResult, setTransactionResult] = useState<any>(null);

  const networks = [
    { id: 'vodacom', name: 'Vodacom', color: '#E60000', logo: '🔴' },
    { id: 'mtn', name: 'MTN', color: '#FFCC00', logo: '🟡' },
    { id: 'cellc', name: 'Cell C', color: '#00A0E3', logo: '🔵' },
    { id: 'telkom', name: 'Telkom', color: '#0066B3', logo: '🔷' },
    { id: 'rain', name: 'Rain', color: '#00B2A9', logo: '🌧️' },
  ];

  const quickAmounts = [10, 20, 50, 100, 200, 500];
  
  const selectedNetworkInfo = networks.find(n => n.id === selectedNetwork);

  const handlePurchase = async () => {
    if (!selectedNetwork || !amount || !phone) {
      toast.error('Please fill in all fields');
      return;
    }
    
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setLoading(true);
    try {
      // Create product ID based on network and amount
      const productId = `${selectedNetwork}_${Math.round(parsedAmount)}`;
      
      const res = await fetch('/api/wallet/airtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase',
          userId: 'demo-consumer-user-001',
          phone,
          productId,
          providerId: selectedNetwork,
          amountCents: Math.round(parsedAmount * 100),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTransactionResult(data.data);
        setStep('success');
        toast.success('Airtime purchased successfully!');
      } else {
        toast.error(data.error || 'Failed to purchase airtime');
      }
    } catch (err) {
      console.error('Airtime purchase error:', err);
      toast.error('Failed to purchase airtime. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Success View with Voucher Token
  if (step === 'success') {
    const receiptNumber = transactionResult?.receiptNumber || `RCP${Date.now().toString(36).toUpperCase()}`;
    const transactionDate = transactionResult?.createdAt ? new Date(transactionResult.createdAt) : new Date();
    // Generate a voucher PIN token similar to electricity tokens (16 digits)
    const voucherPin = transactionResult?.voucherPin || Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
    const voucherExpiry = new Date();
    voucherExpiry.setDate(voucherExpiry.getDate() + 30); // 30 days validity

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto">
              <Smartphone className="w-8 h-8 text-pink-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Voucher Generated!</p>
              <p className="text-sm text-gray-500 mt-1">{formatCurrency(parseFloat(amount))} {selectedNetworkInfo?.name} Airtime</p>
            </div>

            {/* Voucher PIN Display */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200">
              <p className="text-[10px] text-pink-600 uppercase tracking-wide mb-2">Your Voucher PIN</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-xl font-mono font-bold text-gray-900 tracking-wider">
                  {voucherPin.slice(0, 4)}-{voucherPin.slice(4, 8)}-{voucherPin.slice(8, 12)}-{voucherPin.slice(12)}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(voucherPin);
                    toast.success('Voucher PIN copied!');
                  }}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-pink-700 mt-2 font-medium">Valid until {voucherExpiry.toLocaleDateString('en-ZA')}</p>
            </div>

            {/* Receipt Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 text-left space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-[10px] text-gray-500 uppercase tracking-wide">Receipt</span>
                <span className="font-mono text-xs font-semibold text-[#00897B]">{receiptNumber}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Voucher PIN</span>
                  <span className="font-mono font-semibold text-pink-600">{voucherPin.slice(0, 4)}-{voucherPin.slice(4, 8)}-{voucherPin.slice(8, 12)}-{voucherPin.slice(12)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Network</span>
                  <span className="font-medium flex items-center gap-1">
                    <span>{selectedNetworkInfo?.logo}</span> {selectedNetworkInfo?.name}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Phone (ref)</span>
                  <span className="font-medium">+27 {phone}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(parseFloat(amount))}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Valid Until</span>
                  <span className="font-medium text-pink-600">{voucherExpiry.toLocaleDateString('en-ZA')}</span>
                </div>
                {transactionResult?.reference && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Reference</span>
                    <span className="font-mono font-medium">{transactionResult.reference}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">{transactionDate.toLocaleDateString('en-ZA')} {transactionDate.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            {/* How to Redeem */}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-left">
              <p className="text-[10px] font-medium text-blue-700 mb-1">How to Redeem:</p>
              <p className="text-[10px] text-blue-600">Dial *136*{voucherPin}# on your {selectedNetworkInfo?.name} phone to load airtime</p>
            </div>

            {/* Copy Receipt Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                const receiptText = `GROWAY WALLET - AIRTIME VOUCHER\nReceipt: ${receiptNumber}\nVoucher PIN: ${voucherPin}\nNetwork: ${selectedNetworkInfo?.name}\nAmount: ${formatCurrency(parseFloat(amount))}\nValid Until: ${voucherExpiry.toLocaleDateString('en-ZA')}\nReference: ${transactionResult?.reference || 'N/A'}\nDate: ${transactionDate.toLocaleDateString('en-ZA')} ${transactionDate.toLocaleTimeString('en-ZA')}\n\nTo redeem: Dial *136*${voucherPin}#`;
                navigator.clipboard.writeText(receiptText);
                toast.success('Receipt copied to clipboard!');
              }}
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy Receipt
            </Button>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900 text-xs">+{Math.round(parseFloat(amount) * 10)} Points</p>
                <p className="text-[10px] text-gray-500">Earned from this purchase</p>
              </div>
            </div>
            <Button onClick={onClose} className="w-full bg-[#E91E63] hover:bg-[#C2185B]">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#E91E63]" />
            Buy Airtime & Data
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && 'Select your network provider'}
            {step === 'amount' && 'Enter amount and phone number'}
            {step === 'confirm' && 'Review your purchase'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {networks.map((network) => (
                <button
                  key={network.id}
                  className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    selectedNetwork === network.id
                      ? 'border-[#00897B] bg-[#00897B]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedNetwork(network.id);
                    setStep('amount');
                  }}
                >
                  <span className="text-2xl">{network.logo}</span>
                  <span className="font-medium text-sm">{network.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'amount' && (
          <div className="space-y-3">
            {/* Selected Network */}
            <div className="p-2 rounded-lg bg-gray-50 flex items-center gap-2">
              <span className="text-xl">{selectedNetworkInfo?.logo}</span>
              <span className="font-medium text-sm">{selectedNetworkInfo?.name}</span>
              <button 
                onClick={() => { setSelectedNetwork(null); setStep('select'); }}
                className="ml-auto text-xs text-[#00897B]"
              >
                Change
              </button>
            </div>

            {/* Quick Amounts */}
            <div>
              <Label className="text-xs">Quick Amounts</Label>
              <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    variant={amount === amt.toString() ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAmount(amt.toString())}
                    className={`h-9 text-xs ${amount === amt.toString() ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}`}
                  >
                    R{amt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <Label htmlFor="amount" className="text-xs">Custom Amount (R)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 text-sm mt-1.5"
              />
            </div>

            {/* Phone Number */}
            <div>
              <Label htmlFor="phone" className="text-xs">Phone Number</Label>
              <div className="relative mt-1.5">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">+27</span>
                <Input
                  id="phone"
                  placeholder="82 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-10 text-sm pl-12"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep('select')} className="flex-1">
                Back
              </Button>
              <Button
                size="sm"
                onClick={() => setStep('confirm')}
                disabled={!selectedNetwork || !amount || !phone}
                className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-3">
            {/* Summary */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#E91E63]/5 to-[#9C27B0]/5 border border-[#E91E63]/20">
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">You're sending</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(parseFloat(amount))}</p>
                <p className="text-sm text-gray-600 mt-1">Airtime • {selectedNetworkInfo?.name}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Network</span>
                <span className="font-medium flex items-center gap-1.5">
                  <span>{selectedNetworkInfo?.logo}</span> {selectedNetworkInfo?.name}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium">+27 {phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">{formatCurrency(parseFloat(amount))}</span>
              </div>
            </div>

            {/* Info */}
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-[10px] text-blue-700">
                ✓ Instant delivery • Valid for 30 days • No expiry on data bundles
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep('amount')} className="flex-1">
                Back
              </Button>
              <Button
                size="sm"
                onClick={handlePurchase}
                disabled={loading}
                className="flex-1 bg-[#E91E63] hover:bg-[#C2185B]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Confirm Purchase
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Electricity Modal - Comprehensive Transaction Flow
function ElectricityModal({ onClose }: { onClose: () => void }) {
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [tokenResult, setTokenResult] = useState<any>(null);

  const quickAmounts = [50, 100, 200, 500, 1000];
  
  const providers = [
    { name: 'Eskom', regions: 'National' },
    { name: 'City Power', regions: 'Johannesburg' },
    { name: 'Durban Electricity', regions: 'eThekwini' },
    { name: 'CT Electricity', regions: 'Cape Town' },
  ];

  const handlePurchase = async () => {
    if (!meterNumber || !amount) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/utilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'electricity',
          userId: 'demo-consumer-user-001',
          meterNumber,
          amountCents: Math.round(parseFloat(amount) * 100),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTokenResult(data.data);
        setStep('success');
        toast.success('Electricity token purchased!');
      } else {
        toast.error(data.error || 'Failed to purchase electricity');
      }
    } catch {
      toast.error('Failed to purchase electricity');
    } finally {
      setLoading(false);
    }
  };

  // Success View with Token
  if (step === 'success') {
    const receiptNumber = tokenResult?.receiptNumber || `RCP${Date.now().toString(36).toUpperCase()}`;
    const transactionDate = tokenResult?.timestamp ? new Date(tokenResult.timestamp) : new Date();
    const kwhUnits = tokenResult?.kwh || Math.round(parseFloat(amount) * 1.5);
    
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Token Generated!</p>
              <p className="text-sm text-gray-500 mt-1">{formatCurrency(parseFloat(amount))} electricity</p>
            </div>
            
            {/* Token Display */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
              <p className="text-[10px] text-amber-600 uppercase tracking-wide mb-2">Your Token</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-xl font-mono font-bold text-gray-900 tracking-wider">
                  {tokenResult?.token || '1234-5678-9012-3456'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(tokenResult?.token || '1234-5678-9012-3456');
                    toast.success('Token copied!');
                  }}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-amber-700 mt-2 font-medium">{kwhUnits} kWh units</p>
            </div>

            {/* Receipt Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 text-left space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-[10px] text-gray-500 uppercase tracking-wide">Receipt</span>
                <span className="font-mono text-xs font-semibold text-[#00897B]">{receiptNumber}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Meter Number</span>
                  <span className="font-mono font-medium">{meterNumber}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Provider</span>
                  <span className="font-medium">{tokenResult?.provider || 'Eskom'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(parseFloat(amount))}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Units</span>
                  <span className="font-medium text-amber-600">{kwhUnits} kWh</span>
                </div>
                {tokenResult?.reference && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Reference</span>
                    <span className="font-mono font-medium">{tokenResult.reference}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">{transactionDate.toLocaleDateString('en-ZA')} {transactionDate.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
            
            {/* Copy Receipt Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => {
                const receiptText = `GROWAY WALLET - ELECTRICITY TOKEN\nReceipt: ${receiptNumber}\nToken: ${tokenResult?.token || 'N/A'}\nMeter: ${meterNumber}\nProvider: ${tokenResult?.provider || 'Eskom'}\nAmount: ${formatCurrency(parseFloat(amount))}\nUnits: ${kwhUnits} kWh\nReference: ${tokenResult?.reference || 'N/A'}\nDate: ${transactionDate.toLocaleDateString('en-ZA')} ${transactionDate.toLocaleTimeString('en-ZA')}`;
                navigator.clipboard.writeText(receiptText);
                toast.success('Receipt copied to clipboard!');
              }}
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy Receipt
            </Button>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900 text-xs">+{Math.round(parseFloat(amount) * 12)} Points</p>
                <p className="text-[10px] text-gray-500">Earned from this purchase</p>
              </div>
            </div>

            <Button onClick={onClose} className="w-full bg-amber-500 hover:bg-amber-600">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Buy Electricity
          </DialogTitle>
          <DialogDescription>
            {step === 'input' && 'Prepaid electricity tokens'}
            {step === 'confirm' && 'Review your purchase'}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-3">
            {/* Meter Number */}
            <div>
              <Label htmlFor="meter" className="text-xs">Meter Number</Label>
              <Input
                id="meter"
                placeholder="Enter 11-digit meter number"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                className="h-10 text-sm mt-1.5 font-mono tracking-wider"
              />
              {meterNumber.length === 11 && (
                <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Valid meter number
                </p>
              )}
            </div>

            {/* Quick Amounts */}
            <div>
              <Label className="text-xs">Quick Amounts</Label>
              <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    variant={amount === amt.toString() ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAmount(amt.toString())}
                    className={`h-9 text-xs ${amount === amt.toString() ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
                  >
                    R{amt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <Label htmlFor="amount" className="text-xs">Custom Amount (R)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 text-sm mt-1.5"
              />
            </div>

            {/* Estimated kWh */}
            {amount && parseFloat(amount) > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex justify-between text-xs">
                  <span className="text-amber-700">Estimated Units</span>
                  <span className="font-semibold text-amber-800">{Math.round(parseFloat(amount) * 1.5)} kWh</span>
                </div>
              </div>
            )}

            {/* Supported Providers */}
            <div className="p-2.5 rounded-lg bg-gray-50">
              <p className="text-[10px] text-gray-500 mb-1.5">Supported Providers:</p>
              <div className="flex flex-wrap gap-1">
                {providers.map((p, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 bg-white rounded border text-gray-600">{p.name}</span>
                ))}
              </div>
            </div>

            <Button
              className="w-full bg-amber-500 hover:bg-amber-600"
              onClick={() => setStep('confirm')}
              disabled={!meterNumber || meterNumber.length < 11 || !amount}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-3">
            {/* Summary */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">You're purchasing</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(parseFloat(amount))}</p>
                <p className="text-sm text-gray-600 mt-1">Electricity Token</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Meter Number</span>
                <span className="font-medium font-mono">{meterNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Est. Units</span>
                <span className="font-medium text-amber-600">{Math.round(parseFloat(amount) * 1.5)} kWh</span>
              </div>
            </div>

            {/* Info */}
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-[10px] text-blue-700">
                ✓ Instant token delivery • Valid immediately • No expiry
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep('input')} className="flex-1">
                Back
              </Button>
              <Button
                size="sm"
                onClick={handlePurchase}
                disabled={loading}
                className="flex-1 bg-amber-500 hover:bg-amber-600"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Buy Token
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Water Modal - Comprehensive Transaction Flow
function WaterModal({ onClose }: { onClose: () => void }) {
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [tokenResult, setTokenResult] = useState<any>(null);

  const quickAmounts = [50, 100, 200, 500];
  
  const providers = [
    { name: 'Johannesburg Water', regions: 'Johannesburg' },
    { name: 'Cape Town Water', regions: 'Cape Town' },
    { name: 'eThekwini Water', regions: 'Durban' },
    { name: 'Tshwane Water', regions: 'Pretoria' },
  ];

  const handlePurchase = async () => {
    if (!meterNumber || !amount) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/utilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'water',
          userId: 'demo-consumer-user-001',
          meterNumber,
          amountCents: Math.round(parseFloat(amount) * 100),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTokenResult(data.data);
        setStep('success');
        toast.success('Water token purchased!');
      } else {
        toast.error(data.error || 'Failed to purchase water');
      }
    } catch {
      toast.error('Failed to purchase water');
    } finally {
      setLoading(false);
    }
  };

  // Success View with Token
  if (step === 'success') {
    const receiptNumber = tokenResult?.receiptNumber || `RCP${Date.now().toString(36).toUpperCase()}`;
    const transactionDate = tokenResult?.timestamp ? new Date(tokenResult.timestamp) : new Date();
    const litres = tokenResult?.litres || Math.round(parseFloat(amount) * 20);
    
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
              <Droplets className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Water Token Generated!</p>
              <p className="text-sm text-gray-500 mt-1">{formatCurrency(parseFloat(amount))} water</p>
            </div>
            
            {/* Token Display */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
              <p className="text-[10px] text-blue-600 uppercase tracking-wide mb-2">Your Token</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-xl font-mono font-bold text-gray-900 tracking-wider">
                  {tokenResult?.token || '9876-5432-1098-7654'}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(tokenResult?.token || '9876-5432-1098-7654');
                    toast.success('Token copied!');
                  }}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-blue-700 mt-2 font-medium">{litres} litres</p>
            </div>

            {/* Receipt Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 text-left space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-[10px] text-gray-500 uppercase tracking-wide">Receipt</span>
                <span className="font-mono text-xs font-semibold text-[#00897B]">{receiptNumber}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Meter Number</span>
                  <span className="font-mono font-medium">{meterNumber}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Provider</span>
                  <span className="font-medium">{tokenResult?.provider || 'Johannesburg Water'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(parseFloat(amount))}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Litres</span>
                  <span className="font-medium text-blue-600">{litres} L</span>
                </div>
                {tokenResult?.reference && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Reference</span>
                    <span className="font-mono font-medium">{tokenResult.reference}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">{transactionDate.toLocaleDateString('en-ZA')} {transactionDate.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
            
            {/* Copy Receipt Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => {
                const receiptText = `GROWAY WALLET - WATER TOKEN\nReceipt: ${receiptNumber}\nToken: ${tokenResult?.token || 'N/A'}\nMeter: ${meterNumber}\nProvider: ${tokenResult?.provider || 'Johannesburg Water'}\nAmount: ${formatCurrency(parseFloat(amount))}\nLitres: ${litres} L\nReference: ${tokenResult?.reference || 'N/A'}\nDate: ${transactionDate.toLocaleDateString('en-ZA')} ${transactionDate.toLocaleTimeString('en-ZA')}`;
                navigator.clipboard.writeText(receiptText);
                toast.success('Receipt copied to clipboard!');
              }}
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy Receipt
            </Button>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-3">
              <Star className="w-5 h-5 text-blue-500 fill-blue-500" />
              <div className="text-left">
                <p className="font-medium text-gray-900 text-xs">+{Math.round(parseFloat(amount) * 12)} Points</p>
                <p className="text-[10px] text-gray-500">Earned from this purchase</p>
              </div>
            </div>

            <Button onClick={onClose} className="w-full bg-blue-500 hover:bg-blue-600">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Droplets className="w-5 h-5 text-blue-500" />
            Buy Water
          </DialogTitle>
          <DialogDescription>
            {step === 'input' && 'Prepaid water tokens'}
            {step === 'confirm' && 'Review your purchase'}
          </DialogDescription>
        </DialogHeader>

        {step === 'input' && (
          <div className="space-y-3">
            {/* Meter Number */}
            <div>
              <Label htmlFor="meter" className="text-xs">Meter Number</Label>
              <Input
                id="meter"
                placeholder="Enter meter number"
                value={meterNumber}
                onChange={(e) => setMeterNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
                className="h-10 text-sm mt-1.5 font-mono tracking-wider"
              />
              {meterNumber.length >= 6 && (
                <p className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Valid meter number
                </p>
              )}
            </div>

            {/* Quick Amounts */}
            <div>
              <Label className="text-xs">Quick Amounts</Label>
              <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                {quickAmounts.map((amt) => (
                  <Button
                    key={amt}
                    variant={amount === amt.toString() ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAmount(amt.toString())}
                    className={`h-9 text-xs ${amount === amt.toString() ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                  >
                    R{amt}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <Label htmlFor="amount" className="text-xs">Custom Amount (R)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 text-sm mt-1.5"
              />
            </div>

            {/* Estimated Litres */}
            {amount && parseFloat(amount) > 0 && (
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-700">Estimated Water</span>
                  <span className="font-semibold text-blue-800">{Math.round(parseFloat(amount) * 20)} Litres</span>
                </div>
              </div>
            )}

            {/* Supported Providers */}
            <div className="p-2.5 rounded-lg bg-gray-50">
              <p className="text-[10px] text-gray-500 mb-1.5">Supported Providers:</p>
              <div className="flex flex-wrap gap-1">
                {providers.map((p, i) => (
                  <span key={i} className="text-[9px] px-1.5 py-0.5 bg-white rounded border text-gray-600">{p.name}</span>
                ))}
              </div>
            </div>

            <Button
              className="w-full bg-blue-500 hover:bg-blue-600"
              onClick={() => setStep('confirm')}
              disabled={!meterNumber || meterNumber.length < 6 || !amount}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-3">
            {/* Summary */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">You're purchasing</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(parseFloat(amount))}</p>
                <p className="text-sm text-gray-600 mt-1">Water Token</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Meter Number</span>
                <span className="font-medium font-mono">{meterNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">{formatCurrency(parseFloat(amount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Est. Water</span>
                <span className="font-medium text-blue-600">{Math.round(parseFloat(amount) * 20)} Litres</span>
              </div>
            </div>

            {/* Info */}
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-[10px] text-blue-700">
                ✓ Instant token delivery • Valid immediately • No expiry
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep('input')} className="flex-1">
                Back
              </Button>
              <Button
                size="sm"
                onClick={handlePurchase}
                disabled={loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Buy Token
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Bills Modal
function BillsModal({ onClose }: { onClose: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [receiptData, setReceiptData] = useState<any>(null);

  const categories = [
    { id: 'electricity', name: 'Electricity', icon: Zap, color: '#FF9800' },
    { id: 'water', name: 'Water', icon: Droplets, color: '#2196F3' },
    { id: 'tv', name: 'TV & Internet', icon: Globe, color: '#9C27B0' },
    { id: 'municipal', name: 'Municipal', icon: Building, color: '#607D8B' },
  ];

  const providers: Record<string, { id: string; name: string }[]> = {
    electricity: [
      { id: 'eskom', name: 'Eskom' },
      { id: 'citypower', name: 'City Power' },
      { id: 'ekurhuleni', name: 'Ekurhuleni Electricity' },
    ],
    water: [
      { id: 'jhbwater', name: 'Johannesburg Water' },
      { id: 'ctwater', name: 'Cape Town Water' },
    ],
    tv: [
      { id: 'dstv', name: 'DStv' },
      { id: 'multichoice', name: 'MultiChoice' },
      { id: 'showmax', name: 'Showmax' },
    ],
    municipal: [
      { id: 'joburg', name: 'City of Johannesburg' },
      { id: 'capetown', name: 'City of Cape Town' },
    ],
  };

  const handlePay = async () => {
    if (!selectedCategory || !accountNumber || !amount) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/wallet/utilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bills',
          userId: 'demo-consumer-user-001',
          providerId: selectedProvider || selectedCategory,
          accountNumber,
          amountCents: Math.round(parseFloat(amount) * 100),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReceiptData(data.data);
        setStep('success');
        toast.success('Bill paid successfully!');
      } else {
        toast.error(data.error || 'Failed to pay bill');
      }
    } catch {
      toast.error('Failed to pay bill');
    } finally {
      setLoading(false);
    }
  };

  // Success View with Receipt
  if (step === 'success') {
    const receiptNumber = receiptData?.receiptNumber || `RCP${Date.now().toString(36).toUpperCase()}`;
    const transactionDate = receiptData?.timestamp ? new Date(receiptData.timestamp) : new Date();
    const selectedCatInfo = categories.find(c => c.id === selectedCategory);
    
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Payment Successful!</p>
              <p className="text-sm text-gray-500 mt-1">{formatCurrency(parseFloat(amount))} paid</p>
            </div>

            {/* Receipt Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 text-left space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-[10px] text-gray-500 uppercase tracking-wide">Receipt</span>
                <span className="font-mono text-xs font-semibold text-[#00897B]">{receiptNumber}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium">{selectedCatInfo?.name || 'Bill Payment'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Provider</span>
                  <span className="font-medium">{receiptData?.provider || 'Bill Payment'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Account</span>
                  <span className="font-mono font-medium">{accountNumber}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-semibold text-green-600">{formatCurrency(parseFloat(amount))}</span>
                </div>
                {receiptData?.reference && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Reference</span>
                    <span className="font-mono font-medium">{receiptData.reference}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">{transactionDate.toLocaleDateString('en-ZA')} {transactionDate.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>
            
            {/* Copy Receipt Button */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs"
              onClick={() => {
                const receiptText = `GROWAY WALLET - BILL PAYMENT\nReceipt: ${receiptNumber}\nCategory: ${selectedCatInfo?.name || 'Bill Payment'}\nProvider: ${receiptData?.provider || 'Bill Payment'}\nAccount: ${accountNumber}\nAmount: ${formatCurrency(parseFloat(amount))}\nReference: ${receiptData?.reference || 'N/A'}\nDate: ${transactionDate.toLocaleDateString('en-ZA')} ${transactionDate.toLocaleTimeString('en-ZA')}`;
                navigator.clipboard.writeText(receiptText);
                toast.success('Receipt copied to clipboard!');
              }}
            >
              <Copy className="w-3.5 h-3.5 mr-1.5" />
              Copy Receipt
            </Button>

            <div className="p-3 rounded-lg bg-[#00897B]/10 border border-[#00897B]/20 flex items-center gap-3">
              <Star className="w-5 h-5 text-[#00897B]" />
              <div className="text-left">
                <p className="font-medium text-gray-900 text-xs">+{Math.round(parseFloat(amount) * 10)} Points</p>
                <p className="text-[10px] text-gray-500">Earned from this payment</p>
              </div>
            </div>

            <Button onClick={onClose} className="w-full bg-[#00897B] hover:bg-[#00695C]">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const selectedCatInfo = categories.find(c => c.id === selectedCategory);
  const selectedProvInfo = selectedProvider && selectedCategory && providers[selectedCategory]
    ? providers[selectedCategory].find(p => p.id === selectedProvider)
    : null;

  // Confirmation View
  if (step === 'confirm') {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>Review your bill payment details</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Summary */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#00897B]/5 to-[#43A047]/5 border border-[#00897B]/20">
              <div className="text-center">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">You're paying</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(parseFloat(amount))}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedCatInfo?.name || 'Bill Payment'}</p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Category</span>
                <span className="font-medium flex items-center gap-1.5">
                  {selectedCatInfo && (
                    <>
                      <selectedCatInfo.icon className="w-3.5 h-3.5" style={{ color: selectedCatInfo.color }} />
                      {selectedCatInfo.name}
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Provider</span>
                <span className="font-medium">{selectedProvInfo?.name || 'Bill Payment'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Account</span>
                <span className="font-mono font-medium">{accountNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">{formatCurrency(parseFloat(amount))}</span>
              </div>
            </div>

            {/* Info */}
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-[10px] text-blue-700">
                ✓ Instant payment • Confirmation receipt provided • Secure transaction
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep('select')} className="flex-1">
                Back
              </Button>
              <Button
                size="sm"
                onClick={handlePay}
                disabled={loading}
                className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Confirm Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Bill Payments</DialogTitle>
          <DialogDescription>Pay 35+ bill providers</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Select Category</Label>
            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all ${
                    selectedCategory === cat.id ? 'border-[#00897B] bg-[#00897B]/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setSelectedProvider(null);
                  }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: `${cat.color}20` }}>
                    <cat.icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                  </div>
                  <span className="text-xs font-medium text-gray-900">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Provider Selection */}
          {selectedCategory && providers[selectedCategory] && (
            <div>
              <Label className="text-xs">Select Provider</Label>
              <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                {providers[selectedCategory].map((prov) => (
                  <button
                    key={prov.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-xs ${
                      selectedProvider === prov.id ? 'border-[#00897B] bg-[#00897B]/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedProvider(prov.id)}
                  >
                    {prov.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="account" className="text-xs">Account Number</Label>
            <Input id="account" placeholder="Enter account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="h-9 text-sm" />
          </div>
          <div>
            <Label htmlFor="amount" className="text-xs">Amount (R)</Label>
            <Input id="amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-9 text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => setStep('confirm')} disabled={!selectedCategory || !accountNumber || !amount} className="bg-[#00897B] hover:bg-[#00695C]">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== COMPREHENSIVE SASSA MODAL ====================
type SASSAView = 'main' | 'grants' | 'calendar' | 'apply' | 'tracking' | 'history' | 'early-access';

interface SASSAGrant {
  type: string;
  name: string;
  amount: number;
  beneficiaries: number;
  totalAmount: number;
  status: 'pending' | 'approved' | 'active' | 'suspended';
  nextPayment?: string;
  lastPayment?: string;
}

interface SASSAApplication {
  id: string;
  type: string;
  grantName: string;
  status: string;
  submittedAt: string;
  estimatedProcessingDays: number;
  processedAt?: string;
}

interface SASSAPayment {
  id: string;
  grantType: string;
  grantName?: string;
  amount: number;
  date: string;
  status: string;
  reference: string;
}

interface PaymentCalendar {
  month: string;
  dates: {
    olderPersons: string;
    disability: string;
    childSupport: { start: string; end: string };
  };
}

function GrantPlusModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<SASSAView>('main');
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [linked, setLinked] = useState(false);
  const [userGrants, setUserGrants] = useState<SASSAGrant[]>([]);
  const [grantTypes, setGrantTypes] = useState<any[]>([]);
  const [applications, setApplications] = useState<SASSAApplication[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<SASSAPayment[]>([]);
  const [calendar, setCalendar] = useState<PaymentCalendar[]>([]);
  const [earlyAccessData, setEarlyAccessData] = useState<any>(null);
  const [selectedGrant, setSelectedGrant] = useState<string>('');
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [maskedId, setMaskedId] = useState('');

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Format currency
  const formatAmount = (amount: number) => `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statusRes, typesRes] = await Promise.all([
          fetch('/api/sassa?action=status'),
          fetch('/api/sassa?action=grant-types')
        ]);
        
        const statusData = await statusRes.json();
        const typesData = await typesRes.json();
        
        if (statusData.success) {
          setLinked(statusData.data.linked);
          setUserGrants(statusData.data.grants || []);
          setTotalMonthly(statusData.data.totalMonthlyIncome || 0);
          setMaskedId(statusData.data.maskedIdNumber || '');
        }
        
        if (typesData.success) {
          setGrantTypes(typesData.data);
        }
      } catch (error) {
        console.error('Failed to fetch SASSA data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fetch additional data when view changes
  useEffect(() => {
    const fetchViewData = async () => {
      if (view === 'calendar' && calendar.length === 0) {
        try {
          const res = await fetch('/api/sassa?action=payment-calendar');
          const data = await res.json();
          if (data.success) {
            setCalendar(data.data.calendar);
          }
        } catch (error) {
          console.error('Failed to fetch calendar:', error);
        }
      }
      
      if (view === 'tracking' && applications.length === 0) {
        try {
          const res = await fetch('/api/sassa?action=applications');
          const data = await res.json();
          if (data.success) {
            setApplications(data.data);
          }
        } catch (error) {
          console.error('Failed to fetch applications:', error);
        }
      }
      
      if (view === 'history' && paymentHistory.length === 0) {
        try {
          const res = await fetch('/api/sassa?action=payment-history&months=3');
          const data = await res.json();
          if (data.success) {
            setPaymentHistory(data.data);
          }
        } catch (error) {
          console.error('Failed to fetch payment history:', error);
        }
      }
      
      if (view === 'early-access' && !earlyAccessData) {
        try {
          const res = await fetch('/api/sassa?action=early-access');
          const data = await res.json();
          if (data.success) {
            setEarlyAccessData(data.data);
          }
        } catch (error) {
          console.error('Failed to fetch early access data:', error);
        }
      }
    };
    
    fetchViewData();
  }, [view, calendar.length, applications.length, paymentHistory.length, earlyAccessData]);

  // Link SASSA account
  const handleLink = async () => {
    if (!idNumber || idNumber.length < 6) {
      toast.error('Please enter a valid ID number');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/sassa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'link', idNumber }),
      });
      const data = await res.json();
      
      if (data.success) {
        setLinked(true);
        setUserGrants(data.data.grants || []);
        setTotalMonthly(data.data.totalMonthlyIncome || 0);
        setMaskedId(data.data.maskedIdNumber || '');
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Failed to link account');
      }
    } catch {
      toast.error('Failed to link account');
    } finally {
      setLoading(false);
    }
  };

  // Submit application
  const handleApply = async () => {
    if (!selectedGrant) {
      toast.error('Please select a grant type');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/sassa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', grantType: selectedGrant }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        setApplications(prev => [data.data, ...prev]);
        setView('tracking');
      } else {
        toast.error(data.error || 'Failed to submit application');
      }
    } catch {
      toast.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  // Request early access
  const handleEarlyAccess = async (paymentId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/sassa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'early-access', paymentId }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        setView('main');
      } else {
        toast.error(data.error || 'Failed to process early access');
      }
    } catch {
      toast.error('Failed to process early access');
    } finally {
      setLoading(false);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      approved: 'bg-green-100 text-green-700',
      pending: 'bg-amber-100 text-amber-700',
      processing: 'bg-blue-100 text-blue-700',
      submitted: 'bg-purple-100 text-purple-700',
      suspended: 'bg-red-100 text-red-700',
      rejected: 'bg-red-100 text-red-700',
      processed: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // Render header with back button
  const renderHeader = (title: string, subtitle?: string) => (
    <div className="flex items-center gap-2 mb-3">
      {view !== 'main' && (
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setView('main')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
      )}
      <div>
        <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
        {subtitle && <p className="text-[10px] text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );

  // Main view
  const renderMain = () => (
    <div className="space-y-3">
      {/* Link Account Section */}
      {!linked ? (
        <div className="p-3 rounded-lg bg-[#00897B]/5 border border-[#00897B]/20">
          <p className="text-xs font-medium text-gray-700 mb-2">Link your SASSA account</p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter SA ID Number"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              className="h-8 text-xs flex-1"
              maxLength={13}
            />
            <Button size="sm" onClick={handleLink} disabled={loading} className="bg-[#00897B] hover:bg-[#00695C] h-8">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Link'}
            </Button>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Your ID is securely encrypted and verified</p>
        </div>
      ) : (
        <>
          {/* Linked Account Summary */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-[#00897B] to-[#43A047] text-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <BadgeCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-xs">Account Linked</p>
                  <p className="text-[10px] text-white/80">ID: {maskedId}</p>
                </div>
              </div>
              <Badge className="bg-white/20 text-white text-[10px]">Active</Badge>
            </div>
            <div className="pt-2 border-t border-white/20">
              <p className="text-[10px] text-white/80">Total Monthly Grants</p>
              <p className="text-xl font-bold">{formatAmount(totalMonthly)}</p>
            </div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setView('grants')}
              className="p-3 rounded-lg border border-gray-200 hover:border-[#00897B] hover:bg-[#00897B]/5 transition-all text-left"
            >
              <HandCoins className="w-5 h-5 text-[#00897B] mb-1" />
              <p className="font-medium text-gray-900 text-xs">My Grants</p>
              <p className="text-[10px] text-gray-500">{userGrants.length} active</p>
            </button>
            <button
              onClick={() => setView('calendar')}
              className="p-3 rounded-lg border border-gray-200 hover:border-[#00897B] hover:bg-[#00897B]/5 transition-all text-left"
            >
              <Clock className="w-5 h-5 text-amber-500 mb-1" />
              <p className="font-medium text-gray-900 text-xs">Payment Dates</p>
              <p className="text-[10px] text-gray-500">View calendar</p>
            </button>
            <button
              onClick={() => setView('apply')}
              className="p-3 rounded-lg border border-gray-200 hover:border-[#00897B] hover:bg-[#00897B]/5 transition-all text-left"
            >
              <PlusCircle className="w-5 h-5 text-purple-500 mb-1" />
              <p className="font-medium text-gray-900 text-xs">Apply</p>
              <p className="text-[10px] text-gray-500">New grant</p>
            </button>
            <button
              onClick={() => setView('tracking')}
              className="p-3 rounded-lg border border-gray-200 hover:border-[#00897B] hover:bg-[#00897B]/5 transition-all text-left"
            >
              <FileText className="w-5 h-5 text-blue-500 mb-1" />
              <p className="font-medium text-gray-900 text-xs">Applications</p>
              <p className="text-[10px] text-gray-500">{applications.filter(a => a.status === 'processing' || a.status === 'submitted').length} pending</p>
            </button>
          </div>

          {/* Grant+ Advance Banner */}
          <div 
            className="p-3 rounded-lg bg-gradient-to-r from-[#00897B] to-[#43A047] text-white cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => setView('early-access')}
          >
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <HandCoins className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-xs">Grant+ Advance Available</p>
                <p className="text-[10px] text-white/80">Get up to R1,200 advance on your SASSA grant</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/80" />
            </div>
          </div>
        </>
      )}

      {/* Available Grant Types */}
      <div>
        <p className="text-xs font-medium text-gray-700 mb-2">All SASSA Grants (8)</p>
        <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
          {grantTypes.map((grant) => (
            <div key={grant.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-base">{grant.icon}</span>
                <div>
                  <p className="font-medium text-gray-900 text-xs">{grant.name}</p>
                  <p className="text-[10px] text-gray-500">{grant.description}</p>
                </div>
              </div>
              <span className="font-semibold text-[#00897B] text-xs">{formatAmount(grant.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // My Grants View
  const renderGrants = () => (
    <div className="space-y-3">
      {renderHeader('My Grants', 'Your active SASSA grants')}
      
      {userGrants.length === 0 ? (
        <div className="text-center py-6">
          <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500">No active grants</p>
          <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => setView('apply')}>
            Apply for a Grant
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {userGrants.map((grant, idx) => (
            <Card key={idx} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-xs">{grant.name}</p>
                    <p className="text-[10px] text-gray-500">{grant.beneficiaries} beneficiary(ies)</p>
                  </div>
                  <Badge className={getStatusColor(grant.status)}>{grant.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 rounded bg-gray-50">
                    <p className="text-gray-500">Amount</p>
                    <p className="font-semibold text-gray-900">{formatAmount(grant.totalAmount)}</p>
                  </div>
                  <div className="p-2 rounded bg-gray-50">
                    <p className="text-gray-500">Next Payment</p>
                    <p className="font-semibold text-gray-900">{formatDate(grant.nextPayment || '')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Payment Calendar View
  const renderCalendar = () => (
    <div className="space-y-3">
      {renderHeader('Payment Calendar', 'SASSA payment dates based on your ID')}
      
      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 mb-2">
        <p className="text-[10px] text-amber-700">
          <strong>Note:</strong> Payment dates are based on the last digit of your ID number
        </p>
      </div>
      
      <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
        {calendar.slice(0, 6).map((month, idx) => {
          const isCurrentMonth = idx === 0;
          return (
            <div 
              key={month.month} 
              className={`p-2.5 rounded-lg border ${isCurrentMonth ? 'border-[#00897B] bg-[#00897B]/5' : 'border-gray-200'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-gray-900 text-xs">{month.month}</p>
                {isCurrentMonth && <Badge className="bg-[#00897B] text-white text-[10px]">Current</Badge>}
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-gray-600">👴 Older Person's:</span>
                  <span className="font-medium text-gray-900">{new Date(month.dates.olderPersons).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">♿ Disability:</span>
                  <span className="font-medium text-gray-900">{new Date(month.dates.disability).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">👶 Child Support:</span>
                  <span className="font-medium text-gray-900">{new Date(month.dates.childSupport.start).toLocaleDateString('en-ZA', { day: 'numeric' })} - {new Date(month.dates.childSupport.end).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Apply for Grant View
  const renderApply = () => (
    <div className="space-y-3">
      {renderHeader('Apply for Grant', 'Submit a new SASSA grant application')}
      
      <div className="space-y-2">
        <Label className="text-xs">Select Grant Type</Label>
        <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
          {grantTypes.map((grant) => (
            <button
              key={grant.id}
              onClick={() => setSelectedGrant(grant.id)}
              className={`w-full p-2.5 rounded-lg border-2 transition-all text-left ${
                selectedGrant === grant.id 
                  ? 'border-[#00897B] bg-[#00897B]/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{grant.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-xs">{grant.name}</p>
                  <p className="text-[10px] text-gray-500">{formatAmount(grant.amount)}/month</p>
                </div>
                {selectedGrant === grant.id && <Check className="w-4 h-4 text-[#00897B]" />}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedGrant && (
        <div className="p-2.5 rounded-lg bg-gray-50">
          <p className="text-xs font-medium text-gray-700 mb-1.5">Required Documents:</p>
          <div className="space-y-1">
            {grantTypes.find(g => g.id === selectedGrant)?.documents.map((doc: string, idx: number) => (
              <div key={idx} className="flex items-center gap-1.5 text-[10px] text-gray-600">
                <FileText className="w-3 h-3" />
                <span>{doc}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-2">
            Estimated processing: {grantTypes.find(g => g.id === selectedGrant)?.processingDays} days
          </p>
        </div>
      )}

      <Button 
        className="w-full bg-[#00897B] hover:bg-[#00695C]" 
        onClick={handleApply}
        disabled={!selectedGrant || loading}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Submit Application
      </Button>
    </div>
  );

  // Application Tracking View
  const renderTracking = () => (
    <div className="space-y-3">
      {renderHeader('Application Tracking', 'Track your SASSA applications')}
      
      {applications.length === 0 ? (
        <div className="text-center py-6">
          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-xs text-gray-500">No applications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {applications.map((app) => (
            <Card key={app.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-xs">{app.grantName}</p>
                    <p className="text-[10px] text-gray-500">{app.id}</p>
                  </div>
                  <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <p className="text-gray-500">Submitted</p>
                    <p className="font-medium text-gray-900">{formatDate(app.submittedAt)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Processing Time</p>
                    <p className="font-medium text-gray-900">{app.estimatedProcessingDays} days</p>
                  </div>
                </div>
                {app.status === 'processing' && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-1.5">
                      <div className="bg-[#00897B] h-1.5 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    <p className="text-[10px] text-gray-500 mt-1">Application under review</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Payment History View
  const renderHistory = () => (
    <div className="space-y-3">
      {renderHeader('Payment History', 'Last 3 months of SASSA payments')}
      
      <div className="p-2.5 rounded-lg bg-green-50 border border-green-200 mb-2">
        <p className="text-[10px] text-green-700">Total received (3 months):</p>
        <p className="font-bold text-green-800">{formatAmount(paymentHistory.filter(p => p.status === 'processed').reduce((sum, p) => sum + p.amount, 0))}</p>
      </div>
      
      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
        {paymentHistory.map((payment) => (
          <div 
            key={payment.id} 
            className={`p-2.5 rounded-lg border ${
              payment.status === 'pending' 
                ? 'border-amber-200 bg-amber-50' 
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 text-xs">{payment.grantType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                <p className="text-[10px] text-gray-500">{formatDate(payment.date)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 text-xs">{formatAmount(payment.amount)}</p>
                <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
              </div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Ref: {payment.reference}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // Early Access View (Grant+ Advance Flow)
  const renderEarlyAccess = () => (
    <div className="space-y-3">
      {renderHeader('Grant+ Advance', 'Get an advance on your SASSA grant')}
      
      {/* Eligibility Badge */}
      <div className="p-3 rounded-lg bg-gradient-to-r from-[#00897B] to-[#43A047] text-white">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-xs">✓ You're eligible</p>
            <p className="text-[10px] text-white/80">Up to {formatAmount(earlyAccessData?.maxAdvance || 1200)} available</p>
          </div>
        </div>
        <div className="pt-2 border-t border-white/20">
          <p className="text-[10px] text-white/80">Your next grant pays on</p>
          <p className="text-sm font-bold">{earlyAccessData?.nextPaymentDate ? formatDate(earlyAccessData.nextPaymentDate) : '3 June 2025'}</p>
        </div>
      </div>

      {/* Tier Information */}
      <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-medium text-gray-700">Your Tier: {earlyAccessData?.tier || 'Premier'}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="p-2 bg-white rounded border">
            <p className="text-gray-500">Max Advance</p>
            <p className="font-semibold text-gray-900">{formatAmount(earlyAccessData?.maxAdvance || 1200)}</p>
          </div>
          <div className="p-2 bg-white rounded border">
            <p className="text-gray-500">Service Fee</p>
            <p className="font-semibold text-gray-900">R{earlyAccessData?.serviceFee || 95} flat</p>
          </div>
        </div>
      </div>
      
      {earlyAccessData?.upcomingPayments?.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Request Advance</p>
          {earlyAccessData.upcomingPayments.map((payment: any) => (
            <Card key={payment.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-xs">{payment.grantName}</p>
                    <p className="text-[10px] text-gray-500">Payment date: {formatDate(payment.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500">Full Amount</p>
                    <p className="font-semibold text-gray-900 text-xs">{formatAmount(payment.amount)}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 rounded text-center text-[10px] mb-2">
                  <div>
                    <p className="text-gray-500">Available</p>
                    <p className="font-semibold text-[#00897B]">{formatAmount(payment.availableAdvance)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Fee</p>
                    <p className="font-semibold text-amber-600">{formatAmount(payment.fee)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">You Get</p>
                    <p className="font-semibold text-green-600">{formatAmount(payment.netAmount)}</p>
                  </div>
                </div>

                {/* NCA Compliance Notice */}
                <div className="p-2 bg-blue-50 rounded text-[10px] text-blue-700 mb-2">
                  <strong>NCA Compliant:</strong> No interest charged • Flat fee only • Auto-deducted from grant
                </div>
                
                <Button 
                  className="w-full bg-[#00897B] hover:bg-[#00695C] text-xs h-9"
                  onClick={() => handleEarlyAccess(payment.id)}
                  disabled={loading || payment.daysUntilPayment < 5}
                >
                  {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <HandCoins className="w-3 h-3 mr-1" />}
                  Get Advance Now
                </Button>
                {payment.daysUntilPayment < 5 && (
                  <p className="text-[10px] text-amber-600 text-center mt-1">Available 5+ days before payment</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Demo Advance Card */}
          <Card className="border-2 border-[#00897B]">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Older Person's Grant</p>
                  <p className="text-[10px] text-gray-500">Next payment: 3 June 2025</p>
                </div>
                <Badge className="bg-[#00897B]/10 text-[#00897B] text-[10px]">Premier</Badge>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Grant Amount</span>
                  <span className="font-medium">R 2,090.00</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Max Advance (57%)</span>
                  <span className="font-medium text-[#00897B]">R 1,200.00</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Service Fee</span>
                  <span className="font-medium text-amber-600">R 95.00</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-xs font-semibold">
                  <span className="text-gray-700">You Receive</span>
                  <span className="text-green-600">R 1,105.00</span>
                </div>
              </div>

              <Button 
                className="w-full bg-[#00897B] hover:bg-[#00695C] text-xs"
                onClick={() => toast.success('Advance request submitted!')}
              >
                <HandCoins className="w-3.5 h-3.5 mr-1.5" />
                Request R1,200 Advance
              </Button>
            </CardContent>
          </Card>

          {/* Tier Table */}
          <div className="p-2.5 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-2">Grant+ Tiers</p>
            <div className="space-y-1.5 text-[10px]">
              {[
                { tier: 'Starter', grant: 'SRD (R370)', max: 'R185', fee: 'R25' },
                { tier: 'Standard', grant: 'Child Support', max: 'R265', fee: 'R35' },
                { tier: 'Core', grant: 'Disability', max: 'R800', fee: 'R65' },
                { tier: 'Premier', grant: 'Older Persons', max: 'R1,200', fee: 'R95' },
              ].map((t, i) => (
                <div key={i} className={`flex justify-between p-1.5 rounded ${t.tier === 'Premier' ? 'bg-[#00897B]/10' : 'bg-gray-50'}`}>
                  <span className="font-medium text-gray-700">{t.tier}</span>
                  <span className="text-gray-500">{t.grant}</span>
                  <span className="text-[#00897B]">{t.max}</span>
                  <span className="text-amber-600">{t.fee}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* How it works */}
      <div className="p-2.5 rounded-lg border border-gray-200">
        <p className="text-xs font-medium text-gray-700 mb-2">How Grant+ Works</p>
        <div className="space-y-1.5 text-[10px] text-gray-600">
          <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Verify your SASSA grant</p>
          <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Get up to 57% of your grant early</p>
          <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Flat fee — no interest charged</p>
          <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Auto-deducted on payment day</p>
          <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> NCA compliant • 5-day rescission right</p>
        </div>
      </div>

      {/* Risk Guardrails */}
      <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
        <p className="text-[10px] text-amber-700">
          <strong>Consumer Protection:</strong> Max 1 active advance • Max 60% of grant • No rollovers • 30-day cooling-off after default
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-[#00897B]" />
            Grant+ SASSA Advance
          </DialogTitle>
          <DialogDescription>
            Get an advance on your SASSA grant — NCA compliant, no interest
          </DialogDescription>
        </DialogHeader>

        {loading && !linked ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#00897B]" />
          </div>
        ) : (
          <>
            {view === 'main' && renderMain()}
            {view === 'grants' && renderGrants()}
            {view === 'calendar' && renderCalendar()}
            {view === 'apply' && renderApply()}
            {view === 'tracking' && renderTracking()}
            {view === 'history' && renderHistory()}
            {view === 'early-access' && renderEarlyAccess()}
          </>
        )}

        <DialogFooter className="pt-2 border-t">
          {view !== 'main' ? (
            <Button variant="outline" size="sm" onClick={() => setView('main')} className="text-xs">
              <ArrowLeft className="w-3 h-3 mr-1" /> Back
            </Button>
          ) : null}
          {view === 'main' && linked && (
            <Button variant="outline" size="sm" onClick={() => setView('history')} className="text-xs">
              <Clock className="w-3 h-3 mr-1" /> Payment History
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Insurance Marketplace Modal - Comprehensive Implementation
type InsuranceView = 'main' | 'categories' | 'quotes' | 'apply' | 'success';

interface InsuranceProvider {
  id: string;
  name: string;
  logo: string;
  rating: number;
  fscaLicense: string;
  established: number;
}

interface InsuranceProduct {
  id: string;
  provider: string;
  name: string;
  coverAmount: number;
  premium: number;
  waitingPeriod: number;
  benefits: string[];
  description: string;
  providerDetails?: InsuranceProvider;
}

interface InsuranceCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
}

function InsuranceModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<InsuranceView>('main');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [categories, setCategories] = useState<InsuranceCategory[]>([]);
  const [providers, setProviders] = useState<InsuranceProvider[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [quotes, setQuotes] = useState<InsuranceProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<InsuranceProduct | null>(null);
  const [userPolicies, setUserPolicies] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [applicationRef, setApplicationRef] = useState<string>('');
  const [personalDetails, setPersonalDetails] = useState({ name: '', idNumber: '', phone: '' });

  // Fetch insurance data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dataRes, insightsRes] = await Promise.all([
          fetch('/api/insurance'),
          fetch('/api/insurance?action=insights')
        ]);
        
        const dataJson = await dataRes.json();
        const insightsJson = await insightsRes.json();
        
        if (dataJson.success) {
          setCategories(dataJson.data.categories || []);
          setProviders(dataJson.data.providers || []);
          setUserPolicies(dataJson.data.userPolicies || []);
        }
        
        if (insightsJson.success) {
          setInsights(insightsJson.data.insights || []);
        }
      } catch (error) {
        console.error('Failed to fetch insurance data:', error);
        toast.error('Failed to load insurance data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fetch quotes when category selected
  const fetchQuotes = async (category: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/insurance?action=quotes&category=${category}`);
      const data = await res.json();
      if (data.success) {
        setQuotes(data.data);
        setView('quotes');
      }
    } catch (error) {
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  // Apply for insurance
  const handleApply = async () => {
    if (!selectedProduct || !personalDetails.name || !personalDetails.idNumber) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setProcessing(true);
    try {
      const res = await fetch('/api/insurance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'purchase',
          productId: selectedProduct.id,
          personalDetails
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setApplicationRef(data.data.id);
        setView('success');
        toast.success('Insurance policy created successfully!');
      } else {
        toast.error(data.error || 'Failed to create policy');
      }
    } catch {
      toast.error('Failed to process application');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`;

  if (loading && view === 'main') {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Insurance Marketplace</DialogTitle>
            </VisuallyHidden>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#00897B]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#4CAF50]" />
            Insurance Marketplace
          </DialogTitle>
          <DialogDescription>
            Compare 10+ FSCA-licensed providers • Instant quotes
          </DialogDescription>
        </DialogHeader>

        {view === 'main' && (
          <div className="space-y-3">
            {/* User Policies Summary */}
            {userPolicies.length > 0 && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#4CAF50]/10 to-[#00897B]/10 border border-[#4CAF50]/20">
                <p className="text-xs font-medium text-gray-700 mb-2">Your Coverage</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{userPolicies.length} Active Policies</p>
                    <p className="text-xs text-gray-500">{formatCurrency(userPolicies.reduce((s, p) => s + p.premium, 0))}/month</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#4CAF50] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* GroAI Insights */}
            {insights.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span className="text-[10px] font-semibold text-amber-700">GroAI Insights</span>
                </div>
                <p className="text-[10px] text-amber-700">{insights[0]?.message}</p>
                <p className="text-[9px] text-amber-600 mt-0.5">{insights[0]?.recommendation}</p>
              </div>
            )}

            {/* Insurance Categories */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Select Coverage Type</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setSelectedCategory(cat.id); fetchQuotes(cat.id); }}
                    className="p-3 rounded-xl border border-gray-200 hover:border-[#4CAF50] hover:bg-[#4CAF50]/5 transition-all text-left"
                  >
                    <span className="text-lg">{cat.icon}</span>
                    <p className="font-medium text-gray-900 text-xs mt-1">{cat.name}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{cat.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Providers */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-700">10 Licensed Providers</p>
                <span className="text-[10px] text-gray-400">FSCA Regulated</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {providers.slice(0, 10).map((provider) => (
                  <div key={provider.id} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50 border border-gray-100">
                    <span className="text-sm">{provider.logo}</span>
                    <span className="text-[10px] font-medium text-gray-700">{provider.name}</span>
                    <span className="text-[9px] text-amber-500">★{provider.rating}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-[#4CAF50]">10+</p>
                <p className="text-[10px] text-gray-500">Providers</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-[#00897B]">5</p>
                <p className="text-[10px] text-gray-500">Categories</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-amber-500">24h</p>
                <p className="text-[10px] text-gray-500">Activation</p>
              </div>
            </div>
          </div>
        )}

        {view === 'quotes' && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setView('main')} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{categories.find(c => c.id === selectedCategory)?.icon}</span>
              <p className="font-semibold text-gray-900 text-sm">{categories.find(c => c.id === selectedCategory)?.name} Quotes</p>
            </div>

            {/* Quote Cards */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {quotes.map((quote, idx) => (
                <div
                  key={quote.id}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedProduct?.id === quote.id
                      ? 'border-[#4CAF50] bg-[#4CAF50]/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                  onClick={() => setSelectedProduct(quote)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{quote.providerDetails?.logo}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-xs">{quote.name}</p>
                        <p className="text-[10px] text-gray-500">{quote.providerDetails?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#4CAF50]">{formatCurrency(quote.premium)}</p>
                      <p className="text-[10px] text-gray-400">/month</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-2">
                    {quote.benefits.slice(0, 3).map((benefit, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 bg-gray-100 rounded-full text-gray-600">{benefit}</span>
                    ))}
                    {quote.benefits.length > 3 && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 rounded-full text-gray-400">+{quote.benefits.length - 3}</span>
                    )}
                  </div>

                  {quote.coverAmount > 0 && (
                    <p className="text-[10px] text-gray-500">
                      Cover: {formatCurrency(quote.coverAmount)} • Waiting: {quote.waitingPeriod} months
                    </p>
                  )}

                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-[9px] text-amber-500">★{quote.providerDetails?.rating}</span>
                    <span className="text-[9px] text-gray-400">• FSP: {quote.providerDetails?.fscaLicense}</span>
                  </div>
                </div>
              ))}
            </div>

            {selectedProduct && (
              <Button className="w-full bg-[#4CAF50] hover:bg-[#388E3C]" onClick={() => setView('apply')}>
                Apply for {selectedProduct.name}
              </Button>
            )}
          </div>
        )}

        {view === 'apply' && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setView('quotes')} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Quotes
            </Button>

            {/* Selected Product Summary */}
            <div className="p-3 rounded-xl bg-[#4CAF50]/10 border border-[#4CAF50]/20">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedProduct?.providerDetails?.logo}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{selectedProduct?.name}</p>
                  <p className="text-xs text-gray-500">{selectedProduct?.providerDetails?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#4CAF50]">{formatCurrency(selectedProduct?.premium || 0)}</p>
                  <p className="text-[10px] text-gray-400">/month</p>
                </div>
              </div>
            </div>

            {/* Personal Details Form */}
            <div className="space-y-2.5">
              <p className="text-xs font-medium text-gray-700">Personal Details</p>
              
              <div>
                <Label className="text-[10px] text-gray-500">Full Name</Label>
                <Input
                  placeholder="Enter your full name"
                  value={personalDetails.name}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, name: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-[10px] text-gray-500">SA ID Number</Label>
                <Input
                  placeholder="13-digit ID number"
                  value={personalDetails.idNumber}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, idNumber: e.target.value.replace(/\D/g, '').slice(0, 13) })}
                  className="h-9 text-xs mt-1 font-mono"
                />
              </div>

              <div>
                <Label className="text-[10px] text-gray-500">Phone Number</Label>
                <Input
                  placeholder="+27 XX XXX XXXX"
                  value={personalDetails.phone}
                  onChange={(e) => setPersonalDetails({ ...personalDetails, phone: e.target.value })}
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>

            {/* NCA/FSCA Notice */}
            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-[10px] text-blue-700">
                <strong>FSCA Regulated:</strong> This policy is issued by a licensed financial services provider.
                Your premium will be collected monthly via DebiCheck mandate.
              </p>
            </div>

            <Button
              className="w-full bg-[#4CAF50] hover:bg-[#388E3C]"
              onClick={handleApply}
              disabled={!personalDetails.name || !personalDetails.idNumber || processing}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirm & Apply
            </Button>
          </div>
        )}

        {view === 'success' && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#4CAF50] flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>

            <div>
              <p className="font-semibold text-gray-900 text-lg">Application Successful!</p>
              <p className="text-xs text-gray-500 mt-1">Your insurance policy is being processed</p>
            </div>

            {/* Reference Number */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#4CAF50]/10 to-[#00897B]/10 border border-[#4CAF50]/20">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Reference Number</p>
              <p className="text-xl font-mono font-bold text-gray-900">{applicationRef}</p>
            </div>

            {/* Policy Details */}
            <div className="p-3 rounded-lg bg-gray-50 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Provider</span>
                <span className="font-medium">{selectedProduct?.providerDetails?.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Product</span>
                <span className="font-medium">{selectedProduct?.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Monthly Premium</span>
                <span className="font-bold text-[#4CAF50]">{formatCurrency(selectedProduct?.premium || 0)}</span>
              </div>
              {selectedProduct && selectedProduct.coverAmount > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Cover Amount</span>
                  <span className="font-medium">{formatCurrency(selectedProduct.coverAmount)}</span>
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-[10px] text-amber-700">
                <strong>Next Steps:</strong> You will receive a confirmation SMS and email within 24 hours.
                Your policy documents will be sent to your registered email.
              </p>
            </div>

            <Button className="w-full bg-[#00897B] hover:bg-[#00695C]" onClick={onClose}>
              Done
            </Button>
          </div>
        )}

        <DialogFooter className="pt-2 border-t">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Shield className="w-3 h-3" /> FSCA Licensed Providers • POPIA Compliant
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Credit Marketplace Modal - Comprehensive Implementation with POPIA, Debt Counselling, GroAI Insights
type CreditView = 'main' | 'score' | 'providers' | 'quotes' | 'apply' | 'success' | 'debt-counselling' | 'insights';

interface CreditLender {
  id: string;
  name: string;
  logo: string;
  aprMin: number;
  aprMax: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
  rating: number;
  ncrRegistration: string;
}

interface CreditScore {
  score: number;
  band: { min: number; max: number; rating: string; color: string };
  lastUpdated: string;
  factors: { factor: string; score: number; weight: number }[];
  history: { date: string; score: number }[];
}

interface DebtCounsellingService {
  id: string;
  name: string;
  logo: string;
  rating: number;
  ncrRegistration: string;
  fee: string;
  features: string[];
  contact: string;
}

function CreditModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<CreditView>('main');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [personalLenders, setPersonalLenders] = useState<CreditLender[]>([]);
  const [debtCounsellingServices, setDebtCounsellingServices] = useState<DebtCounsellingService[]>([]);
  const [selectedLender, setSelectedLender] = useState<CreditLender | null>(null);
  const [loanAmount, setLoanAmount] = useState<string>('50000');
  const [loanTerm, setLoanTerm] = useState<string>('24');
  const [quotes, setQuotes] = useState<any[]>([]);
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [applicationRef, setApplicationRef] = useState<string>('');
  const [loanPurpose, setLoanPurpose] = useState<string>('personal');

  // Fetch credit data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/credit');
        const data = await res.json();
        
        if (data.success) {
          setCreditScore(data.data.creditScore);
          setPersonalLenders(data.data.personalLenders || []);
          setDebtCounsellingServices(data.data.debtCounsellingServices || []);
          setActiveLoans(data.data.activeLoans || []);
          setInsights(data.data.creditInsights || []);
        }
      } catch (error) {
        console.error('Failed to fetch credit data:', error);
        toast.error('Failed to load credit data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Calculate quotes
  useEffect(() => {
    if (loanAmount && loanTerm) {
      calculateQuotes();
    }
  }, [loanAmount, loanTerm, personalLenders]);

  const calculateQuotes = () => {
    const amount = parseFloat(loanAmount);
    const term = parseInt(loanTerm);
    
    const calculatedQuotes = personalLenders.map(lender => {
      const apr = (lender.aprMin + lender.aprMax) / 2;
      const monthlyRate = apr / 100 / 12;
      const monthlyPayment = amount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
      const totalRepayment = monthlyPayment * term;
      
      return {
        lender,
        loanAmount: amount,
        term,
        apr,
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        totalRepayment: Math.round(totalRepayment * 100) / 100,
        totalInterest: Math.round((totalRepayment - amount) * 100) / 100,
      };
    }).sort((a, b) => a.monthlyPayment - b.monthlyPayment);
    
    setQuotes(calculatedQuotes);
  };

  // Apply for loan
  const handleApply = async () => {
    if (!selectedLender || !loanAmount) {
      toast.error('Please select a lender and enter loan amount');
      return;
    }
    
    setProcessing(true);
    try {
      const res = await fetch('/api/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lenderId: selectedLender.id,
          amount: parseFloat(loanAmount),
          term: parseInt(loanTerm),
          type: loanPurpose,
          purpose: loanPurpose
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setApplicationRef(data.data.id);
        setView('success');
        toast.success('Loan application submitted!');
      } else {
        toast.error(data.error || 'Failed to submit application');
      }
    } catch {
      toast.error('Failed to process application');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`;

  const getScoreColor = (score: number) => {
    if (score >= 750) return '#8B5CF6';
    if (score >= 700) return '#3B82F6';
    if (score >= 650) return '#10B981';
    if (score >= 550) return '#F59E0B';
    return '#EF4444';
  };

  if (loading && view === 'main') {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Credit Marketplace</DialogTitle>
            </VisuallyHidden>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#00897B]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#FF5722]" />
            Credit Marketplace
          </DialogTitle>
          <DialogDescription>
            10 NCR-registered lenders • Compare & apply instantly
          </DialogDescription>
        </DialogHeader>

        {view === 'main' && (
          <div className="space-y-3">
            {/* Credit Score Card - POPIA Compliant */}
            {creditScore && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-gray-800 to-gray-900 text-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-white/60">Your Credit Score</p>
                      <p className="text-2xl font-bold">{creditScore.score}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge style={{ backgroundColor: getScoreColor(creditScore.score) }} className="text-white">
                      {creditScore.band?.rating}
                    </Badge>
                    <p className="text-[10px] text-white/60 mt-1">POPIA Compliant</p>
                  </div>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ width: `${((creditScore.score - 300) / 550) * 100}%`, backgroundColor: getScoreColor(creditScore.score) }}
                  />
                </div>
                <p className="text-[10px] text-white/50 mt-2">
                  Last updated: {new Date(creditScore.lastUpdated).toLocaleDateString('en-ZA')}
                </p>
              </div>
            )}

            {/* GroAI Credit Insights */}
            {insights.length > 0 && (
              <div className="p-2.5 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-[10px] font-semibold text-purple-700">GroAI Credit Health</span>
                </div>
                {insights.slice(0, 2).map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 mb-1">
                    <span>{insight.icon}</span>
                    <p className="text-[10px] text-gray-700">{insight.message}</p>
                  </div>
                ))}
                <Button variant="link" size="sm" className="h-5 p-0 text-[10px] text-purple-600" onClick={() => setView('insights')}>
                  View all insights →
                </Button>
              </div>
            )}

            {/* Active Loans */}
            {activeLoans.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs font-medium text-amber-800 mb-1">Active Loans ({activeLoans.length})</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-amber-900">{formatCurrency(activeLoans.reduce((s, l) => s + l.outstanding, 0))}</p>
                    <p className="text-[10px] text-amber-600">Total outstanding</p>
                  </div>
                  <Badge className="bg-amber-100 text-amber-800">Active</Badge>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setView('providers')}
                className="p-3 rounded-xl border border-gray-200 hover:border-[#FF5722] hover:bg-[#FF5722]/5 transition-all text-left"
              >
                <CreditCard className="w-5 h-5 text-[#FF5722] mb-1" />
                <p className="font-medium text-gray-900 text-xs">Get a Loan</p>
                <p className="text-[10px] text-gray-500">Compare 10 lenders</p>
              </button>
              <button
                onClick={() => setView('debt-counselling')}
                className="p-3 rounded-xl border border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
              >
                <PiggyBank className="w-5 h-5 text-purple-500 mb-1" />
                <p className="font-medium text-gray-900 text-xs">Debt Help</p>
                <p className="text-[10px] text-gray-500">NCR counsellors</p>
              </button>
            </div>

            {/* Credit Score Factors */}
            {creditScore?.factors && (
              <div className="p-2.5 rounded-lg bg-gray-50">
                <p className="text-xs font-medium text-gray-700 mb-2">Score Factors</p>
                <div className="space-y-1.5">
                  {creditScore.factors.slice(0, 3).map((factor, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-[10px] text-gray-600">{factor.factor}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00897B] rounded-full" style={{ width: `${factor.score}%` }} />
                        </div>
                        <span className="text-[10px] font-medium text-gray-700 w-6">{factor.score}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Provider Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-[#FF5722]">10</p>
                <p className="text-[10px] text-gray-500">Lenders</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-[#00897B]">NCR</p>
                <p className="text-[10px] text-gray-500">Registered</p>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-amber-500">24h</p>
                <p className="text-[10px] text-gray-500">Response</p>
              </div>
            </div>
          </div>
        )}

        {view === 'providers' && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setView('main')} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            {/* Loan Calculator */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#FF5722]/10 to-[#E91E63]/10 border border-[#FF5722]/20">
              <p className="text-xs font-medium text-gray-700 mb-2">Loan Calculator</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <Label className="text-[10px] text-gray-500">Amount</Label>
                  <Input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    className="h-9 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-500">Term (months)</Label>
                  <Select value={loanTerm} onValueChange={setLoanTerm}>
                    <SelectTrigger className="h-9 text-sm mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                      <SelectItem value="36">36 months</SelectItem>
                      <SelectItem value="48">48 months</SelectItem>
                      <SelectItem value="60">60 months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-[10px] text-gray-500">Purpose</Label>
                <Select value={loanPurpose} onValueChange={setLoanPurpose}>
                  <SelectTrigger className="h-9 text-sm mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="debt_consolidation">Debt Consolidation</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quote Comparison */}
            <p className="text-xs font-medium text-gray-700">Top Offers for You</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {quotes.slice(0, 8).map((quote, idx) => (
                <div
                  key={quote.lender.id}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedLender?.id === quote.lender.id
                      ? 'border-[#FF5722] bg-[#FF5722]/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                  onClick={() => setSelectedLender(quote.lender)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{quote.lender.logo}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-xs">{quote.lender.name}</p>
                        <p className="text-[10px] text-gray-500">NCR: {quote.lender.ncrRegistration}</p>
                      </div>
                    </div>
                    {idx === 0 && <Badge className="bg-green-100 text-green-700 text-[9px]">Best Rate</Badge>}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-1.5 bg-gray-50 rounded">
                      <p className="text-[9px] text-gray-500">Monthly</p>
                      <p className="text-xs font-bold text-gray-900">{formatCurrency(quote.monthlyPayment)}</p>
                    </div>
                    <div className="p-1.5 bg-gray-50 rounded">
                      <p className="text-[9px] text-gray-500">APR</p>
                      <p className="text-xs font-bold text-gray-900">{quote.apr.toFixed(1)}%</p>
                    </div>
                    <div className="p-1.5 bg-gray-50 rounded">
                      <p className="text-[9px] text-gray-500">Total</p>
                      <p className="text-xs font-bold text-gray-900">{formatCurrency(quote.totalRepayment)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[9px] text-amber-500">★{quote.lender.rating}</span>
                    <span className="text-[9px] text-gray-400">• Max R{quote.lender.maxAmount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {selectedLender && (
              <Button className="w-full bg-[#FF5722] hover:bg-[#E64A19]" onClick={() => setView('apply')}>
                Apply with {selectedLender.name}
              </Button>
            )}
          </div>
        )}

        {view === 'apply' && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setView('providers')} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            {/* Selected Lender */}
            <div className="p-3 rounded-xl bg-[#FF5722]/10 border border-[#FF5722]/20">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedLender?.logo}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">{selectedLender?.name}</p>
                  <p className="text-[10px] text-gray-500">NCR: {selectedLender?.ncrRegistration}</p>
                </div>
              </div>
            </div>

            {/* Loan Summary */}
            <div className="p-3 rounded-lg bg-gray-50 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Loan Amount</span>
                <span className="font-medium">{formatCurrency(parseFloat(loanAmount))}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Term</span>
                <span className="font-medium">{loanTerm} months</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Purpose</span>
                <span className="font-medium capitalize">{loanPurpose.replace('_', ' ')}</span>
              </div>
              {quotes.length > 0 && (
                <>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Est. Monthly Payment</span>
                    <span className="font-bold text-[#FF5722]">{formatCurrency(quotes.find(q => q.lender.id === selectedLender?.id)?.monthlyPayment || 0)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Est. Total Interest</span>
                    <span className="font-medium text-amber-600">{formatCurrency(quotes.find(q => q.lender.id === selectedLender?.id)?.totalInterest || 0)}</span>
                  </div>
                </>
              )}
            </div>

            {/* NCA Disclosure */}
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-[10px] font-semibold text-amber-800 mb-1">NCA Disclosure</p>
              <div className="text-[9px] text-amber-700 space-y-0.5">
                <p>• Credit Provider: {selectedLender?.name} ({selectedLender?.ncrRegistration})</p>
                <p>• Interest Rate: {selectedLender?.aprMin}% - {selectedLender?.aprMax}% (variable)</p>
                <p>• Initiation Fee: R165 + 10% (NCA regulated)</p>
                <p>• Monthly Service Fee: R69 (NCA regulated)</p>
                <p>• Cooling-Off Period: 5 Business Days</p>
              </div>
            </div>

            <Button
              className="w-full bg-[#FF5722] hover:bg-[#E64A19]"
              onClick={handleApply}
              disabled={processing}
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Application
            </Button>
          </div>
        )}

        {view === 'success' && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#FF5722] flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>

            <div>
              <p className="font-semibold text-gray-900 text-lg">Application Submitted!</p>
              <p className="text-xs text-gray-500 mt-1">You'll receive a response within 24-48 hours</p>
            </div>

            {/* Reference Number */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#FF5722]/10 to-[#E91E63]/10 border border-[#FF5722]/20">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">Reference Number</p>
              <p className="text-xl font-mono font-bold text-gray-900">{applicationRef}</p>
            </div>

            {/* Loan Details */}
            <div className="p-3 rounded-lg bg-gray-50 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Lender</span>
                <span className="font-medium">{selectedLender?.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Amount Requested</span>
                <span className="font-medium">{formatCurrency(parseFloat(loanAmount))}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Term</span>
                <span className="font-medium">{loanTerm} months</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Purpose</span>
                <span className="font-medium capitalize">{loanPurpose.replace('_', ' ')}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-[10px] text-blue-700">
                <strong>Next Steps:</strong> The lender will contact you via SMS and email with their credit decision.
                Have your proof of income and 3 months bank statements ready.
              </p>
            </div>

            <Button className="w-full bg-[#00897B] hover:bg-[#00695C]" onClick={onClose}>
              Done
            </Button>
          </div>
        )}

        {view === 'debt-counselling' && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setView('main')} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            <div className="p-3 rounded-xl bg-purple-50 border border-purple-100">
              <div className="flex items-center gap-2 mb-2">
                <PiggyBank className="w-5 h-5 text-purple-600" />
                <p className="font-semibold text-gray-900 text-sm">Debt Counselling Services</p>
              </div>
              <p className="text-xs text-gray-600">
                NCR-registered debt counsellors can help you manage your debt, negotiate with creditors,
                and create an affordable repayment plan.
              </p>
            </div>

            {/* Debt Services */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {debtCounsellingServices.map((service) => (
                <div key={service.id} className="p-3 rounded-xl border border-gray-100 hover:border-purple-200">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-xl">{service.logo}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-xs">{service.name}</p>
                      <p className="text-[10px] text-gray-500">{service.ncrRegistration}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-purple-600">{service.fee}</p>
                      <p className="text-[10px] text-amber-500">★{service.rating}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {service.features.map((feature, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 bg-gray-100 rounded-full text-gray-600">{feature}</span>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">📞 {service.contact}</span>
                    <Button size="sm" variant="outline" className="h-7 text-[10px]">Contact</Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Info */}
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-[10px] text-amber-700">
                <strong>Free Assessment:</strong> All debt counsellors offer a free initial assessment.
                You are under no obligation until you sign a debt review agreement.
              </p>
            </div>
          </div>
        )}

        {view === 'insights' && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setView('main')} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <p className="font-semibold text-gray-900 text-sm">GroAI Credit Insights</p>
            </div>

            {/* Insights List */}
            <div className="space-y-2">
              {insights.map((insight, idx) => (
                <div key={idx} className={`p-3 rounded-xl ${
                  insight.type === 'positive' ? 'bg-green-50 border border-green-200' :
                  insight.type === 'warning' ? 'bg-amber-50 border border-amber-200' :
                  insight.type === 'tip' ? 'bg-blue-50 border border-blue-200' :
                  'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{insight.icon}</span>
                    <div>
                      <p className="text-xs font-medium text-gray-800">{insight.message}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5">{insight.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Improvement Tips */}
            <div className="p-3 rounded-xl bg-gradient-to-r from-[#00897B]/10 to-[#43A047]/10 border border-[#00897B]/20">
              <p className="text-xs font-medium text-gray-700 mb-2">Tips to Improve Your Score</p>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-600">Pay all accounts on time</span>
                  <span className="text-[10px] font-medium text-green-600">+15 points</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-600">Reduce credit utilization to 30%</span>
                  <span className="text-[10px] font-medium text-green-600">+20 points</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-600">Avoid applying for new credit</span>
                  <span className="text-[10px] font-medium text-green-600">+5 points</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-600">Keep old accounts open</span>
                  <span className="text-[10px] font-medium text-green-600">+10 points</span>
                </div>
              </div>
            </div>

            {/* POPIA Notice */}
            <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
              <p className="text-[10px] text-gray-600">
                <strong>POPIA Compliance:</strong> Your credit information is retrieved from registered
                credit bureaus (TransUnion, Experian, Compuscan, XDS) in compliance with the Protection
                of Personal Information Act. You have the right to access, correct, and object to processing.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 border-t">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> NCR Registered Lenders • POPIA Compliant
          </span>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// BNPL Modal - Comprehensive NCA-compliant implementation
interface BNPLMerchant {
  id: string;
  businessName: string;
  category?: string;
  logo?: string | null;
  province?: string;
}

interface BNPLEligibility {
  eligible: boolean;
  creditScore: number;
  limit: number;
  available: number;
  tier: string;
  requirements: { text: string; met: boolean }[];
}

interface BNPLPlan {
  id: string;
  agreementNumber: string;
  merchantName: string;
  purchaseAmount: number;
  instalmentAmount: number;
  paidInstalments: number;
  totalInstalments: number;
  nextDueDate: string;
  status: string;
  BNPLInstalment: { instalmentNumber: number; amount: number; dueDate: string; status: string }[];
}

function BNPLModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'eligibility' | 'form' | 'confirm' | 'success' | 'plans'>('eligibility');
  const [amount, setAmount] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<BNPLMerchant | null>(null);
  const [description, setDescription] = useState('');
  const [merchants, setMerchants] = useState<BNPLMerchant[]>([]);
  const [eligibility, setEligibility] = useState<BNPLEligibility | null>(null);
  const [existingPlans, setExistingPlans] = useState<BNPLPlan[]>([]);
  const [createdPlan, setCreatedPlan] = useState<BNPLPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [merchantSearch, setMerchantSearch] = useState('');

  // Fetch eligibility and merchants on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [eligibilityRes, merchantsRes, plansRes] = await Promise.all([
          fetch('/api/bnpl?action=eligibility'),
          fetch('/api/bnpl?action=merchants'),
          fetch('/api/bnpl?action=plans'),
        ]);
        
        const eligibilityData = await eligibilityRes.json();
        const merchantsData = await merchantsRes.json();
        const plansData = await plansRes.json();
        
        if (eligibilityData.success) {
          setEligibility(eligibilityData.data);
        }
        if (merchantsData.success) {
          setMerchants(merchantsData.data);
        }
        if (plansData.success) {
          setExistingPlans(plansData.data);
        }
      } catch (error) {
        console.error('Failed to fetch BNPL data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Calculate instalments
  const instalmentAmount = amount ? Math.round((parseFloat(amount) / 3) * 100) / 100 : 0;
  const totalAmount = instalmentAmount * 3;
  
  // Calculate due dates
  const getDueDates = () => {
    const dates = [];
    const now = new Date();
    for (let i = 0; i < 3; i++) {
      const due = new Date(now);
      due.setMonth(due.getMonth() + i);
      dates.push(due.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }));
    }
    return dates;
  };
  
  const dueDates = getDueDates();

  // Filter merchants
  const filteredMerchants = merchants.filter(m => 
    m.businessName.toLowerCase().includes(merchantSearch.toLowerCase()) ||
    (m.category && m.category.toLowerCase().includes(merchantSearch.toLowerCase()))
  );

  // Check if can proceed
  const canProceed = eligibility?.eligible && 
    parseFloat(amount) >= 500 && 
    parseFloat(amount) <= (eligibility?.available || 0) &&
    selectedMerchant !== null;

  // Create BNPL agreement
  const handleCreateAgreement = async () => {
    if (!selectedMerchant || !amount) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/bnpl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          merchantId: selectedMerchant.id,
          merchantName: selectedMerchant.businessName,
          purchaseAmount: parseFloat(amount),
          purchaseDescription: description,
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setCreatedPlan(data.data);
        setStep('success');
        toast.success('BNPL agreement created successfully!');
      } else {
        toast.error(data.error || 'Failed to create agreement');
      }
    } catch {
      toast.error('Failed to create agreement');
    } finally {
      setLoading(false);
    }
  };

  // Pay instalment
  const handlePayInstalment = async (instalmentId: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/bnpl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay',
          instalmentId,
          paymentMethod: 'wallet',
        }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        // Refresh plans
        const plansRes = await fetch('/api/bnpl?action=plans');
        const plansData = await plansRes.json();
        if (plansData.success) {
          setExistingPlans(plansData.data);
        }
      } else {
        toast.error(data.error || 'Failed to pay instalment');
      }
    } catch {
      toast.error('Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#E91E63]" />
            Buy Now, Pay Later
          </DialogTitle>
          <DialogDescription>
            Pay in 3 interest-free instalments • NCA Compliant
          </DialogDescription>
        </DialogHeader>

        {loading && !eligibility ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#00897B]" />
          </div>
        ) : (
          <>
            {/* Step: Existing Plans or Eligibility Check */}
            {step === 'eligibility' && (
              <div className="space-y-3">
                {/* Credit Limit Card */}
                {eligibility && (
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#E91E63]/10 to-[#9C27B0]/10 border border-[#E91E63]/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-600">BNPL Limit</span>
                      <Badge className="bg-[#E91E63] text-white text-[10px] capitalize">{eligibility.tier}</Badge>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(eligibility.available)}</p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Credit Score: {eligibility.creditScore} • Used: {formatCurrency(eligibility.limit - eligibility.available)}
                    </p>
                  </div>
                )}

                {/* Eligibility Requirements */}
                {eligibility && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-gray-700">Eligibility Requirements</p>
                    {eligibility.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        {req.met ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-gray-300" />
                        )}
                        <span className={req.met ? 'text-gray-700' : 'text-gray-400'}>{req.text}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Existing Plans */}
                {existingPlans.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-700">Active Plans ({existingPlans.length})</p>
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-[#00897B]" onClick={() => setStep('plans')}>
                        View All
                      </Button>
                    </div>
                    {existingPlans.slice(0, 2).map((plan) => (
                      <div key={plan.id} className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium">{plan.merchantName}</span>
                          <Badge variant="outline" className="text-[10px]">{plan.status}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-500">
                          <span>{plan.paidInstalments}/{plan.totalInstalments} paid</span>
                          <span>{formatCurrency(plan.outstandingAmount)} remaining</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  {eligibility?.eligible ? (
                    <Button 
                      className="w-full bg-[#E91E63] hover:bg-[#C2185B]" 
                      onClick={() => setStep('form')}
                    >
                      Create New BNPL Plan
                    </Button>
                  ) : (
                    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                      <p className="text-xs text-amber-800">
                        <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                        You are not currently eligible for BNPL. Complete the requirements above.
                      </p>
                    </div>
                  )}
                  {existingPlans.length > 0 && (
                    <Button variant="outline" className="w-full" onClick={() => setStep('plans')}>
                      View My Plans
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Step: Create Form */}
            {step === 'form' && (
              <div className="space-y-3">
                {/* Amount Input */}
                <div>
                  <Label className="text-xs font-medium">Purchase Amount (R)</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount (min R500)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 h-10 text-lg font-medium"
                  />
                  {amount && parseFloat(amount) < 500 && (
                    <p className="text-[10px] text-red-500 mt-1">Minimum purchase is R500</p>
                  )}
                  {eligibility && amount && parseFloat(amount) > eligibility.available && (
                    <p className="text-[10px] text-red-500 mt-1">Amount exceeds your available limit</p>
                  )}
                </div>

                {/* Merchant Selection */}
                <div>
                  <Label className="text-xs font-medium">Select Merchant</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search merchants..."
                      value={merchantSearch}
                      onChange={(e) => setMerchantSearch(e.target.value)}
                      className="pl-9 h-9 text-sm"
                    />
                  </div>
                  <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                    {filteredMerchants.slice(0, 5).map((merchant) => (
                      <button
                        key={merchant.id}
                        className={`w-full p-2 rounded-lg border text-left text-xs transition-all ${
                          selectedMerchant?.id === merchant.id 
                            ? 'border-[#E91E63] bg-[#E91E63]/5' 
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                        onClick={() => setSelectedMerchant(merchant)}
                      >
                        <span className="font-medium">{merchant.businessName}</span>
                        {merchant.category && (
                          <span className="text-gray-500 ml-1">• {merchant.category}</span>
                        )}
                      </button>
                    ))}
                    {filteredMerchants.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">No merchants found</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label className="text-xs font-medium">Description (optional)</Label>
                  <Input
                    placeholder="What are you buying?"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 h-9 text-sm"
                  />
                </div>

                {/* Instalment Calculator */}
                {amount && parseFloat(amount) >= 500 && (
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#E91E63]/5 to-[#9C27B0]/5 border border-[#E91E63]/20">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Payment Schedule</p>
                    <div className="space-y-2">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/60">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              i === 0 ? 'bg-[#E91E63] text-white' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {i + 1}
                            </div>
                            <div>
                              <p className="text-xs font-medium">{i === 0 ? 'Today' : `Month ${i + 1}`}</p>
                              <p className="text-[10px] text-gray-500">{dueDates[i]}</p>
                            </div>
                          </div>
                          <p className="text-sm font-bold text-gray-900">{formatCurrency(instalmentAmount)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-200/50 flex items-center justify-between">
                      <span className="text-xs text-gray-600">Total (Interest-Free)</span>
                      <span className="text-sm font-bold text-[#E91E63]">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setStep('eligibility')} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    size="sm" 
                    disabled={!canProceed}
                    className="flex-1 bg-[#E91E63] hover:bg-[#C2185B]"
                    onClick={() => setStep('confirm')}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Confirmation */}
            {step === 'confirm' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 mb-1">Purchase Summary</p>
                  <p className="text-lg font-bold">{formatCurrency(totalAmount)}</p>
                  <p className="text-xs text-gray-600">{selectedMerchant?.businessName}</p>
                  {description && <p className="text-[10px] text-gray-400 mt-1">{description}</p>}
                </div>

                {/* NCA Disclosure */}
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-xs font-semibold text-amber-800 mb-2">NCA Disclosure</p>
                  <div className="text-[10px] text-amber-700 space-y-1">
                    <p>• Credit Provider: Groway BNPL (NCR CP XXXX)</p>
                    <p>• Agreement Type: Incidental Credit Agreement</p>
                    <p>• Interest Rate: 0% (Interest-Free)</p>
                    <p>• Initiation Fee: R0</p>
                    <p>• Monthly Service Fee: R0</p>
                    <p>• Cooling-Off Period: 5 Business Days</p>
                    <p>• Late Fee: 5% of instalment amount</p>
                  </div>
                </div>

                {/* Terms Acceptance */}
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#E91E63] focus:ring-[#E91E63]"
                  />
                  <span className="text-xs text-gray-600">
                    I accept the <span className="text-[#E91E63] font-medium">Terms & Conditions</span> and 
                    acknowledge the NCA disclosure
                  </span>
                </label>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setStep('form')} className="flex-1">
                    Back
                  </Button>
                  <Button 
                    size="sm" 
                    disabled={!acceptedTerms || loading}
                    className="flex-1 bg-[#E91E63] hover:bg-[#C2185B]"
                    onClick={handleCreateAgreement}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Accept & Create'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step: Success */}
            {step === 'success' && createdPlan && (
              <div className="space-y-4 text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">BNPL Plan Created!</p>
                  <p className="text-xs text-gray-500 mt-1">Agreement #{createdPlan.agreementNumber}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 text-left">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Merchant</span>
                    <span className="font-medium">{createdPlan.merchantName}</span>
                  </div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Total Amount</span>
                    <span className="font-medium">{formatCurrency(createdPlan.purchaseAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">First Payment</span>
                    <span className="font-medium text-[#E91E63]">{formatCurrency(createdPlan.instalmentAmount)}</span>
                  </div>
                </div>
                <Button className="w-full bg-[#00897B] hover:bg-[#00695C]" onClick={onClose}>
                  Done
                </Button>
              </div>
            )}

            {/* Step: View Plans */}
            {step === 'plans' && (
              <div className="space-y-3">
                <Button variant="ghost" size="sm" onClick={() => setStep('eligibility')} className="mb-2">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                
                {existingPlans.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No active BNPL plans</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {existingPlans.map((plan) => (
                      <div key={plan.id} className="p-3 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="text-sm font-medium">{plan.merchantName}</p>
                            <p className="text-[10px] text-gray-400">#{plan.agreementNumber}</p>
                          </div>
                          <Badge variant={plan.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                            {plan.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-center mb-2">
                          <div className="p-1.5 rounded bg-gray-50">
                            <p className="text-[10px] text-gray-500">Total</p>
                            <p className="text-xs font-medium">{formatCurrency(plan.purchaseAmount)}</p>
                          </div>
                          <div className="p-1.5 rounded bg-gray-50">
                            <p className="text-[10px] text-gray-500">Paid</p>
                            <p className="text-xs font-medium text-green-600">{plan.paidInstalments}/{plan.totalInstalments}</p>
                          </div>
                          <div className="p-1.5 rounded bg-gray-50">
                            <p className="text-[10px] text-gray-500">Remaining</p>
                            <p className="text-xs font-medium text-[#E91E63]">{formatCurrency(plan.outstandingAmount)}</p>
                          </div>
                        </div>

                        {/* Instalments */}
                        <div className="space-y-1">
                          {plan.BNPLInstalment.map((inst) => (
                            <div key={inst.instalmentNumber} className="flex items-center justify-between p-1.5 rounded bg-gray-50">
                              <div className="flex items-center gap-2">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${
                                  inst.status === 'paid' ? 'bg-green-100 text-green-600' : 
                                  inst.status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {inst.status === 'paid' ? '✓' : inst.instalmentNumber}
                                </div>
                                <span className="text-[10px] text-gray-500">
                                  {new Date(inst.dueDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium">{formatCurrency(inst.amount)}</span>
                                {inst.status === 'pending' && (
                                  <Button 
                                    size="sm" 
                                    className="h-6 text-[10px] px-2 bg-[#E91E63] hover:bg-[#C2185B]"
                                    onClick={() => handlePayInstalment(inst.id)}
                                    disabled={loading}
                                  >
                                    Pay
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// PayPlus Modal (EWA) - Comprehensive Implementation
function PayPlusModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [calculatedFee, setCalculatedFee] = useState<any>(null);
  const [activeView, setActiveView] = useState<'main' | 'history'>('main');

  // Fetch Pay+ status on mount
  useEffect(() => {
    const fetchPayPlusData = async () => {
      try {
        setLoading(true);
        const [statusRes, historyRes] = await Promise.all([
          fetch('/api/payplus?action=status'),
          fetch('/api/payplus?action=history'),
        ]);
        
        const statusJson = await statusRes.json();
        const historyJson = await historyRes.json();
        
        if (statusJson.success) {
          setStatusData(statusJson.data);
        }
        if (historyJson.success) {
          setHistoryData(historyJson.data);
        }
      } catch (error) {
        console.error('Failed to fetch Pay+ data:', error);
        toast.error('Failed to load Pay+ data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPayPlusData();
  }, []);

  // Calculate fee when amount changes
  useEffect(() => {
    const calculateFee = async () => {
      if (!advanceAmount || parseFloat(advanceAmount) <= 0) {
        setCalculatedFee(null);
        return;
      }
      
      try {
        const res = await fetch(`/api/payplus?action=calculate&amount=${advanceAmount}`);
        const data = await res.json();
        if (data.success) {
          setCalculatedFee(data.data);
        }
      } catch (error) {
        console.error('Failed to calculate fee:', error);
      }
    };
    
    calculateFee();
  }, [advanceAmount]);

  // Handle advance request
  const handleRequestAdvance = async () => {
    if (!advanceAmount || parseFloat(advanceAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/payplus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(advanceAmount),
          employeeId: statusData?.employee?.id,
          merchantId: statusData?.employee?.merchantId,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(data.data.message);
        setShowConfirm(false);
        setAdvanceAmount('');
        // Refresh status
        const statusRes = await fetch('/api/payplus?action=status');
        const statusJson = await statusRes.json();
        if (statusJson.success) {
          setStatusData(statusJson.data);
        }
      } else {
        toast.error(data.error || 'Failed to process advance');
      }
    } catch {
      toast.error('Failed to process advance');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `R ${amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Loading state
  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Pay+ Early Wage Access</DialogTitle>
            </VisuallyHidden>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#00897B]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Not eligible state
  if (statusData && !statusData.eligible) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Pay+ Early Wage Access
            </DialogTitle>
            <DialogDescription>Access your earned wages before payday</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-800">Not Yet Eligible</p>
            <p className="text-xs text-gray-600 mt-2">{statusData.reason || 'Please contact your employer to enable Pay+.'}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Demo mode for unregistered users
  const isDemo = statusData && !statusData.registered;
  const displayData = statusData?.demo || statusData;
  const availableAdvance = statusData?.accrual?.availableAdvance || displayData?.maxAdvance || 0;
  const canRequest = statusData?.canRequest ?? (availableAdvance >= 100);

  // History view
  if (activeView === 'history') {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#00897B]" />
              Advance History
            </DialogTitle>
            <DialogDescription>Your recent Pay+ advances</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto -mx-4 px-4">
            {historyData.length > 0 ? (
              <div className="space-y-2">
                {historyData.map((advance, idx) => (
                  <div key={idx} className="p-3 rounded-lg border bg-gray-50">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{advance.referenceNumber}</p>
                        <p className="text-[10px] text-gray-500">{formatDate(advance.createdAt)}</p>
                      </div>
                      <Badge variant={advance.status === 'settled' ? 'default' : 'secondary'} className="text-[10px]">
                        {advance.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div>
                        <p className="text-[10px] text-gray-500">Amount</p>
                        <p className="text-sm font-semibold text-[#00897B]">{formatCurrency(advance.requestedAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500">Repay</p>
                        <p className="text-xs text-gray-600">{formatDate(advance.repaymentDate)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 pt-2 border-t">
                      <div>
                        <p className="text-[10px] text-gray-500">Fee</p>
                        <p className="text-xs text-gray-600">-{formatCurrency(advance.serviceFeeAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500">Net</p>
                        <p className="text-xs font-medium text-green-600">{formatCurrency(advance.netAmount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">No advance history yet</p>
              </div>
            )}
          </div>
          <DialogFooter className="mt-2">
            <Button variant="outline" size="sm" onClick={() => setActiveView('main')}>Back</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Confirmation view
  if (showConfirm && calculatedFee) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Confirm Advance
            </DialogTitle>
            <DialogDescription>Review your advance details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Amount Summary */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-amber-700">Request Amount</span>
                <span className="text-lg font-bold text-amber-600">{formatCurrency(calculatedFee.requestedAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-amber-700">
                <span>Service Fee ({calculatedFee.serviceFeePercent}%)</span>
                <span>-{formatCurrency(calculatedFee.serviceFee)}</span>
              </div>
              <div className="border-t border-amber-200 mt-2 pt-2 flex justify-between items-center">
                <span className="text-sm font-medium text-amber-800">You Receive</span>
                <span className="text-xl font-bold text-green-600">{formatCurrency(calculatedFee.netAmount)}</span>
              </div>
            </div>

            {/* Repayment Info */}
            <div className="p-3 rounded-lg bg-gray-50 border">
              <p className="text-xs font-medium text-gray-700 mb-1">Repayment Schedule</p>
              <p className="text-xs text-gray-600">
                The advance will be automatically deducted from your next payday salary on {' '}
                <span className="font-medium">{displayData?.nextPayDay ? formatDate(displayData.nextPayDay) : 'your next payday'}</span>.
              </p>
            </div>

            {/* Compliance Info */}
            <div className="p-2 rounded bg-blue-50 border border-blue-100">
              <p className="text-[10px] text-blue-700">
                ✓ NCA Compliant • No Interest • Flat Fee Only • Auto Payroll Deduction
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowConfirm(false)} disabled={processing}>Cancel</Button>
            <Button size="sm" onClick={handleRequestAdvance} disabled={processing} className="bg-green-600 hover:bg-green-700">
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
              Confirm Advance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Main view
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Pay+ Early Wage Access
          </DialogTitle>
          <DialogDescription>Access up to 60% of your accrued salary</DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto -mx-4 px-4 space-y-3">
          {/* Available Amount Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-amber-700">Available Advance</span>
              {isDemo && <Badge variant="outline" className="text-[10px] bg-white">Demo</Badge>}
            </div>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(availableAdvance)}</p>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-amber-700">
              <BadgeCheck className="w-3.5 h-3.5" />
              <span>Based on {displayData?.daysWorked || 15} days worked this period</span>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-lg bg-gray-50 border">
              <p className="text-[10px] text-gray-500">Daily Rate</p>
              <p className="text-sm font-semibold text-gray-800">{formatCurrency(displayData?.dailyRate || 833.33)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-50 border">
              <p className="text-[10px] text-gray-500">Days Until Payday</p>
              <p className="text-sm font-semibold text-gray-800">{displayData?.daysUntilPayday || 10} days</p>
            </div>
          </div>

          {/* Monthly Limits */}
          {statusData?.limits && (
            <div className="p-2.5 rounded-lg bg-gray-50 border">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600">Advances this month</span>
                <span className="font-medium text-gray-800">
                  {statusData.limits.advancesThisMonth}/{statusData.limits.maxAdvancesPerMonth}
                </span>
              </div>
              <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#00897B] rounded-full transition-all"
                  style={{ width: `${(statusData.limits.advancesThisMonth / statusData.limits.maxAdvancesPerMonth) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Advance Amount Input */}
          <div className="space-y-2">
            <Label className="text-xs font-medium text-gray-700">How much do you need?</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R</span>
              <Input
                type="number"
                placeholder="0.00"
                value={advanceAmount}
                onChange={(e) => setAdvanceAmount(e.target.value)}
                className="pl-8 h-11 text-lg font-semibold"
                disabled={!canRequest}
              />
            </div>
            {/* Quick amount buttons */}
            <div className="flex gap-1.5">
              {[500, 1000, 2000, 3000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAdvanceAmount(amt.toString())}
                  disabled={!canRequest || amt > availableAdvance}
                  className="flex-1 py-1.5 text-[10px] font-medium rounded-md border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  R{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Fee Breakdown */}
          {calculatedFee && (
            <div className="p-3 rounded-lg border bg-white">
              <p className="text-xs font-medium text-gray-700 mb-2">Fee Breakdown</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600">Requested</span>
                  <span className="font-medium">{formatCurrency(calculatedFee.requestedAmount)}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Service Fee (2.5%)</span>
                  <span>-{formatCurrency(calculatedFee.serviceFee)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t font-semibold text-green-600">
                  <span>You Receive</span>
                  <span>{formatCurrency(calculatedFee.netAmount)}</span>
                </div>
              </div>
              {!calculatedFee.canAfford && (
                <p className="mt-2 text-[10px] text-red-600">Amount exceeds available balance</p>
              )}
            </div>
          )}

          {/* Features */}
          <div className="p-3 rounded-lg bg-gray-50 border">
            <p className="text-xs font-medium text-gray-700 mb-2">Pay+ Benefits</p>
            <div className="space-y-1 text-[10px] text-gray-600">
              <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> No interest charged</p>
              <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Instant wallet credit</p>
              <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> Auto payroll deduction</p>
              <p className="flex items-center gap-1.5"><Check className="w-3 h-3 text-green-500" /> NCA compliant</p>
            </div>
          </div>

          {/* History Link */}
          <button 
            onClick={() => setActiveView('history')}
            className="w-full py-2 text-xs text-[#00897B] font-medium flex items-center justify-center gap-1.5 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            View Advance History
          </button>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button 
            size="sm" 
            onClick={() => setShowConfirm(true)}
            disabled={!canRequest || !advanceAmount || !calculatedFee?.canAfford}
            className="bg-[#00897B] hover:bg-[#00695C]"
          >
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Comprehensive Laybye Modal with Merchant Sync
function LaybyeModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<'create' | 'active' | 'history' | 'detail'>('active');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state for creating laybye
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [termMonths, setTermMonths] = useState(6);
  
  // Data state
  const [merchants, setMerchants] = useState<Array<{id: string; name: string; category?: string; location?: string}>>([]);
  const [laybyes, setLaybyes] = useState<Array<any>>([]);
  const [selectedLaybye, setSelectedLaybye] = useState<any>(null);
  const [stats, setStats] = useState<any>({});
  const [config, setConfig] = useState<any>({});
  
  // Payment state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelPreview, setCancelPreview] = useState<any>(null);

  // Fetch laybye data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [laybyeRes, merchantsRes] = await Promise.all([
          fetch('/api/laybye'),
          fetch('/api/laybye?action=merchants')
        ]);
        
        const laybyeData = await laybyeRes.json();
        const merchantsData = await merchantsRes.json();
        
        if (laybyeData.success) {
          setLaybyes(laybyeData.data);
          setStats(laybyeData.stats);
          setConfig(laybyeData.config);
        }
        
        if (merchantsData.success) {
          setMerchants(merchantsData.data);
        }
      } catch (error) {
        console.error('Failed to fetch laybye data:', error);
        toast.error('Failed to load laybye data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Calculate minimum deposit
  const minDeposit = itemPrice ? Math.ceil(parseFloat(itemPrice) * 0.1) : 0;
  const actualDeposit = depositAmount || minDeposit;
  const remainingBalance = itemPrice ? parseFloat(itemPrice) - actualDeposit : 0;
  const monthlyInstalment = remainingBalance > 0 ? Math.ceil(remainingBalance / termMonths) : 0;

  // Generate payment schedule preview
  const schedulePreview = useMemo(() => {
    if (!itemPrice || !actualDeposit) return [];
    const schedule = [];
    let remaining = remainingBalance;
    const now = new Date();
    
    for (let i = 1; i <= termMonths; i++) {
      const amount = i === termMonths ? remaining : monthlyInstalment;
      remaining -= amount;
      const dueDate = new Date(now);
      dueDate.setMonth(dueDate.getMonth() + i);
      schedule.push({ instalment: i, amount, dueDate });
    }
    return schedule;
  }, [itemPrice, actualDeposit, termMonths, remainingBalance, monthlyInstalment]);

  // Create laybye
  const handleCreateLaybye = async () => {
    if (!itemName || !itemPrice || !selectedMerchant) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    if (parseFloat(itemPrice) < 100) {
      toast.error('Minimum item price is R100');
      return;
    }
    
    if (actualDeposit < minDeposit) {
      toast.error(`Minimum deposit is R${minDeposit.toLocaleString('en-ZA')}`);
      return;
    }
    
    try {
      setSubmitting(true);
      const merchant = merchants.find(m => m.id === selectedMerchant);
      
      const res = await fetch('/api/laybye', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          merchant: merchant?.name || selectedMerchant,
          merchantId: selectedMerchant,
          item: itemName,
          itemPrice: parseFloat(itemPrice),
          deposit: actualDeposit,
          termMonths
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        setItemName('');
        setItemPrice('');
        setSelectedMerchant('');
        setDepositAmount('');
        setTermMonths(6);
        setView('active');
        // Refresh data
        const laybyeRes = await fetch('/api/laybye');
        const laybyeData = await laybyeRes.json();
        if (laybyeData.success) {
          setLaybyes(laybyeData.data);
          setStats(laybyeData.stats);
        }
      } else {
        toast.error(data.error || 'Failed to create laybye');
      }
    } catch (error) {
      console.error('Create laybye error:', error);
      toast.error('Failed to create laybye');
    } finally {
      setSubmitting(false);
    }
  };

  // Make payment
  const handleMakePayment = async () => {
    if (!selectedLaybye || !paymentAmount) {
      toast.error('Please enter payment amount');
      return;
    }
    
    try {
      setSubmitting(true);
      const res = await fetch('/api/laybye', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          laybyeId: selectedLaybye.id,
          paymentAmount: parseFloat(paymentAmount)
        })
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        if (data.data.status === 'completed') {
          toast.success('🎉 Item released for collection!');
        }
        setPaymentAmount('');
        setSelectedLaybye(null);
        setView('active');
        // Refresh data
        const laybyeRes = await fetch('/api/laybye');
        const laybyeData = await laybyeRes.json();
        if (laybyeData.success) {
          setLaybyes(laybyeData.data);
          setStats(laybyeData.stats);
        }
      } else {
        toast.error(data.error || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to process payment');
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel laybye
  const handleCancelLaybye = async () => {
    if (!selectedLaybye) return;
    
    try {
      setSubmitting(true);
      const res = await fetch(`/api/laybye?laybyeId=${selectedLaybye.id}&confirm=true`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        setShowCancelConfirm(false);
        setSelectedLaybye(null);
        setCancelPreview(null);
        setView('active');
        // Refresh data
        const laybyeRes = await fetch('/api/laybye');
        const laybyeData = await laybyeRes.json();
        if (laybyeData.success) {
          setLaybyes(laybyeData.data);
          setStats(laybyeData.stats);
        }
      } else {
        toast.error(data.error || 'Failed to cancel laybye');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error('Failed to cancel laybye');
    } finally {
      setSubmitting(false);
    }
  };

  // Preview cancellation
  const previewCancel = async (laybye: any) => {
    try {
      const res = await fetch(`/api/laybye?laybyeId=${laybye.id}&confirm=false`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setCancelPreview(data.data);
        setShowCancelConfirm(true);
      }
    } catch (error) {
      console.error('Preview cancel error:', error);
    }
  };

  // View laybye details
  const viewLaybyeDetails = async (laybye: any) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/laybye?action=laybye&laybyeId=${laybye.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedLaybye(data.data);
        setView('detail');
      }
    } catch (error) {
      console.error('Failed to fetch laybye details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Active and completed laybyes
  const activeLaybyes = laybyes.filter((l: any) => l.status === 'active');
  const completedLaybyes = laybyes.filter((l: any) => l.status === 'completed');
  const cancelledLaybyes = laybyes.filter((l: any) => l.status === 'cancelled');

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Digital Laybye</DialogTitle>
            </VisuallyHidden>
          </DialogHeader>
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-[#00897B]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-[#00897B]" />
            Digital Laybye
          </DialogTitle>
          <DialogDescription>
            Reserve items and pay over 6 months
          </DialogDescription>
        </DialogHeader>

        {/* View Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('active')}
            className={`flex-1 h-8 text-xs ${view === 'active' ? 'bg-white shadow-sm' : ''}`}
          >
            Active ({activeLaybyes.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('create')}
            className={`flex-1 h-8 text-xs ${view === 'create' ? 'bg-white shadow-sm' : ''}`}
          >
            New
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView('history')}
            className={`flex-1 h-8 text-xs ${view === 'history' ? 'bg-white shadow-sm' : ''}`}
          >
            History
          </Button>
        </div>

        {/* Active Laybyes View */}
        {view === 'active' && (
          <div className="space-y-3">
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center p-2 bg-teal-50 rounded-lg">
                <p className="text-lg font-bold text-[#00897B]">{stats.activeCount || 0}</p>
                <p className="text-[10px] text-gray-600">Active</p>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalPaid || 0)}</p>
                <p className="text-[10px] text-gray-600">Paid</p>
              </div>
              <div className="text-center p-2 bg-amber-50 rounded-lg">
                <p className="text-lg font-bold text-amber-600">{formatCurrency(stats.totalRemaining || 0)}</p>
                <p className="text-[10px] text-gray-600">Remaining</p>
              </div>
            </div>

            {/* Active Laybyes List */}
            {activeLaybyes.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No active laybyes</p>
                <Button size="sm" className="mt-2 bg-[#00897B] hover:bg-[#00695C]" onClick={() => setView('create')}>
                  Start a Laybye
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activeLaybyes.map((laybye: any) => (
                  <Card key={laybye.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => viewLaybyeDetails(laybye)}>
                    <CardContent className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-[#00897B]/10 flex items-center justify-center shrink-0">
                          <ShoppingCart className="w-5 h-5 text-[#00897B]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-xs truncate">{laybye.item}</p>
                          <p className="text-[10px] text-gray-500">{laybye.merchant}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-semibold text-gray-900">{formatCurrency(laybye.remainingBalance)}</p>
                          <p className="text-[10px] text-gray-500">remaining</p>
                        </div>
                      </div>
                      {/* Progress Bar */}
                      <div className="mt-2">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                          <span>{laybye.progress}% paid</span>
                          <span>{laybye.instalmentsPaid}/{laybye.totalInstalments} instalments</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#00897B] to-[#43A047] rounded-full transition-all"
                            style={{ width: `${laybye.progress}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create New Laybye View */}
        {view === 'create' && (
          <div className="space-y-3">
            {/* Merchant Selection */}
            <div>
              <Label className="text-xs font-medium">Select Merchant</Label>
              <Select value={selectedMerchant} onValueChange={setSelectedMerchant}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue placeholder="Choose a merchant" />
                </SelectTrigger>
                <SelectContent>
                  {merchants.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <span>{m.name}</span>
                        {m.category && <span className="text-xs text-gray-400">({m.category})</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Item Description */}
            <div>
              <Label className="text-xs font-medium">Item Description</Label>
              <Textarea
                placeholder="e.g., Samsung 55&quot; Smart TV, Model UA55AU8000"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="h-16 mt-1 text-sm"
              />
            </div>

            {/* Item Price */}
            <div>
              <Label className="text-xs font-medium">Total Item Price (R)</Label>
              <Input
                type="number"
                placeholder="5,000"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                className="h-9 mt-1"
              />
              {parseFloat(itemPrice) > 50000 && (
                <p className="text-[10px] text-amber-600 mt-1">Maximum laybye amount is R50,000</p>
              )}
            </div>

            {/* Deposit Amount */}
            <div>
              <Label className="text-xs font-medium">Deposit Amount (R)</Label>
              <Input
                type="number"
                placeholder={`Minimum: R${minDeposit.toLocaleString('en-ZA')}`}
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="h-9 mt-1"
              />
              <p className="text-[10px] text-gray-500 mt-1">
                Minimum 10% deposit: R{minDeposit.toLocaleString('en-ZA')}
              </p>
            </div>

            {/* Term Selection */}
            <div>
              <Label className="text-xs font-medium">Payment Term</Label>
              <Select value={termMonths.toString()} onValueChange={(v) => setTermMonths(parseInt(v))}>
                <SelectTrigger className="h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 months</SelectItem>
                  <SelectItem value="4">4 months</SelectItem>
                  <SelectItem value="5">5 months</SelectItem>
                  <SelectItem value="6">6 months (max)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Schedule Preview */}
            {itemPrice && actualDeposit >= minDeposit && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-700 mb-2">Payment Schedule Preview</p>
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Deposit (now)</span>
                    <span className="font-medium text-green-600">{formatCurrency(actualDeposit)}</span>
                  </div>
                  {schedulePreview.map((s) => (
                    <div key={s.instalment} className="flex justify-between text-xs">
                      <span className="text-gray-600">Month {s.instalment}</span>
                      <span className="font-medium">{formatCurrency(s.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-1.5 mt-1.5 flex justify-between text-xs font-semibold">
                    <span>Total</span>
                    <span>{formatCurrency(parseFloat(itemPrice))}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Terms */}
            <div className="p-2.5 bg-amber-50 rounded-lg">
              <p className="text-[10px] text-amber-800">
                <strong>Laybye Terms:</strong> 10% minimum deposit • Max 6 months • 7-day grace period for late payments • 10% cancellation fee on item price
              </p>
            </div>

            <Button 
              className="w-full bg-[#00897B] hover:bg-[#00695C]"
              onClick={handleCreateLaybye}
              disabled={!itemName || !itemPrice || !selectedMerchant || actualDeposit < minDeposit || submitting || parseFloat(itemPrice) > 50000}
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create Laybye Agreement
            </Button>
          </div>
        )}

        {/* Laybye Detail View */}
        {view === 'detail' && selectedLaybye && (
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedLaybye(null); setView('active'); }}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <p className="font-medium text-sm">{selectedLaybye.item}</p>
                <p className="text-xs text-gray-500">{selectedLaybye.merchant}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="p-3 rounded-lg" style={{ background: 'linear-gradient(135deg, #00897B 0%, #43A047 100%)' }}>
              <div className="flex justify-between items-center text-white mb-2">
                <span className="text-xs">Payment Progress</span>
                <span className="text-lg font-bold">{selectedLaybye.progress}%</span>
              </div>
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${selectedLaybye.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-white/80 text-xs mt-2">
                <span>Paid: {formatCurrency(selectedLaybye.totalPaid)}</span>
                <span>Remaining: {formatCurrency(selectedLaybye.remainingBalance)}</span>
              </div>
            </div>

            {/* Payment Schedule */}
            {selectedLaybye.paymentSchedule && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Payment Schedule</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedLaybye.paymentSchedule.map((s: any, idx: number) => (
                    <div key={idx} className={`flex items-center justify-between p-2 rounded-lg ${
                      s.status === 'paid' ? 'bg-green-50' : 
                      s.status === 'overdue' ? 'bg-red-50' : 'bg-gray-50'
                    }`}>
                      <div className="flex items-center gap-2">
                        {s.status === 'paid' ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : s.status === 'overdue' ? (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-xs">Month {s.instalmentNumber}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium">{formatCurrency(s.amount)}</span>
                        <p className="text-[10px] text-gray-500">
                          {new Date(s.dueDate).toLocaleDateString('en-ZA')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Make Payment */}
            {selectedLaybye.status === 'active' && (
              <div className="p-3 border rounded-lg">
                <Label className="text-xs font-medium">Make a Payment</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder={`Min: R${selectedLaybye.instalmentAmount?.toLocaleString('en-ZA') || '0'}`}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="h-9"
                  />
                  <Button 
                    className="bg-[#00897B] hover:bg-[#00695C] shrink-0"
                    onClick={handleMakePayment}
                    disabled={!paymentAmount || submitting}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pay'}
                  </Button>
                </div>
                <div className="flex gap-1 mt-2">
                  {[selectedLaybye.instalmentAmount, selectedLaybye.remainingBalance / 2, selectedLaybye.remainingBalance].map((amt, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="flex-1 h-7 text-[10px]"
                      onClick={() => setPaymentAmount(Math.ceil(amt).toString())}
                    >
                      {idx === 0 ? 'Monthly' : idx === 1 ? 'Half' : 'Full'}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Expires</p>
                <p className="font-medium">{selectedLaybye.expiresAt ? new Date(selectedLaybye.expiresAt).toLocaleDateString('en-ZA') : 'N/A'}</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                <p className="text-gray-500">NCA Protected</p>
                <p className="font-medium">{selectedLaybye.ncaProtected ? 'Yes' : 'No'}</p>
              </div>
            </div>

            {/* Cancel Button */}
            {selectedLaybye.status === 'active' && (
              <Button 
                variant="outline" 
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => previewCancel(selectedLaybye)}
              >
                Cancel Laybye
              </Button>
            )}

            {/* Completed Status */}
            {selectedLaybye.status === 'completed' && (
              <div className="p-3 bg-green-50 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-1" />
                <p className="text-sm font-medium text-green-800">Laybye Completed!</p>
                <p className="text-xs text-green-600">Item ready for collection</p>
              </div>
            )}
          </div>
        )}

        {/* History View */}
        {view === 'history' && (
          <div className="space-y-3">
            {/* Completed */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Completed ({completedLaybyes.length})</p>
              {completedLaybyes.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-2">No completed laybyes</p>
              ) : (
                <div className="space-y-1.5">
                  {completedLaybyes.slice(0, 5).map((laybye: any) => (
                    <Card key={laybye.id} className="bg-green-50 cursor-pointer" onClick={() => viewLaybyeDetails(laybye)}>
                      <CardContent className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{laybye.item}</p>
                            <p className="text-[10px] text-gray-500">{laybye.merchant}</p>
                          </div>
                          <span className="text-xs font-medium">{formatCurrency(laybye.itemPrice)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Cancelled */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Cancelled ({cancelledLaybyes.length})</p>
              {cancelledLaybyes.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-2">No cancelled laybyes</p>
              ) : (
                <div className="space-y-1.5">
                  {cancelledLaybyes.slice(0, 5).map((laybye: any) => (
                    <Card key={laybye.id} className="bg-gray-50 cursor-pointer" onClick={() => viewLaybyeDetails(laybye)}>
                      <CardContent className="py-2 px-3">
                        <div className="flex items-center gap-2">
                          <X className="w-4 h-4 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate text-gray-500">{laybye.item}</p>
                            <p className="text-[10px] text-gray-400">{laybye.merchant}</p>
                          </div>
                          <span className="text-xs text-gray-500 line-through">{formatCurrency(laybye.itemPrice)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Cancel Confirmation Dialog */}
        {showCancelConfirm && cancelPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-sm">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Cancel Laybye?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-800 font-medium mb-2">Warning: Cancellation Fee</p>
                  <p className="text-xs text-red-700">
                    Cancelling will forfeit <strong>R{cancelPreview.cancellationFee?.toLocaleString('en-ZA')}</strong> (10% of item price).
                  </p>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount Paid:</span>
                    <span>R{cancelPreview.totalPaid?.toLocaleString('en-ZA')}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Cancellation Fee:</span>
                    <span>-R{cancelPreview.cancellationFee?.toLocaleString('en-ZA')}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-1 border-t">
                    <span>Refund Amount:</span>
                    <span className="text-green-600">R{cancelPreview.refundAmount?.toLocaleString('en-ZA')}</span>
                  </div>
                </div>
              </CardContent>
              <div className="p-4 pt-0 flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowCancelConfirm(false); setCancelPreview(null); }}>
                  Keep Laybye
                </Button>
                <Button variant="destructive" className="flex-1" onClick={handleCancelLaybye} disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Cancel'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==================== TRANSACTION HISTORY MODAL ====================
// Transaction categories with icons and colors
const TRANSACTION_CATEGORIES = [
  { id: 'all', name: 'All', icon: MoreHorizontal, color: '#607D8B' },
  { id: 'Airtime & Data', name: 'Airtime', icon: Smartphone, color: '#E91E63' },
  { id: 'Electricity', name: 'Electricity', icon: Zap, color: '#FF9800' },
  { id: 'Water', name: 'Water', icon: Droplets, color: '#2196F3' },
  { id: 'Transfer', name: 'Transfers', icon: ArrowUpRight, color: '#9C27B0' },
  { id: 'Bill Payments', name: 'Bills', icon: FileText, color: '#00BCD4' },
  { id: 'BNPL Payments', name: 'BNPL', icon: CreditCard, color: '#E91E63' },
  { id: 'Pay+ Advances', name: 'Pay+', icon: TrendingUp, color: '#FF9800' },
  { id: 'Card Transactions', name: 'Card', icon: CreditCard, color: '#607D8B' },
  { id: 'Vouchers', name: 'Vouchers', icon: Ticket, color: '#FF5722' },
  { id: 'Insurance', name: 'Insurance', icon: Shield, color: '#4CAF50' },
  { id: 'Top Up', name: 'Top Up', icon: Plus, color: '#009688' },
];

// Status badge utility function
const getStatusBadge = (status: string) => {
  const statusStyles: Record<string, { bg: string; text: string; icon: React.ElementType }> = {
    completed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
    failed: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
  };
  return statusStyles[status] || statusStyles.pending;
};

// Transaction History Modal Component - Responsive (full-screen mobile, modal on desktop)
function TransactionHistoryModal({ onClose }: { onClose: () => void }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [copied, setCopied] = useState(false);
  const [disputing, setDisputing] = useState(false);

  // Fetch transactions
  const fetchTransactions = useCallback(async (cursor?: string) => {
    try {
      if (cursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        action: 'history',
        limit: '20',
        search: searchQuery,
        category: selectedCategory,
        dateFrom,
        dateTo,
      });

      if (cursor) {
        params.append('cursor', cursor);
      }

      const res = await fetch(`/api/wallet?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        const newTransactions = json.data.transactions;
        if (cursor) {
          setTransactions(prev => [...prev, ...newTransactions]);
        } else {
          setTransactions(newTransactions);
        }
        setHasMore(json.data.pagination.hasMore);
        setNextCursor(json.data.pagination.nextCursor);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchQuery, selectedCategory, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Handle load more
  const handleLoadMore = () => {
    if (nextCursor && !loadingMore) {
      fetchTransactions(nextCursor);
    }
  };

  // Handle export
  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export',
          format,
          filters: {
            category: selectedCategory,
            dateFrom,
            dateTo,
          }
        })
      });

      const json = await res.json();
      
      if (json.success) {
        if (format === 'csv') {
          const blob = new Blob([json.data.csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = json.data.filename;
          a.click();
          URL.revokeObjectURL(url);
          toast.success(`Exported ${json.data.count} transactions`);
        } else {
          toast.success(`PDF export ready: ${json.data.count} transactions`);
        }
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
    }
    setShowExportMenu(false);
  };

  // Get category icon and color
  const getCategoryInfo = (category: string) => {
    const cat = TRANSACTION_CATEGORIES.find(c => c.id === category || c.name === category);
    return cat || TRANSACTION_CATEGORIES[0];
  };

  // Copy transaction ID
  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      toast.success('Transaction ID copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  // Handle dispute
  const handleDispute = async () => {
    if (!disputeReason || !selectedTransaction) {
      toast.error('Please provide a reason for the dispute');
      return;
    }

    setDisputing(true);
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispute',
          transactionId: selectedTransaction.id,
          reason: disputeReason
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success('Dispute submitted successfully');
        setShowDispute(false);
        setSelectedTransaction(null);
      } else {
        toast.error(json.error || 'Failed to submit dispute');
      }
    } catch {
      toast.error('Failed to submit dispute');
    } finally {
      setDisputing(false);
    }
  };

  // Transaction Detail View (inline view within same container)
  if (selectedTransaction && !showDispute) {
    const catInfo = getCategoryInfo(selectedTransaction.category);
    const statusInfo = getStatusBadge(selectedTransaction.status);
    const StatusIcon = statusInfo.icon;

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md max-h-[90vh] p-0 gap-0 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b shrink-0">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedTransaction(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="font-semibold text-gray-900 text-sm">Transaction Receipt</h2>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {/* Status Banner */}
              <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${statusInfo.bg}`}>
                <StatusIcon className={`w-5 h-5 ${statusInfo.text}`} />
                <span className={`font-medium text-sm ${statusInfo.text} capitalize`}>
                  {selectedTransaction.status}
                </span>
              </div>

              {/* Amount */}
              <div className="text-center py-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Amount</p>
                <p className={`text-2xl font-bold ${selectedTransaction.amount >= 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {selectedTransaction.amount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(selectedTransaction.absoluteAmount || selectedTransaction.amount))}
                </p>
                {selectedTransaction.fee && selectedTransaction.fee > 0 && (
                  <p className="text-xs text-gray-500 mt-1">Fee: {formatCurrency(selectedTransaction.fee)}</p>
                )}
              </div>

              {/* Details */}
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b text-sm">
                  <span className="text-gray-500">Description</span>
                  <span className="text-gray-900 font-medium text-right max-w-[60%] truncate">{selectedTransaction.description}</span>
                </div>
                <div className="flex justify-between py-2 border-b text-sm">
                  <span className="text-gray-500">Category</span>
                  <div className="flex items-center gap-1">
                    <catInfo.icon className="w-3 h-3" style={{ color: catInfo.color }} />
                    <span className="text-gray-900">{selectedTransaction.category}</span>
                  </div>
                </div>
                <div className="flex justify-between py-2 border-b text-sm">
                  <span className="text-gray-500">Merchant</span>
                  <span className="text-gray-900">{selectedTransaction.merchant || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b text-sm">
                  <span className="text-gray-500">Date & Time</span>
                  <span className="text-gray-900 text-right">
                    {selectedTransaction.date || new Date(selectedTransaction.timestamp).toLocaleDateString('en-ZA')}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b text-sm">
                  <span className="text-gray-500">Reference</span>
                  <span className="text-gray-900 font-mono text-xs">{selectedTransaction.reference || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b text-sm">
                  <span className="text-gray-500">Transaction ID</span>
                  <div className="flex items-center gap-1">
                    <span className="text-gray-900 font-mono text-xs truncate max-w-[120px]">{selectedTransaction.id}</span>
                    <button onClick={() => handleCopyId(selectedTransaction.id)} className="p-1">
                      {copied ? <CheckCircle className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Voucher/Token Information - Prominent Display */}
              {selectedTransaction.voucherToken && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-[#00897B]/5 to-[#43A047]/5 border border-[#00897B]/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Receipt className="w-5 h-5 text-[#00897B]" />
                    <span className="font-semibold text-[#00897B] text-sm">
                      {selectedTransaction.transactionType === 'airtime_purchase' ? 'Voucher PIN' : 'Token'}
                    </span>
                  </div>

                  <div className="bg-white rounded-lg p-3 border mb-3">
                    <p className="text-xs text-gray-500 mb-1">Your {selectedTransaction.transactionType === 'airtime_purchase' ? 'Voucher PIN' : 'Token'}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-mono font-bold text-gray-900">
                        {selectedTransaction.voucherToken.length === 16 
                          ? `${selectedTransaction.voucherToken.slice(0, 4)}-${selectedTransaction.voucherToken.slice(4, 8)}-${selectedTransaction.voucherToken.slice(8, 12)}-${selectedTransaction.voucherToken.slice(12)}`
                          : selectedTransaction.voucherToken}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTransaction.voucherToken || '');
                          toast.success('Token copied!');
                        }}
                        className="shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    {selectedTransaction.meterNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Meter/Account</span>
                        <span className="font-mono font-medium">{selectedTransaction.meterNumber}</span>
                      </div>
                    )}
                    {selectedTransaction.unitsPurchased && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Units</span>
                        <span className="font-medium text-amber-600">{selectedTransaction.unitsPurchased}</span>
                      </div>
                    )}
                    {selectedTransaction.voucherExpiry && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Valid Until</span>
                        <span className="font-medium text-[#00897B]">
                          {new Date(selectedTransaction.voucherExpiry).toLocaleDateString('en-ZA')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Copy Full Receipt */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 text-xs"
                    onClick={() => {
                      const receiptText = `GROWAY WALLET RECEIPT
Transaction ID: ${selectedTransaction.id}
Reference: ${selectedTransaction.reference || 'N/A'}
${selectedTransaction.transactionType === 'airtime_purchase' ? 'Voucher PIN' : 'Token'}: ${selectedTransaction.voucherToken}
${selectedTransaction.meterNumber ? `Meter/Account: ${selectedTransaction.meterNumber}` : ''}
${selectedTransaction.unitsPurchased ? `Units: ${selectedTransaction.unitsPurchased}` : ''}
Amount: ${formatCurrency(Math.abs(selectedTransaction.absoluteAmount || selectedTransaction.amount))}
Date: ${selectedTransaction.date || new Date(selectedTransaction.timestamp).toLocaleDateString('en-ZA')}
${selectedTransaction.voucherExpiry ? `Valid Until: ${new Date(selectedTransaction.voucherExpiry).toLocaleDateString('en-ZA')}` : ''}`;
                      navigator.clipboard.writeText(receiptText);
                      toast.success('Receipt copied to clipboard!');
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy Receipt
                  </Button>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full text-xs h-9"
                  onClick={() => setShowDispute(true)}
                >
                  <AlertTriangle className="w-3 h-3 mr-2" />
                  Report an Issue
                </Button>
              </div>
            </div>
          </div>

          {/* Dispute Form Overlay */}
          {showDispute && (
            <div className="absolute inset-0 bg-white flex flex-col z-10">
              <div className="flex items-center justify-between p-3 border-b shrink-0">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowDispute(false)}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <h2 className="font-semibold text-gray-900 text-sm">Report Issue</h2>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Reporting issue with: <span className="font-medium">{selectedTransaction.description}</span>
                  </p>
                  <div>
                    <Label className="text-xs text-gray-500 mb-2 block">Reason for dispute</Label>
                    <Textarea
                      placeholder="Please describe the issue..."
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      rows={4}
                      className="text-sm"
                    />
                  </div>
                  <Button 
                    className="w-full bg-[#00897B] hover:bg-[#00695C] text-white"
                    onClick={handleDispute}
                    disabled={disputing}
                  >
                    {disputing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Report'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // Main Transaction List View
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Transaction History</DialogTitle>
        </DialogHeader>
        
        {/* Header */}
        <div className="shrink-0 border-b">
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h2 className="font-semibold text-gray-900 text-sm">Transaction History</h2>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => fetchTransactions()}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => setShowExportMenu(!showExportMenu)}
                >
                  <FileDown className="w-4 h-4" />
                </Button>
                {showExportMenu && (
                  <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border p-1 z-20 w-36">
                    <button 
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-100 rounded"
                      onClick={() => handleExport('csv')}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Export CSV
                    </button>
                    <button 
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-gray-100 rounded"
                      onClick={() => handleExport('pdf')}
                    >
                      <FileText className="w-4 h-4" />
                      Export PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="px-3 pb-2 flex items-center justify-between">
            <button 
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-[#00897B]"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-3 h-3" />
              Filters
              {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            {(selectedCategory !== 'all' || dateFrom || dateTo) && (
              <button
                className="text-xs text-red-500 hover:text-red-700"
                onClick={() => {
                  setSelectedCategory('all');
                  setDateFrom('');
                  setDateTo('');
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="px-3 pb-3 space-y-2 border-t pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-[10px] text-gray-500">From</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-gray-500">To</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Category Chips - Scrollable */}
          <div className="px-3 pb-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1.5 min-w-max">
              {TRANSACTION_CATEGORIES.slice(0, 8).map((cat) => (
                <button
                  key={cat.id}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id 
                      ? 'bg-[#00897B] text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <cat.icon className="w-3 h-3" />
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-[#00897B]" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <Wallet className="w-10 h-10 text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No transactions found</p>
              <p className="text-xs text-gray-400">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="divide-y">
              {transactions.map((tx, idx) => {
                const catInfo = getCategoryInfo(tx.category);
                const statusInfo = getStatusBadge(tx.status);
                const Icon = catInfo.icon;
                const StatusIcon = statusInfo.icon;
                
                return (
                  <button
                    key={tx.id || idx}
                    className="w-full p-3 hover:bg-gray-50 transition-colors text-left"
                    onClick={() => setSelectedTransaction(tx)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Category Icon */}
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${catInfo.color}15` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: catInfo.color }} />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm text-gray-900 truncate">{tx.description}</p>
                            <p className="text-xs text-gray-500 truncate">{tx.merchant}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={`font-semibold text-sm ${tx.amount >= 0 ? 'text-green-600' : 'text-gray-900'}`}>
                              {tx.amount >= 0 ? '+' : '-'}{formatCurrency(Math.abs(tx.absoluteAmount || tx.amount))}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-gray-400">
                            {tx.date || new Date(tx.timestamp).toLocaleDateString('en-ZA')}
                          </span>
                          <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] ${statusInfo.bg} ${statusInfo.text}`}>
                            <StatusIcon className="w-2.5 h-2.5" />
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Load More */}
              {hasMore && (
                <div className="p-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="text-xs"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== WALLET CARD MODAL ====================
interface CardData {
  id: string;
  cardType: string;
  cardNumber: string;
  lastFour: string;
  cvv: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  status: string;
  dailyLimit: number;
  monthlyLimit: number;
  spentToday: number;
  spentThisMonth: number;
  onlineEnabled: boolean;
  atmEnabled: boolean;
  internationalEnabled: boolean;
}

interface CardTransaction {
  id: string;
  type: string;
  amount: number;
  merchant: string;
  category?: string;
  status: string;
  timestamp: string;
}

function WalletCardModal({ onClose }: { onClose: () => void }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showFullNumber, setShowFullNumber] = useState(false);
  const [showCVV, setShowCVV] = useState(false);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'card' | 'limits' | 'transactions' | 'settings'>('card');
  const [copied, setCopied] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchCardData();
  }, []);

  const fetchCardData = async () => {
    try {
      setLoading(true);
      const [cardRes, txRes] = await Promise.all([
        fetch('/api/card'),
        fetch('/api/card?action=transactions')
      ]);
      
      const cardJson = await cardRes.json();
      const txJson = await txRes.json();
      
      if (cardJson.success) {
        setCardData(cardJson.data);
      }
      if (txJson.success) {
        setTransactions(txJson.data.transactions);
      }
    } catch (error) {
      console.error('Failed to fetch card data:', error);
      toast.error('Failed to load card data');
    } finally {
      setLoading(false);
    }
  };

  const handleFreezeToggle = async () => {
    if (!cardData) return;
    
    try {
      setProcessing(true);
      const action = cardData.status === 'active' ? 'freeze' : 'unfreeze';
      
      const res = await fetch('/api/card', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      const json = await res.json();
      if (json.success) {
        setCardData(prev => prev ? { ...prev, status: json.data.status } : null);
        toast.success(json.message);
      }
    } catch (error) {
      console.error('Failed to toggle freeze:', error);
      toast.error('Failed to update card');
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
    toast.success(`${field} copied`);
  };

  const isFrozen = cardData?.status === 'frozen';

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Virtual Card</DialogTitle>
            </VisuallyHidden>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#00897B]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#00897B] to-[#43A047] p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <WalletCards className="w-5 h-5" />
              <span className="font-semibold">Virtual Card</span>
            </div>
            <Badge variant={isFrozen ? "destructive" : "secondary"} className="text-[10px]">
              {cardData?.status?.toUpperCase() || 'ACTIVE'}
            </Badge>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex gap-1 mt-2">
            {[
              { id: 'card', label: 'Card' },
              { id: 'limits', label: 'Limits' },
              { id: 'transactions', label: 'History' },
              { id: 'settings', label: 'Settings' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as typeof activeView)}
                className={`flex-1 py-1.5 text-[10px] font-medium rounded-lg transition-colors ${
                  activeView === tab.id 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/70 hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {/* CARD VIEW */}
          {activeView === 'card' && cardData && (
            <div className="space-y-4">
              {/* Virtual Card with Flip Animation */}
              <div 
                className="relative h-44 cursor-pointer perspective-1000"
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div className={`absolute inset-0 transition-transform duration-500 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                  {/* Front */}
                  <div className={`absolute inset-0 backface-hidden rounded-xl p-4 text-white ${isFlipped ? 'invisible' : ''}`}
                    style={{ 
                      background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
                    }}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-1">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600"></div>
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 opacity-80"></div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                        {cardData.cardType === 'visa' ? 'VISA' : 'MASTERCARD'}
                      </span>
                    </div>
                    
                    {/* Card Number */}
                    <div className="mb-4">
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-mono tracking-wider">
                          {showFullNumber 
                            ? cardData.cardNumber.replace(/(.{4})/g, '$1 ').trim()
                            : `•••• •••• •••• ${cardData.lastFour}`
                          }
                        </p>
                        <button 
                          onClick={(e) => { e.stopPropagation(); setShowFullNumber(!showFullNumber); }}
                          className="p-1 rounded-full hover:bg-white/10"
                        >
                          {showFullNumber ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    
                    {/* Card Footer */}
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[8px] opacity-60 uppercase">Card Holder</p>
                        <p className="text-xs font-medium">{cardData.cardholderName}</p>
                      </div>
                      <div>
                        <p className="text-[8px] opacity-60 uppercase">Expires</p>
                        <p className="text-xs font-medium">{cardData.expiryMonth}/{cardData.expiryYear}</p>
                      </div>
                    </div>
                    
                    {/* Frozen Overlay */}
                    {isFrozen && (
                      <div className="absolute inset-0 bg-gray-900/80 rounded-xl flex items-center justify-center">
                        <div className="text-center">
                          <Lock className="w-8 h-8 mx-auto mb-1 text-amber-400" />
                          <p className="text-sm font-semibold">Card Frozen</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Back */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 rounded-xl overflow-hidden"
                    style={{ 
                      background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
                    }}
                  >
                    {/* Magnetic Strip */}
                    <div className="h-10 bg-gray-700 mt-4"></div>
                    
                    {/* Signature Strip */}
                    <div className="mx-4 mt-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-8 bg-white/90 rounded flex items-center px-2">
                          <span className="text-gray-400 text-xs italic">AUTHORIZED SIGNATURE</span>
                        </div>
                        <div className="bg-white rounded px-2 py-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono text-gray-800 font-bold">
                              {showCVV ? cardData.cvv : '•••'}
                            </span>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setShowCVV(!showCVV); }}
                              className="p-0.5"
                            >
                              {showCVV ? <EyeOff className="w-3 h-3 text-gray-500" /> : <Eye className="w-3 h-3 text-gray-500" />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-[8px] text-white/50 text-center mt-8 px-4">
                      This card is property of Groway. Use subject to cardholder agreement.
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-[10px] text-gray-500 text-center">Tap card to flip</p>

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-2">
                <button 
                  onClick={() => copyToClipboard(cardData.cardNumber, 'Card Number')}
                  className="flex flex-col items-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {copied === 'Card Number' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-500" />}
                  <span className="text-[9px] text-gray-600 mt-1">Copy</span>
                </button>
                <button 
                  onClick={handleFreezeToggle}
                  disabled={processing}
                  className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                    isFrozen ? 'bg-green-50 hover:bg-green-100' : 'bg-red-50 hover:bg-red-100'
                  }`}
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin text-gray-500" /> : 
                    isFrozen ? <Unlock className="w-4 h-4 text-green-600" /> : <Lock className="w-4 h-4 text-red-500" />
                  }
                  <span className={`text-[9px] mt-1 ${isFrozen ? 'text-green-600' : 'text-red-500'}`}>
                    {isFrozen ? 'Unfreeze' : 'Freeze'}
                  </span>
                </button>
                <button className="flex flex-col items-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Settings className="w-4 h-4 text-gray-500" />
                  <span className="text-[9px] text-gray-600 mt-1">Settings</span>
                </button>
                <button className="flex flex-col items-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Shield className="w-4 h-4 text-gray-500" />
                  <span className="text-[9px] text-gray-600 mt-1">Security</span>
                </button>
              </div>

              {/* Spending Summary */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-[9px] text-amber-600">Today&apos;s Spending</p>
                  <p className="text-sm font-bold text-amber-700">{formatCurrency(cardData.spentToday)}</p>
                  <p className="text-[8px] text-amber-500">of {formatCurrency(cardData.dailyLimit)} limit</p>
                </div>
                <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200">
                  <p className="text-[9px] text-purple-600">This Month</p>
                  <p className="text-sm font-bold text-purple-700">{formatCurrency(cardData.spentThisMonth)}</p>
                  <p className="text-[8px] text-purple-500">of {formatCurrency(cardData.monthlyLimit)} limit</p>
                </div>
              </div>
            </div>
          )}

          {/* LIMITS VIEW */}
          {activeView === 'limits' && cardData && (
            <div className="space-y-4">
              {/* Daily Limit */}
              <div className="p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">Daily Limit</span>
                  <span className="text-xs font-bold text-[#00897B]">{formatCurrency(cardData.dailyLimit)}</span>
                </div>
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-[#00897B] to-[#43A047] rounded-full transition-all"
                    style={{ width: `${Math.min((cardData.spentToday / cardData.dailyLimit) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-500">Spent: {formatCurrency(cardData.spentToday)}</span>
                  <span className="text-[10px] text-gray-500">Remaining: {formatCurrency(cardData.dailyLimit - cardData.spentToday)}</span>
                </div>
              </div>

              {/* Monthly Limit */}
              <div className="p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">Monthly Limit</span>
                  <span className="text-xs font-bold text-[#00897B]">{formatCurrency(cardData.monthlyLimit)}</span>
                </div>
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all"
                    style={{ width: `${Math.min((cardData.spentThisMonth / cardData.monthlyLimit) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-gray-500">Spent: {formatCurrency(cardData.spentThisMonth)}</span>
                  <span className="text-[10px] text-gray-500">Remaining: {formatCurrency(cardData.monthlyLimit - cardData.spentThisMonth)}</span>
                </div>
              </div>

              {/* Transaction Limits Info */}
              <div className="p-3 rounded-lg bg-gray-50">
                <h4 className="text-xs font-medium text-gray-700 mb-2">Transaction Limits</h4>
                <div className="space-y-1.5 text-[10px]">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Per Transaction</span>
                    <span className="text-gray-700">R 5,000.00</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Online Purchases</span>
                    <span className="text-gray-700">R 25,000.00/day</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">ATM Withdrawals</span>
                    <span className="text-red-500">Not Available</span>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-gray-400 text-center">
                Limits are set according to NCA regulations
              </p>
            </div>
          )}

          {/* TRANSACTIONS VIEW */}
          {activeView === 'transactions' && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-700">Recent Card Transactions</h4>
              {transactions.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-1.5">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Receipt className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">{tx.merchant}</p>
                        <p className="text-[10px] text-gray-500">{tx.category || 'Purchase'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-gray-900">-{formatCurrency(tx.amount)}</p>
                        <p className="text-[10px] text-gray-400">
                          {new Date(tx.timestamp).toLocaleDateString('en-ZA')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No transactions yet</p>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS VIEW */}
          {activeView === 'settings' && cardData && (
            <div className="space-y-4">
              <h4 className="text-xs font-medium text-gray-700">Card Settings</h4>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">Online Purchases</p>
                      <p className="text-[10px] text-gray-500">Allow online transactions</p>
                    </div>
                  </div>
                  <Badge variant={cardData.onlineEnabled ? "default" : "secondary"} className="text-[10px]">
                    {cardData.onlineEnabled ? 'ON' : 'OFF'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">Contactless</p>
                      <p className="text-[10px] text-gray-500">Tap to pay enabled</p>
                    </div>
                  </div>
                  <Badge variant="default" className="text-[10px]">ON</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">ATM Withdrawals</p>
                      <p className="text-[10px] text-gray-500">Cash withdrawals</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">OFF</Badge>
                </div>
                
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-gray-500" />
                    <div>
                      <p className="text-xs font-medium text-gray-700">International</p>
                      <p className="text-[10px] text-gray-500">Use abroad</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">OFF</Badge>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-700">Card Security</p>
                    <p className="text-[10px] text-amber-600">This is a virtual card for online purchases only. ATM and international transactions are disabled by default.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <Button variant="outline" size="sm" onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== COMPREHENSIVE TRANSFERS MODAL (International Remittance) ====================
type TransfersView = 'main' | 'quote' | 'confirm' | 'success' | 'history';

function TransfersModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<TransfersView>('main');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [providers, setProviders] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [amount, setAmount] = useState('1000');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [transferResult, setTransferResult] = useState<any>(null);
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/transfers');
        const data = await res.json();
        if (data.success) {
          setProviders(data.data.providers || []);
          setCountries(data.data.countries || []);
          setRecentTransfers(data.data.recentTransfers || []);
        }
      } catch (error) {
        console.error('Failed to fetch transfers data:', error);
        toast.error('Failed to load transfer data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getQuotes = async () => {
    if (!selectedCountry || !amount) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/transfers?action=quote&country=${selectedCountry}&amount=${amount}`);
      const data = await res.json();
      if (data.success) {
        setQuotes(data.data.quotes);
        setView('quote');
      }
    } catch (error) {
      toast.error('Failed to get quotes');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!selectedProvider || !recipientName) {
      toast.error('Please fill in all fields');
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: selectedProvider,
          countryCode: selectedCountry,
          amount: parseFloat(amount),
          recipientName,
          recipientPhone,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTransferResult(data.data);
        setView('success');
        toast.success('Transfer initiated successfully!');
      } else {
        toast.error(data.error || 'Failed to initiate transfer');
      }
    } catch (error) {
      toast.error('Failed to process transfer');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amt: number) => `R ${amt.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  if (loading && view === 'main') {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <VisuallyHidden>
            <DialogTitle>Loading Transfers</DialogTitle>
          </VisuallyHidden>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#00897B]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#3F51B5]" />
            International Transfer
          </DialogTitle>
          <DialogDescription>
            Send money to 50+ countries with 6 providers
          </DialogDescription>
        </DialogHeader>

        {view === 'main' && (
          <div className="space-y-3">
            {/* Recent Transfers */}
            {recentTransfers.length > 0 && (
              <div className="p-2.5 rounded-lg bg-gray-50">
                <p className="text-xs font-medium text-gray-700 mb-2">Recent Transfers</p>
                <div className="space-y-1.5">
                  {recentTransfers.slice(0, 3).map((tx, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span>{tx.destination}</span>
                        <Badge variant="outline" className="text-[9px]">{tx.status}</Badge>
                      </div>
                      <span className="font-medium">{formatCurrency(tx.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Country Selection */}
            <div>
              <Label className="text-xs">Destination Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="mt-1.5 h-10">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.flag} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div>
              <Label className="text-xs">Amount (ZAR)</Label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="h-10 mt-1.5"
              />
            </div>

            {/* Provider Logos */}
            <div className="p-2.5 rounded-lg bg-gray-50">
              <p className="text-[10px] text-gray-500 mb-2">Supported Providers</p>
              <div className="flex flex-wrap gap-2">
                {providers.map((p) => (
                  <div key={p.id} className="flex items-center gap-1 px-2 py-1 bg-white rounded-full border text-xs">
                    <span>{p.logo}</span>
                    <span>{p.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              className="w-full bg-[#3F51B5] hover:bg-[#303F9F]"
              onClick={getQuotes}
              disabled={!selectedCountry || !amount}
            >
              Compare Rates
            </Button>
          </div>
        )}

        {view === 'quote' && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setView('main')} className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-700">Sending {formatCurrency(parseFloat(amount))} to {countries.find(c => c.code === selectedCountry)?.name}</p>
            </div>

            {/* Quotes */}
            <div className="space-y-2">
              {quotes.map((q, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedProvider === q.provider.id ? 'border-[#3F51B5] bg-[#3F51B5]/5' : 'border-gray-100'
                  }`}
                  onClick={() => setSelectedProvider(q.provider.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{q.provider.logo}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-xs">{q.provider.name}</p>
                        <p className="text-[10px] text-gray-500">Fee: R{q.fee}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#43A047] text-sm">{q.receiveAmount.toLocaleString()} {q.currency}</p>
                      <p className="text-[10px] text-gray-400">Rate: {q.rate.toFixed(4)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recipient Details */}
            {selectedProvider && (
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Recipient Name</Label>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Full name"
                    className="h-9 mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Recipient Phone (optional)</Label>
                  <Input
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+263 XXX XXX XXX"
                    className="h-9 mt-1 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setView('main')} className="flex-1">Back</Button>
              <Button
                size="sm"
                onClick={() => setView('confirm')}
                disabled={!selectedProvider || !recipientName}
                className="flex-1 bg-[#3F51B5] hover:bg-[#303F9F]"
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {view === 'confirm' && (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#3F51B5] to-[#1A237E] text-white">
              <p className="text-xs opacity-80">You're sending</p>
              <p className="text-2xl font-bold">{formatCurrency(parseFloat(amount) + (quotes.find(q => q.provider.id === selectedProvider)?.fee || 0))}</p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Recipient</span>
                <span className="font-medium">{recipientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Destination</span>
                <span className="font-medium">{countries.find(c => c.code === selectedCountry)?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Provider</span>
                <span className="font-medium">{quotes.find(q => q.provider.id === selectedProvider)?.provider.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">They receive</span>
                <span className="font-bold text-[#43A047]">{quotes.find(q => q.provider.id === selectedProvider)?.receiveAmount.toLocaleString()} {quotes.find(q => q.provider.id === selectedProvider)?.currency}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-[10px] text-amber-700">
                <strong>SARB Compliant:</strong> All transfers comply with exchange control regulations. BOP reference auto-generated.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setView('quote')} className="flex-1">Back</Button>
              <Button
                size="sm"
                onClick={handleTransfer}
                disabled={processing}
                className="flex-1 bg-[#43A047] hover:bg-[#388E3C]"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Confirm Transfer
              </Button>
            </div>
          </div>
        )}

        {view === 'success' && transferResult && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#43A047] flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-lg">Transfer Initiated!</p>
              <p className="text-xs text-gray-500 mt-1">Estimated delivery: 24-48 hours</p>
            </div>

            <div className="p-3 rounded-xl bg-gray-50 text-left space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Reference</span>
                <span className="font-mono font-medium">{transferResult.reference}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Amount Sent</span>
                <span className="font-medium">{formatCurrency(transferResult.amount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Fee</span>
                <span className="font-medium">R{transferResult.fee}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Recipient gets</span>
                <span className="font-bold text-[#43A047]">{transferResult.receiveAmount} {transferResult.currency}</span>
              </div>
            </div>

            <Button onClick={onClose} className="w-full bg-[#00897B] hover:bg-[#00695C]">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==================== SAVINGS MODAL ====================
type SavingsView = 'main' | 'pockets' | 'create' | 'deposit' | 'settings';

function SavingsModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<SavingsView>('main');
  const [loading, setLoading] = useState(true);
  const [pockets, setPockets] = useState<any[]>([]);
  const [pocketTypes, setPocketTypes] = useState<any[]>([]);
  const [interestRates, setInterestRates] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [totalSaved, setTotalSaved] = useState(0);
  const [autoSave, setAutoSave] = useState<any>(null);
  const [selectedPocket, setSelectedPocket] = useState<any>(null);
  const [newPocketType, setNewPocketType] = useState('');
  const [newPocketName, setNewPocketName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/savings');
        const data = await res.json();
        if (data.success) {
          setPockets(data.data.pockets || []);
          setPocketTypes(data.data.pocketTypes || []);
          setInterestRates(data.data.interestRates || []);
          setInsights(data.data.insights || []);
          setTotalSaved(data.data.totalSaved || 0);
          setAutoSave(data.data.autoSave || null);
        }
      } catch (error) {
        console.error('Failed to fetch savings data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreatePocket = async () => {
    if (!newPocketType) {
      toast.error('Please select a pocket type');
      return;
    }
    try {
      const res = await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          pocketType: newPocketType,
          name: newPocketName || pocketTypes.find(t => t.id === newPocketType)?.name,
          targetAmount: parseFloat(targetAmount) || 0,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Savings pocket created!');
        setView('main');
        // Refresh data
        const refreshRes = await fetch('/api/savings');
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setPockets(refreshData.data.pockets || []);
          setTotalSaved(refreshData.data.totalSaved || 0);
        }
      }
    } catch (error) {
      toast.error('Failed to create pocket');
    }
  };

  const handleDeposit = async () => {
    if (!selectedPocket || !depositAmount) return;
    try {
      const res = await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deposit',
          pocketId: selectedPocket.id,
          amount: parseFloat(depositAmount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Deposited R${depositAmount} to ${selectedPocket.name}`);
        setView('main');
        setDepositAmount('');
      }
    } catch (error) {
      toast.error('Failed to deposit');
    }
  };

  const formatCurrency = (amt: number) => `R ${amt.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Savings</DialogTitle>
            </VisuallyHidden>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#00897B]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="w-5 h-5 text-[#2196F3]" />
            Savings Goals
          </DialogTitle>
          <DialogDescription>
            Goal-based savings with auto-save round-up
          </DialogDescription>
        </DialogHeader>

        {view === 'main' && (
          <div className="space-y-3">
            {/* Total Saved */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#2196F3] to-[#1565C0] text-white">
              <p className="text-xs opacity-80">Total Saved</p>
              <p className="text-2xl font-bold">{formatCurrency(totalSaved)}</p>
              <p className="text-xs opacity-60 mt-1">+R{((totalSaved * 0.065) / 12).toFixed(2)} interest this month</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" onClick={() => setView('create')} className="flex flex-col h-auto py-2">
                <Plus className="w-4 h-4 mb-1" />
                <span className="text-[10px]">New Goal</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setView('pockets')} className="flex flex-col h-auto py-2">
                <PiggyBank className="w-4 h-4 mb-1" />
                <span className="text-[10px]">Pockets</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => setView('settings')} className="flex flex-col h-auto py-2">
                <RefreshCw className="w-4 h-4 mb-1" />
                <span className="text-[10px]">Auto-Save</span>
              </Button>
            </div>

            {/* Savings Pockets */}
            {pockets.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Your Savings Pockets</p>
                {pockets.map((pocket, idx) => (
                  <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => { setSelectedPocket(pocket); setView('deposit'); }}>
                    <CardContent className="py-2.5 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${pocket.color}20` }}>
                          <span className="text-xl">{pocket.icon}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-xs">{pocket.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(pocket.balance)}</span>
                            {pocket.target > 0 && (
                              <span className="text-[10px] text-gray-500">/ {formatCurrency(pocket.target)}</span>
                            )}
                          </div>
                          {pocket.target > 0 && (
                            <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#43A047] rounded-full" style={{ width: `${Math.min(100, pocket.progress)}%` }} />
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <PiggyBank className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No savings pockets yet</p>
                <Button size="sm" onClick={() => setView('create')} className="mt-2 bg-[#2196F3] hover:bg-[#1976D2]">
                  Create Your First Goal
                </Button>
              </div>
            )}

            {/* Insights */}
            {insights.length > 0 && (
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                {insights.map((insight, idx) => (
                  <div key={idx} className="flex items-start gap-2 mb-1 last:mb-0">
                    <span>{insight.icon}</span>
                    <p className="text-[10px] text-gray-700">{insight.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'create' && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setView('main')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            <p className="font-medium text-gray-900 text-sm">Select Goal Type</p>
            <div className="grid grid-cols-2 gap-2">
              {pocketTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setNewPocketType(type.id)}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    newPocketType === type.id ? 'border-[#2196F3] bg-[#2196F3]/5' : 'border-gray-100'
                  }`}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <p className="font-medium text-gray-900 text-xs mt-1">{type.name}</p>
                  <p className="text-[10px] text-gray-500">{type.description}</p>
                </button>
              ))}
            </div>

            {newPocketType && (
              <>
                <div>
                  <Label className="text-xs">Goal Name (optional)</Label>
                  <Input
                    value={newPocketName}
                    onChange={(e) => setNewPocketName(e.target.value)}
                    placeholder={pocketTypes.find(t => t.id === newPocketType)?.name}
                    className="h-9 mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Target Amount (optional)</Label>
                  <Input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0.00"
                    className="h-9 mt-1 text-sm"
                  />
                </div>
                <Button onClick={handleCreatePocket} className="w-full bg-[#2196F3] hover:bg-[#1976D2]">
                  Create Savings Pocket
                </Button>
              </>
            )}
          </div>
        )}

        {view === 'deposit' && selectedPocket && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setView('main')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            <div className="p-3 rounded-xl bg-gray-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{selectedPocket.icon}</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{selectedPocket.name}</p>
                  <p className="text-xs text-gray-500">Current: {formatCurrency(selectedPocket.balance)}</p>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs">Deposit Amount</Label>
              <Input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="0.00"
                className="h-10 mt-1 text-sm"
              />
            </div>

            <div className="flex gap-2">
              {[50, 100, 200, 500].map((amt) => (
                <Button key={amt} variant="outline" size="sm" onClick={() => setDepositAmount(amt.toString())}>
                  R{amt}
                </Button>
              ))}
            </div>

            <Button onClick={handleDeposit} disabled={!depositAmount} className="w-full bg-[#43A047] hover:bg-[#388E3C]">
              Deposit
            </Button>
          </div>
        )}

        {view === 'settings' && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setView('main')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            <div className="p-3 rounded-xl bg-gradient-to-r from-[#43A047] to-[#2E7D32] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Round-Up Savings</p>
                  <p className="text-xs opacity-80">Automatically save spare change</p>
                </div>
                <Badge className="bg-white/20 text-white">Active</Badge>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-gray-50">
              <p className="text-xs font-medium text-gray-700 mb-2">Round-Up Setting</p>
              <div className="space-y-2">
                {['nearest-1', 'nearest-5', 'nearest-10'].map((opt) => (
                  <button key={opt} className="w-full p-2 rounded-lg border border-gray-200 text-left text-xs hover:bg-white">
                    Round to {opt.replace('nearest-', 'R')}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-green-50 border border-green-200">
              <p className="text-xs text-green-700">
                <strong>This month:</strong> You've saved R{autoSave?.totalRoundUpThisMonth || '127.50'} through round-ups!
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==================== GAUTRAIN MODAL ====================
function GautrainModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [stations, setStations] = useState<any[]>([]);
  const [card, setCard] = useState<any>(null);
  const [fromStation, setFromStation] = useState('');
  const [toStation, setToStation] = useState('');
  const [topupAmount, setTopupAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'topup' | 'tickets'>('topup');
  const [ticketType, setTicketType] = useState('single');
  const [isPeak, setIsPeak] = useState(true);
  const [passengers, setPassengers] = useState(1);
  const [view, setView] = useState<'main' | 'confirmation'>('main');
  const [fare, setFare] = useState<any>(null);
  const [bookingResult, setBookingResult] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/transport?type=gautrain');
        const data = await res.json();
        if (data.success) {
          setStations(data.data.stations || []);
          setCard(data.data.card || null);
        }
      } catch (error) {
        console.error('Failed to fetch Gautrain data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (fromStation && toStation) {
      const fetchFare = async () => {
        try {
          const res = await fetch(`/api/transport?type=gautrain&action=fares&from=${fromStation}&to=${toStation}`);
          const data = await res.json();
          if (data.success) {
            setFare(data.data);
          }
        } catch (error) {
          console.error('Failed to fetch fare:', error);
        }
      };
      fetchFare();
    }
  }, [fromStation, toStation]);

  const handleTopup = async () => {
    if (!topupAmount || parseFloat(topupAmount) < 10) {
      toast.error('Minimum top-up amount is R10');
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch('/api/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'gautrain-topup',
          amount: parseFloat(topupAmount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCard(prev => ({ ...prev, balance: data.data.newCardBalance }));
        setBookingResult(data.data);
        setView('confirmation');
        toast.success(`Gautrain card topped up with R${topupAmount}`);
      } else {
        toast.error(data.error || 'Failed to top up');
      }
    } catch (error) {
      toast.error('Failed to process top-up');
    } finally {
      setProcessing(false);
    }
  };

  const handleBuyTicket = async () => {
    if (!fromStation || !toStation) {
      toast.error('Please select departure and arrival stations');
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch('/api/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'gautrain-ticket',
          fromStation,
          toStation,
          ticketType,
          isPeak,
          passengers,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingResult(data.data);
        setView('confirmation');
        toast.success('Ticket purchased successfully!');
      } else {
        toast.error(data.error || 'Failed to purchase ticket');
      }
    } catch (error) {
      toast.error('Failed to purchase ticket');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amt: number) => `R ${amt.toFixed(2)}`;

  const ticketTypes = [
    { id: 'single', name: 'Single Trip', multiplier: 1 },
    { id: 'return', name: 'Return Trip', multiplier: 1.9 },
    { id: 'weekly', name: 'Weekly Pass', multiplier: 8 },
    { id: 'monthly', name: 'Monthly Pass', multiplier: 28 },
  ];

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <VisuallyHidden>
            <DialogTitle>Loading Gautrain</DialogTitle>
          </VisuallyHidden>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#00897B]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (view === 'confirmation' && bookingResult) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#43A047]">
              <CheckCircle className="w-5 h-5" />
              {activeTab === 'topup' ? 'Top-up Successful' : 'Ticket Purchased'}
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 rounded-xl bg-gradient-to-br from-[#009688] to-[#00796B] text-white text-center">
            <Train className="w-12 h-12 mx-auto mb-2" />
            <p className="font-bold text-lg">GAUTRAIN</p>
            <p className="text-xs opacity-80">Reference: {bookingResult.ticketRef || bookingResult.reference}</p>
          </div>

          <div className="space-y-2 text-sm">
            {activeTab === 'topup' ? (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-medium">R{bookingResult.amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Previous Balance</span>
                  <span>R{bookingResult.previousBalance?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">New Balance</span>
                  <span className="font-bold text-[#43A047]">R{bookingResult.newCardBalance?.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-500">Route</span>
                  <span className="font-medium">{bookingResult.from} → {bookingResult.to}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ticket Type</span>
                  <span>{bookingResult.ticketType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Passengers</span>
                  <span>{bookingResult.passengers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fare Type</span>
                  <span>{bookingResult.isPeak ? 'Peak' : 'Off-Peak'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Paid</span>
                  <span className="font-bold text-[#43A047]">R{bookingResult.totalAmount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Valid Until</span>
                  <span>{new Date(bookingResult.validUntil).toLocaleDateString()}</span>
                </div>
              </>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Timestamp</span>
                <span>{new Date(bookingResult.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* QR Code for tickets */}
          {activeTab === 'tickets' && (
            <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Scan at gate</p>
              <TicketQRCode data={bookingResult.ticketRef || bookingResult.reference} size={100} />
            </div>
          )}

          <Button onClick={onClose} className="w-full bg-[#009688] hover:bg-[#00796B]">
            Done
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Train className="w-5 h-5 text-[#009688]" />
            Gautrain
          </DialogTitle>
          <DialogDescription>
            Train tickets & card top-up
          </DialogDescription>
        </DialogHeader>

        {/* Virtual Card */}
        {card && (
          <div className="p-4 rounded-xl bg-gradient-to-br from-[#009688] to-[#00796B] text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                <Train className="w-4 h-4 text-white" />
              </div>
              <Badge className="bg-white/20 text-white">{card.cardType?.toUpperCase()}</Badge>
            </div>
            <p className="text-xs opacity-80 mb-1">Card Number</p>
            <p className="font-mono text-sm tracking-wider mb-3">{card.cardNumber}</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Balance</p>
                <p className="text-xl font-bold">{formatCurrency(Number(card.balance) || 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">Status</p>
                <p className="text-sm font-medium capitalize">{card.status}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'topup' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('topup')}
            className={activeTab === 'topup' ? 'bg-[#009688] hover:bg-[#00796B]' : ''}
          >
            Top Up
          </Button>
          <Button
            variant={activeTab === 'tickets' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('tickets')}
            className={activeTab === 'tickets' ? 'bg-[#009688] hover:bg-[#00796B]' : ''}
          >
            Buy Ticket
          </Button>
        </div>

        {activeTab === 'topup' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Top-up Amount (R10 - R5000)</Label>
              <Input
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                placeholder="Enter amount"
                className="h-10 mt-1"
                min="10"
                max="5000"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[50, 100, 200, 500].map((amt) => (
                <Button key={amt} variant="outline" size="sm" onClick={() => setTopupAmount(amt.toString())}>
                  R{amt}
                </Button>
              ))}
            </div>
            <Button
              onClick={handleTopup}
              disabled={!topupAmount || parseFloat(topupAmount) < 10 || processing}
              className="w-full bg-[#009688] hover:bg-[#00796B]"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Top Up Card
            </Button>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">From Station</Label>
              <Select value={fromStation} onValueChange={setFromStation}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue placeholder="Select departure station" />
                </SelectTrigger>
                <SelectContent>
                  {stations.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">To Station</Label>
              <Select value={toStation} onValueChange={setToStation}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue placeholder="Select arrival station" />
                </SelectTrigger>
                <SelectContent>
                  {stations.filter(s => s.id !== fromStation).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Ticket Type</Label>
              <Select value={ticketType} onValueChange={setTicketType}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ticketTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Passengers</Label>
              <div className="flex items-center gap-2 mt-1">
                <Button variant="outline" size="sm" onClick={() => setPassengers(Math.max(1, passengers - 1))}>
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="font-bold text-lg w-8 text-center">{passengers}</span>
                <Button variant="outline" size="sm" onClick={() => setPassengers(Math.min(10, passengers + 1))}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant={isPeak ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsPeak(true)}
                className={isPeak ? 'bg-[#009688] hover:bg-[#00796B]' : ''}
              >
                Peak (05:30-09:00, 15:30-18:30)
              </Button>
              <Button
                variant={!isPeak ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsPeak(false)}
                className={!isPeak ? 'bg-[#43A047] hover:bg-[#2E7D32]' : ''}
              >
                Off-Peak
              </Button>
            </div>

            {fromStation && toStation && fare && (
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-2">Fare Summary</p>
                <div className="flex justify-between text-sm mb-1">
                  <span>Base Fare ({isPeak ? 'Peak' : 'Off-Peak'})</span>
                  <span>R{isPeak ? fare.peak : fare.offPeak}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Ticket Type Multiplier</span>
                  <span>x{ticketTypes.find(t => t.id === ticketType)?.multiplier}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Passengers</span>
                  <span>x{passengers}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-sm font-bold">
                    <span>Total</span>
                    <span className="text-[#43A047]">
                      R{Math.round((isPeak ? fare.peak : fare.offPeak) * (ticketTypes.find(t => t.id === ticketType)?.multiplier || 1) * passengers)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleBuyTicket}
              disabled={!fromStation || !toStation || processing}
              className="w-full bg-[#009688] hover:bg-[#00796B]"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Purchase Ticket
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==================== BUS MODAL ====================
function BusModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [operators, setOperators] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [fromCity, setFromCity] = useState('');
  const [toCity, setToCity] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [isReturn, setIsReturn] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [returnResults, setReturnResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [selectedReturnBus, setSelectedReturnBus] = useState<any>(null);
  const [ticketClass, setTicketClass] = useState('economy');
  const [processing, setProcessing] = useState(false);
  const [view, setView] = useState<'search' | 'results' | 'return' | 'details' | 'travellers' | 'confirmation'>('search');
  const [bookingResult, setBookingResult] = useState<any>(null);
  
  // Traveller details
  const [travellers, setTravellers] = useState<{
    firstName: string;
    lastName: string;
    idNumber: string;
    phone: string;
    email: string;
    isPrimary: boolean;
  }[]>([
    { firstName: '', lastName: '', idNumber: '', phone: '', email: '', isPrimary: true }
  ]);

  // Bus ticket classes
  const ticketClasses = [
    { id: 'economy', name: 'Economy', description: 'Standard seating', multiplier: 1 },
    { id: 'business', name: 'Business', description: 'Reclining seats + AC', multiplier: 1.3 },
    { id: 'sleeper', name: 'Sleeper', description: 'Lie-flat berth', multiplier: 1.6 },
    { id: 'luxury', name: 'Luxury Sleeper', description: 'Private cabin + meals', multiplier: 2.2 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/transport?type=bus');
        const data = await res.json();
        if (data.success) {
          setOperators(data.data.operators || []);
          setCities(data.data.cities || []);
        }
      } catch (error) {
        console.error('Failed to fetch bus data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async () => {
    if (!fromCity || !toCity || !travelDate) {
      toast.error('Please select departure city, destination, and travel date');
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/transport?type=bus&action=search&from=${fromCity}&to=${toCity}&date=${travelDate}`);
      const data = await res.json();
      if (data.success) {
        if (data.data.results && data.data.results.length > 0) {
          setSearchResults(data.data.results);
          setView('results');
          toast.success(`Found ${data.data.results.length} buses`);
        } else {
          toast.error('No buses found for this route. Try different cities.');
        }
      } else {
        toast.error(data.error || 'Failed to search buses');
      }
    } catch (error) {
      console.error('Bus search error:', error);
      toast.error('Failed to search buses');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchReturn = async () => {
    if (!returnDate) {
      toast.error('Please select a return date');
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/transport?type=bus&action=search&from=${toCity}&to=${fromCity}&date=${returnDate}`);
      const data = await res.json();
      if (data.success && data.data.results?.length > 0) {
        setReturnResults(data.data.results);
        setView('return');
        toast.success(`Found ${data.data.results.length} return buses`);
      } else {
        toast.error('No return buses available');
      }
    } catch (error) {
      toast.error('Failed to search return buses');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectBus = (bus: any) => {
    setSelectedBus(bus);
    if (isReturn) {
      handleSearchReturn();
    } else {
      setView('travellers');
    }
  };

  const handleSelectReturnBus = (bus: any) => {
    setSelectedReturnBus(bus);
    setView('travellers');
  };

  const addTraveller = () => {
    setTravellers([...travellers, { firstName: '', lastName: '', idNumber: '', phone: '', email: '', isPrimary: false }]);
  };

  const removeTraveller = (index: number) => {
    if (travellers.length > 1) {
      setTravellers(travellers.filter((_, i) => i !== index));
    }
  };

  const updateTraveller = (index: number, field: string, value: string) => {
    const updated = [...travellers];
    updated[index] = { ...updated[index], [field]: value };
    setTravellers(updated);
  };

  const validateTravellers = () => {
    for (const t of travellers) {
      if (!t.firstName || !t.lastName || !t.idNumber || !t.phone) {
        return false;
      }
    }
    return true;
  };

  const handleBook = async () => {
    if (!validateTravellers()) {
      toast.error('Please fill in all required traveller details');
      return;
    }
    if (!selectedBus) return;
    setProcessing(true);
    
    const classMultiplier = ticketClasses.find(c => c.id === ticketClass)?.multiplier || 1;
    const outboundPrice = Math.round(selectedBus.price * classMultiplier);
    const returnPrice = selectedReturnBus ? Math.round(selectedReturnBus.price * classMultiplier) : 0;
    const totalAmount = (outboundPrice + returnPrice) * travellers.length;

    try {
      const res = await fetch('/api/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'bus-ticket',
          operatorId: selectedBus.operator.id,
          from: fromCity,
          to: toCity,
          date: travelDate,
          departureTime: selectedBus.departureTime,
          passengers: travellers.length,
          price: outboundPrice,
          busType: selectedBus.busType,
          ticketClass,
          travellers,
          isReturn,
          returnDate: isReturn ? returnDate : undefined,
          returnOperatorId: selectedReturnBus?.operator?.id,
          returnDepartureTime: selectedReturnBus?.departureTime,
          returnPrice,
          totalAmount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingResult(data.data);
        setView('confirmation');
        toast.success('Bus ticket booked successfully!');
      } else {
        toast.error(data.error || 'Failed to book ticket');
      }
    } catch (error) {
      toast.error('Failed to book ticket');
    } finally {
      setProcessing(false);
    }
  };

  const getCityName = (id: string) => cities.find(c => c.id === id)?.name || id;
  const selectedClass = ticketClasses.find(c => c.id === ticketClass);
  const classMultiplier = selectedClass?.multiplier || 1;

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <VisuallyHidden><DialogTitle>Loading Bus Tickets</DialogTitle></VisuallyHidden>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#795548]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Confirmation View
  if (view === 'confirmation' && bookingResult) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#43A047]">
              <CheckCircle className="w-5 h-5" />
              Booking Confirmed
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 rounded-xl bg-gradient-to-br from-[#795548] to-[#5D4037] text-white text-center">
            <Bus className="w-12 h-12 mx-auto mb-2" />
            <p className="font-bold text-lg">{bookingResult.operator}</p>
            <p className="text-xs opacity-80">Booking Ref: {bookingResult.bookingRef}</p>
          </div>

          {/* Travellers */}
          <div className="p-3 rounded-lg bg-gray-50">
            <p className="text-xs font-medium text-gray-700 mb-2">Passengers</p>
            {bookingResult.travellers?.map((t: any, i: number) => (
              <div key={i} className="flex items-center gap-2 py-1 border-b last:border-0">
                <div className="w-6 h-6 rounded-full bg-[#795548]/10 flex items-center justify-center text-xs">{i + 1}</div>
                <div>
                  <p className="text-sm font-medium">{t.firstName} {t.lastName}</p>
                  <p className="text-xs text-gray-500">ID: {t.idNumber}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-gray-50 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Outbound</span>
              <span className="font-medium">{bookingResult.route}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span>{bookingResult.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Departure</span>
              <span>{bookingResult.departureTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Class</span>
              <span className="font-medium">{selectedClass?.name}</span>
            </div>
            {bookingResult.isReturn && (
              <>
                <div className="border-t pt-2 mt-2">
                  <p className="font-medium text-gray-700">Return Journey</p>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Return Date</span>
                  <span>{bookingResult.returnDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Return Departure</span>
                  <span>{bookingResult.returnDepartureTime}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Seats</span>
              <span>{bookingResult.seats?.join(', ')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Bus Type</span>
              <span>{bookingResult.busType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Boarding</span>
              <span className="text-xs">{bookingResult.boardingPoint}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>Total Paid</span>
                <span className="text-[#43A047]">R{bookingResult.totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border-2 border-dashed border-gray-300 text-center">
            <p className="text-xs text-gray-500 mb-1">E-Ticket</p>
            <p className="text-xs font-mono text-[#795548] break-all">{bookingResult.eTicket}</p>
          </div>

          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Scan for boarding</p>
            <TicketQRCode data={bookingResult.bookingRef} size={100} />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(bookingResult.bookingRef)}>
              <Copy className="w-4 h-4 mr-1" /> Copy Ref
            </Button>
            <Button onClick={onClose} className="flex-1 bg-[#795548] hover:bg-[#5D4037]">Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Travellers View
  if (view === 'travellers') {
    const outboundPrice = Math.round((selectedBus?.price || 0) * classMultiplier);
    const returnPrice = Math.round((selectedReturnBus?.price || 0) * classMultiplier);
    const totalPerPerson = outboundPrice + returnPrice;

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#795548]" />
              Traveller Details
            </DialogTitle>
            <DialogDescription>
              Enter details for all {travellers.length} passenger{travellers.length > 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          {/* Journey Summary */}
          <div className="p-3 rounded-lg bg-[#795548]/10 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{getCityName(fromCity)} → {getCityName(toCity)}</span>
              <Badge variant="outline">{selectedClass?.name}</Badge>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {travelDate} • {selectedBus?.departureTime} • {selectedBus?.operator?.name}
            </div>
            {isReturn && selectedReturnBus && (
              <div className="text-xs text-gray-500 mt-1 pt-1 border-t">
                Return: {returnDate} • {selectedReturnBus?.departureTime}
              </div>
            )}
          </div>

          {/* Ticket Class Selection */}
          <div>
            <Label className="text-xs font-medium">Ticket Class</Label>
            <Select value={ticketClass} onValueChange={setTicketClass}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ticketClasses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} - R{Math.round((selectedBus?.price || 0) * c.multiplier)} ({c.description})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Traveller Forms */}
          <div className="space-y-3">
            {travellers.map((traveller, index) => (
              <Card key={index} className="relative">
                <CardContent className="pt-3 pb-3 px-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#795548] text-white flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="text-sm font-medium">
                        {traveller.isPrimary ? 'Primary Traveller' : `Passenger ${index + 1}`}
                      </span>
                    </div>
                    {travellers.length > 1 && !traveller.isPrimary && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeTraveller(index)}>
                        <X className="w-4 h-4 text-gray-400" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-gray-500">First Name *</Label>
                      <Input
                        value={traveller.firstName}
                        onChange={(e) => updateTraveller(index, 'firstName', e.target.value)}
                        placeholder="First name"
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-500">Last Name *</Label>
                      <Input
                        value={traveller.lastName}
                        onChange={(e) => updateTraveller(index, 'lastName', e.target.value)}
                        placeholder="Last name"
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Label className="text-[10px] text-gray-500">ID Number *</Label>
                      <Input
                        value={traveller.idNumber}
                        onChange={(e) => updateTraveller(index, 'idNumber', e.target.value)}
                        placeholder="SA ID or Passport"
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-500">Phone *</Label>
                      <Input
                        value={traveller.phone}
                        onChange={(e) => updateTraveller(index, 'phone', e.target.value)}
                        placeholder="Phone number"
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Label className="text-[10px] text-gray-500">Email</Label>
                    <Input
                      value={traveller.email}
                      onChange={(e) => updateTraveller(index, 'email', e.target.value)}
                      placeholder="Email (optional)"
                      className="h-8 text-sm mt-0.5"
                      type="email"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button variant="outline" onClick={addTraveller} className="w-full">
            <Plus className="w-4 h-4 mr-1" /> Add Another Passenger
          </Button>

          {/* Price Summary */}
          <div className="p-3 rounded-lg bg-[#795548]/10">
            <div className="flex justify-between text-sm">
              <span>Outbound x {travellers.length}</span>
              <span>R{outboundPrice * travellers.length}</span>
            </div>
            {isReturn && selectedReturnBus && (
              <div className="flex justify-between text-sm">
                <span>Return x {travellers.length}</span>
                <span>R{returnPrice * travellers.length}</span>
              </div>
            )}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-[#795548]">R{totalPerPerson * travellers.length}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => isReturn && selectedReturnBus ? setView('return') : setView('details')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button
              onClick={handleBook}
              disabled={processing || !validateTravellers()}
              className="flex-1 bg-[#795548] hover:bg-[#5D4037]"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Pay R{totalPerPerson * travellers.length}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Details View (selected bus)
  if (view === 'details' && selectedBus) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bus className="w-5 h-5 text-[#795548]" />
              {selectedBus.operator.name}
            </DialogTitle>
            <DialogDescription>{selectedBus.busType}</DialogDescription>
          </DialogHeader>

          <div className="p-3 rounded-lg bg-gray-50 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">From</span>
              <span className="font-medium">{selectedBus.fromCity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">To</span>
              <span className="font-medium">{selectedBus.toCity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span>{travelDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Duration</span>
              <span>{selectedBus.duration}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Seats Available</span>
              <span className="text-[#43A047] font-medium">{selectedBus.seatsAvailable}</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Amenities</p>
            <div className="flex flex-wrap gap-1">
              {selectedBus.amenities?.map((a: string, i: number) => (
                <Badge key={i} variant="outline" className="text-xs">{a}</Badge>
              ))}
            </div>
          </div>

          {/* Ticket Class Selection */}
          <div>
            <Label className="text-xs font-medium">Select Class</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {ticketClasses.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setTicketClass(c.id)}
                  className={`p-2 rounded-lg border-2 cursor-pointer transition-all ${
                    ticketClass === c.id ? 'border-[#795548] bg-[#795548]/10' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-[10px] text-gray-500">{c.description}</p>
                  <p className="text-sm font-bold text-[#795548] mt-1">R{Math.round(selectedBus.price * c.multiplier)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Return Trip Option */}
          <div className="p-3 rounded-lg border-2 border-dashed border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Return Trip?</p>
                <p className="text-xs text-gray-500">Book a return journey</p>
              </div>
              <Button
                variant={isReturn ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsReturn(!isReturn)}
                className={isReturn ? 'bg-[#795548] hover:bg-[#5D4037]' : ''}
              >
                {isReturn ? 'Yes' : 'No'}
              </Button>
            </div>
            {isReturn && (
              <div className="mt-2">
                <Label className="text-xs">Return Date</Label>
                <Input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="h-9 mt-1"
                  min={travelDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-[#795548]/10">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Price per ticket</p>
                <p className="font-bold text-lg">R{Math.round(selectedBus.price * classMultiplier)}</p>
              </div>
              <Badge variant="outline">{selectedClass?.name}</Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setView('results')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button
              onClick={() => {
                if (isReturn && returnDate) {
                  handleSearchReturn();
                } else if (isReturn && !returnDate) {
                  toast.error('Please select a return date');
                } else {
                  setView('travellers');
                }
              }}
              className="flex-1 bg-[#795548] hover:bg-[#5D4037]"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Return Results View
  if (view === 'return') {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bus className="w-5 h-5 text-[#795548]" />
              Select Return Bus
            </DialogTitle>
            <DialogDescription>
              {getCityName(toCity)} → {getCityName(fromCity)} on {returnDate}
            </DialogDescription>
          </DialogHeader>

          {/* Outbound Summary */}
          <div className="p-2 rounded-lg bg-[#795548]/10 text-xs">
            <p className="font-medium">Outbound: {selectedBus.operator.name}</p>
            <p className="text-gray-500">{travelDate} • {selectedBus.departureTime}</p>
          </div>

          {searching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#795548]" />
            </div>
          ) : (
            <div className="space-y-2">
              {returnResults.map((result, idx) => (
                <Card 
                  key={idx} 
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-[#795548]"
                  onClick={() => handleSelectReturnBus(result)}
                >
                  <CardContent className="py-2.5 px-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{result.operator.logo}</span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{result.operator.name}</p>
                          <p className="text-xs text-gray-500">{result.busType}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#43A047]">R{Math.round(result.price * classMultiplier)}</p>
                        <p className="text-xs text-gray-500">{result.seatsAvailable} seats</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <div>
                        <p className="text-sm font-bold">{result.departureTime}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-400">{result.duration}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{result.arrivalTime}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Button variant="outline" onClick={() => setView('details')} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Results View
  if (view === 'results') {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bus className="w-5 h-5 text-[#795548]" />
              Select Bus
            </DialogTitle>
            <DialogDescription>
              {getCityName(fromCity)} → {getCityName(toCity)} on {travelDate}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {searchResults.map((result, idx) => (
              <Card 
                key={idx} 
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-[#795548]"
                onClick={() => handleSelectBus(result)}
              >
                <CardContent className="py-2.5 px-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{result.operator.logo}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{result.operator.name}</p>
                        <p className="text-xs text-gray-500">{result.busType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#43A047]">R{result.price}</p>
                      <p className="text-xs text-gray-500">{result.seatsAvailable} seats left</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <div>
                      <p className="text-sm font-bold">{result.departureTime}</p>
                      <p className="text-xs text-gray-500">{result.fromCity}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-gray-400">{result.duration}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{result.arrivalTime}</p>
                      <p className="text-xs text-gray-500">{result.toCity}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t flex flex-wrap gap-1">
                    {result.amenities?.slice(0, 4).map((a: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{a}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button variant="outline" onClick={() => setView('search')} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-1" /> Modify Search
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Search View
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bus className="w-5 h-5 text-[#795548]" />
            Bus Tickets
          </DialogTitle>
          <DialogDescription>Intercape, Greyhound, Translux & more</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Select value={fromCity} onValueChange={setFromCity}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue placeholder="Departure" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Select value={toCity} onValueChange={setToCity}>
                <SelectTrigger className="mt-1 h-9">
                  <SelectValue placeholder="Destination" />
                </SelectTrigger>
                <SelectContent>
                  {cities.filter(c => c.id !== fromCity).map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Departure Date</Label>
              <Input
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                className="h-9 mt-1"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label className="text-xs">Return Date (Optional)</Label>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => {
                  setReturnDate(e.target.value);
                  setIsReturn(!!e.target.value);
                }}
                className="h-9 mt-1"
                min={travelDate || new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          {/* Quick Class Selection */}
          <div>
            <Label className="text-xs">Ticket Class</Label>
            <div className="flex gap-1 mt-1">
              {ticketClasses.map((c) => (
                <Button
                  key={c.id}
                  variant={ticketClass === c.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTicketClass(c.id)}
                  className={`flex-1 h-8 text-xs ${ticketClass === c.id ? 'bg-[#795548] hover:bg-[#5D4037]' : ''}`}
                >
                  {c.name}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={!fromCity || !toCity || !travelDate || searching}
            className="w-full bg-[#795548] hover:bg-[#5D4037]"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {isReturn ? 'Search Return Trip' : 'Search Buses'}
          </Button>
        </div>

        {searchResults.length === 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Partner Operators</p>
            <div className="flex flex-wrap gap-2">
              {operators.map((op) => (
                <div key={op.id} className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-full text-xs">
                  <span>{op.logo}</span>
                  <span>{op.name}</span>
                  <span className="text-amber-500">★{op.rating}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==================== FLIGHTS MODAL ====================
function FlightsModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [airlines, setAirlines] = useState<any[]>([]);
  const [airports, setAirports] = useState<any[]>([]);
  const [lounges, setLounges] = useState<any[]>([]);
  const [fromAirport, setFromAirport] = useState('');
  const [toAirport, setToAirport] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [isReturn, setIsReturn] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [returnResults, setReturnResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [selectedReturnFlight, setSelectedReturnFlight] = useState<any>(null);
  const [cabinClass, setCabinClass] = useState('economy');
  const [selectedLounge, setSelectedLounge] = useState<string>('none');
  const [processing, setProcessing] = useState(false);
  const [view, setView] = useState<'search' | 'results' | 'return' | 'details' | 'travellers' | 'confirmation'>('search');
  const [bookingResult, setBookingResult] = useState<any>(null);

  // Traveller details
  const [travellers, setTravellers] = useState<{
    firstName: string;
    lastName: string;
    idNumber: string;
    phone: string;
    email: string;
    dateOfBirth: string;
    passportNumber?: string;
    nationality?: string;
    isPrimary: boolean;
  }[]>([
    { firstName: '', lastName: '', idNumber: '', phone: '', email: '', dateOfBirth: '', isPrimary: true }
  ]);

  const cabinClasses = [
    { id: 'economy', name: 'Economy', multiplier: 1 },
    { id: 'premium_economy', name: 'Premium Economy', multiplier: 1.5 },
    { id: 'business', name: 'Business', multiplier: 2.5 },
    { id: 'first', name: 'First Class', multiplier: 4 },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/transport?type=flights');
        const data = await res.json();
        if (data.success) {
          setAirlines(data.data.airlines || []);
          setAirports(data.data.airports || []);
          setLounges(data.data.lounges || []);
        }
      } catch (error) {
        console.error('Failed to fetch flights data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async () => {
    if (!fromAirport || !toAirport || !travelDate) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/transport?type=flights&action=search&from=${fromAirport}&to=${toAirport}&date=${travelDate}`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.data.results);
        if (data.data.lounges) {
          setLounges(data.data.lounges);
        }
        setView('results');
        toast.success(`Found ${data.data.results?.length || 0} flights`);
      }
    } catch (error) {
      toast.error('Failed to search flights');
    } finally {
      setSearching(false);
    }
  };

  const handleSearchReturn = async () => {
    if (!returnDate) {
      toast.error('Please select a return date');
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/transport?type=flights&action=search&from=${toAirport}&to=${fromAirport}&date=${returnDate}`);
      const data = await res.json();
      if (data.success && data.data.results?.length > 0) {
        setReturnResults(data.data.results);
        setView('return');
        toast.success(`Found ${data.data.results.length} return flights`);
      } else {
        toast.error('No return flights available');
      }
    } catch (error) {
      toast.error('Failed to search return flights');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectFlight = (flight: any) => {
    setSelectedFlight(flight);
    if (isReturn) {
      handleSearchReturn();
    } else {
      setView('travellers');
    }
  };

  const handleSelectReturnFlight = (flight: any) => {
    setSelectedReturnFlight(flight);
    setView('travellers');
  };

  const addTraveller = () => {
    setTravellers([...travellers, { firstName: '', lastName: '', idNumber: '', phone: '', email: '', dateOfBirth: '', isPrimary: false }]);
  };

  const removeTraveller = (index: number) => {
    if (travellers.length > 1) {
      setTravellers(travellers.filter((_, i) => i !== index));
    }
  };

  const updateTraveller = (index: number, field: string, value: string) => {
    const updated = [...travellers];
    updated[index] = { ...updated[index], [field]: value };
    setTravellers(updated);
  };

  const validateTravellers = () => {
    for (const t of travellers) {
      if (!t.firstName || !t.lastName || !t.idNumber || !t.phone || !t.dateOfBirth) {
        return false;
      }
    }
    return true;
  };

  const handleBook = async () => {
    if (!validateTravellers()) {
      toast.error('Please fill in all required traveller details');
      return;
    }
    if (!selectedFlight) return;
    setProcessing(true);
    
    const classMultiplier = cabinClasses.find(c => c.id === cabinClass)?.multiplier || 1;
    const outboundPrice = Math.round((selectedFlight.economyPrice || selectedFlight.price || 0) * classMultiplier);
    const returnPrice = selectedReturnFlight ? Math.round((selectedReturnFlight.economyPrice || selectedReturnFlight.price || 0) * classMultiplier) : 0;
    const loungePrice = selectedLounge !== 'none' ? lounges.find(l => l.id === selectedLounge)?.price || 0 : 0;
    const totalAmount = (outboundPrice + returnPrice + loungePrice) * travellers.length;

    try {
      const res = await fetch('/api/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'flight-ticket',
          airlineId: selectedFlight.airline.id,
          flightNumber: selectedFlight.flightNumber,
          from: fromAirport,
          to: toAirport,
          date: travelDate,
          departureTime: selectedFlight.departureTime,
          arrivalTime: selectedFlight.arrivalTime,
          passengers: travellers.length,
          cabinClass,
          price: outboundPrice,
          loungeAccess: selectedLounge !== 'none' ? selectedLounge : undefined,
          travellers,
          isReturn,
          returnDate: isReturn ? returnDate : undefined,
          returnAirlineId: selectedReturnFlight?.airline?.id,
          returnFlightNumber: selectedReturnFlight?.flightNumber,
          returnDepartureTime: selectedReturnFlight?.departureTime,
          returnArrivalTime: selectedReturnFlight?.arrivalTime,
          returnPrice,
          totalAmount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingResult(data.data);
        setView('confirmation');
        toast.success('Flight booked successfully!');
      } else {
        toast.error(data.error || 'Failed to book flight');
      }
    } catch (error) {
      toast.error('Failed to book flight');
    } finally {
      setProcessing(false);
    }
  };

  const getAirportName = (code: string) => {
    const airport = airports.find(a => a.code === code);
    return airport ? `${airport.city} (${airport.code})` : code;
  };
  const selectedClass = cabinClasses.find(c => c.id === cabinClass);
  const classMultiplier = selectedClass?.multiplier || 1;
  const selectedLoungeObj = lounges.find(l => l.id === selectedLounge);

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <VisuallyHidden><DialogTitle>Loading Flights</DialogTitle></VisuallyHidden>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#03A9F4]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Confirmation View
  if (view === 'confirmation' && bookingResult) {
    const iataClass = bookingResult.cabinClass === 'Economy' ? 'Y' : 
                      bookingResult.cabinClass === 'Premium Economy' ? 'W' : 
                      bookingResult.cabinClass === 'Business' ? 'J' : 
                      bookingResult.cabinClass === 'First Class' ? 'F' : 'Y';
    const seatNumber = `${Math.floor(Math.random() * 30) + 1}${['A', 'B', 'C', 'D', 'E', 'F'][Math.floor(Math.random() * 6)]}`;
    const boardingTime = bookingResult.departureTime ? 
      `${(parseInt(bookingResult.departureTime.split(':')[0]) - 1).toString().padStart(2, '0')}:${bookingResult.departureTime.split(':')[1]}` : 
      'Unknown';
    
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#43A047]">
              <CheckCircle className="w-5 h-5" />
              Boarding Pass
            </DialogTitle>
            <DialogDescription>IATA BCBP Compliant E-Ticket</DialogDescription>
          </DialogHeader>

          {/* Travellers */}
          <div className="p-3 rounded-lg bg-gray-50">
            <p className="text-xs font-medium text-gray-700 mb-2">Passengers</p>
            {bookingResult.travellers?.map((t: any, i: number) => (
              <div key={i} className="flex items-center gap-2 py-1 border-b last:border-0">
                <div className="w-6 h-6 rounded-full bg-[#03A9F4]/10 flex items-center justify-center text-xs text-[#03A9F4]">{i + 1}</div>
                <div>
                  <p className="text-sm font-medium">{t.firstName} {t.lastName}</p>
                  <p className="text-xs text-gray-500">ID: {t.idNumber}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Boarding Pass Header */}
          <div className="p-4 rounded-t-xl bg-gradient-to-br from-[#03A9F4] to-[#0288D1] text-white">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="font-bold text-lg">{bookingResult.airline}</p>
                <p className="text-sm opacity-80">{bookingResult.flightNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-70">PNR</p>
                <p className="font-bold text-lg tracking-wider">{bookingResult.pnr}</p>
              </div>
            </div>
            <div className="flex justify-between items-center py-3 border-t border-white/20">
              <div className="text-center">
                <p className="text-2xl font-bold">{bookingResult.route?.split(' → ')[0] || fromAirport}</p>
              </div>
              <div className="flex-1 px-4">
                <div className="w-full h-0.5 bg-white/30"></div>
                <Plane className="w-4 h-4 absolute text-white" style={{ marginTop: '-8px', marginLeft: '45%' }} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{bookingResult.route?.split(' → ')[1] || toAirport}</p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-white border-x border-gray-200">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div><p className="text-[10px] text-gray-400 uppercase">Date</p><p className="text-sm font-bold">{bookingResult.date}</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase">Depart</p><p className="text-sm font-bold">{bookingResult.departureTime}</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase">Class</p><p className="text-sm font-bold">{iataClass}</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase">Gate</p><p className="text-sm font-bold text-[#03A9F4]">{bookingResult.gate}</p></div>
            </div>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 border-t-0 rounded-b-xl">
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div><p className="text-[10px] text-gray-400 uppercase">Seat</p><p className="text-lg font-bold text-[#03A9F4]">{seatNumber}</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase">Boarding</p><p className="text-lg font-bold text-[#43A047]">{boardingTime}</p></div>
              <div><p className="text-[10px] text-gray-400 uppercase">Baggage</p><p className="text-xs font-medium">{bookingResult.baggage}</p></div>
            </div>
            {bookingResult.loungeAccess && (
              <div className="mt-2 p-2 rounded bg-[#03A9F4]/10 text-center">
                <p className="text-xs font-medium text-[#03A9F4]">✓ Lounge Access: {bookingResult.loungeAccess.name}</p>
              </div>
            )}
          </div>

          {bookingResult.isReturn && (
            <div className="p-3 rounded-lg bg-[#03A9F4]/10">
              <p className="font-medium text-gray-700 text-sm">Return Flight</p>
              <p className="text-xs text-gray-500">{bookingResult.returnDate} • {bookingResult.returnFlightNumber}</p>
              <p className="text-xs text-gray-500">Depart: {bookingResult.returnDepartureTime}</p>
            </div>
          )}

          <div className="flex flex-col items-center p-3 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-xs text-gray-500 mb-2 font-medium">IATA BCBP Aztec Barcode</p>
            <AztecBarcode 
              data={{
                passengerName: bookingResult.travellers?.[0] ? `${bookingResult.travellers[0].lastName}/${bookingResult.travellers[0].firstName}`.toUpperCase() : 'PASSENGER',
                pnr: bookingResult.pnr,
                from: bookingResult.route?.split(' → ')[0] || fromAirport,
                to: bookingResult.route?.split(' → ')[1] || toAirport,
                flightNumber: bookingResult.flightNumber,
                date: bookingResult.date?.replace(/-/g, '').slice(-6) || '000000',
                seat: seatNumber,
                class: iataClass,
                seq: '001'
              }}
              size={140}
            />
          </div>

          <div className="flex justify-between items-center p-3 bg-[#43A047]/10 rounded-lg">
            <span className="font-medium text-gray-700">Total Paid</span>
            <span className="text-lg font-bold text-[#43A047]">R{bookingResult.totalAmount}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(bookingResult.pnr)}>
              <Copy className="w-4 h-4 mr-1" /> Copy PNR
            </Button>
            <Button onClick={onClose} className="flex-1 bg-[#03A9F4] hover:bg-[#0288D1]">Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Travellers View
  if (view === 'travellers') {
    const outboundPrice = Math.round((selectedFlight?.economyPrice || selectedFlight?.price || 0) * classMultiplier);
    const returnPrice = selectedReturnFlight ? Math.round((selectedReturnFlight.economyPrice || selectedReturnFlight.price || 0) * classMultiplier) : 0;
    const loungePrice = selectedLounge !== 'none' ? selectedLoungeObj?.price || 0 : 0;
    const totalPerPerson = outboundPrice + returnPrice + loungePrice;

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#03A9F4]" />
              Traveller Details
            </DialogTitle>
            <DialogDescription>
              Enter details for all {travellers.length} passenger{travellers.length > 1 ? 's' : ''} (required for IATA compliance)
            </DialogDescription>
          </DialogHeader>

          {/* Journey Summary */}
          <div className="p-3 rounded-lg bg-[#03A9F4]/10 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{getAirportName(fromAirport)} → {getAirportName(toAirport)}</span>
              <Badge variant="outline">{selectedClass?.name}</Badge>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {travelDate} • {selectedFlight?.departureTime} • {selectedFlight?.flightNumber}
            </div>
            {isReturn && selectedReturnFlight && (
              <div className="text-xs text-gray-500 mt-1 pt-1 border-t">
                Return: {returnDate} • {selectedReturnFlight?.departureTime}
              </div>
            )}
          </div>

          {/* Cabin Class Selection */}
          <div>
            <Label className="text-xs font-medium">Cabin Class</Label>
            <Select value={cabinClass} onValueChange={setCabinClass}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cabinClasses.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} - R{Math.round((selectedFlight?.economyPrice || 0) * c.multiplier)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Lounge Access */}
          {lounges.length > 0 && (
            <div>
              <Label className="text-xs font-medium">Airport Lounge (Optional)</Label>
              <Select value={selectedLounge} onValueChange={setSelectedLounge}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None - Skip lounge</SelectItem>
                  {lounges.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name} - R{l.price}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Traveller Forms */}
          <div className="space-y-3">
            {travellers.map((traveller, index) => (
              <Card key={index}>
                <CardContent className="pt-3 pb-3 px-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#03A9F4] text-white flex items-center justify-center text-xs font-medium">{index + 1}</div>
                      <span className="text-sm font-medium">{traveller.isPrimary ? 'Primary Traveller' : `Passenger ${index + 1}`}</span>
                    </div>
                    {travellers.length > 1 && !traveller.isPrimary && (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => removeTraveller(index)}>
                        <X className="w-4 h-4 text-gray-400" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-gray-500">First Name *</Label>
                      <Input value={traveller.firstName} onChange={(e) => updateTraveller(index, 'firstName', e.target.value)} placeholder="First name" className="h-8 text-sm mt-0.5" />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-500">Last Name *</Label>
                      <Input value={traveller.lastName} onChange={(e) => updateTraveller(index, 'lastName', e.target.value)} placeholder="Last name" className="h-8 text-sm mt-0.5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Label className="text-[10px] text-gray-500">ID/Passport *</Label>
                      <Input value={traveller.idNumber} onChange={(e) => updateTraveller(index, 'idNumber', e.target.value)} placeholder="ID or Passport" className="h-8 text-sm mt-0.5" />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-500">Date of Birth *</Label>
                      <Input type="date" value={traveller.dateOfBirth} onChange={(e) => updateTraveller(index, 'dateOfBirth', e.target.value)} className="h-8 text-sm mt-0.5" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <Label className="text-[10px] text-gray-500">Phone *</Label>
                      <Input value={traveller.phone} onChange={(e) => updateTraveller(index, 'phone', e.target.value)} placeholder="Phone" className="h-8 text-sm mt-0.5" />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-500">Email</Label>
                      <Input type="email" value={traveller.email} onChange={(e) => updateTraveller(index, 'email', e.target.value)} placeholder="Email" className="h-8 text-sm mt-0.5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button variant="outline" onClick={addTraveller} className="w-full">
            <Plus className="w-4 h-4 mr-1" /> Add Another Passenger
          </Button>

          {/* Price Summary */}
          <div className="p-3 rounded-lg bg-[#03A9F4]/10">
            <div className="flex justify-between text-sm"><span>Outbound x {travellers.length}</span><span>R{outboundPrice * travellers.length}</span></div>
            {isReturn && selectedReturnFlight && <div className="flex justify-between text-sm"><span>Return x {travellers.length}</span><span>R{returnPrice * travellers.length}</span></div>}
            {loungePrice > 0 && <div className="flex justify-between text-sm"><span>Lounge x {travellers.length}</span><span>R{loungePrice * travellers.length}</span></div>}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold"><span>Total</span><span className="text-[#03A9F4]">R{totalPerPerson * travellers.length}</span></div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => isReturn && selectedReturnFlight ? setView('return') : setView('results')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button onClick={handleBook} disabled={processing || !validateTravellers()} className="flex-1 bg-[#03A9F4] hover:bg-[#0288D1]">
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Pay R{totalPerPerson * travellers.length}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Return Results View
  if (view === 'return') {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-[#03A9F4]" />
              Select Return Flight
            </DialogTitle>
            <DialogDescription>{getAirportName(toAirport)} → {getAirportName(fromAirport)} on {returnDate}</DialogDescription>
          </DialogHeader>

          <div className="p-2 rounded-lg bg-[#03A9F4]/10 text-xs">
            <p className="font-medium">Outbound: {selectedFlight?.flightNumber}</p>
            <p className="text-gray-500">{travelDate} • {selectedFlight?.departureTime}</p>
          </div>

          {searching ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#03A9F4]" /></div>
          ) : (
            <div className="space-y-2">
              {returnResults.map((result, idx) => (
                <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-[#03A9F4]" onClick={() => handleSelectReturnFlight(result)}>
                  <CardContent className="py-2.5 px-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{result.airline.logo}</span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{result.flightNumber}</p>
                          <p className="text-xs text-gray-500">{result.airline.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#43A047]">R{Math.round((result.economyPrice || result.price) * classMultiplier)}</p>
                        <p className="text-xs text-gray-500">{result.seatsLeft} seats</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <div><p className="text-sm font-bold">{result.departureTime}</p><p className="text-xs text-gray-500">{result.fromAirport?.city}</p></div>
                      <div className="text-center"><p className="text-xs text-gray-400">{result.duration}</p></div>
                      <div className="text-right"><p className="text-sm font-bold">{result.arrivalTime}</p><p className="text-xs text-gray-500">{result.toAirport?.city}</p></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <Button variant="outline" onClick={() => setView('results')} className="w-full"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Results View
  if (view === 'results') {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-[#03A9F4]" />
              Select Flight
            </DialogTitle>
            <DialogDescription>{getAirportName(fromAirport)} → {getAirportName(toAirport)} on {travelDate}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {searchResults.map((result, idx) => (
              <Card key={idx} className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-[#03A9F4]" onClick={() => handleSelectFlight(result)}>
                <CardContent className="py-2.5 px-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{result.airline.logo}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{result.flightNumber}</p>
                        <p className="text-xs text-gray-500">{result.airline.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#43A047]">R{result.economyPrice || result.price}</p>
                      <p className="text-xs text-gray-500">{result.seatsLeft} seats</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t">
                    <div><p className="text-sm font-bold">{result.departureTime}</p><p className="text-xs text-gray-500">{result.fromAirport?.city}</p></div>
                    <div className="text-center"><p className="text-xs text-gray-400">{result.duration}</p></div>
                    <div className="text-right"><p className="text-sm font-bold">{result.arrivalTime}</p><p className="text-xs text-gray-500">{result.toAirport?.city}</p></div>
                  </div>
                  <div className="mt-2 pt-2 border-t flex items-center gap-2 text-xs text-gray-500">
                    <span>🧳 {result.baggage}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button variant="outline" onClick={() => setView('search')} className="w-full"><ArrowLeft className="w-4 h-4 mr-1" /> Modify Search</Button>
        </DialogContent>
      </Dialog>
    );
  }

  // Search View
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-[#03A9F4]" />
            Flights
          </DialogTitle>
          <DialogDescription>FlySafair, Lift, Airlink & more</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">From</Label>
              <Select value={fromAirport} onValueChange={setFromAirport}>
                <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Departure" /></SelectTrigger>
                <SelectContent>
                  {airports.map((a) => (
                    <SelectItem key={a.id} value={a.code}>{a.city} ({a.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">To</Label>
              <Select value={toAirport} onValueChange={setToAirport}>
                <SelectTrigger className="mt-1 h-9"><SelectValue placeholder="Destination" /></SelectTrigger>
                <SelectContent>
                  {airports.filter(a => a.code !== fromAirport).map((a) => (
                    <SelectItem key={a.id} value={a.code}>{a.city} ({a.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Departure Date</Label>
              <Input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className="h-9 mt-1" min={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <Label className="text-xs">Return Date (Optional)</Label>
              <Input type="date" value={returnDate} onChange={(e) => { setReturnDate(e.target.value); setIsReturn(!!e.target.value); }} className="h-9 mt-1" min={travelDate || new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          {/* Quick Class Selection */}
          <div>
            <Label className="text-xs">Cabin Class</Label>
            <div className="flex gap-1 mt-1">
              {cabinClasses.slice(0, 3).map((c) => (
                <Button key={c.id} variant={cabinClass === c.id ? 'default' : 'outline'} size="sm" onClick={() => setCabinClass(c.id)} className={`flex-1 h-8 text-xs ${cabinClass === c.id ? 'bg-[#03A9F4] hover:bg-[#0288D1]' : ''}`}>
                  {c.name}
                </Button>
              ))}
            </div>
          </div>

          <Button onClick={handleSearch} disabled={!fromAirport || !toAirport || !travelDate || searching} className="w-full bg-[#03A9F4] hover:bg-[#0288D1]">
            {searching ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
            {isReturn ? 'Search Round Trip' : 'Search Flights'}
          </Button>
        </div>

        {searchResults.length === 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Partner Airlines</p>
            <div className="flex flex-wrap gap-2">
              {airlines.map((a) => (
                <div key={a.id} className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-full text-xs">
                  <span>{a.logo}</span>
                  <span>{a.name}</span>
                  <span className="text-amber-500">★{a.rating}</span>
                </div>
              ))}
            </div>
            <p className="text-xs font-medium text-gray-700 mb-2 mt-4">Airport Lounges</p>
            <div className="flex flex-wrap gap-2">
              {lounges.slice(0, 4).map((l) => (
                <div key={l.id} className="flex items-center gap-1 px-2 py-1 bg-[#03A9F4]/10 rounded-full text-xs">
                  <span>🛋️</span>
                  <span>{l.name}</span>
                  <span className="text-[#03A9F4]">R{l.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==================== EVENTS MODAL ====================
function EventsModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedTicketType, setSelectedTicketType] = useState<any>(null);
  const [ticketQty, setTicketQty] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [view, setView] = useState<'list' | 'details' | 'confirmation'>('list');
  const [bookingResult, setBookingResult] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/transport?type=events');
        const data = await res.json();
        if (data.success) {
          setCategories(data.data.categories || []);
          setEvents(data.data.events || []);
        }
      } catch (error) {
        console.error('Failed to fetch events data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event);
    setSelectedTicketType(event.ticketTypes?.[0] || { id: 'general', name: 'General', price: event.minPrice });
    setView('details');
  };

  const handleBook = async () => {
    if (!selectedEvent || !selectedTicketType) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/transport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'event-ticket',
          eventId: selectedEvent.id,
          ticketTypeId: selectedTicketType.id,
          quantity: ticketQty,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBookingResult(data.data);
        setView('confirmation');
        toast.success('Event tickets booked successfully!');
      } else {
        toast.error(data.error || 'Failed to book tickets');
      }
    } catch (error) {
      toast.error('Failed to book tickets');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <VisuallyHidden>
            <DialogTitle>Loading Events</DialogTitle>
          </VisuallyHidden>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#9C27B0]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Confirmation View
  if (view === 'confirmation' && bookingResult) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#43A047]">
              <CheckCircle className="w-5 h-5" />
              Tickets Booked!
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 rounded-xl bg-gradient-to-br from-[#9C27B0] to-[#7B1FA2] text-white text-center">
            <span className="text-5xl">{bookingResult.eventImage}</span>
            <p className="font-bold text-lg mt-2">{bookingResult.event}</p>
            <p className="text-xs opacity-80">Booking Ref: {bookingResult.bookingRef}</p>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Venue</span>
              <span className="font-medium">{bookingResult.venue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Address</span>
              <span className="text-xs">{bookingResult.venueAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span>{bookingResult.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Time</span>
              <span>{bookingResult.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Ticket Type</span>
              <span>{bookingResult.ticketType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Quantity</span>
              <span>{bookingResult.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Seats</span>
              <span>{bookingResult.seats?.join(', ')}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>Total Paid</span>
                <span className="text-[#43A047]">R{bookingResult.totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border-2 border-dashed border-gray-300 text-center">
            <p className="text-xs text-gray-500 mb-1">QR Code / Entry</p>
            <p className="text-xs font-mono text-[#9C27B0] break-all">{bookingResult.qrCode}</p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Scan at venue entrance</p>
            <TicketQRCode data={bookingResult.bookingRef} size={100} />
          </div>

          <div className="p-3 rounded-lg bg-[#9C27B0]/10 text-xs text-center">
            <p className="font-medium text-[#9C27B0]">Important</p>
            <p className="text-gray-600 mt-1">Present this QR code or booking reference at the venue entrance. Arrive 30 minutes before the event.</p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(bookingResult.bookingRef)}>
              <Copy className="w-4 h-4 mr-1" /> Copy Ref
            </Button>
            <Button onClick={onClose} className="flex-1 bg-[#9C27B0] hover:bg-[#7B1FA2]">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Details View
  if (view === 'details' && selectedEvent) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-[#9C27B0]" />
              {selectedEvent.name}
            </DialogTitle>
          </DialogHeader>

          <div className="p-4 rounded-xl bg-gradient-to-br from-[#9C27B0] to-[#7B1FA2] text-white text-center">
            <span className="text-5xl">{selectedEvent.image}</span>
          </div>

          <div className="p-3 rounded-lg bg-gray-50 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Venue</span>
              <span className="font-medium">{selectedEvent.venue}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span>{selectedEvent.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Time</span>
              <span>{selectedEvent.time}</span>
            </div>
          </div>

          {selectedEvent.ticketTypes && selectedEvent.ticketTypes.length > 0 && (
            <div>
              <Label className="text-xs">Ticket Type</Label>
              <div className="space-y-2 mt-2">
                {selectedEvent.ticketTypes.map((t: any) => (
                  <Card 
                    key={t.id}
                    className={`cursor-pointer transition-all ${selectedTicketType?.id === t.id ? 'border-2 border-[#9C27B0] bg-[#9C27B0]/5' : ''}`}
                    onClick={() => setSelectedTicketType(t)}
                  >
                    <CardContent className="py-2 px-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {selectedTicketType?.id === t.id && <CheckCircle className="w-4 h-4 text-[#9C27B0]" />}
                        <span className="font-medium text-sm">{t.name}</span>
                      </div>
                      <span className="font-bold">R{t.price}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs">Number of Tickets</Label>
            <div className="flex items-center gap-2 mt-1">
              <Button variant="outline" size="sm" onClick={() => setTicketQty(Math.max(1, ticketQty - 1))}>
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-bold text-lg w-8 text-center">{ticketQty}</span>
              <Button variant="outline" size="sm" onClick={() => setTicketQty(Math.min(10, ticketQty + 1))}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#9C27B0]/10">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500">Per ticket</p>
                <p className="font-bold text-lg">R{selectedTicketType?.price || selectedEvent.minPrice}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total</p>
                <p className="font-bold text-xl text-[#9C27B0]">
                  R{(selectedTicketType?.price || selectedEvent.minPrice) * ticketQty}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setView('list')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <Button
              onClick={handleBook}
              disabled={processing || !selectedTicketType}
              className="flex-1 bg-[#9C27B0] hover:bg-[#7B1FA2]"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Book Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // List View
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#9C27B0]" />
            Events
          </DialogTitle>
          <DialogDescription>
            Concerts, Sports, Comedy, Theatre & more
          </DialogDescription>
        </DialogHeader>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={!selectedCategory ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('')}
            className={!selectedCategory ? 'bg-[#9C27B0] hover:bg-[#7B1FA2]' : ''}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id ? 'bg-[#9C27B0] hover:bg-[#7B1FA2]' : ''}
            >
              {cat.icon} {cat.name}
            </Button>
          ))}
        </div>

        {/* Events List */}
        <div className="space-y-2">
          {events
            .filter(e => !selectedCategory || e.category === selectedCategory)
            .map((event) => (
              <Card 
                key={event.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-[#9C27B0]"
                onClick={() => handleSelectEvent(event)}
              >
                <CardContent className="py-2.5 px-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9C27B0] to-[#7B1FA2] flex items-center justify-center text-2xl">
                      {event.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{event.name}</p>
                      <p className="text-xs text-gray-500 truncate">{event.venue}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">{event.date}</Badge>
                        <Badge variant="outline" className="text-[10px]">{event.time}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">From</p>
                      <p className="font-bold text-[#43A047]">R{event.minPrice}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ==================== VOUCHERS MODAL ====================
type VouchersView = 'main' | 'vouchers' | 'giftcards' | 'purchase' | 'my-vouchers';

function VouchersModal({ onClose }: { onClose: () => void }) {
  const [view, setView] = useState<VouchersView>('main');
  const [loading, setLoading] = useState(true);
  const [voucherTypes, setVoucherTypes] = useState<any[]>([]);
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [myVouchers, setMyVouchers] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/vouchers');
        const data = await res.json();
        if (data.success) {
          setVoucherTypes(data.data.voucherTypes || []);
          setGiftCards(data.data.giftCards || []);
          setCategories(data.data.categories || []);
          setMyVouchers(data.data.purchasedVouchers || []);
        }
      } catch (error) {
        console.error('Failed to fetch vouchers data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePurchase = async () => {
    if (!selectedItem || !selectedAmount) return;
    setProcessing(true);
    try {
      const res = await fetch('/api/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedItem.type || 'giftcard',
          itemId: selectedItem.id,
          amount: selectedAmount,
          quantity,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPurchaseResult(data.data);
        toast.success(data.message);
        // Refresh my vouchers
        const refreshRes = await fetch('/api/vouchers?action=my-vouchers');
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setMyVouchers(refreshData.data);
        }
      } else {
        toast.error(data.error || 'Failed to purchase');
      }
    } catch (error) {
      toast.error('Failed to process purchase');
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (amt: number) => `R ${amt.toFixed(2)}`;

  if (loading) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-sm">
          <VisuallyHidden>
            <DialogTitle>Loading Vouchers</DialogTitle>
          </VisuallyHidden>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#E91E63]" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-[#E91E63]" />
            Vouchers & Gift Cards
          </DialogTitle>
          <DialogDescription>
            Gaming, retail, food, entertainment & more
          </DialogDescription>
        </DialogHeader>

        {view === 'main' && (
          <div className="space-y-3">
            {/* My Vouchers */}
            {myVouchers.length > 0 && (
              <Card className="cursor-pointer hover:shadow-md" onClick={() => setView('my-vouchers')}>
                <CardContent className="py-2.5 px-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#E91E63]/10 flex items-center justify-center">
                        <Ticket className="w-4 h-4 text-[#E91E63]" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-xs">My Vouchers</p>
                        <p className="text-[10px] text-gray-500">{myVouchers.length} active</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Betting Vouchers */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Betting Vouchers</p>
              <div className="grid grid-cols-2 gap-2">
                {voucherTypes.map((v, idx) => (
                  <Card key={idx} className="cursor-pointer hover:shadow-md" onClick={() => { setSelectedItem({...v, type: 'voucher'}); setView('purchase'); }}>
                    <CardContent className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{v.logo}</span>
                        <div>
                          <p className="font-medium text-gray-900 text-xs">{v.name}</p>
                          <p className="text-[10px] text-gray-500">R{v.minAmount} - R{v.maxAmount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Gift Cards */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Gift Cards</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((cat, idx) => (
                  <Button
                    key={idx}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                    className={selectedCategory === cat ? 'bg-[#E91E63] hover:bg-[#C2185B]' : 'capitalize'}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {giftCards
                  .filter(g => !selectedCategory || g.category === selectedCategory)
                  .slice(0, 9)
                  .map((g, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setSelectedItem({...g, type: 'giftcard'}); setView('purchase'); }}
                      className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-2xl">{g.logo}</span>
                      <span className="text-[10px] text-gray-600 font-medium mt-1">{g.name}</span>
                    </button>
                  ))}
                <button
                  onClick={() => setView('giftcards')}
                  className="flex flex-col items-center p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <span className="text-2xl">📦</span>
                  <span className="text-[10px] text-gray-600 font-medium mt-1">All</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'purchase' && selectedItem && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => { setView('main'); setSelectedItem(null); setPurchaseResult(null); }}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            {purchaseResult ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#43A047] flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <p className="font-semibold text-gray-900">Purchase Successful!</p>
                
                <div className="p-4 rounded-xl bg-gray-50 text-left">
                  <p className="text-[10px] text-gray-500 mb-1">Your Code</p>
                  <p className="font-mono font-bold text-lg">{purchaseResult.code || purchaseResult.pin}</p>
                </div>

                <Button onClick={() => { setView('main'); setSelectedItem(null); setPurchaseResult(null); }} className="w-full bg-[#43A047]">
                  Done
                </Button>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-xl bg-gray-50 text-center">
                  <span className="text-4xl">{selectedItem.logo}</span>
                  <p className="font-medium text-gray-900 mt-2">{selectedItem.name}</p>
                  <p className="text-xs text-gray-500">{selectedItem.description || 'Gift Card'}</p>
                </div>

                {selectedItem.amounts ? (
                  <div>
                    <Label className="text-xs">Select Amount</Label>
                    <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                      {selectedItem.amounts.map((amt: number, idx: number) => (
                        <Button
                          key={idx}
                          variant={selectedAmount === amt ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedAmount(amt)}
                          className={selectedAmount === amt ? 'bg-[#E91E63] hover:bg-[#C2185B]' : ''}
                        >
                          R{amt}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label className="text-xs">Amount (R{selectedItem.minAmount} - R{selectedItem.maxAmount})</Label>
                    <Input
                      type="number"
                      value={selectedAmount || ''}
                      onChange={(e) => setSelectedAmount(parseInt(e.target.value))}
                      placeholder="Enter amount"
                      className="h-10 mt-1"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-xs">Quantity</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Button variant="outline" size="sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                    <Button variant="outline" size="sm" onClick={() => setQuantity(quantity + 1)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-gray-50 flex justify-between text-sm">
                  <span className="text-gray-500">Total</span>
                  <span className="font-bold">{formatCurrency(selectedAmount * quantity)}</span>
                </div>

                <Button
                  onClick={handlePurchase}
                  disabled={!selectedAmount || processing}
                  className="w-full bg-[#E91E63] hover:bg-[#C2185B]"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                  Purchase
                </Button>
              </>
            )}
          </div>
        )}

        {view === 'my-vouchers' && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setView('main')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            {myVouchers.length > 0 ? (
              <div className="space-y-2">
                {myVouchers.map((v, idx) => (
                  <Card key={idx}>
                    <CardContent className="py-2.5 px-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 text-xs">{v.name}</p>
                          <p className="text-[10px] text-gray-500">{formatCurrency(v.amount)}</p>
                        </div>
                        <Badge variant={v.status === 'unused' ? 'default' : 'secondary'}>
                          {v.status}
                        </Badge>
                      </div>
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                        <p className="font-mono text-xs text-center">{v.code || v.pin}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No vouchers yet</p>
              </div>
            )}
          </div>
        )}

        {view === 'giftcards' && (
          <div className="space-y-3">
            <Button variant="ghost" size="sm" onClick={() => setView('main')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>

            <div className="grid grid-cols-3 gap-2">
              {giftCards.map((g, idx) => (
                <button
                  key={idx}
                  onClick={() => { setSelectedItem({...g, type: 'giftcard'}); setView('purchase'); }}
                  className="flex flex-col items-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-2xl">{g.logo}</span>
                  <span className="text-[10px] text-gray-600 font-medium mt-1">{g.name}</span>
                  <span className="text-[9px] text-gray-400">from R{Math.min(...g.amounts)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ==================== PROFILE MODALS ====================

// Personal Details Modal
function PersonalDetailsModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: 'Thabo',
    lastName: 'Molefe',
    email: 'thabo.molefe@example.com',
    phone: '+27 82 123 4567',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Personal details updated');
      onClose();
    } catch (error) {
      toast.error('Failed to update details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#00897B]" />
            Personal Details
          </DialogTitle>
          <DialogDescription>Update your personal information</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">First Name</Label>
              <Input value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">Last Name</Label>
              <Input value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="h-9 text-sm" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">Phone</Label>
            <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="h-9 text-sm" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={loading} className="bg-[#00897B] hover:bg-[#00695C]">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// KYC/FICA Modal
function KYCModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const documents = [
    { type: 'ID Document', status: 'verified', uploaded: true },
    { type: 'Proof of Address', status: 'verified', uploaded: true },
    { type: 'Selfie', status: 'verified', uploaded: true },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#00897B]" />
            KYC/FICA Documents
          </DialogTitle>
          <DialogDescription>Your verified identity documents</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {documents.map((doc, idx) => (
            <Card key={idx}>
              <CardContent className="py-2.5 px-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-xs">{doc.type}</p>
                      <p className="text-[10px] text-green-600 capitalize">{doc.status}</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Verified</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="p-3 bg-[#E0F2F1] rounded-lg">
          <p className="text-xs text-[#00695C]">All documents verified. Your account is fully compliant.</p>
        </div>
        <DialogFooter>
          <Button size="sm" onClick={onClose} className="bg-[#00897B] hover:bg-[#00695C]">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Linked Accounts Modal
function LinkedAccountsModal({ onClose }: { onClose: () => void }) {
  const accounts = [
    { type: 'Bank', name: 'FNB Cheque Account', last4: '4567', icon: Building },
    { type: 'Card', name: 'Visa Debit', last4: '1234', icon: CreditCard },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-[#00897B]" />
            Linked Accounts
          </DialogTitle>
          <DialogDescription>Your connected bank accounts and cards</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {accounts.map((acc, idx) => (
            <Card key={idx}>
              <CardContent className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <acc.icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-xs">{acc.name}</p>
                    <p className="text-[10px] text-gray-500">•••• {acc.last4}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-red-600">Remove</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button variant="outline" className="w-full text-sm">
          <Plus className="w-4 h-4 mr-2" />
          Add New Account
        </Button>
        <DialogFooter>
          <Button size="sm" onClick={onClose} className="bg-[#00897B] hover:bg-[#00695C]">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Change PIN Modal
function ChangePINModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'current' | 'new' | 'confirm'>('current');
  const [currentPIN, setCurrentPIN] = useState('');
  const [newPIN, setNewPIN] = useState('');
  const [confirmPIN, setConfirmPIN] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePIN = async () => {
    if (newPIN !== confirmPIN) {
      toast.error('PINs do not match');
      return;
    }
    if (newPIN.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('PIN changed successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to change PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#00897B]" />
            Change PIN
          </DialogTitle>
          <DialogDescription>Update your wallet PIN</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Current PIN</Label>
            <Input type="password" maxLength={4} value={currentPIN} onChange={(e) => setCurrentPIN(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="h-9 text-sm text-center tracking-widest" />
          </div>
          <div>
            <Label className="text-xs">New PIN</Label>
            <Input type="password" maxLength={4} value={newPIN} onChange={(e) => setNewPIN(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="h-9 text-sm text-center tracking-widest" />
          </div>
          <div>
            <Label className="text-xs">Confirm New PIN</Label>
            <Input type="password" maxLength={4} value={confirmPIN} onChange={(e) => setConfirmPIN(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="h-9 text-sm text-center tracking-widest" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleChangePIN} disabled={loading} className="bg-[#00897B] hover:bg-[#00695C]">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
            Change PIN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Biometric Modal
function BiometricModal({ onClose }: { onClose: () => void }) {
  const [faceIdEnabled, setFaceIdEnabled] = useState(true);
  const [fingerprintEnabled, setFingerprintEnabled] = useState(false);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-[#00897B]" />
            Biometric Settings
          </DialogTitle>
          <DialogDescription>Manage your biometric authentication</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Card>
            <CardContent className="py-2.5 px-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-xs">Face ID</p>
                    <p className="text-[10px] text-gray-500">Use facial recognition</p>
                  </div>
                </div>
                <Switch checked={faceIdEnabled} onCheckedChange={setFaceIdEnabled} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2.5 px-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Fingerprint className="w-4 h-4 text-gray-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-xs">Fingerprint</p>
                    <p className="text-[10px] text-gray-500">Use fingerprint scanner</p>
                  </div>
                </div>
                <Switch checked={fingerprintEnabled} onCheckedChange={setFingerprintEnabled} />
              </div>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button size="sm" onClick={onClose} className="bg-[#00897B] hover:bg-[#00695C]">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Login Activity Modal
function LoginActivityModal({ onClose }: { onClose: () => void }) {
  const activities = [
    { device: 'iPhone 15 Pro', location: 'Johannesburg, SA', time: '2 mins ago', current: true },
    { device: 'Chrome on Windows', location: 'Cape Town, SA', time: 'Yesterday, 14:30' },
    { device: 'Safari on Mac', location: 'Johannesburg, SA', time: '3 days ago' },
  ];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#00897B]" />
            Login Activity
          </DialogTitle>
          <DialogDescription>Recent login sessions</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {activities.map((act, idx) => (
            <Card key={idx}>
              <CardContent className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Smartphone className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-xs">{act.device} {act.current && <Badge className="ml-1 bg-green-100 text-green-700 text-[8px]">Current</Badge>}</p>
                    <p className="text-[10px] text-gray-500">{act.location} • {act.time}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button variant="outline" className="w-full text-red-600 border-red-200 text-xs">
          Sign Out All Other Devices
        </Button>
        <DialogFooter>
          <Button size="sm" onClick={onClose} className="bg-[#00897B] hover:bg-[#00695C]">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Help Centre Modal
function HelpCentreModal({ onClose }: { onClose: () => void }) {
  const faqs = [
    { q: 'How do I top up my wallet?', a: 'Tap "Top Up" on the home screen and choose your payment method.' },
    { q: 'How do I send money?', a: 'Tap "Send" and enter the recipient\'s phone number or select from contacts.' },
    { q: 'Is my money safe?', a: 'Yes! All funds are held in a regulated bank account with full FSCA compliance.' },
  ];
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#00897B]" />
            Help Centre
          </DialogTitle>
          <DialogDescription>Frequently asked questions</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <Card key={idx} className="cursor-pointer" onClick={() => setExpanded(expanded === idx ? null : idx)}>
              <CardContent className="py-2.5 px-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 text-xs">{faq.q}</p>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expanded === idx ? 'rotate-180' : ''}`} />
                </div>
                {expanded === idx && (
                  <p className="text-[10px] text-gray-600 mt-2">{faq.a}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        <DialogFooter>
          <Button size="sm" onClick={onClose} className="bg-[#00897B] hover:bg-[#00695C]">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Chat Support Modal
function ChatSupportModal({ onClose }: { onClose: () => void }) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { from: 'agent', text: 'Hi! I\'m JAX, your Groway assistant. How can I help you today?', time: '10:30' },
  ]);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setMessages([...messages, { from: 'user', text: message, time: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) }]);
    setMessage('');
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'agent', text: 'Thanks for your message! An agent will respond shortly. In the meantime, check our Help Centre for quick answers.', time: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) }]);
      setSending(false);
    }, 1000);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#00897B]" />
            Chat Support
          </DialogTitle>
          <DialogDescription>Talk to our support team</DialogDescription>
        </DialogHeader>
        <div className="h-48 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-lg">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-2 rounded-lg text-xs ${msg.from === 'user' ? 'bg-[#00897B] text-white' : 'bg-white'}`}>
                <p>{msg.text}</p>
                <p className="text-[8px] opacity-70 mt-1">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." className="h-9 text-sm" onKeyPress={(e) => e.key === 'Enter' && handleSend()} />
          <Button size="sm" onClick={handleSend} disabled={sending} className="bg-[#00897B] hover:bg-[#00695C]">
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Notifications Modal
function NotificationsModal({ onClose }: { onClose: () => void }) {
  const [settings, setSettings] = useState({
    transactions: true,
    promotions: false,
    security: true,
    updates: true,
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#00897B]" />
            Notifications
          </DialogTitle>
          <DialogDescription>Manage your notification preferences</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Card>
            <CardContent className="py-2.5 px-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-xs">Transactions</p>
                  <p className="text-[10px] text-gray-500">Payment alerts</p>
                </div>
                <Switch checked={settings.transactions} onCheckedChange={(v) => setSettings({...settings, transactions: v})} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2.5 px-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-xs">Promotions</p>
                  <p className="text-[10px] text-gray-500">Offers and deals</p>
                </div>
                <Switch checked={settings.promotions} onCheckedChange={(v) => setSettings({...settings, promotions: v})} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2.5 px-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-xs">Security</p>
                  <p className="text-[10px] text-gray-500">Login alerts</p>
                </div>
                <Switch checked={settings.security} onCheckedChange={(v) => setSettings({...settings, security: v})} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-2.5 px-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 text-xs">Updates</p>
                  <p className="text-[10px] text-gray-500">App and feature updates</p>
                </div>
                <Switch checked={settings.updates} onCheckedChange={(v) => setSettings({...settings, updates: v})} />
              </div>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button size="sm" onClick={onClose} className="bg-[#00897B] hover:bg-[#00695C]">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
