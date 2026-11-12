'use client'

import React from 'react'

type CardTier = 'blue' | 'silver' | 'gold' | 'platinum'
type FormFactor = 'virtual' | 'physical'

// Tier Badge Component - Shows card tier and form factor
export const TierBadge: React.FC<{ 
  tier: CardTier
  formFactor?: FormFactor
  className?: string
}> = ({ 
  tier, 
  formFactor,
  className = ''
}) => {
  const tierConfig = {
    blue: { label: 'Blue', bg: 'rgba(13, 79, 66, 0.8)', color: '#fff' },
    silver: { label: 'Silver', bg: 'rgba(160, 160, 160, 0.8)', color: '#fff' },
    gold: { label: 'Gold', bg: 'rgba(218, 165, 32, 0.9)', color: '#fff' },
    platinum: { label: 'Platinum', bg: 'rgba(120, 120, 140, 0.9)', color: '#fff' },
  }

  const config = tierConfig[tier]
  const label = formFactor ? `${config.label} ${formFactor === 'virtual' ? 'Virtual' : 'Physical'}` : config.label

  return (
    <span 
      className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${className}`}
      style={{ 
        backgroundColor: config.bg, 
        color: config.color 
      }}
    >
      {label}
    </span>
  )
}

export default TierBadge
