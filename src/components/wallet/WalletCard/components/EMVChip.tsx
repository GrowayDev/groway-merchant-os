'use client'

import React from 'react'

// EMV Chip Component - Realistic gold chip design
export const EMVChip: React.FC<{ width?: number; height?: number }> = ({ 
  width = 54, 
  height = 42 
}) => {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 54 42" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Main chip body */}
      <rect x="2" y="2" width="50" height="38" rx="4" fill="url(#emvGradient)" />
      
      {/* Chip lines pattern */}
      <path 
        d="M2 14h50M2 28h50M18 2v38M36 2v38" 
        stroke="#B8860B" 
        strokeWidth="1" 
        opacity="0.5"
      />
      
      {/* Center contact area */}
      <rect x="20" y="14" width="14" height="14" rx="2" fill="#DAA520" opacity="0.8" />
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="emvGradient" x1="0" y1="0" x2="54" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="30%" stopColor="#FFC125" />
          <stop offset="50%" stopColor="#DAA520" />
          <stop offset="70%" stopColor="#B8860B" />
          <stop offset="100%" stopColor="#8B6914" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default EMVChip
