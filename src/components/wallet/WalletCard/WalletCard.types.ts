// WalletCard Types

export type CardTier = 'blue' | 'silver' | 'gold' | 'platinum'
export type CardNetwork = 'visa' | 'mastercard'
export type CardStatus = 'active' | 'frozen' | 'blocked'
export type FormFactor = 'virtual' | 'physical'

export interface CardData {
  cardId: string
  cardholderName: string
  maskedNumber: string
  fullNumber?: string
  expiryMonth: number
  expiryYear: number
  expiryDisplay: string
  cvv?: string
  tier: CardTier
  status: CardStatus
  formFactor: FormFactor
  network: CardNetwork
  nfcEnabled: boolean
}

export interface TierConfig {
  gradient: string
  shadowColor: string
  shimmerColor: string
  borderColor: string
  textColor: string
}
