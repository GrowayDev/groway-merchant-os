'use client';

import React, { useState, useEffect } from 'react';
import { 
  Home, Smartphone, QrCode, Send, Download, Plus, Zap, Droplets, 
  Globe, Ticket, Shield, TrendingUp, ChevronRight, Eye, EyeOff,
  CreditCard, ShoppingBag, Diamond, User, Bell, Star, Award,
  Check, Plane, Train, Bus, Coffee, Gift, Percent, Wallet,
  Building, Phone, Users, Clock, Lock, FileText, HelpCircle,
  Mail, AlertCircle, LogOut, ChevronUp, Play, ArrowRight,
  ShieldCheck, Clock4, PiggyBank, CreditCard as CardIcon,
  Landmark, Bus as BusIcon, Utensils, Sparkles
} from 'lucide-react';

// Design Tokens
const colors = {
  teal: '#00897B',
  tealDark: '#00695C',
  green: '#43A047',
  greenDark: '#2E7D32',
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

// Mockup Screen Components
function PhoneMockup({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-[280px] h-[580px] bg-white rounded-[36px] shadow-2xl overflow-hidden relative border-[10px] border-gray-900">
        {/* Status Bar */}
        <div className="h-8 flex items-center justify-between px-4" style={{ backgroundColor: colors.teal }}>
          <span className="text-white text-[10px] font-medium">09:41</span>
          <div className="flex items-center gap-1">
            <Smartphone className="w-3 h-3 text-white" />
            <span className="text-white text-[8px]">5G</span>
          </div>
        </div>
        {/* Content */}
        <div className="h-[calc(100%-32px-56px)] overflow-hidden bg-gray-50">
          {children}
        </div>
        {/* Bottom Nav */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 flex items-center justify-around px-1">
          {[Home, CreditCard, ShoppingBag, Diamond, User].map((Icon, i) => (
            <div key={i} className="flex flex-col items-center justify-center">
              <Icon className={`w-4 h-4 ${i === 0 ? 'text-[#00897B]' : 'text-gray-400'}`} />
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-gray-700">{title}</p>
    </div>
  );
}

// Home Screen Mockup
function HomeScreenMockup() {
  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00897B] to-[#43A047] flex items-center justify-center text-white text-xs font-bold">TM</div>
          <div>
            <p className="text-gray-500 text-[8px]">Good morning,</p>
            <p className="text-gray-900 font-semibold text-[10px]">Thabo Molefe</p>
          </div>
        </div>
        <Bell className="w-4 h-4 text-gray-600" />
      </div>
      
      {/* Balance Card */}
      <div className="rounded-2xl p-3 text-white mb-2" style={{ background: `linear-gradient(135deg, ${colors.teal} 0%, ${colors.green} 100%)` }}>
        <p className="text-white/80 text-[8px]">Available Balance</p>
        <p className="text-lg font-bold">R 12 450.00</p>
        <div className="flex justify-between mt-2">
          {[
            { icon: Send, label: 'Send' },
            { icon: Download, label: 'Receive' },
            { icon: QrCode, label: 'Scan' },
            { icon: Plus, label: 'Top Up' },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center mb-0.5">
                <item.icon className="w-3 h-3 text-white" />
              </div>
              <span className="text-[6px] text-white/90">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Loyalty */}
      <div className="bg-gray-100 rounded-full px-2 py-1 flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <Award className="w-3 h-3 text-gray-500" />
          <span className="text-[8px] font-medium text-gray-700">Silver Member</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span className="text-[8px] font-bold">2,450 pts</span>
        </div>
      </div>
      
      {/* Services Grid */}
      <div className="grid grid-cols-4 gap-1 mb-2">
        {[
          { icon: Smartphone, label: 'Airtime', color: '#E91E63' },
          { icon: Zap, label: 'Electricity', color: '#FF9800' },
          { icon: Droplets, label: 'Water', color: '#2196F3' },
          { icon: Globe, label: 'Transfer', color: '#9C27B0' },
          { icon: Ticket, label: 'Tickets', color: '#00BCD4' },
          { icon: Shield, label: 'Insurance', color: '#4CAF50' },
          { icon: TrendingUp, label: 'Credit', color: '#FF5722' },
          { icon: ShoppingBag, label: 'More', color: '#607D8B' },
        ].map((s, i) => (
          <div key={i} className="flex flex-col items-center py-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${s.color}20` }}>
              <s.icon className="w-3 h-3" style={{ color: s.color }} />
            </div>
            <span className="text-[6px] text-gray-600 mt-0.5">{s.label}</span>
          </div>
        ))}
      </div>
      
      {/* Transactions */}
      <p className="text-[8px] font-semibold text-gray-900 mb-1">Recent Transactions</p>
      {[
        { icon: Smartphone, name: 'Vodacom Data', amount: -149 },
        { icon: ShoppingBag, name: 'Checkers', amount: -456.50 },
      ].map((tx, i) => (
        <div key={i} className="bg-white rounded-lg p-2 flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
            <tx.icon className="w-3 h-3 text-gray-500" />
          </div>
          <p className="text-[8px] font-medium text-gray-900 flex-1">{tx.name}</p>
          <p className={`text-[8px] font-semibold ${tx.amount >= 0 ? 'text-green-600' : ''}`}>
            {tx.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
          </p>
        </div>
      ))}
    </div>
  );
}

// Pay Screen Mockup
function PayScreenMockup() {
  return (
    <div className="p-3">
      <h2 className="text-sm font-bold text-gray-900 mb-1">Pay Hub</h2>
      <p className="text-[8px] text-gray-500 mb-3">Send and receive money instantly</p>
      
      {/* QR Code */}
      <div className="bg-white rounded-xl p-3 mb-3 flex flex-col items-center">
        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mb-1">
          <QrCode className="w-16 h-16 text-gray-400" />
        </div>
        <p className="text-[8px] text-gray-600">Scan to pay me</p>
      </div>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-1 mb-3">
        {[
          { icon: QrCode, label: 'Scan', c: colors.teal },
          { icon: Send, label: 'Send', c: colors.green },
          { icon: Download, label: 'Request', c: colors.purple },
          { icon: Users, label: 'Split', c: colors.blue },
        ].map((a, i) => (
          <div key={i} className="bg-white rounded-lg p-2 flex flex-col items-center">
            <a.icon className="w-4 h-4 mb-0.5" style={{ color: a.c }} />
            <span className="text-[6px] text-gray-600">{a.label}</span>
          </div>
        ))}
      </div>
      
      {/* Recipients */}
      <p className="text-[8px] font-semibold text-gray-900 mb-1">Recent Recipients</p>
      <div className="flex gap-2">
        {['TM', 'LM', 'SK', 'ND'].map((init, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[8px] font-semibold" style={{ backgroundColor: [colors.teal, colors.purple, colors.amber, colors.blue][i] }}>{init}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Services Screen Mockup
function ServicesScreenMockup() {
  return (
    <div className="p-3">
      <h2 className="text-sm font-bold text-gray-900 mb-1">Services</h2>
      <p className="text-[8px] text-gray-500 mb-3">All your financial services</p>
      
      {/* Financial Services */}
      <p className="text-[8px] font-semibold text-gray-900 mb-1">Financial Services</p>
      <div className="grid grid-cols-2 gap-1 mb-3">
        {[
          { icon: TrendingUp, label: 'Credit Market', c: '#E91E63' },
          { icon: Shield, label: 'Insurance', c: '#4CAF50' },
          { icon: Zap, label: 'Pay+ EWA', c: '#FF9800' },
          { icon: CreditCard, label: 'BNPL', c: '#9C27B0' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg p-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.c}20` }}>
              <s.icon className="w-3 h-3" style={{ color: s.c }} />
            </div>
            <span className="text-[7px] font-medium text-gray-900">{s.label}</span>
          </div>
        ))}
      </div>
      
      {/* Payments */}
      <p className="text-[8px] font-semibold text-gray-900 mb-1">Payments & Transfers</p>
      <div className="grid grid-cols-2 gap-1 mb-3">
        {[
          { icon: Building, label: 'Bill Payments', c: '#607D8B' },
          { icon: Globe, label: "Int'l Transfer", c: '#3F51B5' },
          { icon: Phone, label: 'Airtime & Data', c: '#E91E63' },
          { icon: Gift, label: 'Vouchers', c: '#FF5722' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-lg p-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.c}20` }}>
              <s.icon className="w-3 h-3" style={{ color: s.c }} />
            </div>
            <span className="text-[7px] font-medium text-gray-900">{s.label}</span>
          </div>
        ))}
      </div>
      
      {/* SASSA */}
      <div className="bg-gradient-to-r from-[#00897B] to-[#43A047] rounded-xl p-2 text-white">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          <div>
            <p className="text-[8px] font-semibold">Grant+ SASSA Benefits</p>
            <p className="text-[6px] text-white/80">Check grants & payment dates</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Offers Screen Mockup
function OffersScreenMockup() {
  return (
    <div className="p-3">
      <h2 className="text-sm font-bold text-gray-900 mb-1">Offers</h2>
      <p className="text-[8px] text-gray-500 mb-3">Personalised just for you</p>
      
      {/* Loyalty */}
      <div className="bg-gray-100 rounded-xl p-2 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
            <Award className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[8px] font-semibold">Silver Member</p>
            <p className="text-[6px] text-gray-600">2,450 points • 550 to Gold</p>
          </div>
        </div>
        <div className="bg-gray-200 rounded-full h-1.5">
          <div className="bg-gradient-to-r from-gray-400 to-gray-500 h-1.5 rounded-full w-4/5"></div>
        </div>
      </div>
      
      {/* Flash Sales */}
      <p className="text-[8px] font-semibold text-gray-900 mb-1">Flash Sales</p>
      {[
        { store: 'Checkers', discount: '30% OFF', time: '2h 34m' },
        { store: 'Dis-Chem', discount: '25% OFF', time: '5h 12m' },
      ].map((sale, i) => (
        <div key={i} className="bg-white rounded-lg p-2 flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm">🛒</div>
          <div className="flex-1">
            <p className="text-[8px] font-medium">{sale.store}</p>
            <p className="text-[10px] font-bold text-[#00897B]">{sale.discount}</p>
          </div>
          <p className="text-[6px] text-amber-600">{sale.time}</p>
        </div>
      ))}
    </div>
  );
}

// Main Landing Page
export default function ConsumerWalletLanding() {
  const [activeScreen, setActiveScreen] = useState(0);
  const screens = [
    { component: <HomeScreenMockup />, title: 'Home Dashboard' },
    { component: <PayScreenMockup />, title: 'Pay & Transfer' },
    { component: <ServicesScreenMockup />, title: 'Services Hub' },
    { component: <OffersScreenMockup />, title: 'Offers & Rewards' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveScreen((prev) => (prev + 1) % screens.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Wallet, title: 'Multi-Currency Wallet', desc: 'Hold ZAR plus 40+ currencies with real-time exchange rates' },
    { icon: QrCode, title: 'QR Payments', desc: 'Scan to pay at any merchant with EMVCo QR standard' },
    { icon: Send, title: 'Instant Transfers', desc: 'PayShap & GoPay for instant bank transfers' },
    { icon: Shield, title: 'Insurance Marketplace', desc: 'Compare funeral, life, health & vehicle insurance' },
    { icon: TrendingUp, title: 'Credit Marketplace', desc: 'Personal & business loans from 12 lenders' },
    { icon: CreditCard, title: 'Buy Now, Pay Later', desc: 'NCA-compliant BNPL with 0% interest' },
  ];

  const stats = [
    { value: '42+', label: 'Features' },
    { value: '35+', label: 'Bill Providers' },
    { value: '50+', label: 'Countries' },
    { value: '11', label: 'SA Languages' },
  ];

  const compliance = [
    { name: 'NCA Compliant', desc: 'National Credit Act' },
    { name: 'NCR Registered', desc: 'Credit Provider' },
    { name: 'FSCA Licensed', desc: 'Financial Services' },
    { name: 'POPIA Compliant', desc: 'Data Protection' },
    { name: 'PCI DSS L1', desc: 'Payment Security' },
    { name: 'FICA Verified', desc: 'KYC Levels 0-4' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors.teal} 0%, ${colors.green} 100%)` }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white"></div>
          <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-white"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="text-white">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="font-bold text-lg">G</span>
                </div>
                <span className="font-semibold text-xl">Groway Wallet</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                South Africa&apos;s Premier<br />
                <span className="text-white/90">Financial Super-App</span>
              </h1>
              
              <p className="text-lg text-white/80 mb-6 max-w-md">
                Pay bills, buy airtime, send money, get insurance, access credit — all in one app. 
                Benchmarked against Alipay, WeChat Pay, and M-Pesa.
              </p>
              
              <div className="flex flex-wrap gap-3 mb-8">
                <button className="bg-white text-[#00897B] px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:shadow-lg transition-all">
                  <Play className="w-4 h-4" /> Launch App
                </button>
                <button className="bg-white/20 text-white px-6 py-3 rounded-full font-semibold flex items-center gap-2 hover:bg-white/30 transition-all">
                  Learn More <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                  <div key={i} className="text-center">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-white/70">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right - Phone Mockup */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full transform scale-150"></div>
                <div className="relative">
                  {screens[activeScreen].component}
                  <p className="text-center mt-4 text-white font-medium">{screens[activeScreen].title}</p>
                </div>
                
                {/* Screen Indicators */}
                <div className="flex justify-center gap-2 mt-4">
                  {screens.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveScreen(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === activeScreen ? 'bg-white w-6' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything You Need</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A complete financial toolkit designed for South Africans, with world-class features 
              benchmarked against global super-apps.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${colors.teal}15` }}>
                  <feature.icon className="w-6 h-6" style={{ color: colors.teal }} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mockup Screens Gallery */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">App Screens</h2>
            <p className="text-gray-600">Explore the intuitive mobile-first design</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {screens.map((screen, i) => (
              <div key={i} className="transform hover:scale-105 transition-all duration-300">
                <PhoneMockup title={screen.title}>
                  {screen.component}
                </PhoneMockup>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Showcase */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Comprehensive Services</h2>
            <p className="text-gray-600">All your financial needs in one place</p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { icon: Smartphone, title: 'Airtime & Data', desc: 'All SA networks', c: '#E91E63' },
              { icon: Zap, title: 'Electricity', desc: 'Prepaid tokens', c: '#FF9800' },
              { icon: Droplets, title: 'Water', desc: 'Municipal bills', c: '#2196F3' },
              { icon: Globe, title: 'Int\'l Transfer', desc: '50+ countries', c: '#3F51B5' },
              { icon: Ticket, title: 'Transport', desc: 'Gautrain, buses', c: '#009688' },
              { icon: Shield, title: 'Insurance', desc: 'Life, funeral, health', c: '#4CAF50' },
              { icon: TrendingUp, title: 'Credit', desc: 'Loans marketplace', c: '#FF5722' },
              { icon: CreditCard, title: 'BNPL', desc: 'Pay in 3 instalments', c: '#9C27B0' },
            ].map((service, i) => (
              <div key={i} className="bg-white rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-all">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${service.c}15` }}>
                  <service.icon className="w-5 h-5" style={{ color: service.c }} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{service.title}</p>
                  <p className="text-xs text-gray-500">{service.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-16" style={{ background: `linear-gradient(135deg, ${colors.tealDark} 0%, ${colors.greenDark} 100%)` }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Fully Compliant</h2>
            <p className="text-white/70">Built for South African regulatory requirements</p>
          </div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {compliance.map((item, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-4 text-center backdrop-blur">
                <ShieldCheck className="w-8 h-8 text-white mx-auto mb-2" />
                <p className="font-semibold text-white text-sm">{item.name}</p>
                <p className="text-xs text-white/60">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8">
            Join thousands of South Africans who trust Groway Wallet for their daily financial needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-8 py-4 rounded-full font-semibold flex items-center gap-2 text-white transition-all" style={{ background: `linear-gradient(135deg, ${colors.teal} 0%, ${colors.green} 100%)` }}>
              <a href="/consumer-wallet" className="flex items-center gap-2">
                Launch Consumer Wallet <ArrowRight className="w-4 h-4" />
              </a>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00897B] to-[#43A047] flex items-center justify-center font-bold">G</div>
              <span className="font-semibold">Groway Wallet</span>
            </div>
            <p className="text-sm text-gray-400">© 2026 Groway. All rights reserved. NCR Registered Credit Provider.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
