'use client'

import React from 'react'

type NetworkType = 'visa' | 'mastercard'

// Network Logo Component - Visa/Mastercard logos
export const NetworkLogo: React.FC<{ 
  network: NetworkType
  size?: number 
}> = ({ 
  network, 
  size = 42 
}) => {
  if (network === 'visa') {
    return (
      <svg width={size} height={size * 0.65} viewBox="0 0 48 31" fill="none">
        <rect width="48" height="31" rx="3" fill="#1A1F71" />
        <path 
          d="M19.5 21h-3l1.9-11.5h3L19.5 21zm-5.3-11.5l-2.9 7.9-.3-1.6-1-5.1s-.1-.8-1-.8H5.1l-.1.3c1.1.3 2.3.7 3 1.2l2.5 9.6h3.2l4.9-11.5h-3.4zm20.3 7.5l1.6-4.4.9 4.4h-2.5zm3.6 4h2.9l-2.5-11.5h-2.7c-.6 0-1.1.4-1.3.9l-4.7 10.6h3.2l.6-1.8h4l.5 1.8zm-7.4-3.8c0 2.5-2.3 4.1-5.7 4.1-1.5 0-3-.3-3.7-.6l.6-2.7.2.1c1 .4 1.6.6 2.8.6 1.3 0 2-.5 2-1.2 0-.7-.6-1-2.1-1.7-1.5-.6-3.4-1.7-3.4-3.8 0-2.3 2.1-4 5.3-4 1.3 0 2.4.3 3.1.6l-.6 2.6-.1-.1c-.7-.3-1.6-.6-2.6-.6-1.1 0-1.7.5-1.7 1 0 .6.7 1 2 1.6 2 .9 3 2.1 3 3.7v.4z" 
          fill="#fff"
        />
      </svg>
    )
  }

  // Mastercard
  return (
    <svg width={size} height={size * 0.65} viewBox="0 0 48 31" fill="none">
      <rect width="48" height="31" rx="3" fill="#000" />
      <circle cx="18" cy="15.5" r="9" fill="#EB001B" />
      <circle cx="30" cy="15.5" r="9" fill="#F79E1B" />
      <path 
        d="M24 8.5a9 9 0 0 0 0 14 9 9 0 0 0 0-14z" 
        fill="#FF5F00"
      />
    </svg>
  )
}

export default NetworkLogo
