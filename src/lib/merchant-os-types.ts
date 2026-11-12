// Merchant OS TypeScript Interfaces

export interface BusinessVertical {
  id: string;
  name: string;
  icon: string;
  subCount: number;
  description: string;
  subVerticals: SubVertical[];
  compliance: ComplianceRequirement[];
  vatDefault: 'standard' | 'zero_rated' | 'exempt';
  hasBooking: boolean;
  hasInventory: boolean;
}

export interface SubVertical {
  id: string;
  name: string;
  parentId: string;
  description: string;
  posLayout: 'retail' | 'restaurant' | 'service' | 'bar' | 'hybrid';
  features: string[];
  requiresLicense: boolean;
  licenseType?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  subCategory?: string;
  vertical: string;
  subVertical?: string;
  sellingPrice: number; // cents
  costPrice: number; // cents
  stock: number;
  minStock: number;
  maxStock: number;
  unit: 'each' | 'kg' | 'litre' | 'hour' | 'service';
  vatRate: 15 | 0 | 'exempt';
  isService: boolean;
  hasVariants: boolean;
  variants?: ProductVariant[];
  allergens?: string[];
  shelfLifeDays?: number;
  requiresBatchTracking: boolean;
  isComplianceRestricted: boolean;
  posLabel?: string; // Short name for POS display
  imageUrl?: string;
  isAvailable: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string; // e.g., "Small", "Large"
  sku: string;
  priceModifier: number; // Add to base price
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variant?: ProductVariant;
  note?: string;
  discount: number; // percentage
  lineTotal: number;
}

export interface Transaction {
  id: string;
  date: Date;
  items: CartItem[];
  subtotal: number;
  vatAmount: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod[];
  status: 'pending' | 'completed' | 'refunded' | 'partial';
  customer?: Customer;
  cashierId: string;
  receiptNumber: string;
}

export interface PaymentMethod {
  type: 'cash' | 'card' | 'qr' | 'wallet' | 'payshap' | 'voucher';
  amount: number;
  reference?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  loyaltyPoints: number;
  totalSpent: number;
  visitCount: number;
  lastVisit?: Date;
}

export interface VASItem {
  id: string;
  category: 'airtime' | 'data' | 'electricity' | 'water' | 'vouchers' | 'tickets' | 'insurance' | 'municipal';
  provider: string;
  name: string;
  amounts: number[];
  commission: number; // percentage
  icon: string;
  isLive: boolean;
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  description: string;
  regulator: string;
  requiredDocuments: string[];
  restrictions: string[];
  verticals: string[];
}

export interface BookingSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  staffId: string;
  customerId?: string;
  service: Product;
  status: 'available' | 'booked' | 'blocked';
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  hourlyRate: number;
  skills: string[];
  isWorking: boolean;
  currentShift?: 'morning' | 'afternoon' | 'evening';
}

// Application State
export interface AppState {
  selectedVertical: string | null;
  selectedSubVertical: string | null;
  currentScreen: 'selection' | 'dashboard' | 'pos' | 'inventory' | 'bookings' | 'reports' | 'settings';
  cart: CartItem[];
  customer: Customer | null;
  isOnboarding: boolean;
}
