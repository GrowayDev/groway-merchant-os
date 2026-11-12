// GroSupply Cart System
// Shared cart state for Marketplace → Merchant OS integration

export interface CartItem {
  id: string
  productId: string
  sku: string
  description: string
  brand?: string
  packSize: string
  quantity: number
  unitPrice: number
  costPrice: number
  retailPrice: number
  margin: number
  supplierId?: string
  supplierName?: string
  wholesalerId?: string
  wholesalerName?: string
  leadDays: number
  minOrderQty: number
  inStock: boolean
  vertical?: string
  category?: string
  notes?: string
}

export interface CartSupplier {
  id: string
  name: string
  code: string
  tier: string
  items: CartItem[]
  subtotal: number
  deliveryDays: number
  minOrderValue: number
}

export interface Cart {
  id: string
  merchantId: string
  items: CartItem[]
  suppliers: CartSupplier[]
  subtotal: number
  vat: number
  total: number
  itemCount: number
  createdAt: Date
  updatedAt: Date
}

export interface RFQItem {
  sku: string
  description: string
  quantity: number
  unit?: string
  notes?: string
}

export interface RFQRequest {
  supplierIds: string[]
  items: RFQItem[]
  requiredBy?: string
  deliveryAddress?: string
  notes?: string
}

// Cart calculation utilities
export function calculateItemTotal(item: CartItem): number {
  return item.quantity * item.unitPrice
}

export function calculateCartTotals(items: CartItem[]): { subtotal: number; vat: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0)
  const vat = subtotal * 0.15 // 15% VAT
  const total = subtotal + vat
  return { subtotal, vat, total }
}

export function groupBySupplier(items: CartItem[]): Map<string, CartItem[]> {
  const grouped = new Map<string, CartItem[]>()
  
  for (const item of items) {
    const supplierKey = item.supplierId || item.wholesalerId || 'unknown'
    if (!grouped.has(supplierKey)) {
      grouped.set(supplierKey, [])
    }
    grouped.get(supplierKey)!.push(item)
  }
  
  return grouped
}

// Local storage key for cart persistence
const CART_STORAGE_KEY = 'grosupply_cart'
const CART_EXPIRY_HOURS = 24

export function saveCartToStorage(cart: Cart): void {
  try {
    const data = {
      ...cart,
      savedAt: Date.now()
    }
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save cart to storage:', e)
  }
}

export function loadCartFromStorage(): Cart | null {
  try {
    const data = localStorage.getItem(CART_STORAGE_KEY)
    if (!data) return null
    
    const cart = JSON.parse(data)
    
    // Check if cart has expired
    const savedAt = cart.savedAt || 0
    const expiryMs = CART_EXPIRY_HOURS * 60 * 60 * 1000
    if (Date.now() - savedAt > expiryMs) {
      localStorage.removeItem(CART_STORAGE_KEY)
      return null
    }
    
    return cart
  } catch (e) {
    console.error('Failed to load cart from storage:', e)
    return null
  }
}

export function clearCartFromStorage(): void {
  try {
    localStorage.removeItem(CART_STORAGE_KEY)
  } catch (e) {
    console.error('Failed to clear cart from storage:', e)
  }
}

// Generate unique IDs
export function generateCartId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function generateCartItemId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
