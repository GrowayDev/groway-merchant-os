'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { EMVChip } from './components/EMVChip'
import { NFCSymbol } from './components/NFCSymbol'
import { NetworkLogo } from './components/NetworkLogo'
import { TierBadge } from './components/TierBadge'
import { TIER_CONFIGS, COLORS, ANIMATION } from './WalletCard.constants'
import type { CardData } from './WalletCard.types'

interface WalletCardProps {
  card: CardData
  size?: 'full' | 'mini'
  showBack?: boolean
  onFreeze?: (cardId: string) => void
  onRevealDetails?: (cardId: string) => Promise<{ fullNumber: string; cvv: string }>
  onCardPress?: (cardId: string) => void
}

export const WalletCard: React.FC<WalletCardProps> = ({
  card,
  size = 'full',
  showBack: controlledShowBack,
  onFreeze,
  onRevealDetails,
  onCardPress,
}) => {
  const [isFlipped, setIsFlipped] = useState(controlledShowBack || false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [revealedData, setRevealedData] = useState<{ fullNumber: string; cvv: string } | null>(null)
  const [revealTimer, setRevealTimer] = useState<NodeJS.Timeout | null>(null)
  const [countdown, setCountdown] = useState(30)
  
  const config = TIER_CONFIGS[card.tier]
  const isMini = size === 'mini'
  
  const haptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      navigator.vibrate(type === 'light' ? 10 : type === 'medium' ? 25 : 50)
    }
  }, [])
  
  const handleFlip = useCallback(() => {
    if (isMini) return
    setIsFlipped(prev => !prev)
    haptic('light')
  }, [isMini, haptic])
  
  const handleReveal = useCallback(async () => {
    if (isRevealed) {
      setIsRevealed(false)
      setRevealedData(null)
      if (revealTimer) {
        clearTimeout(revealTimer)
        setRevealTimer(null)
      }
      setCountdown(30)
      return
    }
    
    if (card.fullNumber && card.cvv) {
      setRevealedData({ fullNumber: card.fullNumber, cvv: card.cvv })
      setIsRevealed(true)
      setCountdown(30)
      
      const timer = setTimeout(() => {
        setIsRevealed(false)
        setRevealedData(null)
        setCountdown(30)
      }, ANIMATION.revealTimeout)
      setRevealTimer(timer)
    }
    
    haptic('medium')
  }, [isRevealed, card.fullNumber, card.cvv, revealTimer, haptic])
  
  useEffect(() => {
    if (isRevealed && countdown > 0) {
      const interval = setInterval(() => {
        setCountdown(prev => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isRevealed, countdown])
  
  useEffect(() => {
    return () => {
      if (revealTimer) {
        clearTimeout(revealTimer)
      }
    }
  }, [revealTimer])
  
  const handlePress = useCallback(() => {
    if (onCardPress) {
      onCardPress(card.cardId)
    }
  }, [onCardPress, card.cardId])
  
  const handleCopyNumber = useCallback(() => {
    const numberToCopy = isRevealed && revealedData?.fullNumber 
      ? revealedData.fullNumber.replace(/\s/g, '')
      : card.maskedNumber
    navigator.clipboard.writeText(numberToCopy)
    haptic('light')
  }, [isRevealed, revealedData, card.maskedNumber, haptic])
  
  const displayNumber = isRevealed && revealedData?.fullNumber 
    ? revealedData.fullNumber 
    : card.maskedNumber
  
  const displayCVV = isRevealed && revealedData?.cvv 
    ? revealedData.cvv 
    : '•••'

  const cardStyles: React.CSSProperties = {
    aspectRatio: '1.586',
    background: config.gradient,
    borderRadius: isMini ? 10 : 14,
    boxShadow: `0 ${isMini ? '8px 20px' : '20px 60px'} ${config.shadowColor}`,
    border: `1px solid ${config.borderColor}`,
    perspective: '1000px',
    transformStyle: 'preserve-3d',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
    width: '100%',
    maxWidth: isMini ? '100%' : '380px',
  }

  const innerStyles: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    transition: `transform ${ANIMATION.flipDuration}ms ease-out`,
    transformStyle: 'preserve-3d',
    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
  }

  const faceStyles: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    backfaceVisibility: 'hidden',
    borderRadius: 'inherit',
    overflow: 'hidden',
  }

  if (isMini) {
    return (
      <div 
        className="wallet-card-mini w-full"
        style={{ height: '90px' }}
        onClick={handlePress}
      >
        <div style={cardStyles} className="p-3 flex flex-col justify-between">
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${config.shimmerColor} 50%, transparent 100%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 4s infinite',
            }}
          />
          
          <div className="flex items-start justify-between relative z-10">
            <div>
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
              <TierBadge tier={card.tier} formFactor={card.formFactor} className="ml-2" />
            </div>
            <NetworkLogo network={card.network} size={32} />
          </div>
          
          <div className="flex items-center gap-2 relative z-10">
            <EMVChip width={28} height={22} />
            {card.nfcEnabled && <NFCSymbol size={16} />}
          </div>
          
          <div className="flex items-end justify-between relative z-10">
            <div>
              <p className="font-mono text-[10px] text-white/90 tracking-wide">
                {displayNumber}
              </p>
              <p className="font-mono text-[8px] text-white/70 mt-0.5">
                {card.cardholderName}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[6px] text-white/50">Valid</p>
              <p className="font-mono text-[8px] text-white/80">{card.expiryDisplay}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="wallet-card-full flex flex-col items-center">
      <div 
        className="wallet-card-container"
        style={cardStyles}
        onClick={handleFlip}
      >
        <div style={innerStyles}>
          {/* FRONT FACE */}
          <div style={faceStyles}>
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${config.shimmerColor} 50%, transparent 100%)`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 4s infinite',
              }}
            />
            
            <div className="relative z-10 h-full flex flex-col justify-between p-4 sm:p-5 md:p-7">
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span 
                    className="text-lg sm:text-xl md:text-2xl font-bold"
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      background: `linear-gradient(90deg, ${COLORS.TEAL_PRIMARY}, ${COLORS.GREEN_PRIMARY})`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    groway
                  </span>
                  <span className="text-[8px] uppercase tracking-[2px] text-white/50">
                    Wallet Card
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {card.nfcEnabled && <NFCSymbol size={20} />}
                  <NetworkLogo network={card.network} size={42} />
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <EMVChip width={54} height={42} />
                {isRevealed && (
                  <span className="text-[8px] text-[#4CAF50] bg-[#E8F5E9] px-2 py-0.5 rounded-full">
                    Revealed · {countdown}s
                  </span>
                )}
              </div>
              
              <div>
                <p className="font-mono text-sm sm:text-base md:text-lg tracking-wider text-white mb-2">
                  {displayNumber}
                </p>
                
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-mono text-xs sm:text-sm text-white/80 font-medium">
                      {card.cardholderName}
                    </p>
                    <TierBadge tier={card.tier} formFactor={card.formFactor} className="mt-1" />
                  </div>
                  
                  <div className="text-right">
                    <p className="text-[8px] text-white/50 uppercase">Valid thru</p>
                    <p className="font-mono text-xs sm:text-sm text-white/80">{card.expiryDisplay}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {card.status === 'frozen' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#FFF3E0] text-[#E65100] text-[10px] px-3 py-1 rounded-full font-medium flex items-center gap-1">
                <span>❄️</span> Frozen
              </div>
            )}
          </div>
          
          {/* BACK FACE */}
          <div 
            style={{
              ...faceStyles,
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="relative z-10 h-full flex flex-col p-4">
              <div 
                className="w-full h-10 sm:h-12 md:h-14 rounded-sm mb-4"
                style={{
                  background: `linear-gradient(90deg, ${COLORS.MAG_STRIPE_L}, ${COLORS.MAG_STRIPE_R})`,
                }}
              />
              
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="flex-1 h-10 rounded"
                  style={{ backgroundColor: COLORS.SIG_STRIP_BG }}
                />
                <div className="bg-white rounded px-3 py-2 min-w-[60px]">
                  <p className="text-[8px] text-gray-500 mb-0.5">CVV</p>
                  <p className="font-mono text-sm text-gray-800 text-center font-medium">
                    {displayCVV}
                  </p>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-end">
                <p className="text-[7px] text-white/40 leading-relaxed mb-3">
                  This card is property of Groway (Pty) Ltd. If found, please return to any Groway branch or call 0860 GROWAY. Unauthorized use is prohibited.
                </p>
                
                <div className="flex items-center justify-between text-[8px] text-white/50">
                  <span>Customer Service: 0860 476 929</span>
                  <span>www.groway.co.za</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={(e) => { e.stopPropagation(); handleReveal() }}
                  className="flex-1 bg-white/80 hover:bg-white text-gray-800 text-[10px] py-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  {isRevealed ? `Hide (${countdown}s)` : '👁 Reveal'}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCopyNumber() }}
                  className="flex-1 bg-white/80 hover:bg-white text-gray-800 text-[10px] py-2 rounded-lg flex items-center justify-center gap-1 transition-colors"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
        🔄 Tap to flip card
      </p>
    </div>
  )
}

export default WalletCard

// Re-export sub-components
export { EMVChip } from './components/EMVChip'
export { NFCSymbol } from './components/NFCSymbol'
export { NetworkLogo } from './components/NetworkLogo'
export { TierBadge } from './components/TierBadge'
export { SAMPLE_CARDS } from './WalletCard.constants'
export type { CardData, CardTier, CardNetwork, CardStatus, FormFactor } from './WalletCard.types'
