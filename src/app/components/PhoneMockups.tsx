'use client'

import { useState, useEffect } from 'react'
import {
  Smartphone,
  RefreshCw,
  Send,
  Download,
  QrCode,
  Plus,
  Zap,
  Globe,
  Ticket,
  Users,
  Store,
  ShoppingBag,
  ArrowLeft,
  ShoppingCart,
  CreditCard,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AppInfo } from './LandingData'

// Phone Mockup Component
export function PhoneMockup({ app, isActive }: { app: AppInfo; isActive: boolean }) {
  const [currentScreen, setCurrentScreen] = useState(0)
  
  useEffect(() => {
    if (isActive) {
      const interval = setInterval(() => {
        setCurrentScreen((prev) => (prev + 1) % app.mockupScreens.length)
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [isActive, app.mockupScreens.length])

  const renderScreen = () => {
    switch (app.id) {
      case 'consumer-wallet':
        return <ConsumerWalletScreen screen={app.mockupScreens[currentScreen]} />
      case 'merchant-os':
        return <MerchantOSScreen screen={app.mockupScreens[currentScreen]} />
      case 'grosell':
        return <GroSellScreen screen={app.mockupScreens[currentScreen]} />
      case 'grosupply':
        return <GroSupplyScreen screen={app.mockupScreens[currentScreen]} />
      case 'gopay':
        return <GoPayScreen screen={app.mockupScreens[currentScreen]} />
      default:
        return <GenericScreen appName={app.name} screen={app.mockupScreens[currentScreen]} color={app.color} />
    }
  }

  return (
    <div className="relative w-[260px] h-[520px]">
      {/* Phone Frame */}
      <div className="relative bg-[#1A1A1A] rounded-[2.5rem] p-2 shadow-2xl h-full">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1A1A1A] rounded-b-2xl z-10"></div>
        
        {/* Screen */}
        <div className="bg-white rounded-[2rem] overflow-hidden h-full">
          {/* Status Bar */}
          <div className="h-8 flex items-center justify-between px-5 text-xs" style={{ backgroundColor: app.color }}>
            <span className="text-white font-medium">9:41</span>
            <div className="flex items-center gap-1 text-white">
              <Smartphone className="w-3 h-3" />
              <span className="text-[10px]">5G</span>
            </div>
          </div>
          
          {/* App Content */}
          <div className="h-[calc(100%-32px)] overflow-hidden">
            {renderScreen()}
          </div>
        </div>
      </div>
      
      {/* Screen Indicator */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
        {app.mockupScreens.map((_, idx) => (
          <div 
            key={idx} 
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              currentScreen === idx ? 'w-4' : 'bg-gray-300'
            }`}
            style={{ backgroundColor: currentScreen === idx ? app.color : undefined }}
          />
        ))}
      </div>
    </div>
  )
}

// Consumer Wallet Screen
function ConsumerWalletScreen({ screen }: { screen: string }) {
  switch (screen) {
    case 'home':
      return (
        <div className="p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00897B] to-[#43A047] flex items-center justify-center text-white text-xs font-bold">TM</div>
              <div>
                <p className="text-[10px] text-gray-500">Good morning,</p>
                <p className="text-xs font-semibold text-gray-900">Thabo</p>
              </div>
            </div>
            <RefreshCw className="w-4 h-4 text-gray-400" />
          </div>
          
          <div className="rounded-2xl p-4 text-white bg-gradient-to-br from-[#00897B] to-[#43A047]">
            <p className="text-[10px] text-white/80">Available Balance</p>
            <p className="text-xl font-bold">R 2,456.78</p>
            <div className="flex justify-between mt-3">
              {[
                { icon: Send, label: 'Send' },
                { icon: Download, label: 'Receive' },
                { icon: QrCode, label: 'Scan' },
                { icon: Plus, label: 'Top Up' },
              ].map((action, idx) => (
                <button key={idx} className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-0.5">
                    <action.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[8px] text-white/90">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Smartphone, label: 'Airtime', color: '#E91E63' },
              { icon: Zap, label: 'Power', color: '#FF9800' },
              { icon: Globe, label: 'Transfer', color: '#9C27B0' },
              { icon: Ticket, label: 'Bills', color: '#00BCD4' },
            ].map((service, idx) => (
              <button key={idx} className="flex flex-col items-center py-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${service.color}20` }}>
                  <service.icon className="w-4 h-4" style={{ color: service.color }} />
                </div>
                <span className="text-[8px] text-gray-600 mt-1">{service.label}</span>
              </button>
            ))}
          </div>
          
          <div>
            <p className="text-xs font-semibold text-gray-900 mb-2">Recent</p>
            <div className="space-y-2">
              {[
                { merchant: 'Shoprite', amount: '-R 156.00', time: 'Today' },
                { merchant: 'Vodacom Airtime', amount: '-R 50.00', time: 'Yesterday' },
              ].map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between bg-gray-50 rounded-xl p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200" />
                    <div>
                      <p className="text-[10px] font-medium text-gray-900">{tx.merchant}</p>
                      <p className="text-[8px] text-gray-500">{tx.time}</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-semibold text-gray-900">{tx.amount}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    case 'pay':
      return (
        <div className="p-3 space-y-3">
          <p className="text-sm font-bold text-gray-900">Pay Hub</p>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
            <QrCode className="w-20 h-20 mx-auto text-gray-300" />
            <p className="text-[10px] text-gray-500 mt-2">Tap to show your QR code</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: QrCode, label: 'Scan', color: '#00897B' },
              { icon: Send, label: 'Send', color: '#4CAF50' },
              { icon: Download, label: 'Request', color: '#9C27B0' },
              { icon: Users, label: 'Split', color: '#1565C0' },
            ].map((action, idx) => (
              <button key={idx} className="bg-gray-50 rounded-xl p-2 flex flex-col items-center">
                <action.icon className="w-4 h-4 mb-0.5" style={{ color: action.color }} />
                <span className="text-[8px] text-gray-600">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )
    default:
      return <GenericAppContent appName="Consumer Wallet" color="#00897B" />
  }
}

// Merchant OS Screen
function MerchantOSScreen({ screen }: { screen: string }) {
  switch (screen) {
    case 'pos':
      return (
        <div className="p-2 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-900">POS Terminal</p>
            <div className="flex items-center gap-1">
              <div className="w-6 h-6 rounded-full bg-[#1565C0] flex items-center justify-center">
                <Store className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { name: 'Burger', price: 'R89', emoji: '🍔' },
              { name: 'Chicken', price: 'R75', emoji: '🍗' },
              { name: 'Pizza', price: 'R95', emoji: '🍕' },
              { name: 'Soda', price: 'R18', emoji: '🥤' },
              { name: 'Fries', price: 'R32', emoji: '🍟' },
              { name: 'Salad', price: 'R65', emoji: '🥗' },
            ].map((item, idx) => (
              <button key={idx} className="bg-gray-50 rounded-lg p-2 text-center">
                <span className="text-lg">{item.emoji}</span>
                <p className="text-[8px] font-medium text-gray-900">{item.name}</p>
                <p className="text-[8px] text-[#1565C0] font-bold">{item.price}</p>
              </button>
            ))}
          </div>
          
          <div className="bg-gray-900 rounded-lg p-2 text-white">
            <div className="flex justify-between text-[10px] mb-1">
              <span>Items: 3</span>
              <span className="font-bold">R 202.00</span>
            </div>
            <Button className="w-full h-8 text-[10px] bg-[#4CAF50]">PAY NOW</Button>
          </div>
        </div>
      )
    default:
      return <GenericAppContent appName="Merchant OS" color="#1565C0" />
  }
}

// GroSell Screen
function GroSellScreen({ screen }: { screen: string }) {
  switch (screen) {
    case 'catalog':
      return (
        <div className="h-full bg-[#ECE5DD]">
          <div className="bg-[#075E54] px-3 py-2 text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold">Your Business Store</p>
                <p className="text-[8px] opacity-80">Online</p>
              </div>
            </div>
          </div>
          
          <div className="p-2 space-y-2">
            <div className="bg-white rounded-lg p-2 max-w-[85%]">
              <p className="text-[10px] font-medium text-[#075E54] mb-1">📦 Our Products</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { name: 'Burger', price: 'R49', emoji: '🍔' },
                  { name: 'Steak', price: 'R89', emoji: '🥩' },
                  { name: 'Fish', price: 'R65', emoji: '🐟' },
                  { name: 'Bowl', price: 'R55', emoji: '🥗' },
                ].map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded p-1.5 text-center">
                    <span className="text-base">{item.emoji}</span>
                    <p className="text-[8px] font-medium">{item.name}</p>
                    <p className="text-[8px] text-[#25D366] font-bold">{item.price}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-[#DCF8C6] rounded-lg p-2 max-w-[85%] ml-auto">
              <p className="text-[10px]">Hi! I'd like to see your menu 👋</p>
              <p className="text-[8px] text-gray-500 text-right mt-0.5">10:30 AM ✓✓</p>
            </div>
          </div>
        </div>
      )
    case 'chat':
      return (
        <div className="h-full bg-[#ECE5DD]">
          <div className="bg-[#075E54] px-3 py-2 text-white">
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">JD</div>
              <div>
                <p className="text-xs font-semibold">John Doe</p>
                <p className="text-[8px] opacity-80">Online</p>
              </div>
            </div>
          </div>
          
          <div className="p-2 space-y-1.5">
            <div className="bg-[#DCF8C6] rounded-lg p-2 max-w-[80%] ml-auto">
              <p className="text-[10px]">I'll take 2x Burgers please!</p>
              <p className="text-[8px] text-gray-500 text-right">10:32 AM ✓✓</p>
            </div>
            <div className="bg-white rounded-lg p-2 max-w-[85%]">
              <p className="text-[10px]">Great choice! 🎉</p>
              <div className="bg-[#E8F5E9] rounded p-1.5 mt-1">
                <p className="text-[8px] font-semibold">Order #GS-2847</p>
                <p className="text-[8px] text-gray-600">Total: R113.00</p>
              </div>
            </div>
          </div>
        </div>
      )
    default:
      return <GenericAppContent appName="GroSell" color="#25D366" />
  }
}

// GroSupply Screen
function GroSupplyScreen({ screen }: { screen: string }) {
  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900">Marketplace</p>
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <ShoppingCart className="w-3 h-3" />
          <span>3 items</span>
        </div>
      </div>
      
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {['All', 'F&B', 'Liquor', 'Grocery'].map((cat, idx) => (
          <button key={idx} className={`px-2.5 py-1 rounded-full text-[8px] whitespace-nowrap ${idx === 0 ? 'bg-[#FF9800] text-white' : 'bg-gray-100 text-gray-600'}`}>
            {cat}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {[
          { name: 'Maize Meal 10kg', price: 'R 89.00', supplier: 'Premier Foods' },
          { name: 'Cooking Oil 5L', price: 'R 145.00', supplier: 'Willowton' },
          { name: 'Rice 20kg', price: 'R 269.00', supplier: 'Tiger Brands' },
          { name: 'Sugar 10kg', price: 'R 175.00', supplier: 'Tongaat Hulett' },
        ].map((product, idx) => (
          <div key={idx} className="bg-white rounded-lg p-2 border border-gray-100">
            <div className="w-full h-12 bg-gray-100 rounded mb-1.5" />
            <p className="text-[9px] font-medium text-gray-900 truncate">{product.name}</p>
            <p className="text-[8px] text-gray-500">{product.supplier}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-[9px] font-bold text-[#FF9800]">{product.price}</p>
              <Button className="h-5 text-[8px] px-2 bg-[#FF9800]">Add</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// GoPay Screen
function GoPayScreen({ screen }: { screen: string }) {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900">Dashboard</p>
        <div className="w-7 h-7 rounded-full bg-[#9C27B0] flex items-center justify-center">
          <CreditCard className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gradient-to-br from-[#9C27B0] to-[#7B1FA2] rounded-xl p-3 text-white">
          <p className="text-[8px] opacity-80">Today's Volume</p>
          <p className="text-lg font-bold">R 45,230</p>
          <p className="text-[8px] opacity-80">142 transactions</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <p className="text-[8px] text-gray-500">Active Devices</p>
          <p className="text-lg font-bold text-gray-900">24</p>
          <p className="text-[8px] text-green-600">All online</p>
        </div>
      </div>
      
      <div>
        <p className="text-[10px] font-semibold text-gray-900 mb-2">Recent Transactions</p>
        <div className="space-y-1.5">
          {[
            { ref: 'TXN-4827', amount: 'R 1,250.00', status: 'Success' },
            { ref: 'TXN-4826', amount: 'R 890.00', status: 'Success' },
            { ref: 'TXN-4825', amount: 'R 2,340.00', status: 'Pending' },
          ].map((tx, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-2 border border-gray-100">
              <div>
                <p className="text-[9px] font-medium text-gray-900">{tx.ref}</p>
                <p className="text-[8px] text-gray-500">{tx.status}</p>
              </div>
              <p className="text-[9px] font-bold text-gray-900">{tx.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Generic Screen for other apps
function GenericScreen({ appName, screen, color }: { appName: string; screen: string; color: string }) {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-900">{appName}</p>
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-50 rounded-xl p-3 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded-lg mb-2" />
            <div className="h-2 bg-gray-200 rounded w-3/4 mb-1" />
            <div className="h-2 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

// Generic App Content
function GenericAppContent({ appName, color }: { appName: string; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-4 text-center">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${color}20` }}>
        <Sparkles className="w-6 h-6" style={{ color }} />
      </div>
      <p className="text-sm font-semibold text-gray-900">{appName}</p>
      <p className="text-[10px] text-gray-500 mt-1">Full app experience</p>
    </div>
  )
}
