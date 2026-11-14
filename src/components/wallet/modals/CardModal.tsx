'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  CreditCard, Snowflake, Eye, EyeOff, Plus, Shield, TrendingUp,
  Apple, Smartphone, Wifi, CheckCircle2, Lock, ChevronRight, Sparkles,
} from 'lucide-react'
import { apiGet, apiPost, apiPut, formatMoney } from '@/components/wallet/lib/api'
import {
  CARD_TIERS, TIER_ORDER, getTierForPoints, getNextTier, getTierProgress,
  CardTier,
} from '@/lib/consumer-wallet/card-tiers'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CardModal({ open, onOpenChange }: Props) {
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<any[]>([])
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  const [currentTier, setCurrentTier] = useState<CardTier>('standard')
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [applePayAdded, setApplePayAdded] = useState(false)
  const [googlePayAdded, setGooglePayAdded] = useState(false)
  const [issuing, setIssuing] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiGet('/cards')
      const data = res?.data || res
      setCards(data?.cards || [])
      setLoyaltyPoints(data?.loyaltyPoints || 0)
      setCurrentTier(data?.currentTier || 'standard')
      if (data?.cards?.length > 0) setSelectedCard(data.cards[0])
    } catch {
      // Fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (open) load() }, [open])

  const tierConfig = CARD_TIERS[currentTier]
  const nextTier = getNextTier(currentTier)
  const tierProgress = getTierProgress(loyaltyPoints, currentTier)

  const issueCard = async () => {
    setIssuing(true)
    try {
      const res = await apiPost('/cards', {})
      const data = res?.data || res
      await load()
      if (data) setSelectedCard(data)
    } catch {} finally { setIssuing(false) }
  }

  const toggleFreeze = async (cardId: string) => {
    try { await apiPut('/cards', { cardId, action: 'freeze' }); await load() } catch {}
  }

  const toggleSetting = async (cardId: string, setting: string, value: boolean) => {
    try { await apiPut('/cards', { cardId, action: 'updateSettings', [setting]: value }); await load() } catch {}
  }

  const addToApplePay = async () => {
    setApplePayAdded(true)
    // In production: call Apple Pay provisioning API
  }

  const addToGooglePay = async () => {
    setGooglePayAdded(true)
    // In production: call Google Pay tokenization API
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#00897B]" /> Groway Card
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-12 text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00897B] mx-auto" /></div>
        ) : (
          <div className="space-y-4">
            {/* Tier Status */}
            <Card className={`bg-gradient-to-br ${tierConfig.gradient} border-0`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{tierConfig.icon}</span>
                    <div>
                      <p className="text-white font-bold">{tierConfig.label} Tier</p>
                      <p className="text-white/70 text-xs">{tierConfig.network === 'visa' ? 'Visa' : 'Mastercard'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">{loyaltyPoints.toLocaleString()}</p>
                    <p className="text-white/70 text-[10px]">points</p>
                  </div>
                </div>
                {/* Progress to next tier */}
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

            {/* Card Visualization */}
            {selectedCard ? (
              <div className={`relative w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br ${CARD_TIERS[selectedCard.cardType as CardTier]?.gradient || tierConfig.gradient} p-5 shadow-xl overflow-hidden`}>
                {/* Chip */}
                <div className="absolute top-5 right-5">
                  <div className="w-10 h-7 rounded bg-gradient-to-br from-yellow-200 to-yellow-400 flex items-center justify-center">
                    <div className="w-8 h-5 border border-yellow-600/30 rounded-sm grid grid-cols-3 gap-px p-px">
                      {[...Array(6)].map((_, i) => <div key={i} className="bg-yellow-600/20 rounded-sm" />)}
                    </div>
                  </div>
                </div>
                {/* Contactless icon */}
                <div className="absolute top-7 right-20">
                  <Wifi className="h-4 w-4 text-white/60 rotate-90" />
                </div>
                {/* Groway logo */}
                <div className="absolute top-5 left-5">
                  <p className="text-white font-bold text-sm">Groway</p>
                </div>
                {/* Card number */}
                <div className="absolute bottom-16 left-5 right-5">
                  <p className="text-white font-mono text-sm tracking-wider">
                    {showDetails ? selectedCard.panEncrypted?.replace(/(.{4})/g, '$1 ').trim() : `•••• •••• •••• ${selectedCard.lastFourDigits}`}
                  </p>
                </div>
                {/* Bottom row */}
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
                  <div>
                    <p className="text-white/50 text-[8px] uppercase">Cardholder</p>
                    <p className="text-white text-xs font-medium">{selectedCard.cardholderName || 'GROWAY USER'}</p>
                  </div>
                  <div>
                    <p className="text-white/50 text-[8px] uppercase">Expires</p>
                    <p className="text-white text-xs font-medium">{selectedCard.expiryMonth}/{selectedCard.expiryYear}</p>
                  </div>
                  <div>
                    {CARD_TIERS[selectedCard.cardType as CardTier]?.network === 'visa' ? (
                      <p className="text-white font-bold italic text-lg tracking-tight">VISA</p>
                    ) : (
                      <div className="flex items-center">
                        <div className="w-6 h-6 rounded-full bg-red-500 opacity-90" />
                        <div className="w-6 h-6 rounded-full bg-yellow-400 opacity-90 -ml-2" />
                      </div>
                    )}
                  </div>
                </div>
                {/* Tier badge */}
                <div className="absolute top-14 left-5">
                  <Badge className="bg-white/20 text-white border-0 text-[9px]">
                    {CARD_TIERS[selectedCard.cardType as CardTier]?.icon} {CARD_TIERS[selectedCard.cardType as CardTier]?.label}
                  </Badge>
                </div>
              </div>
            ) : (
              <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="p-8 text-center">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 mb-3">No active card</p>
                  <Button className="bg-[#00897B] hover:bg-[#00897B]/90" onClick={issueCard} disabled={issuing}>
                    <Plus className="h-4 w-4 mr-1" /> {issuing ? 'Issuing...' : 'Issue Card'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Card Actions */}
            {selectedCard && (
              <>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowDetails(!showDetails)}>
                    {showDetails ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                    {showDetails ? 'Hide' : 'Show'} Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => toggleFreeze(selectedCard.id)}>
                    <Snowflake className="h-4 w-4 mr-1" /> {selectedCard.status === 'frozen' ? 'Unfreeze' : 'Freeze'}
                  </Button>
                </div>

                {/* Digital Wallet */}
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold mb-3">Digital Wallet</p>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={addToApplePay}
                        disabled={applePayAdded}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${applePayAdded ? 'border-[#00897B] bg-[#00897B]/5' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <Apple className="h-6 w-6 mb-1" />
                        <span className="text-xs font-medium">{applePayAdded ? '✓ Added' : 'Apple Pay'}</span>
                      </button>
                      <button
                        onClick={addToGooglePay}
                        disabled={googlePayAdded}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${googlePayAdded ? 'border-[#00897B] bg-[#00897B]/5' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <Smartphone className="h-6 w-6 mb-1" />
                        <span className="text-xs font-medium">{googlePayAdded ? '✓ Added' : 'Google Pay'}</span>
                      </button>
                    </div>
                    {applePayAdded && googlePayAdded && (
                      <p className="text-[10px] text-[#00897B] mt-2 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Card added to both wallets — use anywhere Apple Pay or Google Pay is accepted.
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
                      <Switch checked={selectedCard.onlineEnabled} onCheckedChange={(v) => toggleSetting(selectedCard.id, 'onlineEnabled', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm flex items-center gap-2"><Wifi className="h-4 w-4 text-gray-400" /> Contactless (NFC)</Label>
                      <Switch checked={selectedCard.contactlessEnabled} onCheckedChange={(v) => toggleSetting(selectedCard.id, 'contactlessEnabled', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm flex items-center gap-2"><Lock className="h-4 w-4 text-gray-400" /> ATM withdrawals</Label>
                      <Switch checked={selectedCard.atmEnabled} onCheckedChange={(v) => toggleSetting(selectedCard.id, 'atmEnabled', v)} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-gray-400" /> International</Label>
                      <Switch checked={selectedCard.internationalEnabled} onCheckedChange={(v) => toggleSetting(selectedCard.id, 'internationalEnabled', v)} />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Tier Benefits */}
            <Card>
              <CardContent className="p-4">
                <p className="text-sm font-semibold mb-3">{tierConfig.label} Tier Benefits</p>
                <div className="space-y-1.5">
                  {tierConfig.benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                      <CheckCircle2 className="h-3 w-3 text-[#00897B] flex-shrink-0" /> {b}
                    </div>
                  ))}
                </div>
                {/* All tiers overview */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-2">All Tiers</p>
                  <div className="flex gap-1">
                    {TIER_ORDER.map((t) => (
                      <div key={t} className={`flex-1 rounded-lg p-2 text-center ${t === currentTier ? `bg-gradient-to-br ${CARD_TIERS[t].gradient}` : 'bg-gray-100'}`}>
                        <p className="text-[10px]">{CARD_TIERS[t].icon}</p>
                        <p className={`text-[9px] font-medium ${t === currentTier ? 'text-white' : 'text-gray-500'}`}>{CARD_TIERS[t].label}</p>
                        <p className={`text-[8px] ${t === currentTier ? 'text-white/70' : 'text-gray-400'}`}>{CARD_TIERS[t].minPoints >= 1000 ? `${CARD_TIERS[t].minPoints / 1000}k` : CARD_TIERS[t].minPoints} pts</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Issue new card button */}
            {selectedCard && (
              <Button variant="outline" className="w-full" onClick={issueCard} disabled={issuing}>
                <Plus className="h-4 w-4 mr-1" /> {issuing ? 'Issuing...' : 'Issue Additional Card'}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
