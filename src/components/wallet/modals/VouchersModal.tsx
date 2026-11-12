'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Check,
  Loader2,
  Gift,
  Gamepad2,
  Ticket,
  ShoppingBag,
  Music,
  ChevronRight,
  Trophy,
  Dice5
} from 'lucide-react'

interface VouchersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'categories' | 'products' | 'details' | 'success'

interface VoucherCategory {
  id: string
  name: string
  icon: typeof Gift
  color: string
  bg: string
}

const categories: VoucherCategory[] = [
  { id: 'sports-betting', name: 'Sports Betting', icon: Trophy, color: '#FF9800', bg: '#FFF3E0' },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2, color: '#9C27B0', bg: '#F3E5F5' },
  { id: 'retail', name: 'Retail', icon: ShoppingBag, color: '#00897B', bg: '#E0F2F1' },
  { id: 'entertainment', name: 'Entertainment', icon: Music, color: '#E91E63', bg: '#FCE4EC' },
]

const voucherProducts: Record<string, Array<{ id: string; name: string; values: number[]; logo?: string; description?: string }>> = {
  'sports-betting': [
    { id: 'betway', name: 'Betway', values: [25, 50, 100, 200, 500, 1000], logo: 'BW', description: 'Sports betting voucher' },
    { id: 'hollywoodbets', name: 'Hollywoodbets', values: [25, 50, 100, 200, 500, 1000], logo: 'HB', description: 'Sports betting voucher' },
    { id: 'supabets', name: 'Supabets', values: [25, 50, 100, 200, 500], logo: 'SB', description: 'Sports betting voucher' },
    { id: 'sunbet', name: 'SunBet', values: [50, 100, 200, 500], logo: 'SU', description: 'Sports betting voucher' },
    { id: 'wsb', name: 'World Sports Betting', values: [25, 50, 100, 200, 500], logo: 'WSB', description: 'Sports betting voucher' },
  ],
  'gaming': [
    { id: 'playstation', name: 'PlayStation Store', values: [50, 100, 200, 500] },
    { id: 'xbox', name: 'Xbox Gift Card', values: [50, 100, 200, 500] },
    { id: 'steam', name: 'Steam Wallet', values: [50, 100, 200, 500] },
    { id: 'nintendo', name: 'Nintendo eShop', values: [50, 100, 200] },
    { id: 'google-play', name: 'Google Play', values: [25, 50, 100, 200] },
  ],
  'retail': [
    { id: 'takealot', name: 'Takealot', values: [50, 100, 200, 500] },
    { id: 'checkers', name: 'Checkers Gift Card', values: [50, 100, 200, 500] },
    { id: 'woolworths', name: 'Woolworths', values: [50, 100, 200, 500] },
    { id: 'game', name: 'Game Store', values: [50, 100, 200, 500] },
  ],
  'entertainment': [
    { id: 'netflix', name: 'Netflix', values: [99, 139, 199] },
    { id: 'spotify', name: 'Spotify', values: [59, 99] },
    { id: 'showmax', name: 'Showmax', values: [99, 199, 399] },
    { id: 'youtube', name: 'YouTube Premium', values: [79, 119] },
  ],
}

interface VoucherProduct {
  id: string
  name: string
  values: number[]
  logo?: string
  description?: string
}

export function VouchersModal({ open, onOpenChange }: VouchersModalProps) {
  const [step, setStep] = useState<Step>('categories')
  const [selectedCategory, setSelectedCategory] = useState<VoucherCategory | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<VoucherProduct | null>(null)
  const [amount, setAmount] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')

  const handleBuy = useCallback(async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setVoucherCode(`${selectedProduct?.name.substring(0, 3).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`)
    setStep('success')
    setIsLoading(false)
  }, [selectedProduct])

  const handleClose = useCallback(() => {
    setStep('categories')
    setSelectedCategory(null)
    setSelectedProduct(null)
    setAmount(0)
    setVoucherCode('')
    onOpenChange(false)
  }, [onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Vouchers</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'categories' && (
            <div className="space-y-4">
              <p className="text-sm text-[#757575]">Choose voucher category</p>

              <div className="grid grid-cols-2 gap-3">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category)
                        setStep('products')
                      }}
                      className="p-4 rounded-xl border border-gray-200 hover:border-[#00897B] transition-all text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mb-2"
                        style={{ backgroundColor: category.bg }}
                      >
                        <Icon className="h-5 w-5" style={{ color: category.color }} />
                      </div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{category.name}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {step === 'products' && selectedCategory && (
            <div className="space-y-4">
              <button onClick={() => setStep('categories')} className="text-sm text-[#00897B]">
                ← Back to categories
              </button>

              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: selectedCategory.bg }}
                >
                  <selectedCategory.icon className="h-4 w-4" style={{ color: selectedCategory.color }} />
                </div>
                <span className="text-sm font-bold text-[#1A1A1A]">{selectedCategory.name} Vouchers</span>
              </div>

              {/* Sports Betting Warning */}
              {selectedCategory.id === 'sports-betting' && (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                  <div className="flex items-center gap-2">
                    <Dice5 className="h-4 w-4 text-amber-600" />
                    <p className="text-xs text-amber-700">
                      18+ Only. Please gamble responsibly.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {(voucherProducts[selectedCategory.id] || []).map((product) => (
                  <button
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product)
                      setAmount(product.values[0])
                      setStep('details')
                    }}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {product.logo && (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{product.logo}</span>
                        </div>
                      )}
                      <div className="text-left">
                        <p className="text-sm font-medium text-[#1A1A1A]">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-[#757575]">{product.description}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && selectedProduct && (
            <div className="space-y-4">
              <button onClick={() => setStep('products')} className="text-sm text-[#00897B]">
                ← Back
              </button>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-lg font-bold text-[#1A1A1A]">{selectedProduct.name}</p>
                <p className="text-sm text-[#757575]">Select voucher value</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {selectedProduct.values.map((value) => (
                  <button
                    key={value}
                    onClick={() => setAmount(value)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${
                      amount === value
                        ? 'bg-[#00897B] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    R{value}
                  </button>
                ))}
              </div>

              <div className="bg-[#E0F2F1] rounded-xl p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Voucher Value</span>
                  <span className="text-lg font-bold text-[#00897B]">R {amount}</span>
                </div>
              </div>

              <Button
                onClick={handleBuy}
                disabled={isLoading}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Buy Voucher'}
              </Button>
            </div>
          )}

          {step === 'success' && selectedProduct && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-[#4CAF50]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Voucher Purchased!</h3>
              <p className="text-sm text-[#757575] mb-4">
                {selectedProduct.name} - R{amount}
              </p>

              <div className="bg-[#E0F2F1] rounded-xl p-4 mb-4">
                <p className="text-xs text-[#757575] mb-1">Your Voucher Code</p>
                <p className="text-lg font-mono font-bold text-[#00897B]">{voucherCode}</p>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(voucherCode)
                }}
                className="w-full mb-2"
              >
                Copy Code
              </Button>

              <Button onClick={handleClose} className="w-full bg-[#00897B] hover:bg-[#00695C]">
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
