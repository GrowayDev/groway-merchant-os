'use client'

import { useCallback, useEffect, useState } from 'react'
import { HomeTab } from '@/components/wallet/HomeTab'
import { ServicesTab } from '@/components/wallet/ServicesTab'
import { WalletCard, type CardData } from '@/components/wallet/WalletCard'
import { PayPlusModal } from '@/components/wallet/modals/PayPlusModal'
import { GrantPlusModal } from '@/components/wallet/modals/GrantPlusModal'
import { LaybyeModal } from '@/components/wallet/modals/LaybyeModal'
import { MTNMOMOModal } from '@/components/wallet/modals/MTNMOMOModal'
import { SendMoneyModal } from '@/components/wallet/modals/SendMoneyModal'
import { QRPayModal } from '@/components/wallet/modals/QRPayModal'
import { BNPLModal } from '@/components/wallet/modals/BNPLModal'
import { PayShapModal } from '@/components/wallet/modals/PayShapModal'
import { CreditMarketModal } from '@/components/wallet/modals/CreditMarketModal'
import { InsuranceModal } from '@/components/wallet/modals/InsuranceModal'
import { BillsModal } from '@/components/wallet/modals/BillsModal'
import { AirtimeModal } from '@/components/wallet/modals/AirtimeModal'
import { VouchersModal } from '@/components/wallet/modals/VouchersModal'
import { FlightsModal } from '@/components/wallet/modals/FlightsModal'
import { BusModal } from '@/components/wallet/modals/BusModal'
import { TrainModal } from '@/components/wallet/modals/TrainModal'
import { EventsModal } from '@/components/wallet/modals/EventsModal'
import { RemittanceModal } from '@/components/wallet/modals/RemittanceModal'
import { TransactionHistoryModal } from '@/components/wallet/modals/TransactionHistoryModal'
import { SavingsModal } from '@/components/wallet/modals/SavingsModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { apiGet, apiPut } from '@/components/wallet/lib/api'
import {
  Home,
  Grid3X3,
  CreditCard,
  User,
  QrCode,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  LogOut,
  Loader2,
  AlertCircle,
} from 'lucide-react'

/**
 * Map a card record from `/api/consumer/cards` (which uses snake-ish fields
 * like `lastFour`, `expiryMonth`, `cardType`, `type`) to the `CardData` shape
 * expected by the `WalletCard` component.
 */
function mapApiCardToCardData(card: Record<string, unknown>): CardData {
  const lastFour = String(card.lastFour ?? '0000')
  const network = (card.type === 'mastercard' ? 'mastercard' : 'visa') as CardData['network']
  const cardType = (card.cardType ?? 'virtual') as CardData['formFactor']
  const expiryMonth = String(card.expiryMonth ?? '12').padStart(2, '0')
  const expiryYear = String(card.expiryYear ?? '28')
  const statusRaw = String(card.status ?? 'active')
  const status = (statusRaw === 'frozen' ? 'frozen' : statusRaw === 'terminated' ? 'cancelled' : statusRaw === 'pending' ? 'pending' : 'active') as CardData['status']

  return {
    cardId: String(card.id ?? ''),
    merchantId: String(card.merchantId ?? 'groway'),
    network,
    tier: (card.tier ?? 'business') as CardData['tier'],
    formFactor: cardType,
    status,
    cardholderName: String(card.cardholderName ?? 'GROWAY USER'),
    lastFour,
    maskedNumber: `•••• •••• •••• ${lastFour}`,
    expiryDisplay: `${expiryMonth} / ${expiryYear}`,
    nfcEnabled: Boolean(card.contactlessEnabled ?? true),
    dailyLimitCents: Number(card.dailyLimitCents ?? 20000),
    issuedAt: String(card.createdAt ?? new Date().toISOString()),
    expiresAt: String(card.expiresAt ?? `${new Date().getFullYear() + 4}-12-31`),
  }
}

export default function ConsumerWalletPage() {
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'pay' | 'cards' | 'profile'>('home')

  // Card data fetched from the backend
  const [card, setCard] = useState<CardData | null>(null)
  const [cardLoading, setCardLoading] = useState(true)
  const [cardError, setCardError] = useState<string | null>(null)
  const [cardFreezing, setCardFreezing] = useState(false)

  // Modal states
  const [payPlusOpen, setPayPlusOpen] = useState(false)
  const [grantPlusOpen, setGrantPlusOpen] = useState(false)
  const [laybyeOpen, setLaybyeOpen] = useState(false)
  const [mtnMomoOpen, setMtnMomoOpen] = useState(false)
  const [sendMoneyOpen, setSendMoneyOpen] = useState(false)
  const [qrPayOpen, setQRPayOpen] = useState(false)
  const [bnplOpen, setBnplOpen] = useState(false)
  const [payShapOpen, setPayShapOpen] = useState(false)
  const [creditMarketOpen, setCreditMarketOpen] = useState(false)
  const [insuranceOpen, setInsuranceOpen] = useState(false)
  const [billsOpen, setBillsOpen] = useState(false)
  const [airtimeOpen, setAirtimeOpen] = useState(false)
  const [vouchersOpen, setVouchersOpen] = useState(false)
  const [flightsOpen, setFlightsOpen] = useState(false)
  const [busOpen, setBusOpen] = useState(false)
  const [trainOpen, setTrainOpen] = useState(false)
  const [eventsOpen, setEventsOpen] = useState(false)
  const [remittanceOpen, setRemittanceOpen] = useState(false)
  const [transactionHistoryOpen, setTransactionHistoryOpen] = useState(false)
  const [savingsOpen, setSavingsOpen] = useState(false)

  // Fetch the user's primary card on mount
  useEffect(() => {
    let cancelled = false
    async function loadCard() {
      setCardLoading(true)
      setCardError(null)
      try {
        const res = await apiGet<{ success?: boolean; data?: Record<string, unknown>[] }>('/cards')
        if (cancelled) return
        const cards = Array.isArray(res?.data) ? res.data : []
        const first = cards.find((c) => c && c.status !== 'terminated') ?? cards[0]
        if (!first) {
          setCard(null)
        } else {
          setCard(mapApiCardToCardData(first))
        }
      } catch (err) {
        if (!cancelled) {
          setCardError(err instanceof Error ? err.message : 'Failed to load card')
          setCard(null)
        }
      } finally {
        if (!cancelled) setCardLoading(false)
      }
    }
    loadCard()
    return () => {
      cancelled = true
    }
  }, [])

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'services', icon: Grid3X3, label: 'Services' },
    { id: 'pay', icon: QrCode, label: 'Pay', isCenter: true },
    { id: 'cards', icon: CreditCard, label: 'Cards' },
    { id: 'profile', icon: User, label: 'Profile' },
  ]

  // Toggle card freeze state via the consumer cards API
  const handleFreezeCard = useCallback(
    async (cardId: string) => {
      if (!card) return
      const currentlyFrozen = card.status === 'frozen'
      setCardFreezing(true)
      try {
        await apiPut('/cards', { cardId, frozen: !currentlyFrozen })
        setCard((prev) =>
          prev ? { ...prev, status: currentlyFrozen ? 'active' : 'frozen' } : prev
        )
      } catch (err) {
        // Surface the error in the console so the operator can see the API
        // response without disrupting the UI flow.
        console.error('Freeze card failed:', err)
      } finally {
        setCardFreezing(false)
      }
    },
    [card]
  )

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#00897B] to-[#4CAF50] flex items-center justify-center">
              <span className="text-white font-bold text-sm">GW</span>
            </div>
            <span className="font-bold text-[#1A1A1A]">Groway Wallet</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQRPayOpen(true)}>
              <QrCode className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        <div className="max-w-md mx-auto">
          {activeTab === 'home' && (
            <HomeTab
              onOpenPayPlus={() => setPayPlusOpen(true)}
              onOpenGrantPlus={() => setGrantPlusOpen(true)}
              onOpenLaybye={() => setLaybyeOpen(true)}
              onOpenMTNMoMo={() => setMtnMomoOpen(true)}
              onOpenQR={() => setQRPayOpen(true)}
              onOpenSend={() => setSendMoneyOpen(true)}
              onOpenTransactionHistory={() => setTransactionHistoryOpen(true)}
            />
          )}
          {activeTab === 'services' && (
            <ServicesTab
              onOpenPayPlus={() => setPayPlusOpen(true)}
              onOpenLaybye={() => setLaybyeOpen(true)}
              onOpenBNPL={() => setBnplOpen(true)}
              onOpenMTNMoMo={() => setMtnMomoOpen(true)}
              onOpenCredit={() => setCreditMarketOpen(true)}
              onOpenInsurance={() => setInsuranceOpen(true)}
              onOpenBills={() => setBillsOpen(true)}
              onOpenAirtime={() => setAirtimeOpen(true)}
              onOpenVouchers={() => setVouchersOpen(true)}
              onOpenFlights={() => setFlightsOpen(true)}
              onOpenBus={() => setBusOpen(true)}
              onOpenTrain={() => setTrainOpen(true)}
              onOpenEvents={() => setEventsOpen(true)}
              onOpenRemittance={() => setRemittanceOpen(true)}
              onOpenPayShap={() => setPayShapOpen(true)}
              onOpenSavings={() => setSavingsOpen(true)}
              onOpenGrantPlus={() => setGrantPlusOpen(true)}
            />
          )}
          {activeTab === 'pay' && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="w-56 h-56 bg-white rounded-2xl shadow-lg p-4 mb-4 border border-gray-100">
                <div className="w-full h-full bg-[#E0F2F1] rounded-xl flex items-center justify-center">
                  <QrCode className="h-28 w-28 text-[#00897B]" />
                </div>
              </div>
              <p className="text-lg font-bold text-[#1A1A1A] mb-1">Scan to Pay</p>
              <p className="text-sm text-[#757575] text-center mb-4">
                Show this QR code to the merchant to pay
              </p>
              <div className="bg-gray-50 rounded-lg px-4 py-2 mb-4">
                <p className="text-xs text-[#757575]">Groway ID</p>
                <p className="text-sm font-mono font-bold text-[#1A1A1A]">GW-THABO-8472</p>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={() => setQRPayOpen(true)}
                  className="flex-1"
                >
                  Scan QR Code
                </Button>
                <Button
                  onClick={() => setSendMoneyOpen(true)}
                  className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
                >
                  Send Money
                </Button>
              </div>
            </div>
          )}
          {activeTab === 'cards' && (
            <div className="p-4">
              <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">My Cards</h2>

              {/* Virtual Card */}
              <div className="mb-4">
                {cardLoading ? (
                  <div className="w-full max-w-[340px] mx-auto h-[214px] rounded-xl bg-gray-100 animate-pulse flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-[#00897B] animate-spin" />
                  </div>
                ) : cardError ? (
                  <div className="w-full max-w-[340px] mx-auto rounded-xl border border-red-200 bg-red-50 p-4 text-center">
                    <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-red-700">{cardError}</p>
                    <p className="text-xs text-red-500 mt-1">Could not load your wallet card.</p>
                  </div>
                ) : card ? (
                  <WalletCard
                    card={card}
                    onFreeze={handleFreezeCard}
                  />
                ) : (
                  <div className="w-full max-w-[340px] mx-auto rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                    <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-[#1A1A1A]">No wallet card yet</p>
                    <p className="text-xs text-[#757575] mt-1">Issue a virtual card to start spending.</p>
                    <Button className="mt-3 bg-[#00897B] hover:bg-[#00695C]" disabled={cardFreezing}>
                      <CreditCard className="h-4 w-4 mr-2" /> Issue Virtual Card
                    </Button>
                  </div>
                )}
              </div>

              {/* Card Tiers */}
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Available Card Tiers</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { tier: 'standard', name: 'Standard', color: '#00897B' },
                  { tier: 'business', name: 'Business', color: '#1E88E5' },
                  { tier: 'premium', name: 'Premium Gold', color: '#FFB300' },
                  { tier: 'virtual', name: 'Virtual Only', color: '#9C27B0' },
                ].map((card) => (
                  <button
                    key={card.tier}
                    className="p-3 rounded-xl border border-gray-200 hover:border-[#00897B] text-left transition-all"
                  >
                    <div
                      className="w-8 h-5 rounded mb-2"
                      style={{ background: `linear-gradient(135deg, ${card.color}20, ${card.color}40)` }}
                    />
                    <p className="text-sm font-medium text-[#1A1A1A]">{card.name}</p>
                  </button>
                ))}
              </div>

              {/* Linked Cards */}
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Linked Bank Cards</h3>
              <div className="space-y-2">
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-6 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">VISA</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">FNB Debit Card</p>
                        <p className="text-xs text-[#757575]">•••• 4567</p>
                      </div>
                    </div>
                    <Badge className="bg-[#4CAF50]/10 text-[#4CAF50] border-0">Primary</Badge>
                  </CardContent>
                </Card>
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-6 bg-red-600 rounded flex items-center justify-center">
                        <span className="text-white text-[8px] font-bold">MC</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">Capitec Credit</p>
                        <p className="text-xs text-[#757575]">•••• 8901</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </CardContent>
                </Card>
              </div>

              <Button variant="outline" className="w-full mt-4">
                <CreditCard className="h-4 w-4 mr-2" /> Add New Card
              </Button>
            </div>
          )}
          {activeTab === 'profile' && (
            <div className="p-4">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#00897B] to-[#4CAF50] flex items-center justify-center mx-auto mb-3">
                  <User className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-lg font-bold text-[#1A1A1A]">Thabo Mokoena</h2>
                <p className="text-sm text-[#757575]">thabo.mokoena@email.com</p>
                <div className="flex justify-center gap-2 mt-2">
                  <Badge className="bg-[#00897B]/10 text-[#00897B] border-0">L2 Verified</Badge>
                  <Badge className="bg-[#FFD700]/20 text-[#B8860B] border-0">Gold Member</Badge>
                </div>
              </div>

              <div className="space-y-2">
                <button className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-[#00897B]" />
                    <span className="text-sm text-[#1A1A1A]">Personal Information</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-[#00897B]" />
                    <span className="text-sm text-[#1A1A1A]">Security Settings</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-[#00897B]" />
                    <span className="text-sm text-[#1A1A1A]">Notifications</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-[#00897B]" />
                    <span className="text-sm text-[#1A1A1A]">App Settings</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
                <button className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-[#00897B]" />
                    <span className="text-sm text-[#1A1A1A]">Help & Support</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <Button variant="outline" className="w-full mt-6 text-red-500 border-red-200 hover:bg-red-50">
                <LogOut className="h-4 w-4 mr-2" /> Sign Out
              </Button>

              <p className="text-xs text-center text-[#757575] mt-4">
                Version 1.0.0 • Groway Wallet © 2025
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`flex flex-col items-center ${
                  item.isCenter ? '-mt-6' : ''
                }`}
              >
                {item.isCenter ? (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#00897B] to-[#4CAF50] flex items-center justify-center shadow-lg active:scale-95 transition-transform">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                ) : (
                  <>
                    <item.icon
                      className={`h-5 w-5 ${
                        activeTab === item.id ? 'text-[#00897B]' : 'text-[#757575]'
                      }`}
                    />
                    <span
                      className={`text-xs mt-1 ${
                        activeTab === item.id ? 'text-[#00897B] font-medium' : 'text-[#757575]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Modals */}
      <PayPlusModal open={payPlusOpen} onOpenChange={setPayPlusOpen} />
      <GrantPlusModal open={grantPlusOpen} onOpenChange={setGrantPlusOpen} />
      <LaybyeModal open={laybyeOpen} onOpenChange={setLaybyeOpen} />
      <MTNMOMOModal open={mtnMomoOpen} onOpenChange={setMtnMomoOpen} />
      <SendMoneyModal open={sendMoneyOpen} onOpenChange={setSendMoneyOpen} />
      <QRPayModal open={qrPayOpen} onOpenChange={setQRPayOpen} />
      <BNPLModal open={bnplOpen} onOpenChange={setBnplOpen} />
      <PayShapModal open={payShapOpen} onOpenChange={setPayShapOpen} />
      <CreditMarketModal open={creditMarketOpen} onOpenChange={setCreditMarketOpen} />
      <InsuranceModal open={insuranceOpen} onOpenChange={setInsuranceOpen} />
      <BillsModal open={billsOpen} onOpenChange={setBillsOpen} />
      <AirtimeModal open={airtimeOpen} onOpenChange={setAirtimeOpen} />
      <VouchersModal open={vouchersOpen} onOpenChange={setVouchersOpen} />
      <FlightsModal open={flightsOpen} onOpenChange={setFlightsOpen} />
      <BusModal open={busOpen} onOpenChange={setBusOpen} />
      <TrainModal open={trainOpen} onOpenChange={setTrainOpen} />
      <EventsModal open={eventsOpen} onOpenChange={setEventsOpen} />
      <RemittanceModal open={remittanceOpen} onOpenChange={setRemittanceOpen} />
      <TransactionHistoryModal open={transactionHistoryOpen} onOpenChange={setTransactionHistoryOpen} />
      <SavingsModal open={savingsOpen} onOpenChange={setSavingsOpen} />
    </div>
  )
}
