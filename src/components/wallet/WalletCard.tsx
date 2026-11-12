'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'

// Types
export type CardNetwork = 'visa' | 'mastercard'
export type CardTier = 'standard' | 'business' | 'premium' | 'virtual'
export type CardStatus = 'active' | 'frozen' | 'pending' | 'cancelled'
export type CardFormFactor = 'virtual' | 'physical' | 'metal'

export interface CardData {
  cardId: string
  merchantId: string
  network: CardNetwork
  tier: CardTier
  formFactor: CardFormFactor
  status: CardStatus
  cardholderName: string
  lastFour: string
  maskedNumber: string
  fullNumber?: string
  expiryDisplay: string
  cvv?: string
  nfcEnabled: boolean
  dailyLimitCents: number
  issuedAt: string
  expiresAt: string
}

interface WalletCardProps {
  card: CardData
  onFreeze?: (cardId: string) => void
  onRevealDetails?: (cardId: string) => Promise<{ fullNumber: string; cvv: string }>
  onCardPress?: (cardId: string) => void
  size?: 'full' | 'mini'
  showBack?: boolean
}

// Design Tokens
const COLORS = {
  TEAL_PRIMARY: '#00897B',
  GREEN_PRIMARY: '#43A047',
  TEAL_DARK: '#00695C',
  CARD_TEXT_DARK: '#0A3D30',
  CARD_BG_WHITE: '#FFFFFF',
  CARD_BG_MID: '#E8F8F0',
  CARD_BG_END: '#C0EDDA',
  BUSINESS_START: '#F0FFFE',
  BUSINESS_END: '#60D8B8',
  PREMIUM_START: '#FFFFFF',
  PREMIUM_END: '#16A878',
  VIRTUAL_START: '#F8FFFC',
  VIRTUAL_END: '#AAEEDD',
  CHIP_GOLD_LIGHT: '#F2D060',
  CHIP_GOLD_DARK: '#B88010',
  VISA_BLUE: '#1A1F71',
  MC_RED: '#EB001B',
  MC_YELLOW: '#F79E1B',
}

const TIER_GRADIENTS = {
  standard: `linear-gradient(135deg, ${COLORS.CARD_BG_WHITE} 0%, ${COLORS.CARD_BG_MID} 50%, ${COLORS.CARD_BG_END} 100%)`,
  business: `linear-gradient(135deg, ${COLORS.BUSINESS_START} 0%, ${COLORS.BUSINESS_END} 100%)`,
  premium: `linear-gradient(135deg, #FFD700 0%, #FFA500 25%, ${COLORS.PREMIUM_END} 100%)`,
  virtual: `linear-gradient(135deg, ${COLORS.VIRTUAL_START} 0%, ${COLORS.VIRTUAL_END} 100%)`,
}

const TIER_BADGES = {
  standard: { label: 'STANDARD', color: '#00897B' },
  business: { label: 'BUSINESS', color: '#1E88E5' },
  premium: { label: 'PREMIUM GOLD', color: '#FFB300' },
  virtual: { label: 'VIRTUAL', color: '#9C27B0' },
}

// EMV Chip SVG Component
function EMVChip({ width = 54, height = 42 }: { width?: number; height?: number }) {
  const sx = width / 54
  const sy = height / 42

  return (
    <svg width={width} height={height} viewBox="0 0 54 42" className="flex-shrink-0">
      <defs>
        <linearGradient id="chipBody" x1="0" y1="0" x2="54" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D4A820" />
          <stop offset="22%" stopColor="#F2D060" />
          <stop offset="45%" stopColor="#C89418" />
          <stop offset="68%" stopColor="#E8C840" />
          <stop offset="100%" stopColor="#B88010" />
        </linearGradient>
        <linearGradient id="padShine" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#F8E878" />
          <stop offset="50%" stopColor="#D4A820" />
          <stop offset="100%" stopColor="#A07010" />
        </linearGradient>
      </defs>

      {/* Chip body */}
      <rect x="0" y="0" width="54" height="42" rx="5" ry="5" fill="url(#chipBody)" />

      {/* Inner border groove */}
      <rect x="1.5" y="1.5" width="51" height="39" rx="4" ry="4" fill="none" stroke="#A07010" strokeWidth="0.8" opacity="0.5" />

      {/* Left Column: C1, C2, C3, C4 */}
      {/* C1 (VCC) */}
      <rect x="5" y="5" width="18" height="7" rx="1" fill="url(#padShine)" />
      <rect x="5" y="5" width="8" height="2" rx="0.5" fill="#F8E878" opacity="0.6" />

      {/* C2 (RST) */}
      <rect x="5" y="14" width="18" height="7" rx="1" fill="url(#padShine)" />
      <rect x="5" y="14" width="8" height="2" rx="0.5" fill="#F8E878" opacity="0.6" />

      {/* C3 (CLK) */}
      <rect x="5" y="23" width="18" height="7" rx="1" fill="url(#padShine)" />
      <rect x="5" y="23" width="8" height="2" rx="0.5" fill="#F8E878" opacity="0.6" />

      {/* C4 (RFU) */}
      <rect x="5" y="32" width="18" height="5" rx="1" fill="url(#padShine)" opacity="0.7" />

      {/* Right Column: C5, C6, C7, C8 */}
      {/* C5 (GND) */}
      <rect x="31" y="5" width="18" height="7" rx="1" fill="url(#padShine)" />
      <rect x="31" y="5" width="8" height="2" rx="0.5" fill="#F8E878" opacity="0.6" />

      {/* C6 (Vpp) */}
      <rect x="31" y="14" width="18" height="7" rx="1" fill="url(#padShine)" />
      <rect x="31" y="14" width="8" height="2" rx="0.5" fill="#F8E878" opacity="0.6" />

      {/* C7 (I/O) */}
      <rect x="31" y="23" width="18" height="7" rx="1" fill="url(#padShine)" />
      <rect x="31" y="23" width="8" height="2" rx="0.5" fill="#F8E878" opacity="0.6" />

      {/* C8 (RFU) */}
      <rect x="31" y="32" width="18" height="5" rx="1" fill="url(#padShine)" opacity="0.7" />

      {/* Body sheen */}
      <rect x="3" y="2" width="48" height="1.5" rx="0.5" fill="rgba(255,248,160,0.35)" />
    </svg>
  )
}

// NFC Symbol SVG Component
function NFCSymbol({ size = 32, color = '#00897B' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className="flex-shrink-0">
      <defs>
        <linearGradient id="nfcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00897B" />
          <stop offset="100%" stopColor="#43A047" />
        </linearGradient>
      </defs>
      {/* Base vertical line */}
      <rect x="14" y="6" width="4" height="20" rx="2" fill={color} />
      {/* Small arc */}
      <path d="M8 22 Q8 14, 14 12" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Medium arc */}
      <path d="M4 26 Q4 10, 14 6" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Large arc */}
      <path d="M0 30 Q0 6, 14 2" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

// Visa Logo SVG
function VisaLogo({ width = 48 }: { width?: number }) {
  return (
    <svg width={width} height={width * 0.32} viewBox="0 0 48 15" className="flex-shrink-0">
      <text x="0" y="12" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="14" fill="#1A1F71" fontStyle="italic">
        VISA
      </text>
    </svg>
  )
}

// Mastercard Logo SVG
function MastercardLogo({ width = 40 }: { width?: number }) {
  const height = width * 0.6
  const r = width * 0.35

  return (
    <svg width={width} height={height} viewBox="0 0 40 24" className="flex-shrink-0">
      {/* Left circle */}
      <circle cx="14" cy="12" r={r} fill="#EB001B" />
      {/* Right circle */}
      <circle cx="26" cy="12" r={r} fill="#F79E1B" />
      {/* Overlap blend */}
      <path
        d={`M20,${12 - r} A${r},${r} 0 0,1 20,${12 + r} A${r},${r} 0 0,1 20,${12 - r}`}
        fill="#FF5F00"
      />
    </svg>
  )
}

// Tier Badge Component
function TierBadge({ tier }: { tier: CardTier }) {
  const badge = TIER_BADGES[tier]

  return (
    <div
      className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[8px] font-bold tracking-wider"
      style={{
        backgroundColor: `${badge.color}20`,
        color: badge.color,
        border: `1px solid ${badge.color}40`,
      }}
    >
      {badge.label}
    </div>
  )
}

// Card Number Display Component
function CardNumberDisplay({
  maskedNumber,
  isRevealed,
  fullNumber
}: {
  maskedNumber: string
  isRevealed: boolean
  fullNumber?: string
}) {
  const displayNumber = isRevealed && fullNumber ? fullNumber : maskedNumber

  return (
    <p
      className="text-lg tracking-[0.2em] font-mono"
      style={{ color: COLORS.CARD_TEXT_DARK }}
    >
      {displayNumber}
    </p>
  )
}

// Main WalletCard Component
export function WalletCard({
  card,
  onFreeze,
  onRevealDetails,
  onCardPress,
  size = 'full',
  showBack: controlledShowBack,
}: WalletCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [revealedData, setRevealedData] = useState<{ fullNumber: string; cvv: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const isFrozen = card.status === 'frozen'

  const flip = useCallback(() => {
    setIsFlipped((prev) => !prev)
  }, [])

  const reveal = useCallback(async () => {
    if (isRevealed) {
      setIsRevealed(false)
      return
    }

    if (onRevealDetails) {
      setIsLoading(true)
      try {
        const data = await onRevealDetails(card.cardId)
        setRevealedData(data)
        setIsRevealed(true)
        // Auto-hide after 30 seconds (PCI DSS requirement)
        setTimeout(() => setIsRevealed(false), 30000)
      } catch (error) {
        console.error('Failed to reveal card details:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }, [card.cardId, isRevealed, onRevealDetails])

  const handleFreeze = useCallback(() => {
    if (onFreeze) {
      onFreeze(card.cardId)
    }
  }, [card.cardId, onFreeze])

  const handleCardPress = useCallback(() => {
    if (onCardPress) {
      onCardPress(card.cardId)
    }
  }, [card.cardId, onCardPress])

  // Mini card size
  if (size === 'mini') {
    return (
      <button
        onClick={handleCardPress}
        className="relative w-full h-[90px] rounded-xl overflow-hidden shadow-lg active:scale-[0.98] transition-transform"
        style={{ background: TIER_GRADIENTS[card.tier] }}
      >
        <div className="absolute inset-0 p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span
              className="text-sm font-bold"
              style={{
                background: `linear-gradient(90deg, ${COLORS.TEAL_PRIMARY}, ${COLORS.GREEN_PRIMARY})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              groway
            </span>
            <TierBadge tier={card.tier} />
          </div>
          <div className="flex items-center justify-between">
            <p
              className="text-xs font-mono"
              style={{ color: COLORS.CARD_TEXT_DARK }}
            >
              •••• {card.lastFour}
            </p>
            {card.network === 'visa' ? <VisaLogo width={32} /> : <MastercardLogo width={28} />}
          </div>
        </div>

        {isFrozen && (
          <div className="absolute inset-0 bg-gray-400/80 flex items-center justify-center backdrop-blur-sm">
            <span className="text-white font-bold text-sm">❄️ FROZEN</span>
          </div>
        )}
      </button>
    )
  }

  // Full card size
  return (
    <div className="relative" style={{ perspective: '1000px' }}>
      {/* Card Container */}
      <div
        className={cn(
          "relative w-full rounded-xl overflow-hidden shadow-xl cursor-pointer transition-transform duration-500",
          isFlipped && "[transform:rotateY(180deg)]"
        )}
        style={{
          aspectRatio: '1.586 / 1',
          maxWidth: '340px',
          transformStyle: 'preserve-3d',
        }}
        onClick={flip}
      >
        {/* Front Face */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full [backface-visibility:hidden]",
            isFlipped && "[transform:rotateY(180deg)]"
          )}
          style={{ background: TIER_GRADIENTS[card.tier] }}
        >
          <div className="absolute inset-0 p-6 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <span
                  className="text-xl font-bold"
                  style={{
                    fontFamily: 'Sora, sans-serif',
                    background: `linear-gradient(90deg, ${COLORS.TEAL_PRIMARY}, ${COLORS.GREEN_PRIMARY})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  groway
                </span>
                <p className="text-[8px] uppercase tracking-[2px] opacity-55 mt-0.5" style={{ color: COLORS.CARD_TEXT_DARK }}>
                  Wallet Card
                </p>
              </div>
              <TierBadge tier={card.tier} />
            </div>

            {/* EMV Chip and NFC */}
            <div className="flex items-center gap-3">
              <EMVChip width={48} height={36} />
              {card.nfcEnabled && <NFCSymbol size={28} color={COLORS.TEAL_PRIMARY} />}
            </div>

            {/* Card Number */}
            <div className="space-y-1">
              <CardNumberDisplay
                maskedNumber={card.maskedNumber}
                isRevealed={isRevealed}
                fullNumber={revealedData?.fullNumber}
              />
            </div>

            {/* Footer */}
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <p className="text-[8px] uppercase tracking-[1px] opacity-55" style={{ color: COLORS.CARD_TEXT_DARK }}>
                  Card Holder
                </p>
                <p
                  className="text-sm font-mono uppercase tracking-wider"
                  style={{ color: COLORS.CARD_TEXT_DARK }}
                >
                  {card.cardholderName}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[8px] uppercase tracking-[1px] opacity-55" style={{ color: COLORS.CARD_TEXT_DARK }}>
                  Expires
                </p>
                <p
                  className="text-sm font-mono"
                  style={{ color: COLORS.CARD_TEXT_DARK }}
                >
                  {card.expiryDisplay}
                </p>
              </div>
              {card.network === 'visa' ? <VisaLogo width={48} /> : <MastercardLogo width={40} />}
            </div>
          </div>

          {/* Frozen Overlay */}
          {isFrozen && (
            <div className="absolute inset-0 bg-gray-400/80 flex items-center justify-center backdrop-blur-sm rounded-xl">
              <span className="text-white font-bold text-lg">❄️ CARD FROZEN</span>
            </div>
          )}
        </div>

        {/* Back Face */}
        <div
          className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)]"
          style={{ background: `linear-gradient(135deg, ${COLORS.TEAL_DARK} 0%, #004D40 100%)` }}
        >
          <div className="absolute inset-0 flex flex-col">
            {/* Magnetic Stripe */}
            <div
              className="w-full h-12 mt-6"
              style={{ background: `linear-gradient(90deg, #1A3A30 0%, #0A2A22 100%)` }}
            />

            {/* Signature Strip and CVV */}
            <div className="mt-4 mx-4 flex items-center gap-2">
              <div
                className="flex-1 h-10 rounded"
                style={{ backgroundColor: 'rgba(255,255,255,0.70)' }}
              />
              <div className="bg-white rounded px-3 py-2">
                <p className="text-[8px] uppercase tracking-[1px] text-gray-500 mb-0.5">CVV</p>
                <p className="text-sm font-mono font-bold" style={{ color: COLORS.TEAL_DARK }}>
                  {revealedData?.cvv || '•••'}
                </p>
              </div>
            </div>

            {/* NFC Symbol on back */}
            <div className="mt-auto mx-4 mb-4">
              <NFCSymbol size={24} color="rgba(255,255,255,0.4)" />
            </div>

            {/* Compliance Text */}
            <div className="bg-black/20 px-4 py-2">
              <p className="text-[6px] text-white/60 leading-relaxed">
                This card is issued by Groway (Pty) Ltd pursuant to a license from Visa U.S.A. Inc.
                and may be used everywhere Visa debit cards are accepted. ©2025 Groway. All rights reserved.
                For customer service, call 0800 123 4567.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={(e) => {
            e.stopPropagation()
            reveal()
          }}
          disabled={isLoading}
          className="flex-1 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : isRevealed ? 'Hide Details' : 'Reveal Details'}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleFreeze()
          }}
          className="flex-1 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:scale-95 transition-all"
        >
          {isFrozen ? 'Unfreeze Card' : 'Freeze Card'}
        </button>
      </div>

      {/* Tap to flip hint */}
      <p className="text-center text-[10px] text-gray-400 mt-2">
        Tap card to flip and see CVV
      </p>
    </div>
  )
}

export default WalletCard
