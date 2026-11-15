'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  CreditCard, Snowflake, Eye, EyeOff, Plus, Shield, TrendingUp,
  Apple, Smartphone, Wifi, CheckCircle2, Lock, ChevronRight, Sparkles,
  Copy, Check, Clock, AlertCircle, Fingerprint, RotateCw,
} from 'lucide-react'
import { apiGet, apiPost, apiPatch, formatMoney } from '@/components/wallet/lib/api'
import {
  CARD_TIERS, TIER_ORDER, getTierForPoints, getNextTier, getTierProgress,
  CardTier,
} from '@/lib/consumer-wallet/card-tiers'

// ============================================================
// Props
// ============================================================
interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ============================================================
// Card state machine
// ============================================================
type CardState = 'pending_activation' | 'active' | 'frozen' | 'expired' | 'cancelled'
type ModalMode = 'view' | 'generate'
type AuthStep = 'none' | 'otp' | 'verifying' | 'verified'

// ============================================================
// Reduced motion hook
// ============================================================
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return reduced
}

// ============================================================
// 3D Flip Card Shell
// ============================================================
interface FlipCardShellProps {
  flipped: boolean
  front: React.ReactNode
  back: React.ReactNode
  reducedMotion: boolean
}

function FlipCardShell({ flipped, front, back, reducedMotion }: FlipCardShellProps) {
  const transitionDuration = reducedMotion ? '0ms' : '500ms'
  const transitionTiming = reducedMotion ? 'ease' : 'cubic-bezier(0.34, 1.56, 0.64, 1)'

  return (
    <div style={{ perspective: '1200px' }} className="w-full max-w-[420px] mx-auto">
      {/* Rotator layer — preserve-3d, NO overflow-hidden, NO rounded here */}
      <div
        className="relative w-full transition-transform"
        style={{
          aspectRatio: '1.586',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${flipped ? 180 : 0}deg) scale(${flipped && !reducedMotion ? 1.02 : 1})`,
          transition: `transform ${transitionDuration} ${transitionTiming}`,
        }}
      >
        {/* Front face — backface-hidden, overflow-hidden, rounded HERE */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
          {...(flipped ? { 'aria-hidden': true, inert: true } : {})}
        >
          {front}
        </div>

        {/* Back face — pre-rotated 180deg, backface-hidden */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          {...(!flipped ? { 'aria-hidden': true, inert: true } : {})}
        >
          {back}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// Card Front Face
// ============================================================
interface CardFrontProps {
  tier: CardTier
  lastFour: string
  cardholderName: string
  expiryMonth: string
  expiryYear: string
  status: CardState
  revealed: boolean
  pan: string
  network: 'visa' | 'mastercard'
}

function CardFront({ tier, lastFour, cardholderName, expiryMonth, expiryYear, status, revealed, pan, network }: CardFrontProps) {
  const tierConfig = CARD_TIERS[tier]
  const isDimmed = status !== 'active'

  return (
    <div className={`w-full h-full bg-gradient-to-br ${tierConfig.gradient} p-5 relative ${isDimmed ? 'opacity-60 saturate-50' : ''}`}>
      {/* Top row: Groway logo + tier badge */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-bold text-sm">Groway</p>
          <p className="text-white/50 text-[8px]">{tierConfig.label} Card</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Contactless icon */}
          <Wifi className="h-4 w-4 text-white/40 rotate-90" aria-hidden="true" />
          {/* EMV Chip */}
          <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-200 to-yellow-500 flex items-center justify-center" aria-hidden="true">
            <div className="w-8 h-5 border border-yellow-700/30 rounded-sm grid grid-cols-3 gap-px p-px">
              {[...Array(6)].map((_, i) => <div key={i} className="bg-yellow-700/20 rounded-sm" />)}
            </div>
          </div>
        </div>
      </div>

      {/* Status overlay for non-active cards */}
      {status === 'frozen' && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-1">
            <Snowflake className="h-8 w-8 text-blue-300" />
            <p className="text-blue-100 text-xs font-medium">Frozen</p>
          </div>
        </div>
      )}
      {status === 'pending_activation' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-1">
            <Lock className="h-8 w-8 text-white/70" />
            <p className="text-white/70 text-xs font-medium">Activation Required</p>
          </div>
        </div>
      )}
      {status === 'expired' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-500/30 backdrop-blur-sm">
          <p className="text-white/60 text-xs font-medium">Expired</p>
        </div>
      )}

      {/* Card number */}
      <div className="absolute bottom-16 left-5 right-5">
        <p className="text-white font-mono text-sm tracking-wider">
          {revealed && pan ? (
            pan.replace(/(.{4})/g, '$1 ').trim()
          ) : (
            <>
              <span className="text-white/30">•••• •••• •••• </span>
              <span className="text-white">{lastFour}</span>
            </>
          )}
        </p>
      </div>

      {/* Bottom row: cardholder + expiry + network */}
      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
        <div>
          <p className="text-white/40 text-[7px] uppercase tracking-wide">Cardholder</p>
          <p className="text-white text-xs font-medium uppercase">{cardholderName || 'GROWAY USER'}</p>
        </div>
        <div>
          <p className="text-white/40 text-[7px] uppercase tracking-wide">Expires</p>
          <p className="text-white text-xs font-medium">{expiryMonth}/{expiryYear}</p>
        </div>
        {/* Network mark */}
        <div aria-hidden="true">
          {network === 'visa' ? (
            <p className="text-white font-bold italic text-lg tracking-tight">VISA</p>
          ) : (
            <div className="flex items-center -mr-1">
              <div className="w-6 h-6 rounded-full bg-red-500 opacity-90" />
              <div className="w-6 h-6 rounded-full bg-yellow-400 opacity-90 -ml-2" />
            </div>
          )}
        </div>
      </div>

      {/* Tier icon */}
      <div className="absolute top-14 left-5">
        <span className="text-lg" aria-hidden="true">{tierConfig.icon}</span>
      </div>
    </div>
  )
}

// ============================================================
// Card Back Face
// ============================================================
interface CardBackProps {
  tier: CardTier
  cvv: string
  revealed: boolean
  expiryMonth: string
  expiryYear: string
  cardholderName: string
}

function CardBack({ tier, cvv, revealed, expiryMonth, expiryYear, cardholderName }: CardBackProps) {
  const tierConfig = CARD_TIERS[tier]
  return (
    <div className={`w-full h-full bg-gradient-to-br ${tierConfig.gradient} relative`}>
      {/* Magnetic stripe */}
      <div className="absolute top-5 left-0 right-0 h-10 bg-black/80" aria-hidden="true" />

      {/* Signature strip */}
      <div className="absolute top-20 left-5 right-20 h-8 bg-white/90 rounded-sm flex items-center px-2">
        <p className="text-gray-400 text-[8px] font-mono italic truncate">
          {cardholderName || 'GROWAY USER'}
        </p>
      </div>

      {/* CVV area */}
      <div className="absolute top-20 right-5 w-16 h-8 bg-white/90 rounded-sm flex items-center justify-center">
        <p className="text-gray-700 text-xs font-mono">
          {revealed ? cvv : '•••'}
        </p>
      </div>

      {/* CVV label */}
      <div className="absolute top-[104px] right-5 w-16 text-center">
        <p className="text-white/40 text-[6px] uppercase">CVV</p>
      </div>

      {/* Back info */}
      <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
        <div>
          <p className="text-white/30 text-[7px]">Groway (Pty) Ltd · NCR Registered</p>
          <p className="text-white/30 text-[7px]">Helpline: 0800 GROWAY · www.groway.co.za</p>
        </div>
        <div>
          <p className="text-white/40 text-[7px] uppercase">Exp</p>
          <p className="text-white text-xs">{expiryMonth}/{expiryYear}</p>
        </div>
      </div>

      {/* Security note */}
      <div className="absolute bottom-16 left-5 right-5">
        <p className="text-white/20 text-[6px] leading-tight">
          This card is the property of Groway (Pty) Ltd. Unauthorized use is prohibited.
          If found, please return to any Groway branch or call 0800 GROWAY.
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Main CardModal
// ============================================================
export function CardModal({ open, onOpenChange }: Props) {
  const reducedMotion = usePrefersReducedMotion()

  // State
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<any[]>([])
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [currentTier, setCurrentTier] = useState<CardTier>('standard')
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [mode, setMode] = useState<ModalMode>('view')

  // Flip state
  const [flipped, setFlipped] = useState(false)

  // Reveal state
  const [revealed, setRevealed] = useState(false)
  const [revealCountdown, setRevealCountdown] = useState(0)
  const [copied, setCopied] = useState<'pan' | 'cvv' | null>(null)
  const revealTimer = useRef<NodeJS.Timeout | null>(null)

  // Generate mode state
  const [spendLimit, setSpendLimit] = useState('')
  const [spendType, setSpendType] = useState<'total' | 'per_transaction'>('total')
  const [merchantLock, setMerchantLock] = useState('')
  const [expiryPreset, setExpiryPreset] = useState('24h')
  const [fundingSource, setFundingSource] = useState('wallet')
  const [issuing, setIssuing] = useState(false)
  const [authStep, setAuthStep] = useState<AuthStep>('none')
  const [otpCode, setOtpCode] = useState('')
  const [error, setError] = useState('')

  // Apple Pay / Google Pay
  const [applePayAdded, setApplePayAdded] = useState(false)
  const [googlePayAdded, setGooglePayAdded] = useState(false)

  // Load cards on open
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await apiGet('/cards')
      const data = res?.data || res
      setCards(data?.cards || [])
      setLoyaltyPoints(data?.loyaltyPoints || 0)
      setCurrentTier(data?.currentTier || 'standard')
      if (data?.cards?.length > 0) {
        setSelectedCard(data.cards[0])
        setMode('view')
      } else {
        setMode('generate')
      }
    } catch {
      // Stay in generate mode if no cards
      setMode('generate')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  // Reveal countdown
  useEffect(() => {
    if (revealCountdown > 0) {
      const timer = setTimeout(() => setRevealCountdown(c => c - 1), 1000)
      return () => clearTimeout(timer)
    } else if (revealCountdown === 0 && revealed) {
      // Auto-hide after countdown reaches 0
      setRevealed(false)
    }
  }, [revealCountdown, revealed])

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      setFlipped(false)
      setRevealed(false)
      setRevealCountdown(0)
      setMode('view')
      setAuthStep('none')
      setOtpCode('')
      setError('')
      if (revealTimer.current) clearTimeout(revealTimer.current)
    }
  }, [open])

  // Actions
  const revealDetails = () => {
    if (selectedCard?.status !== 'active') return
    setRevealed(true)
    setRevealCountdown(45) // 45-second reveal window
  }

  const hideDetails = () => {
    setRevealed(false)
    setRevealCountdown(0)
    if (revealTimer.current) clearTimeout(revealTimer.current)
  }

  const copyToClipboard = (text: string, type: 'pan' | 'cvv') => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const toggleFreeze = async () => {
    if (!selectedCard) return
    try {
      await apiPatch('/cards', { cardId: selectedCard.id, action: 'freeze' })
      await load()
    } catch {}
  }

  const issueCard = async () => {
    setError('')
    setIssuing(true)
    try {
      const res = await apiPost('/cards', {
        tier: currentTier,
        network: CARD_TIERS[currentTier].network,
        cardholderName: 'DEMO USER',
      })
      const data = res?.data || res
      await load()
      if (data) {
        setSelectedCard(data)
        setMode('view')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIssuing(false)
      setAuthStep('none')
      setOtpCode('')
    }
  }

  const handleIssue = () => {
    // Step-up auth gate: require OTP before issuance
    setError('')
    setAuthStep('otp')
    // In production, this would call the SMS gateway to send an OTP
    // For demo, accept any 4-digit code
  }

  const verifyOtp = () => {
    if (otpCode.length < 4) {
      setError('Enter a valid 4-digit OTP code')
      return
    }
    setError('')
    setAuthStep('verifying')
    // Simulate OTP verification (in production, this calls the auth API)
    setTimeout(() => {
      setAuthStep('verified')
      issueCard()
    }, 1500)
  }

  const resendOtp = () => {
    // In production, this would re-send the OTP via SMS
    setError('')
    setOtpCode('')
  }

  const addToApplePay = () => setApplePayAdded(true)
  const addToGooglePay = () => setGooglePayAdded(true)

  // Derived values
  const tierConfig = CARD_TIERS[currentTier]
  const nextTier = getNextTier(currentTier)
  const tierProgress = getTierProgress(loyaltyPoints, currentTier)
  const cardState: CardState = selectedCard?.status === 'frozen' ? 'frozen' :
    selectedCard?.status === 'cancelled' ? 'cancelled' :
    selectedCard?.status === 'expired' ? 'expired' :
    selectedCard?.status === 'pending' ? 'pending_activation' : 'active'

  const cardNetwork = selectedCard?.cardType ?
    (CARD_TIERS[selectedCard.cardType as CardTier]?.network || 'visa') : tierConfig.network

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#00897B]" />
            {mode === 'view' ? 'Groway Card' : 'Issue Virtual Card'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00897B] mx-auto" />
          </div>
        ) : mode === 'view' && selectedCard ? (
          <div className="space-y-4">
            {/* 3D Flip Card */}
            <FlipCardShell
              flipped={flipped}
              reducedMotion={reducedMotion}
              front={
                <CardFront
                  tier={selectedCard.cardType as CardTier || currentTier}
                  lastFour={selectedCard.lastFourDigits}
                  cardholderName={selectedCard.cardholderName}
                  expiryMonth={selectedCard.expiryMonth}
                  expiryYear={selectedCard.expiryYear}
                  status={cardState}
                  revealed={revealed}
                  pan={selectedCard.panEncrypted}
                  network={cardNetwork}
                />
              }
              back={
                <CardBack
                  tier={selectedCard.cardType as CardTier || currentTier}
                  cvv={selectedCard.cvvEncrypted}
                  revealed={revealed}
                  expiryMonth={selectedCard.expiryMonth}
                  expiryYear={selectedCard.expiryYear}
                  cardholderName={selectedCard.cardholderName}
                />
              }
            />

            {/* Flip control — outside the card, always focusable */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setFlipped(f => !f)}
              aria-label={flipped ? 'Show front of card' : 'Show back of card'}
            >
              <RotateCw className="h-3 w-3 mr-1" />
              {flipped ? 'Show Front' : 'Show Back'}
            </Button>

            {/* Card status badge */}
            <div className="flex items-center justify-center gap-2">
              {cardState === 'active' && <Badge className="bg-green-500 text-white border-0 text-xs">Active</Badge>}
              {cardState === 'frozen' && <Badge className="bg-blue-500 text-white border-0 text-xs">Frozen</Badge>}
              {cardState === 'pending_activation' && <Badge className="bg-amber-500 text-white border-0 text-xs">Pending Activation</Badge>}
              {cardState === 'expired' && <Badge className="bg-gray-500 text-white border-0 text-xs">Expired</Badge>}
              <Badge variant="outline" className="text-xs">
                {CARD_TIERS[selectedCard.cardType as CardTier]?.icon} {CARD_TIERS[selectedCard.cardType as CardTier]?.label}
              </Badge>
            </div>

            {/* Reveal / Hide controls */}
            {cardState === 'active' && (
              <div className="space-y-2">
                {!revealed ? (
                  <Button className="w-full bg-[#00897B] hover:bg-[#00897B]/90" onClick={revealDetails}>
                    <Eye className="h-4 w-4 mr-2" /> Reveal Card Details
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 text-amber-700 text-xs">
                        <Clock className="h-3 w-3" />
                        Auto-hiding in {revealCountdown}s
                      </div>
                      <Button size="sm" variant="ghost" className="h-6 text-xs text-amber-700" onClick={hideDetails}>
                        Hide Now
                      </Button>
                    </div>
                    {/* Countdown bar */}
                    <div className="w-full bg-amber-200 rounded-full h-0.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-0.5 transition-all duration-1000 ease-linear"
                        style={{ width: `${(revealCountdown / 45) * 100}%` }}
                      />
                    </div>
                    {/* Copy buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => copyToClipboard(selectedCard.panEncrypted, 'pan')}
                      >
                        {copied === 'pan' ? <Check className="h-3 w-3 mr-1 text-green-600" /> : <Copy className="h-3 w-3 mr-1" />}
                        {copied === 'pan' ? 'Copied!' : 'Copy Number'}
                      </Button>
                      {flipped && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => copyToClipboard(selectedCard.cvvEncrypted, 'cvv')}
                        >
                          {copied === 'cvv' ? <Check className="h-3 w-3 mr-1 text-green-600" /> : <Copy className="h-3 w-3 mr-1" />}
                          {copied === 'cvv' ? 'Copied!' : 'Copy CVV'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Freeze / Unfreeze */}
            {cardState !== 'expired' && cardState !== 'cancelled' && (
              <Button
                variant="outline"
                className="w-full"
                onClick={toggleFreeze}
                disabled={cardState === 'pending_activation'}
              >
                <Snowflake className="h-4 w-4 mr-2" />
                {cardState === 'frozen' ? 'Unfreeze Card' : 'Freeze Card'}
              </Button>
            )}

            {/* Digital Wallet */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-3">Add to Digital Wallet</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={addToApplePay}
                    disabled={applePayAdded || cardState !== 'active'}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${applePayAdded ? 'border-[#00897B] bg-[#00897B]/5' : 'border-gray-200 hover:border-gray-300'} ${cardState !== 'active' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <Apple className="h-6 w-6 mb-1" />
                    <span className="text-xs font-medium">{applePayAdded ? '✓ Added' : 'Apple Pay'}</span>
                  </button>
                  <button
                    onClick={addToGooglePay}
                    disabled={googlePayAdded || cardState !== 'active'}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${googlePayAdded ? 'border-[#00897B] bg-[#00897B]/5' : 'border-gray-200 hover:border-gray-300'} ${cardState !== 'active' ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <Smartphone className="h-6 w-6 mb-1" />
                    <span className="text-xs font-medium">{googlePayAdded ? '✓ Added' : 'Google Pay'}</span>
                  </button>
                </div>
                {applePayAdded && googlePayAdded && (
                  <p className="text-[10px] text-[#00897B] mt-2 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Card added to both wallets — tap to pay anywhere.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Card Settings */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold">Card Settings</p>
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4 text-gray-400" /> Online payments</Label>
                  <Switch checked={selectedCard.onlineEnabled} onCheckedChange={async (v) => { await apiPatch('/cards', { cardId: selectedCard.id, action: 'updateSettings', onlineEnabled: v }); await load() }} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2"><Wifi className="h-4 w-4 text-gray-400" /> Contactless (NFC)</Label>
                  <Switch checked={selectedCard.contactlessEnabled} onCheckedChange={async (v) => { await apiPatch('/cards', { cardId: selectedCard.id, action: 'updateSettings', contactlessEnabled: v }); await load() }} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2"><Lock className="h-4 w-4 text-gray-400" /> ATM withdrawals</Label>
                  <Switch checked={selectedCard.atmEnabled} onCheckedChange={async (v) => { await apiPatch('/cards', { cardId: selectedCard.id, action: 'updateSettings', atmEnabled: v }); await load() }} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-gray-400" /> International</Label>
                  <Switch checked={selectedCard.internationalEnabled} onCheckedChange={async (v) => { await apiPatch('/cards', { cardId: selectedCard.id, action: 'updateSettings', internationalEnabled: v }); await load() }} />
                </div>
              </CardContent>
            </Card>

            {/* Tier Status */}
            <Card className={`bg-gradient-to-br ${tierConfig.gradient} border-0`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{tierConfig.icon}</span>
                    <div>
                      <p className="text-white font-bold text-sm">{tierConfig.label} Tier</p>
                      <p className="text-white/70 text-xs">{tierConfig.network === 'visa' ? 'Visa' : 'Mastercard'} · {tierConfig.cashbackPercent}% cashback</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">{loyaltyPoints.toLocaleString('en-ZA')}</p>
                    <p className="text-white/70 text-[10px]">points</p>
                  </div>
                </div>
                {nextTier ? (
                  <div>
                    <div className="flex justify-between text-[10px] text-white/70 mb-1">
                      <span>{tierConfig.label}</span>
                      <span>{CARD_TIERS[nextTier.tier].label} in {nextTier.pointsNeeded - loyaltyPoints} pts</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-1.5">
                      <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${tierProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <Badge className="bg-white/20 text-white border-0 text-xs">Highest tier achieved 👑</Badge>
                )}
              </CardContent>
            </Card>

            {/* Issue new card button */}
            <Button variant="outline" className="w-full" onClick={() => setMode('generate')}>
              <Plus className="h-4 w-4 mr-1" /> Issue Additional Card
            </Button>
          </div>
        ) : (
          /* === GENERATE MODE === */
          <div className="space-y-4">
            {/* Explainer */}
            <Card className="border-[#00897B]/20 bg-[#00897B]/5">
              <CardContent className="py-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-[#00897B] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-600">
                    Issue a virtual {tierConfig.label} card ({tierConfig.network === 'visa' ? 'Visa' : 'Mastercard'}).
                    You'll get {tierConfig.cashbackPercent}% cashback on all spend.
                    Card details are revealed securely after issuance.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Funding source */}
            <div>
              <Label className="text-sm font-medium">Funding Source</Label>
              <select className="mt-1 w-full rounded-md border px-3 py-2 text-sm" value={fundingSource} onChange={(e) => setFundingSource(e.target.value)}>
                <option value="wallet">Groway Wallet (R{formatMoney(loyaltyPoints ? BigInt(1245000) : BigInt(0))})</option>
                <option value="bank">Linked Bank Account</option>
                <option value="card">Linked Debit Card</option>
              </select>
            </div>

            {/* Spend limit */}
            <div>
              <Label className="text-sm font-medium">Spend Limit</Label>
              <div className="flex gap-2 mt-1">
                <Input type="number" placeholder="e.g. 5000" value={spendLimit} onChange={(e) => setSpendLimit(e.target.value)} />
                <select className="rounded-md border px-3 py-2 text-sm" value={spendType} onChange={(e) => setSpendType(e.target.value as any)}>
                  <option value="total">Total</option>
                  <option value="per_transaction">Per Transaction</option>
                </select>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Maximum: {formatMoney(tierConfig.monthlyLimitCents)} / month</p>
            </div>

            {/* Merchant lock */}
            <div>
              <Label className="text-sm font-medium">Merchant Lock (optional)</Label>
              <Input placeholder="e.g. Amazon, or leave blank for any merchant" value={merchantLock} onChange={(e) => setMerchantLock(e.target.value)} />
            </div>

            {/* Expiry */}
            <div>
              <Label className="text-sm font-medium">Card Expiry</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {['1h', '24h', '1w', 'custom'].map(p => (
                  <button
                    key={p}
                    onClick={() => setExpiryPreset(p)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${expiryPreset === p ? 'border-[#00897B] bg-[#00897B]/5 text-[#00897B]' : 'border-gray-200 text-gray-500'}`}
                  >
                    {p === '1h' ? '1 Hour' : p === '24h' ? '24 Hours' : p === '1w' ? '1 Week' : 'Custom'}
                  </button>
                ))}
              </div>
              {expiryPreset === 'custom' && (
                <Input
                  type="date"
                  className="mt-2"
                  onChange={(e) => setExpiryPreset(e.target.value || 'custom')}
                  min={new Date().toISOString().split('T')[0]}
                />
              )}
            </div>

            {/* Step-up authentication */}
            {authStep !== 'none' && authStep !== 'verified' && (
              <Card className="border-amber-300 bg-amber-50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-900">Step-up Authentication</p>
                  </div>
                  <p className="text-xs text-amber-700">
                    Enter the OTP sent to your phone to authorize card issuance.
                  </p>
                  {authStep === 'otp' && (
                    <>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Enter 4-digit OTP"
                        value={otpCode}
                        onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, '')); setError('') }}
                        onKeyDown={(e) => { if (e.key === 'Enter') verifyOtp() }}
                        className="text-center text-lg tracking-widest"
                        autoFocus
                      />
                      {error && <p className="text-xs text-red-500">{error}</p>}
                      <Button className="w-full bg-amber-600 hover:bg-amber-700" onClick={verifyOtp} disabled={otpCode.length < 4}>
                        Verify & Issue Card
                      </Button>
                      <button className="text-xs text-amber-600 hover:underline w-full text-center" onClick={resendOtp}>
                        Resend OTP
                      </button>
                    </>
                  )}
                  {authStep === 'verifying' && (
                    <div className="flex items-center justify-center py-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600" />
                      <span className="ml-2 text-sm text-amber-700">Verifying...</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Error */}
            {error && authStep === 'none' && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            {/* Issue button */}
            {authStep === 'none' && (
              <Button className="w-full bg-[#00897B] hover:bg-[#00897B]/90" onClick={handleIssue} disabled={issuing}>
                <Shield className="h-4 w-4 mr-2" /> Issue Virtual Card
              </Button>
            )}

            {authStep === 'verified' && issuing && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00897B]" />
                <span className="ml-3 text-sm text-slate-600">Issuing your card...</span>
              </div>
            )}

            {/* Cancel */}
            <Button variant="ghost" className="w-full" onClick={() => { setMode('view'); setAuthStep('none'); setOtpCode(''); setError('') }}>
              Cancel
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
