import { 
  Wallet, 
  Store, 
  Truck, 
  CreditCard, 
  Shield, 
  Building2, 
  Smartphone,
  Globe,
  Zap,
  TrendingUp,
  Sparkles,
  Utensils,
  ShoppingBag,
  Scissors,
  Pill,
  Hotel,
  Wrench,
  Wine,
  Shirt,
  Dumbbell,
  Baby,
  CheckCircle2,
  User,
  MessageSquare,
  Building,
  Briefcase,
  Gift,
  UserPlus,
  MessageCircle,
} from 'lucide-react'

// App info interface used by PhoneMockup
export interface AppInfo {
  id: string
  name: string
  tagline: string
  description: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  features: string[]
  users: string
  cta: string
  color: string
  mockupScreens: string[]
}

// Business Verticals - Core Differentiator (Alipay-style minimal icons)
export const businessVerticals = [
  { name: 'Food & Beverage', icon: Utensils, subCount: 8 },
  { name: 'Liquor & Nightlife', icon: Wine, subCount: 6 },
  { name: 'Grocery & FMCG', icon: ShoppingBag, subCount: 7 },
  { name: 'Health & Beauty', icon: Scissors, subCount: 7 },
  { name: 'Fashion & Apparel', icon: Shirt, subCount: 6 },
  { name: 'Health & Pharmacy', icon: Pill, subCount: 6 },
  { name: 'Hospitality', icon: Hotel, subCount: 7 },
  { name: 'Hardware & Building', icon: Wrench, subCount: 6 },
  { name: 'Electronics & Tech', icon: Smartphone, subCount: 4 },
  { name: 'Sport & Leisure', icon: Dumbbell, subCount: 6 },
  { name: 'Childcare & Education', icon: Baby, subCount: 5 },
  { name: 'Professional Services', icon: Building2, subCount: 6 },
]

// Platform Applications - All 9 modules
export const applications: AppInfo[] = [
  {
    id: 'consumer-wallet',
    name: 'Consumer Wallet',
    tagline: 'Your Financial Life, One Tap Away',
    description: 'Pay, send, save, and grow your money with South Africa\'s most powerful mobile wallet.',
    icon: Wallet,
    features: ['QR Payments', 'P2P Transfers', 'Remittance', 'Bill Pay'],
    users: '2.5M+',
    cta: 'Download App',
    color: '#00897B',
    mockupScreens: ['home', 'pay', 'services', 'offers'],
  },
  {
    id: 'merchant-os',
    name: 'Merchant OS',
    tagline: 'One Platform. Every Business Type.',
    description: 'Multi-vertical Business OS with vertical-specific POS, inventory, accounting, and compliance.',
    icon: Store,
    features: ['Smart POS', 'Inventory', 'Accounting', 'Analytics'],
    users: '15K+',
    cta: 'Start Free Trial',
    color: '#1565C0',
    mockupScreens: ['pos', 'inventory', 'reports', 'settings'],
  },
  {
    id: 'grosell',
    name: 'GroSell',
    tagline: 'Sell on WhatsApp Without Business API',
    description: 'Turn your WhatsApp into a powerful sales channel. Share products, take orders, and get paid.',
    icon: MessageCircle,
    features: ['Product Catalog', 'Order Management', 'Payment Links', 'Analytics'],
    users: '5,000+',
    cta: 'Start Selling Free',
    color: '#25D366',
    mockupScreens: ['catalog', 'orders', 'chat', 'analytics'],
  },
  {
    id: 'grosupply',
    name: 'GroSupply',
    tagline: 'B2B Procurement, Simplified',
    description: 'Source stock from verified suppliers, get instant credit, and settle with one click.',
    icon: Truck,
    features: ['Supplier Network', 'GroCredit', 'GroSettle', '3-Way Match'],
    users: '5K+',
    cta: 'Join Marketplace',
    color: '#FF9800',
    mockupScreens: ['marketplace', 'orders', 'suppliers', 'credit'],
  },
  {
    id: 'gopay',
    name: 'GoPay',
    tagline: 'Payments That Move At The Speed Of Business',
    description: 'Payment gateway processing cards, QR, EFT, and PayShap with PCI-DSS compliance.',
    icon: CreditCard,
    features: ['PayShap', 'Card Processing', 'Instant EFT', 'PCI-DSS'],
    users: '10M+ txns',
    cta: 'Integrate Now',
    color: '#9C27B0',
    mockupScreens: ['dashboard', 'transactions', 'devices', 'analytics'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Scale Your Business Across Locations',
    description: 'Multi-branch management, consolidated reporting, and enterprise-grade controls.',
    icon: Building2,
    features: ['Multi-Branch', 'Consolidated Reports', 'RBAC', 'API Access'],
    users: '500+',
    cta: 'Contact Sales',
    color: '#1A1A1A',
    mockupScreens: ['overview', 'branches', 'reports', 'users'],
  },
  {
    id: 'admin-console',
    name: 'Admin Console',
    tagline: 'Platform Operations, Under Control',
    description: 'Monitor platform health, manage merchants, handle compliance, and detect fraud.',
    icon: Shield,
    features: ['Compliance', 'Fraud Detection', 'Analytics', 'Support'],
    users: 'Internal',
    cta: 'Learn More',
    color: '#D32F2F',
    mockupScreens: ['dashboard', 'merchants', 'compliance', 'alerts'],
  },
  {
    id: 'salesforce',
    name: 'Field Salesforce',
    tagline: 'Earn Great Money Growing Businesses',
    description: 'Join our professional field sales team. Help businesses modernize with Groway POS.',
    icon: UserPlus,
    features: ['Base + Commission', 'Training Provided', 'Territory Assignment', 'Career Growth'],
    users: '892',
    cta: 'Apply Now',
    color: '#E91E63',
    mockupScreens: ['leads', 'appointments', 'commissions', 'training'],
  },
  {
    id: 'agent-network',
    name: 'Agent Network',
    tagline: 'Turn Your Network Into Revenue',
    description: 'Earn up to 15% commission by referring merchants. Build your network and create passive income.',
    icon: Gift,
    features: ['Up to 15% Commission', '5-Tier System', 'Network Override', 'Passive Income'],
    users: '1,234',
    cta: 'Start Earning',
    color: '#00BCD4',
    mockupScreens: ['referrals', 'earnings', 'network', 'withdrawals'],
  },
]

// Growth Programs
export const growthPrograms = [
  {
    id: 'agent-network',
    name: 'Agent Network',
    tagline: 'Turn Your Network Into Revenue',
    description: 'Earn up to 15% commission by referring merchants. Build your network and create passive income streams.',
    icon: Gift,
    features: ['Up to 15% Commission', '5-Tier System', 'Network Override', 'Passive Income'],
    users: '1,234',
    cta: 'Start Earning',
  },
  {
    id: 'salesforce',
    name: 'Field Salesforce',
    tagline: 'Earn Great Money Growing Businesses',
    description: 'Join our professional field sales team. Help businesses modernize with Groway POS.',
    icon: UserPlus,
    features: ['Base + Commission', 'Training Provided', 'Territory Assignment', 'Career Growth'],
    users: '892',
    cta: 'Apply Now',
  },
]

// Platform Stats
export const platformStats = [
  { label: 'API Endpoints', value: '528+', icon: Zap },
  { label: 'Microservices', value: '35', icon: TrendingUp },
  { label: 'Business Verticals', value: '12', icon: Store },
  { label: 'Countries', value: '6+', icon: Globe },
]

// Compliance badges
export const complianceBadges = [
  { name: 'PCI-DSS Level 1', desc: 'Payment security' },
  { name: 'POPIA', desc: 'Data protection' },
  { name: 'SARB', desc: 'Banking regulation' },
  { name: 'NCR', desc: 'Credit compliance' },
]

// Enquiry types
export const enquiryTypes = [
  { value: 'consumer', label: 'Consumer Sign Up', icon: User },
  { value: 'merchant', label: 'Merchant / Business', icon: Store },
  { value: 'enterprise', label: 'Enterprise Solution', icon: Building },
  { value: 'partnership', label: 'Partnership Enquiry', icon: Briefcase },
  { value: 'general', label: 'General Enquiry', icon: MessageSquare },
]
