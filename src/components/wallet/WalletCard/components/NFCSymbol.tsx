'use client'

import React from 'react'

// NFC Symbol Component - Contactless payment indicator
export const NFCSymbol: React.FC<{ size?: number; color?: string }> = ({ 
  size = 20, 
  color = '#FFFFFF' 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* NFC waves */}
      <path 
        d="M8.5 14.5A5 5 0 0 1 7 11a5 5 0 0 1 1.5-3.5" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
        opacity="0.6"
      />
      <path 
        d="M11.5 17A8.5 8.5 0 0 1 5 11a8.5 8.5 0 0 1 6.5-6" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
        opacity="0.8"
      />
      <path 
        d="M14.5 19.5A11.5 11.5 0 0 1 2 11 11.5 11.5 0 0 1 14.5 2.5" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      
      {/* Center dot */}
      <circle cx="18" cy="18" r="2" fill={color} opacity="0.8" />
    </svg>
  )
}

export default NFCSymbol
