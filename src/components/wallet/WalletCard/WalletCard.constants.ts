// WalletCard Constants

import type { TierConfig } from './WalletCard.types'

export const COLORS = {
  TEAL_PRIMARY: '#0D9488',
  GREEN_PRIMARY: '#22C55E',
  MAG_STRIPE_L: '#1A1A2E',
  MAG_STRIPE_R: '#2D2D44',
  SIG_STRIP_BG: '#F5F5F0',
}

export const ANIMATION = {
  flipDuration: 600,
  revealTimeout: 30000, // 30 seconds for PCI DSS compliance
}

export const TIER_CONFIGS: Record<string, TierConfig> = {
  blue: {
    gradient: 'linear-gradient(135deg, #0D4F42 0%, #1A7D64 50%, #0A3D30 100%)',
    shadowColor: 'rgba(10, 61, 48, 0.4)',
    shimmerColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textColor: '#FFFFFF',
  },
  silver: {
    gradient: 'linear-gradient(135deg, #2C3E50 0%, #4A6572 50%, #1A252F 100%)',
    shadowColor: 'rgba(44, 62, 80, 0.4)',
    shimmerColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    textColor: '#FFFFFF',
  },
  gold: {
    gradient: 'linear-gradient(135deg, #8B6914 0%, #D4A810 50%, #705812 100%)',
    shadowColor: 'rgba(139, 105, 20, 0.4)',
    shimmerColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 215, 0, 0.3)',
    textColor: '#FFFFFF',
  },
  platinum: {
    gradient: 'linear-gradient(135deg, #1A1A2E 0%, #3D3D5C 50%, #0F0F1A 100%)',
    shadowColor: 'rgba(26, 26, 46, 0.5)',
    shimmerColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    textColor: '#FFFFFF',
  },
}

export const SAMPLE_CARDS = [
  {
    cardId: 'GW-DEMO-001',
    cardholderName: 'THABISO MOLEFE',
    maskedNumber: '**** **** **** 4582',
    expiryMonth: 12,
    expiryYear: 2028,
    expiryDisplay: '12/28',
    tier: 'gold' as const,
    status: 'active' as const,
    formFactor: 'virtual' as const,
    network: 'visa' as const,
    nfcEnabled: true,
  },
  {
    cardId: 'GW-DEMO-002',
    cardholderName: 'JOHN SMITH',
    maskedNumber: '**** **** **** 7891',
    expiryMonth: 6,
    expiryYear: 2027,
    expiryDisplay: '06/27',
    tier: 'platinum' as const,
    status: 'active' as const,
    formFactor: 'physical' as const,
    network: 'mastercard' as const,
    nfcEnabled: true,
  },
]
