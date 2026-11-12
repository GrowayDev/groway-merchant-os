/**
 * Inventory Utilities
 * 
 * Common utility functions for inventory management
 */

/**
 * Format currency in South African Rand
 */
export function formatZAR(cents: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Format currency from decimal
 */
export function formatCurrency(value: number, currency = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Format quantity with unit
 */
export function formatQuantity(quantity: number, unit: string): string {
  const formattedQty = quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2);
  return `${formattedQty} ${unit}`;
}

/**
 * Calculate days between dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date2.getTime() - date1.getTime()) / oneDay));
}

/**
 * Calculate days until date
 */
export function daysUntil(targetDate: Date): number {
  return daysBetween(new Date(), targetDate);
}

/**
 * Check if date is expired
 */
export function isExpired(expiryDate: Date | null): boolean {
  if (!expiryDate) return false;
  return expiryDate < new Date();
}

/**
 * Check if date is expiring within days
 */
export function isExpiringWithin(expiryDate: Date | null, days: number): boolean {
  if (!expiryDate) return false;
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + days);
  return expiryDate <= threshold && expiryDate >= new Date();
}

/**
 * Get expiry status
 */
export type ExpiryStatus = 'no_expiry' | 'ok' | 'warning' | 'critical' | 'expired';

export function getExpiryStatus(expiryDate: Date | null): ExpiryStatus {
  if (!expiryDate) return 'no_expiry';
  
  const days = daysUntil(expiryDate);
  
  if (days <= 0) return 'expired';
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  return 'ok';
}

/**
 * Get stock status
 */
export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export function getStockStatus(
  currentStock: number,
  lowStockThreshold: number
): StockStatus {
  if (currentStock <= 0) return 'out_of_stock';
  if (currentStock <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

/**
 * Calculate margin percentage
 */
export function calculateMargin(costPrice: number, sellingPrice: number): number {
  if (sellingPrice === 0) return 0;
  return ((sellingPrice - costPrice) / sellingPrice) * 100;
}

/**
 * Calculate markup percentage
 */
export function calculateMarkup(costPrice: number, sellingPrice: number): number {
  if (costPrice === 0) return 0;
  return ((sellingPrice - costPrice) / costPrice) * 100;
}

/**
 * Calculate selling price from margin
 */
export function calculateSellingPriceFromMargin(costPrice: number, marginPercent: number): number {
  return costPrice / (1 - marginPercent / 100);
}

/**
 * Calculate selling price from markup
 */
export function calculateSellingPriceFromMarkup(costPrice: number, markupPercent: number): number {
  return costPrice * (1 + markupPercent / 100);
}

/**
 * Generate SKU
 */
export function generateSKU(prefix: string = 'SKU'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate batch number
 */
export function generateBatchNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `B${year}${month}${day}-${random}`;
}

/**
 * Generate GRN number
 */
export function generateGRNNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `GRN-${year}${month}${day}-${random}`;
}

/**
 * Generate transfer code
 */
export function generateTransferCode(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TR-${year}${month}-${random}`;
}

/**
 * Generate stocktake session number
 */
export function generateStocktakeNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ST-${year}${month}-${random}`;
}

/**
 * Generate idempotency key
 */
export function generateIdempotencyKey(prefix: string = 'op'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
}

/**
 * Round to decimal places
 */
export function roundTo(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate VAT amount
 */
export function calculateVAT(amount: number, vatRate: number = 15): number {
  return amount * (vatRate / 100);
}

/**
 * Calculate amount including VAT
 */
export function calculateWithVAT(amount: number, vatRate: number = 15): number {
  return amount * (1 + vatRate / 100);
}

/**
 * Calculate amount excluding VAT
 */
export function calculateExcludingVAT(amountWithVAT: number, vatRate: number = 15): number {
  return amountWithVAT / (1 + vatRate / 100);
}

/**
 * Inventory movement types
 */
export const MOVEMENT_TYPES = {
  purchase: { label: 'Purchase', direction: 'in', icon: 'Package' },
  sale: { label: 'Sale', direction: 'out', icon: 'ShoppingCart' },
  return: { label: 'Return', direction: 'in', icon: 'RotateCcw' },
  adjustment: { label: 'Adjustment', direction: 'both', icon: 'Settings' },
  transfer_in: { label: 'Transfer In', direction: 'in', icon: 'ArrowDown' },
  transfer_out: { label: 'Transfer Out', direction: 'out', icon: 'ArrowUp' },
  grn: { label: 'Goods Received', direction: 'in', icon: 'PackageCheck' },
  stocktake: { label: 'Stocktake', direction: 'both', icon: 'ClipboardCheck' },
  waste: { label: 'Waste', direction: 'out', icon: 'Trash2' },
  recipe: { label: 'Recipe', direction: 'out', icon: 'ChefHat' },
} as const;

export type MovementType = keyof typeof MOVEMENT_TYPES;

/**
 * Get movement type info
 */
export function getMovementTypeInfo(type: MovementType) {
  return MOVEMENT_TYPES[type] || { label: type, direction: 'both', icon: 'Package' };
}

/**
 * Validate stock quantity
 */
export function validateQuantity(
  quantity: number,
  currentStock: number,
  allowNegative: boolean = false
): { valid: boolean; error?: string } {
  if (quantity < 0) {
    return { valid: false, error: 'Quantity cannot be negative' };
  }

  if (quantity === 0) {
    return { valid: false, error: 'Quantity cannot be zero' };
  }

  if (!allowNegative && quantity > currentStock) {
    return { valid: false, error: `Insufficient stock. Available: ${currentStock}` };
  }

  return { valid: true };
}
