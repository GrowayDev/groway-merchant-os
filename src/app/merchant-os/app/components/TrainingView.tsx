'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  GraduationCap,
  Play,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  Video,
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  ChevronRight,
  ChevronDown,
  Star,
  Award,
  Trophy,
  Target,
  Lightbulb,
  ArrowRight,
  ExternalLink,
  FileText,
  Download,
  Bookmark,
  ThumbsUp,
  AlertCircle,
  Zap,
  Users,
  Store,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  Megaphone,
  Calendar,
  Calculator,
  Gift,
  Building2,
  Wifi,
  Code,
  ChevronLeft,
  Menu,
  X,
  ShoppingCart,
  Tag,
  Receipt,
  Printer,
  CreditCard as CardIcon,
  Wallet,
  QrCode,
  Percent,
  DollarSign,
  UserPlus,
  Clock as ClockIcon,
  MapPin,
  Truck,
  AlertTriangle,
  TrendingUp,
  FileSpreadsheet,
  PieChart,
  Banknote,
  Building,
  MessageSquare,
  Send,
  CalendarDays,
  Bell,
  CheckSquare,
  ListChecks,
  Info,
} from 'lucide-react'

// Training module interface
interface TrainingModule {
  id: string
  title: string
  description: string
  duration: string
  category: 'getting-started' | 'pos' | 'inventory' | 'customers' | 'accounting' | 'advanced'
  lessons: Lesson[]
  completed: boolean
  progress: number
}

interface Lesson {
  id: string
  title: string
  duration: string
  type: 'video' | 'article' | 'quiz' | 'interactive'
  completed: boolean
  content?: string
}

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

interface InteractiveStep {
  title: string
  description: string
  instruction: string
  highlight?: string
}

interface LessonContentData {
  title: string
  type: 'video' | 'article' | 'quiz' | 'interactive'
  overview: string
  content?: string
  steps?: string[]
  tips?: string[]
  keyPoints?: string[]
  quizQuestions?: QuizQuestion[]
  interactiveSteps?: InteractiveStep[]
  videoTranscript?: string
}

// Detailed lesson content for each lesson
const lessonContentMap: Record<string, LessonContentData> = {
  // ===== GETTING STARTED MODULE =====
  'gs-1': {
    title: 'Welcome to Groway Merchant OS',
    type: 'video',
    overview: 'An introduction to the Groway Merchant OS platform - your all-in-one business management solution for South African businesses.',
    videoTranscript: `
Welcome to Groway Merchant OS, South Africa's leading all-in-one business management platform. This comprehensive system is designed specifically for the unique needs of South African businesses, with built-in support for VAT, SARS compliance, and local payment methods.

WHAT IS MERCHANT OS?
Merchant OS is a cloud-based business management platform that combines Point of Sale, Inventory Management, Customer Relationship Management, Accounting, and much more into a single, unified system. Whether you run a retail store, restaurant, salon, pharmacy, or professional practice, Merchant OS adapts to your business vertical.

KEY FEATURES INCLUDE:
• Point of Sale with offline capability (works without internet for up to 72 hours)
• Real-time inventory tracking with batch and expiry management
• Customer loyalty programs with RFM segmentation
• Full accounting with VAT 201 reporting
• Integration with Yoco, PayFast, Ozow, and other SA payment providers
• WhatsApp Business integration for customer communication
• Multi-location support for growing businesses

GETTING STARTED:
1. Complete your business profile setup
2. Configure your VAT settings (15% standard rate)
3. Add your products or services
4. Set up your payment methods
5. Train your staff using this training portal

The platform is designed to be intuitive, but this training will help you unlock its full potential. Let's get started!
    `,
    keyPoints: [
      'Merchant OS works offline for up to 72 hours',
      'Built specifically for South African business compliance',
      'Supports multiple business verticals (retail, food, services, professional)',
      'Includes VAT 201 reporting and SARS-compliant invoicing',
      'Integrates with local payment providers (Yoco, PayFast, Ozow)'
    ]
  },
  'gs-2': {
    title: 'Selecting Your Business Vertical',
    type: 'interactive',
    overview: 'Learn how to select and configure your business vertical - the foundation of your Merchant OS setup.',
    interactiveSteps: [
      {
        title: 'Navigate to Settings',
        description: 'Access your business configuration',
        instruction: 'Click on the Settings icon (gear) in the bottom left navigation, then select "Business Profile" from the menu.',
        highlight: 'Settings > Business Profile'
      },
      {
        title: 'Choose Your Vertical',
        description: 'Select the business type that best matches your operations',
        instruction: 'In the Business Profile section, you will see a "Business Vertical" dropdown. Select from: Retail, Food & Beverage, Health & Beauty, Professional Services, Pharmacy, Auto Services, or Other.',
        highlight: 'Business Vertical dropdown'
      },
      {
        title: 'Configure Vertical-Specific Settings',
        description: 'Each vertical has unique features',
        instruction: 'Based on your selection, additional configuration options will appear. For example, Food & Beverage businesses can enable table management and kitchen display, while Professional Services can enable appointment booking.',
        highlight: 'Vertical-specific options'
      },
      {
        title: 'Save Your Configuration',
        description: 'Apply your vertical settings',
        instruction: 'Click "Save Changes" at the bottom of the form. Your Merchant OS will now be configured with the appropriate features for your business type.',
        highlight: 'Save Changes button'
      }
    ],
    tips: [
      'You can change your business vertical at any time, but this may reset some vertical-specific configurations',
      'If your business spans multiple categories (e.g., a spa with retail products), choose the primary vertical and enable additional features manually',
      'Professional Services includes: Legal, Accounting, Architecture, Engineering, Medical, Dental, Real Estate, and more'
    ]
  },
  'gs-3': {
    title: 'Understanding the Dashboard',
    type: 'video',
    overview: 'A comprehensive overview of the Merchant OS dashboard - your command center for business operations.',
    videoTranscript: `
The Merchant OS Dashboard is your central hub for monitoring and managing your business. Let's walk through each section:

TOP HEADER BAR:
• Business name and logo (customizable)
• Current date and time
• Offline indicator (shows when internet is unavailable)
• Notification bell for alerts
• Quick actions menu

LEFT NAVIGATION:
The main menu provides access to all Merchant OS features:
• Home - Dashboard overview
• POS - Point of Sale screen
• Transactions - Sales history and reports
• Inventory - Stock management
• Customers - CRM and loyalty
• Accounting - Financial management
• Bookings - Appointments (if enabled)
• Reports - Business analytics
• Settings - Configuration

MAIN DASHBOARD CARDS:
1. Today's Sales - Real-time revenue with comparison to yesterday
2. Transaction Count - Number of sales processed
3. Average Transaction Value - Helps track customer spending
4. Inventory Alerts - Low stock and expiry warnings
5. Customer Insights - New customers and loyalty stats

QUICK ACTIONS:
• New Sale - Jump straight to POS
• Add Product - Quick inventory addition
• New Customer - Register a customer
• View Reports - Access analytics

The dashboard is fully customizable. You can rearrange cards, add widgets, and set your preferred default view. Changes are saved automatically.
    `,
    keyPoints: [
      'Dashboard provides real-time business overview',
      'Navigation is organized by business function',
      'Offline mode indicator alerts you to connectivity issues',
      'Quick actions provide shortcuts to common tasks',
      'Dashboard cards can be rearranged and customized'
    ]
  },
  'gs-4': {
    title: 'Quick Setup Checklist',
    type: 'article',
    overview: 'A step-by-step checklist to get your Merchant OS fully configured and ready for business.',
    content: `
# Quick Setup Checklist

Complete these essential setup tasks to get your Merchant OS fully operational:

## 1. Business Information (Required)
- [ ] Enter business name and logo
- [ ] Set business address and contact details
- [ ] Configure operating hours
- [ ] Add business registration number
- [ ] Set VAT number (if VAT registered)

## 2. Tax Configuration (Required)
- [ ] Set VAT rate (default: 15%)
- [ ] Configure VAT-inclusive or VAT-exclusive pricing
- [ ] Set up tax categories for different product types
- [ ] Configure invoice numbering format

## 3. Payment Methods
- [ ] Enable Cash payments
- [ ] Configure Card payment terminal (Yoco, Pax, Verifone)
- [ ] Set up mobile payments (SnapScan, Zapper)
- [ ] Enable EFT/QR payments (Ozow, PayFast)
- [ ] Configure account/credit sales (if applicable)

## 4. Products & Inventory
- [ ] Add product categories
- [ ] Import products (CSV or manual entry)
- [ ] Set prices and cost values
- [ ] Configure stock quantities
- [ ] Set reorder points for alerts

## 5. Staff & Users
- [ ] Create staff accounts
- [ ] Assign user roles and permissions
- [ ] Set up cashier PINs
- [ ] Configure manager approval requirements

## 6. Hardware Setup
- [ ] Connect receipt printer
- [ ] Pair payment terminal
- [ ] Configure barcode scanner
- [ ] Set up cash drawer

## 7. Receipt Configuration
- [ ] Add company logo to receipt
- [ ] Configure receipt header text
- [ ] Set footer message (return policy, etc.)
- [ ] Enable VAT breakdown display

## 8. Optional Integrations
- [ ] Connect WhatsApp Business
- [ ] Set up email notifications
- [ ] Configure SMS alerts
- [ ] Link to e-commerce platform
    `,
    steps: [
      'Complete all Required sections before going live',
      'Test payment processing with small transactions',
      'Print test receipts to verify formatting',
      'Train all staff members on basic operations',
      'Set up backup procedures and data export'
    ]
  },
  'gs-5': {
    title: 'Getting Started Quiz',
    type: 'quiz',
    overview: 'Test your knowledge of Merchant OS basics.',
    quizQuestions: [
      {
        question: 'How long can Merchant OS operate in offline mode?',
        options: ['24 hours', '48 hours', '72 hours', '1 week'],
        correctAnswer: 2,
        explanation: 'Merchant OS can operate offline for up to 72 hours. Transactions are stored locally and automatically sync when connection is restored.'
      },
      {
        question: 'What is the standard VAT rate in South Africa?',
        options: ['10%', '14%', '15%', '20%'],
        correctAnswer: 2,
        explanation: 'The standard VAT rate in South Africa is 15%. This was increased from 14% on 1 April 2018.'
      },
      {
        question: 'Which payment providers are integrated with Merchant OS?',
        options: ['PayPal and Stripe only', 'Yoco, PayFast, and Ozow', 'Only bank transfers', 'International providers only'],
        correctAnswer: 1,
        explanation: 'Merchant OS integrates with South African payment providers including Yoco, PayFast, Ozow, SnapScan, Zapper, and major banks.'
      },
      {
        question: 'Where do you configure your business vertical?',
        options: ['POS Screen', 'Settings > Business Profile', 'Reports section', 'Customer management'],
        correctAnswer: 1,
        explanation: 'Business vertical is configured in Settings > Business Profile. This determines which features are enabled for your business type.'
      },
      {
        question: 'What happens when you change your business vertical?',
        options: ['Nothing changes', 'All data is deleted', 'Vertical-specific configurations may reset', 'Only the logo changes'],
        correctAnswer: 2,
        explanation: 'Changing your business vertical may reset some vertical-specific configurations. Your core data (products, customers, transactions) is preserved.'
      }
    ]
  },

  // ===== POINT OF SALE MODULE =====
  'pos-1': {
    title: 'Navigating the POS Screen',
    type: 'video',
    overview: 'Learn the layout and features of the Point of Sale screen - your primary interface for processing sales.',
    videoTranscript: `
The POS screen is divided into three main areas: the Product Grid, the Cart, and the Action Bar.

PRODUCT GRID (Left Side):
This displays all your products organized in a grid format. Features include:
• Category tabs across the top for quick filtering
• Search bar to find products by name, SKU, or barcode
• Product cards showing name, price, and stock status
• Quick-add buttons for frequently sold items
• Custom grid layouts (3x3, 4x4, or list view)

CART SECTION (Right Side):
Shows items added to the current transaction:
• Item list with quantity and price
• Per-item discount and price override options
• Remove or edit item quantities
• Customer selection area
• Running subtotal, VAT, and total

ACTION BAR (Bottom):
Primary transaction actions:
• Pay - Process payment
• Hold - Park transaction for later
• Discount - Apply cart-level discount
• Customer - Link customer to sale
• Clear - Empty the cart
• More - Additional options (void, refund, split payment)

QUICK KEYS:
Use keyboard shortcuts for faster operation:
• F1-F12: Quick access to top 12 products
• F2: Open search
• F3: Add customer
• F4: Apply discount
• F8: Process payment
• ESC: Clear cart

TIPS FOR EFFICIENCY:
• Organize products by most frequently sold
• Use barcode scanner for fast item entry
• Set up product variants (size, color) for easy selection
• Create combo items for commonly sold together products
    `,
    keyPoints: [
      'Product Grid can be customized with different layouts',
      'Use keyboard shortcuts for faster operations',
      'Hold transactions to serve multiple customers',
      'Customer selection enables loyalty points and history tracking',
      'Quick Charge buttons provide preset amounts for fast checkout'
    ]
  },
  'pos-2': {
    title: 'Adding Items to Cart',
    type: 'interactive',
    overview: 'Learn the different ways to add items to a transaction cart.',
    interactiveSteps: [
      {
        title: 'Method 1: Tap on Product Grid',
        description: 'The easiest way to add items',
        instruction: 'Simply tap on any product card in the product grid. The item will be added to the cart with a quantity of 1. Tap again to add another unit.',
        highlight: 'Product cards on the left side'
      },
      {
        title: 'Method 2: Search and Add',
        description: 'Find products quickly by name or SKU',
        instruction: 'Click the search bar at the top of the product grid, type the product name or SKU, and press Enter. Click on the search result to add it to cart.',
        highlight: 'Search bar'
      },
      {
        title: 'Method 3: Barcode Scan',
        description: 'Fastest method for barcode products',
        instruction: 'Use a connected barcode scanner to scan product barcodes. The scanner will automatically add the item to the cart. Each scan adds one unit.',
        highlight: 'Scanner input field'
      },
      {
        title: 'Method 4: Quick Charge',
        description: 'For quick sales without selecting items',
        instruction: 'Use the Quick Charge buttons for preset amounts (R10, R20, R50, R100, R200). This creates a sale without linking to specific inventory items.',
        highlight: 'Quick Charge buttons in cart area'
      },
      {
        title: 'Adjust Quantities',
        description: 'Change item quantities',
        instruction: 'In the cart, tap the +/- buttons next to any item to adjust quantity. You can also tap the number to enter a specific quantity.',
        highlight: 'Quantity controls in cart'
      },
      {
        title: 'Add Notes to Items',
        description: 'Include special instructions',
        instruction: 'Swipe left on any cart item or click the three-dot menu to add notes, apply item-level discounts, or override the price.',
        highlight: 'Item actions menu'
      }
    ],
    tips: [
      'Double-tap a product to open its detail view',
      'Use the "Favorites" category for quick access to top sellers',
      'Create product variants to handle different sizes/colors',
      'Scan multiple items rapidly - the system queues them correctly'
    ]
  },
  'pos-3': {
    title: 'Processing Payments',
    type: 'video',
    overview: 'Master the payment process including multiple payment methods and split payments.',
    videoTranscript: `
PROCESSING PAYMENTS IN MERCHANT OS

Click the green "Pay" button when your cart is ready. The payment screen will show the total amount due and available payment methods.

PAYMENT METHODS:

1. CASH
• Enter the amount received
• System calculates change automatically
• Opens cash drawer (if connected)
• Prints receipt

2. CARD
• Tap "Card" to initiate card payment
• Customer taps/inserts card on terminal
• Wait for approval notification
• Print or email receipt

3. QR CODE / EFT
• Select Ozow or PayFast
• Customer scans QR code with banking app
• Payment confirms automatically
• No manual reconciliation needed

4. MOBILE PAYMENTS
• SnapScan, Zapper supported
• Customer scans your merchant QR
• Enter amount and confirm

5. WALLET / LOYALTY POINTS
• Redeem customer loyalty points
• Points converted to Rand value
• Shows remaining balance

6. ACCOUNT / CREDIT
• For customers with credit terms
• Records as receivable
• Updates customer balance

SPLIT PAYMENTS:
When a customer wants to pay with multiple methods:
1. Click "Split Payment" on the payment screen
2. Enter amount for first payment method
3. Select the payment type and process
4. Remaining balance shows for next payment
5. Continue until full amount is paid

QUICK CHARGE:
For high-volume, low-value transactions:
• Preset amounts: R10, R20, R50, R100
• One tap completes the sale
• Ideal for parking, events, quick service
    `,
    keyPoints: [
      'Multiple payment methods can be combined in split payment',
      'Card payments integrate directly with Yoco, Pax terminals',
      'QR payments confirm automatically via Ozow/PayFast',
      'Account sales create receivables in accounting',
      'Always verify payment confirmation before completing'
    ]
  },
  'pos-4': {
    title: 'Handling Discounts & Offers',
    type: 'article',
    overview: 'Learn how to apply discounts, create promotions, and manage special offers.',
    content: `
# Discounts & Offers in Merchant OS

## Types of Discounts

### 1. Item-Level Discounts
Applied to individual items in the cart:
- **Percentage discount**: Reduce item price by X%
- **Fixed amount discount**: Reduce by R amount
- **Price override**: Set a specific price

**How to apply:**
1. In the cart, tap the three-dot menu on the item
2. Select "Discount" or "Price Override"
3. Enter discount value or new price
4. Add a reason (required for audit trail)

### 2. Cart-Level Discounts
Applied to the entire transaction:
- **Percentage discount**: X% off total
- **Fixed amount discount**: R off total
- **Buy X Get Y**: Automatic promotions

**How to apply:**
1. Click "Discount" in the action bar
2. Choose percentage or fixed amount
3. Enter the discount value
4. Select reason from dropdown

### 3. Automatic Promotions
Configure in Marketing > Promotions:
- **Buy X Get Y Free**
- **Spend R500 Get 10% Off**
- **Happy Hour Pricing**
- **Bundle Deals**

### 4. Customer-Specific Discounts
Linked to customer profiles:
- **Loyalty tier discounts** (Bronze 5%, Silver 10%, Gold 15%)
- **Birthday discounts**
- **VIP pricing**

## Discount Reasons (Audit Trail)
All discounts require a reason:
- Price Match Competitor
- Damaged Item
- Manager Approval
- Customer Complaint
- Promotion/Offer
- Staff Discount
- Other (requires notes)

## Best Practices
1. Set manager PIN for discounts over a threshold
2. Review discount reports weekly
3. Train staff on when discounts are appropriate
4. Use automatic promotions instead of manual discounts
5. Monitor discount abuse through reports
    `,
    steps: [
      'Tap item menu > Discount to apply item-level discount',
      'Use Discount button in action bar for cart-wide discounts',
      'Select appropriate reason for audit compliance',
      'Set up automatic promotions for recurring offers',
      'Review discount reports to monitor staff compliance'
    ]
  },
  'pos-5': {
    title: 'Printing Receipts',
    type: 'video',
    overview: 'Configure and manage receipt printing options for your business.',
    videoTranscript: `
RECEIPT OPTIONS IN MERCHANT OS

After completing a payment, you have several receipt options:

PRINT RECEIPT
• Automatically prints if thermal printer is connected
• Shows all transaction details
• Includes VAT breakdown
• Displays payment method

EMAIL RECEIPT
• Enter customer email address
• Professional HTML format
• Includes digital copy for customer records
• Option to save email for future

SMS RECEIPT
• Send receipt link via SMS
• Customer receives link to view/download
• Useful for customers without email
• Standard SMS rates apply

WHATSAPP RECECIPT
• Send receipt via WhatsApp Business
• Opens conversation with customer
• Great for follow-up marketing
• Requires WhatsApp Business integration

NO RECEIPT
• Skip receipt if customer doesn't want one
• Transaction is still recorded
• Can reprint later from transaction history

CONFIGURING RECEIPT SETTINGS:
Go to Settings > Receipts to customize:
• Add company logo
• Set header text (welcome message)
• Configure footer text (return policy, contact info)
• Enable/disable VAT breakdown
• Set paper size (58mm or 80mm)
• Test print functionality

REPRINTING RECEIPTS:
From Transactions screen:
1. Find the transaction
2. Click "View Details"
3. Select "Reprint Receipt"

THERMAL PRINTER SETUP:
Merchant OS supports:
• Epson TM series
• Star TSP series
• XPrinter
• Generic ESC/POS printers

Connect via USB, Bluetooth, or Network (LAN).
    `,
    keyPoints: [
      'Multiple receipt delivery options: print, email, SMS, WhatsApp',
      'Customize receipt header and footer in Settings',
      'Receipts can be reprinted from transaction history',
      'VAT breakdown is required by SARS for tax invoices',
      'Configure thermal printer paper size (58mm or 80mm)'
    ]
  },
  'pos-6': {
    title: 'POS Quiz',
    type: 'quiz',
    overview: 'Test your knowledge of Point of Sale operations.',
    quizQuestions: [
      {
        question: 'What happens when you use the "Hold" button on a transaction?',
        options: ['Transaction is cancelled', 'Transaction is saved for later retrieval', 'Transaction is sent to manager', 'Transaction prints automatically'],
        correctAnswer: 1,
        explanation: 'The Hold button parks the transaction, allowing you to serve another customer and resume the held transaction later.'
      },
      {
        question: 'How do you process a split payment?',
        options: ['Ask customer to pay separately', 'Click "Split Payment" and enter amounts for each method', 'Process multiple transactions', 'Split payment is not supported'],
        correctAnswer: 1,
        explanation: 'Click "Split Payment" on the payment screen, enter the amount for the first payment method, process it, then continue with remaining balance.'
      },
      {
        question: 'What is required when applying a discount?',
        options: ['Manager password only', 'Nothing is required', 'A reason must be selected', 'Customer signature'],
        correctAnswer: 2,
        explanation: 'All discounts require a reason to be selected for audit trail purposes. This helps track discount usage and prevent abuse.'
      },
      {
        question: 'How can you add items to cart using a barcode scanner?',
        options: ['Manually type the barcode', 'Scan directly - items auto-add', 'Copy and paste the barcode', 'Barcode scanning is not supported'],
        correctAnswer: 1,
        explanation: 'Simply scan the product barcode with your connected scanner. The item is automatically added to the cart with quantity 1.'
      },
      {
        question: 'What is Quick Charge used for?',
        options: ['Fast card payments', 'Charging devices', 'Quick sales without item selection', 'Splitting bills'],
        correctAnswer: 2,
        explanation: 'Quick Charge allows you to process quick sales for preset amounts (R10, R20, R50, etc.) without selecting specific inventory items.'
      }
    ]
  },

  // ===== INVENTORY MANAGEMENT MODULE =====
  'inv-1': {
    title: 'Understanding Inventory Dashboard',
    type: 'video',
    overview: 'Navigate the inventory management dashboard and understand key metrics.',
    videoTranscript: `
THE INVENTORY DASHBOARD OVERVIEW

The Inventory Dashboard provides a comprehensive view of your stock status and movements.

KEY METRICS CARDS:

1. TOTAL PRODUCTS
   Active products in your catalog
   Includes variants as separate items

2. LOW STOCK ALERTS
   Products below reorder point
   Click to see affected items
   Red = critical, Orange = warning

3. OUT OF STOCK
   Products with zero quantity
   Immediate attention needed
   May need supplier orders

4. EXPIRING SOON
   Batches nearing expiry
   Configurable alert period
   Track by batch number

5. TOTAL STOCK VALUE
   Current inventory worth
   Based on cost price
   Helps with asset tracking

MAIN TABS:

PRODUCTS
• Complete product catalog
• Add, edit, delete products
• Manage categories
• Import/export CSV

BATCHES
• Track inventory by batch
• Expiry date management
• FIFO/LIFO tracking
• Recall capability

STOCK MOVEMENTS
• All stock changes logged
• Sales, purchases, adjustments
• Transfer between locations
• Audit trail

ALERTS
• Active stock alerts
• Low stock warnings
• Expiry notifications
• Reorder suggestions

TRANSFERS
• Move stock between locations
• Track in-transit inventory
• Receive confirmations

SNAPSHOTS
• Period-end inventory capture
• Compare over time
• Variance reporting
    `,
    keyPoints: [
      'Dashboard shows real-time stock status',
      'Low stock alerts based on reorder points you configure',
      'Batch tracking enables expiry management',
      'Stock movements provide full audit trail',
      'Multi-location transfers tracked with status updates'
    ]
  },
  'inv-2': {
    title: 'Adding Products & SKUs',
    type: 'interactive',
    overview: 'Learn how to add products, configure SKUs, and set up product variants.',
    interactiveSteps: [
      {
        title: 'Navigate to Products',
        description: 'Open the product management screen',
        instruction: 'Click "Inventory" in the left navigation, then select the "Products" tab. You will see your product catalog with search and filter options.',
        highlight: 'Inventory > Products'
      },
      {
        title: 'Click Add Product',
        description: 'Open the new product form',
        instruction: 'Click the green "Add Product" button in the top right. A form will open with all product configuration fields.',
        highlight: 'Add Product button'
      },
      {
        title: 'Enter Basic Details',
        description: 'Required product information',
        instruction: 'Fill in: Product Name, SKU (auto-generated or custom), Category, and Description. SKU must be unique across your catalog.',
        highlight: 'Product Name, SKU, Category fields'
      },
      {
        title: 'Set Pricing',
        description: 'Configure selling and cost prices',
        instruction: 'Enter the Selling Price (what customers pay) and Cost Price (what you pay supplier). The system calculates margin automatically.',
        highlight: 'Selling Price, Cost Price fields'
      },
      {
        title: 'Configure Stock Settings',
        description: 'Inventory tracking options',
        instruction: 'Set initial Stock Quantity, Low Stock Threshold (reorder point), and enable Batch Tracking if applicable.',
        highlight: 'Stock settings section'
      },
      {
        title: 'Add Product Variants',
        description: 'For products with multiple options',
        instruction: 'If the product comes in different sizes/colors, click "Add Variant". Create options like Size: S/M/L or Color: Red/Blue/Green. Each variant gets its own SKU.',
        highlight: 'Variants section'
      },
      {
        title: 'Save the Product',
        description: 'Complete the addition',
        instruction: 'Review all details and click "Save Product". The product is now available in POS and inventory reports.',
        highlight: 'Save button'
      }
    ],
    tips: [
      'Use a consistent SKU naming convention (e.g., CAT-BRAND-SIZE)',
      'Import products in bulk using CSV for faster setup',
      'Set reorder points based on average daily sales x lead time',
      'Enable batch tracking for products with expiry dates'
    ]
  },
  'inv-3': {
    title: 'Stock Movements & Adjustments',
    type: 'video',
    overview: 'Learn how stock movements work and how to make inventory adjustments.',
    videoTranscript: `
STOCK MOVEMENTS IN MERCHANT OS

Every change to inventory is logged as a "movement" with full audit trail.

TYPES OF STOCK MOVEMENTS:

1. SALES (-)
   Automatic when items are sold
   Reduces stock quantity
   Linked to transaction number

2. PURCHASES / GRN (+)
   Goods Received Note
   When receiving from supplier
   Includes cost tracking

3. ADJUSTMENTS (+/-)
   Manual corrections
   Reasons: Damaged, Theft, Count Error, Found
   Requires authorization

4. TRANSFERS (+/-)
   Between locations
   Tracks in-transit status
   Requires receiving confirmation

5. STOCKTAKE (+/-)
   From physical count
   Reconciles system vs actual
   Records variance

MAKING ADJUSTMENTS:

When you need to manually adjust stock:

1. Go to Inventory > Stock Movements
2. Click "New Adjustment"
3. Select the product
4. Choose adjustment type:
   - Add Stock (+)
   - Remove Stock (-)
   - Set Quantity (=)
5. Enter quantity and reason
6. Add notes if required
7. Authorize with PIN if needed

ADJUSTMENT REASONS:
• Damaged/Expired
• Theft/Loss
• Count Error
• Sample/Giveaway
• Internal Use
• Return to Supplier
• Found
• Other

VIEWING MOVEMENT HISTORY:
Each product shows full movement history:
• Date and time
• Movement type
• Quantity changed
• Running balance
• User who made change
• Reference (invoice, GRN, etc.)

This audit trail is essential for inventory accuracy and loss prevention.
    `,
    keyPoints: [
      'All stock changes create a movement record',
      'Adjustments require reasons for audit compliance',
      'Large adjustments may need manager authorization',
      'Movement history shows full audit trail',
      'Stocktake creates adjustment for variances'
    ]
  },
  'inv-4': {
    title: 'Running a Stocktake',
    type: 'interactive',
    overview: 'Learn how to perform physical inventory counts and reconcile with system records.',
    interactiveSteps: [
      {
        title: 'Prepare for Stocktake',
        description: 'Set up the count session',
        instruction: 'Go to Inventory > Stocktake. Click "New Stocktake". Select which products or categories to count. Choose to count all stock or specific locations.',
        highlight: 'Inventory > Stocktake > New'
      },
      {
        title: 'Print Count Sheet',
        description: 'Create physical counting document',
        instruction: 'Click "Print Count Sheet" to generate a PDF with product names, SKUs, and space for counted quantities. Distribute to counting staff.',
        highlight: 'Print Count Sheet button'
      },
      {
        title: 'Perform Physical Count',
        description: 'Count inventory on shelves',
        instruction: 'Walk through your stock and count each product. Record quantities on the count sheet. For accuracy, have a second person verify counts.',
        highlight: 'Physical counting process'
      },
      {
        title: 'Enter Counted Quantities',
        description: 'Input counts into system',
        instruction: 'Return to the stocktake screen. Enter counted quantities for each product. You can also scan barcodes and enter counts directly.',
        highlight: 'Count entry fields'
      },
      {
        title: 'Review Variances',
        description: 'Check differences',
        instruction: 'Click "Review Variances" to see items where counted quantity differs from system quantity. Investigate significant variances before proceeding.',
        highlight: 'Review Variances button'
      },
      {
        title: 'Finalize Stocktake',
        description: 'Apply adjustments',
        instruction: 'Click "Finalize Stocktake" to apply the adjustments. This creates stock movement records for all variances. System stock now matches physical count.',
        highlight: 'Finalize button'
      }
    ],
    tips: [
      'Perform stocktake during low-traffic periods',
      'Freeze sales during count for accuracy',
      'Count high-value items twice',
      'Investigate variances over 5% before finalizing',
      'Schedule regular stocktakes (monthly for high-value, quarterly for others)'
    ]
  },
  'inv-5': {
    title: 'Reorder Points & Alerts',
    type: 'article',
    overview: 'Configure automatic reorder alerts to prevent stockouts.',
    content: `
# Reorder Points & Stock Alerts

## What is a Reorder Point?

A reorder point is the stock level at which you should place a new order with your supplier. It's calculated as:

**Reorder Point = (Average Daily Sales × Lead Time) + Safety Stock**

Where:
- **Average Daily Sales**: How many units you sell per day
- **Lead Time**: Days between placing and receiving an order
- **Safety Stock**: Buffer for unexpected demand or delays

## Setting Up Reorder Points

### Method 1: Manual Configuration
1. Go to Inventory > Products
2. Edit a product
3. Find "Low Stock Threshold"
4. Enter the quantity that triggers an alert
5. Save

### Method 2: Automatic Calculation
1. Go to Inventory > Settings
2. Enable "Auto-calculate reorder points"
3. Set lead time per supplier
4. Set safety stock percentage
5. System calculates based on sales history

## Alert Types

### Low Stock Alert
- Yellow indicator
- Stock is below reorder point
- Time to place order

### Critical Stock Alert
- Red indicator
- Stock at dangerous level
- Immediate action needed

### Out of Stock
- Red indicator with zero icon
- Cannot sell this item
- Urgent reorder needed

### Expiry Alert
- Orange indicator
- Batch nearing expiry date
- Consider markdown or donation

## Alert Notifications

Configure how you receive alerts:

**In-App Notifications**
- Bell icon in header
- Popup on login
- Dashboard widget

**Email Notifications**
- Daily summary email
- Instant alerts for critical items
- Configurable by user role

**SMS Notifications**
- Critical alerts only
- Configurable phone numbers
- Standard SMS rates apply

## Best Practices

1. **Review alerts daily** - Don't let alerts pile up
2. **Set realistic thresholds** - Too low = stockouts, too high = excess inventory
3. **Update lead times** - Supplier delays should trigger threshold adjustment
4. **Monitor alert history** - Patterns may indicate data issues
5. **Connect to GroSupply** - Automatic ordering when alerts trigger
    `,
    steps: [
      'Set reorder point based on sales velocity and lead time',
      'Configure notification preferences in Inventory Settings',
      'Review alerts daily and take action promptly',
      'Update thresholds seasonally as demand changes',
      'Use GroSupply integration for automatic reordering'
    ]
  },
  'inv-6': {
    title: 'GroSupply Integration',
    type: 'video',
    overview: 'Learn how to use GroSupply marketplace for automatic ordering and supplier management.',
    videoTranscript: `
GROSUPPLY - YOUR AUTOMATED SUPPLY CHAIN

GroSupply is Merchant OS's integrated B2B marketplace that connects you directly with suppliers for automatic ordering.

KEY FEATURES:

1. MARKETPLACE ACCESS
   Browse products from multiple suppliers:
   • Compare prices across vendors
   • Bulk discounts available
   • See real-time stock availability
   • Read supplier ratings and reviews

2. AUTOMATIC REORDERING
   Never run out of stock:
   • Connect products to GroSupply listings
   • Set auto-order when stock hits threshold
   • Orders placed automatically
   • Track delivery status

3. SMART SUGGESTIONS
   AI-powered inventory intelligence:
   • Predict demand based on history
   • Suggest optimal order quantities
   • Identify slow-moving stock
   • Recommend markdown timing

HOW TO CONNECT PRODUCTS:

1. Go to Inventory > Products
2. Select a product to edit
3. Find "GroSupply Link" section
4. Search for matching product
5. Select the best supplier
6. Save the connection

Now when stock falls below reorder point, you'll get a one-click reorder option.

PLACING ORDERS:

Manual Order:
1. Go to GroSupply in navigation
2. Browse or search products
3. Add to cart
4. Select delivery address
5. Confirm payment method
6. Submit order

Auto-Order:
1. Configure in Inventory > Settings
2. Enable "Auto-order from GroSupply"
3. Set budget limits
4. Select default supplier preference
5. System handles the rest

TRACKING DELIVERIES:

• View order status in GroSupply > Orders
• Receive notifications on updates
• Generate GRN when goods arrive
• Stock automatically updates
    `,
    keyPoints: [
      'GroSupply connects you directly to multiple suppliers',
      'Compare prices and order from best vendor',
      'Enable auto-reorder to prevent stockouts',
      'AI suggests optimal order quantities based on sales',
      'Delivery tracking with automatic stock update on receipt'
    ]
  },

  // ===== CUSTOMER & LOYALTY MODULE =====
  'crm-1': {
    title: 'Customer Profiles',
    type: 'video',
    overview: 'Learn how to create, manage, and use customer profiles for better service.',
    videoTranscript: `
CUSTOMER MANAGEMENT IN MERCHANT OS

Customer profiles are the foundation of your CRM system. They enable personalized service, loyalty tracking, and targeted marketing.

CREATING CUSTOMER PROFILES:

Quick Add (from POS):
1. Click "Customer" in POS action bar
2. Click "New Customer"
3. Enter name and phone (minimum)
4. Save

Full Profile (from CRM):
1. Go to Customers in navigation
2. Click "Add Customer"
3. Fill in all details:
   - Name, Phone, Email
   - Address
   - Birthday (for offers)
   - Company (for B2B)
   - Custom fields

CUSTOMER PROFILE SECTIONS:

OVERVIEW
• Total spend (Lifetime Value)
• Transaction count
• Average transaction
• First/Last visit date
• Loyalty tier

TRANSACTIONS
• Complete purchase history
• Filter by date range
• View transaction details
• Duplicate receipts

LOYALTY
• Points balance
• Points history
• Tier progress
• Available rewards

NOTES
• Staff notes about customer
• Preferences
• Special requests
• VIP indicators

COMMUNICATION
• WhatsApp messages
• Email history
• SMS sent
• Campaign responses

USING CUSTOMER DATA:

At POS:
1. Link customer to sale
2. Points automatically earned
3. View last purchases
4. Apply tier discount
5. Print personalized receipt

For Marketing:
1. Segment by spend, frequency
2. Target campaigns
3. Send birthday offers
4. Win-back lapsed customers
    `,
    keyPoints: [
      'Minimum customer data: Name and phone number',
      'Customer profiles enable loyalty and marketing',
      'Link customer to sales for points and history',
      'Notes help staff provide personalized service',
      'Lifetime Value tracks customer worth'
    ]
  },
  'crm-2': {
    title: 'RFM Segmentation Explained',
    type: 'article',
    overview: 'Understand RFM analysis and how it powers your customer segmentation.',
    content: `
# RFM Segmentation Guide

## What is RFM?

RFM stands for **Recency, Frequency, Monetary** - three key metrics that predict customer behavior:

### Recency (R)
How recently did the customer make a purchase?
- Score 1-5 (5 = most recent)
- Recent customers more likely to buy again
- Lapsed customers need re-engagement

### Frequency (F)
How often does the customer purchase?
- Score 1-5 (5 = most frequent)
- Frequent buyers are more loyal
- Infrequent may need incentives

### Monetary (M)
How much does the customer spend?
- Score 1-5 (5 = highest spend)
- High spenders are valuable
- Low spenders may have potential

## RFM Segments

Combining R, F, M scores creates customer segments:

| Segment | RFM Score | Description | Strategy |
|---------|-----------|-------------|----------|
| **Champions** | 555 | Recent, frequent, high spend | Reward, upsell, referrals |
| **Loyal Customers** | X5X | Frequent buyers | Loyalty rewards, new products |
| **Potential Loyalists** | 5X3-5 | Recent, good spend | Membership, loyalty program |
| **New Customers** | 5XX | Recent first purchase | Onboarding, welcome offers |
| **Promising** | 4-5X2-3 | Recent, moderate frequency | Nurture, build relationship |
| **Need Attention** | 3X2-3 | Recency declining | Re-engagement campaigns |
| **At Risk** | 2X2-5 | Haven't purchased recently | Win-back campaigns |
| **Can't Lose Them** | X5X but R=1 | Was loyal, now inactive | Urgent win-back, personal outreach |
| **Hibernating** | 112-2 | Low on all metrics | Survey, understand why |
| **Lost** | 111 | Lowest scores | Reactivation or let go |

## How Merchant OS Uses RFM

### Automatic Scoring
- Calculated nightly from transaction data
- Scores visible in customer profiles
- Updated as behavior changes

### Loyalty Tiers
Based on RFM combination:
- **Platinum**: Champions and high-value loyal
- **Gold**: Regular customers with good spend
- **Silver**: Occasional buyers
- **Bronze**: New or low-engagement

### Marketing Targeting
- Create campaigns by segment
- "At Risk" customers get win-back offers
- "Champions" get VIP exclusives
- Track campaign effectiveness

## Viewing RFM Data

1. Go to Customers > Segments
2. View segment breakdown
3. Click segment for customer list
4. Create campaign for segment
5. Track segment movement over time

## Improving Your RFM

**Recency**: 
- Regular communication
- New product announcements
- Limited-time offers

**Frequency**:
- Subscription services
- Loyalty rewards for visits
- Cross-selling related products

**Monetary**:
- Upselling premium options
- Bundle deals
- Tiered loyalty benefits
    `,
    keyPoints: [
      'RFM scores customers on Recency, Frequency, and Monetary value',
      'Each dimension scored 1-5 for a total RFM score',
      'Segments help target marketing effectively',
      'Champions are your most valuable customers',
      'At Risk customers need re-engagement'
    ]
  },
  'crm-3': {
    title: 'Setting Up Loyalty Tiers',
    type: 'interactive',
    overview: 'Create and configure a tiered loyalty program for your customers.',
    interactiveSteps: [
      {
        title: 'Navigate to Loyalty Settings',
        description: 'Access loyalty configuration',
        instruction: 'Go to Customers in the left navigation, then click the "Loyalty" tab. Click "Settings" to configure your loyalty program.',
        highlight: 'Customers > Loyalty > Settings'
      },
      {
        title: 'Enable Loyalty Program',
        description: 'Turn on the loyalty feature',
        instruction: 'Toggle "Enable Loyalty Program" to ON. This activates points earning and redemption across your system.',
        highlight: 'Enable toggle'
      },
      {
        title: 'Configure Points Rules',
        description: 'Set how customers earn points',
        instruction: 'Set the points earning rate (e.g., 1 point per R10 spent). You can also set bonus points for first purchase, referrals, or birthdays.',
        highlight: 'Points earning settings'
      },
      {
        title: 'Create Loyalty Tiers',
        description: 'Define your tier structure',
        instruction: 'Add tiers by clicking "Add Tier". Common structure: Bronze (entry), Silver (R2,000 spend), Gold (R5,000 spend), Platinum (R10,000+). Set tier names, thresholds, and benefits.',
        highlight: 'Tier configuration'
      },
      {
        title: 'Set Tier Benefits',
        description: 'What each tier receives',
        instruction: 'For each tier, configure: Points multiplier (1x, 1.5x, 2x), Discount percentage (5%, 10%, 15%), Birthday bonus, Free delivery, or custom perks.',
        highlight: 'Benefits per tier'
      },
      {
        title: 'Configure Redemption',
        description: 'How points convert to value',
        instruction: 'Set the redemption rate (e.g., 100 points = R10). Define minimum points to redeem and maximum discount per transaction.',
        highlight: 'Redemption settings'
      },
      {
        title: 'Save and Launch',
        description: 'Activate your program',
        instruction: 'Click "Save Settings" to apply. Your loyalty program is now live. Customers start earning points on their next purchase.',
        highlight: 'Save button'
      }
    ],
    tips: [
      'Keep tiers achievable - if too hard, customers disengage',
      'Offer meaningful differences between tiers',
      'Consider soft benefits (priority service, early access) alongside discounts',
      'Review and adjust tier thresholds quarterly',
      'Promote your loyalty program prominently'
    ]
  },
  'crm-4': {
    title: 'Creating Marketing Campaigns',
    type: 'video',
    overview: 'Learn how to create and send marketing campaigns to your customers.',
    videoTranscript: `
MARKETING CAMPAIGNS IN MERCHANT OS

The Marketing module helps you create targeted campaigns across multiple channels.

CAMPAIGN TYPES:

1. SMS CAMPAIGNS
   - Quick delivery (seconds)
   - High open rates (98%)
   - Cost per SMS ~R0.50
   - Best for: Promotions, reminders, alerts

2. EMAIL CAMPAIGNS
   - Rich content with images
   - Lower cost (free up to limit)
   - Trackable opens and clicks
   - Best for: Newsletters, detailed offers

3. WHATSAPP CAMPAIGNS
   - Personal messaging feel
   - Rich media support
   - Higher engagement
   - Best for: VIP offers, service updates

CREATING A CAMPAIGN:

Step 1: Select Audience
- Choose from segments (RFM, custom)
- Filter by location, tier, last purchase
- Upload custom list
- Exclude recent recipients

Step 2: Choose Channel
- SMS, Email, or WhatsApp
- Multi-channel campaigns supported

Step 3: Create Content
- Use templates or create new
- Personalization tokens available:
  {{customer_name}}
  {{loyalty_points}}
  {{last_purchase}}
  {{tier_name}}

Step 4: Schedule
- Send immediately
- Schedule for future
- Best time suggestions based on data

Step 5: Review & Send
- Preview in test mode
- Check personalization
- Confirm recipient count
- Launch campaign

CAMPAIGN ANALYTICS:

After sending, track:
- Delivered count
- Open rate (email)
- Click-through rate
- Conversions (sales from campaign)
- Revenue generated
- ROI calculation

CAMPAIGN TEMPLATES:

Pre-built templates available:
- Welcome (new customers)
- Birthday offer
- Win-back (lapsed customers)
- Promotion announcement
- Thank you (after purchase)
- Feedback request
    `,
    keyPoints: [
      'Target campaigns using RFM segments',
      'Use personalization tokens for relevance',
      'SMS has highest open rate, email best for rich content',
      'Track conversion to measure ROI',
      'Templates save time for recurring campaigns'
    ]
  },
  'crm-5': {
    title: 'WhatsApp Business Integration',
    type: 'article',
    overview: 'Set up and use WhatsApp Business for customer communication.',
    content: `
# WhatsApp Business Integration Guide

## Why WhatsApp Business?

In South Africa, WhatsApp is the most-used messaging app. Integration benefits:
- Instant customer communication
- Send receipts, updates, promotions
- Two-way conversation
- Automated responses
- Broadcast lists for marketing

## Setting Up Integration

### Prerequisites
1. WhatsApp Business account
2. Facebook Business Manager
3. Verified business phone number

### Connection Steps

1. **Access WhatsApp Settings**
   - Go to Integrations > WhatsApp Business
   - Click "Connect Account"

2. **Authorize Access**
   - Log into Facebook Business Manager
   - Select your WhatsApp Business account
   - Grant permissions to Merchant OS

3. **Configure Settings**
   - Select default phone number
   - Set business hours
   - Configure auto-reply messages

4. **Test Connection**
   - Send test message to your number
   - Verify receipt in Merchant OS

## Features Available

### Receipts via WhatsApp
After sale, click WhatsApp icon:
- Customer receives receipt link
- Opens conversation
- Great for follow-up

### Order Updates
For delivery/pickup businesses:
- Order confirmed
- Order preparing
- Ready for collection
- Out for delivery
- Delivered

### Automated Messages
Configure auto-responses:
- **Greeting**: When customer first messages
- **Away**: Outside business hours
- **FAQ**: Automatic answers to common questions

### Broadcast Lists
Send to multiple customers:
- Create contact groups
- Send promotional messages
- Track delivery and read status
- Note: Recipients must have your number saved

### Chat Inbox
Centralized message management:
- All conversations in one place
- Assign to staff members
- Add internal notes
- Track response times

## Compliance Notes

- Only message customers who opted in
- Honor opt-out requests immediately
- Include unsubscribe option
- Don't spam (max 1 promo per week recommended)
- WhatsApp may restrict for spam

## Pricing

- WhatsApp Business API charges per conversation
- First 1000 conversations/month free
- Marketing conversations cost more than utility
- Check current Meta pricing
    `,
    steps: [
      'Connect WhatsApp Business account via Integrations',
      'Configure business hours and auto-replies',
      'Enable receipt sending via WhatsApp',
      'Create broadcast lists for marketing',
      'Monitor chat inbox for customer queries'
    ]
  },

  // ===== ACCOUNTING MODULE =====
  'acc-1': {
    title: 'Chart of Accounts Overview',
    type: 'video',
    overview: 'Understand the Chart of Accounts - the foundation of your accounting system.',
    videoTranscript: `
CHART OF ACCOUNTS IN MERCHANT OS

The Chart of Accounts (COA) is a complete list of all accounts used in your financial records. It's organized by account type and forms the structure for all your financial reporting.

ACCOUNT TYPES:

1. ASSETS (1000-1999)
   Things you own:
   - Current Assets: Cash, Bank, Inventory, Receivables
   - Fixed Assets: Equipment, Vehicles, Property
   - Other Assets: Deposits, Prepayments

2. LIABILITIES (2000-2999)
   Things you owe:
   - Current Liabilities: Payables, VAT Payable, Short-term loans
   - Long-term Liabilities: Loans, Bonds
   - Deferred Revenue: Prepaid services

3. EQUITY (3000-3999)
   Owner's interest:
   - Capital Account
   - Retained Earnings
   - Drawings

4. REVENUE (4000-4999)
   Income earned:
   - Sales Revenue
   - Service Revenue
   - Other Income
   - Discounts Given (contra-revenue)

5. EXPENSES (5000-6999)
   Costs incurred:
   - Cost of Goods Sold
   - Operating Expenses
   - Salaries & Wages
   - Rent, Utilities, Marketing

DEFAULT ACCOUNTS:

Merchant OS creates these accounts automatically:
- 1100: Cash on Hand
- 1200: Bank Account
- 1300: Accounts Receivable
- 1400: Inventory
- 2000: Accounts Payable
- 2100: VAT Payable
- 3000: Owner's Equity
- 4000: Sales Revenue
- 5000: Cost of Goods Sold
- 6000: Operating Expenses

CUSTOMIZING YOUR COA:

1. Go to Accounting > Chart of Accounts
2. Add accounts specific to your business
3. Use standard numbering conventions
4. Link accounts to features:
   - POS sales → Sales Revenue account
   - Inventory → Inventory Asset account
   - VAT → VAT Payable account

ACCOUNT HIERARCHY:

Parent accounts show totals:
- 6000: Operating Expenses
  - 6100: Rent
  - 6200: Utilities
  - 6300: Marketing

This structure enables detailed reporting while keeping summaries clear.
    `,
    keyPoints: [
      'Chart of Accounts organizes all financial transactions',
      'Five main types: Assets, Liabilities, Equity, Revenue, Expenses',
      'Number ranges help identify account types',
      'Default accounts are created automatically',
      'Customize with accounts specific to your business'
    ]
  },
  'acc-2': {
    title: 'Creating Invoices',
    type: 'interactive',
    overview: 'Learn how to create and send professional invoices to your customers.',
    interactiveSteps: [
      {
        title: 'Navigate to Invoices',
        description: 'Access the invoice module',
        instruction: 'Click "Accounting" in the left navigation, then select the "Invoices" tab. You\'ll see a list of existing invoices and the "Create Invoice" button.',
        highlight: 'Accounting > Invoices'
      },
      {
        title: 'Select Customer',
        description: 'Choose who to invoice',
        instruction: 'Click "Create Invoice", then search for and select a customer. If they don\'t exist, click "New Customer" to add them.',
        highlight: 'Customer selection field'
      },
      {
        title: 'Set Invoice Details',
        description: 'Configure invoice header',
        instruction: 'Set the invoice date and due date. The system auto-generates an invoice number (INV-0001). Add a reference or PO number if applicable.',
        highlight: 'Invoice date and due date fields'
      },
      {
        title: 'Add Line Items',
        description: 'Items or services being billed',
        instruction: 'Click "Add Line Item" to add products from inventory or type in service descriptions. Enter quantity and unit price. The line total calculates automatically.',
        highlight: 'Line items section'
      },
      {
        title: 'Apply VAT',
        description: 'Tax configuration',
        instruction: 'VAT is automatically applied at 15%. If the item is zero-rated or exempt, select the appropriate tax code. VAT-inclusive pricing can be toggled.',
        highlight: 'VAT settings per line'
      },
      {
        title: 'Add Notes & Terms',
        description: 'Invoice footer information',
        instruction: 'Add payment terms (e.g., "Payment due within 30 days"), bank details for EFT, and any notes for the customer.',
        highlight: 'Notes and terms section'
      },
      {
        title: 'Preview & Send',
        description: 'Review and deliver invoice',
        instruction: 'Click "Preview" to see the final invoice. Then click "Send" to email it directly, or "Download" for PDF. The invoice is now recorded as "Sent" status.',
        highlight: 'Preview and Send buttons'
      }
    ],
    tips: [
      'Set default payment terms in Accounting Settings',
      'Enable automatic payment reminders for overdue invoices',
      'Use line item descriptions for detailed billing',
      'Record partial payments to track outstanding balance',
      'Recurring invoices can be set up for retainer clients'
    ]
  },
  'acc-3': {
    title: 'Managing Bills & Expenses',
    type: 'video',
    overview: 'Track supplier bills and business expenses for complete financial records.',
    videoTranscript: `
BILLS & EXPENSES MANAGEMENT

Track what you owe to suppliers and record business expenses.

SUPPLIER BILLS:

Recording a Bill:
1. Go to Accounting > Bills
2. Click "New Bill"
3. Select supplier (or add new)
4. Enter bill date and due date
5. Add line items:
   - Product/Service
   - Quantity
   - Unit price
   - VAT amount
6. Save as Draft or Approve

Bill Statuses:
- Draft: Not yet approved
- Awaiting Payment: Approved, unpaid
- Partially Paid: Some payments made
- Paid: Fully settled
- Overdue: Past due date, unpaid

Paying Bills:
1. Select bill to pay
2. Click "Record Payment"
3. Choose payment method
4. Enter amount (partial or full)
5. Select payment date
6. Save

EXPENSE RECORDING:

Quick Expense:
1. Go to Accounting > Expenses
2. Click "Record Expense"
3. Select expense category:
   - Travel
   - Marketing
   - Utilities
   - Office Supplies
   - Professional Fees
   - Other
4. Enter amount and date
5. Add description
6. Attach receipt (optional)
7. Save

Expense from Bill:
When you receive a supplier invoice for expenses:
1. Create a Bill (not Quick Expense)
2. Categorize line items
3. This enables better tracking

EXPENSE CATEGORIES:

Configure categories for your business:
- Rent
- Salaries
- Electricity
- Water
- Internet
- Insurance
- Marketing
- Travel
- Training
- Professional Fees
- Bank Charges
- Depreciation

Each category maps to an expense account in your Chart of Accounts.

REPORTS:

View spending by:
- Category
- Supplier
- Date range
- Payment method

This helps identify cost-saving opportunities.
    `,
    keyPoints: [
      'Bills track supplier invoices and payables',
      'Record expenses for tax-deductible costs',
      'Categorize expenses for reporting',
      'Track payment status and due dates',
      'Attach receipts for audit trail'
    ]
  },
  'acc-4': {
    title: 'Bank Reconciliation',
    type: 'interactive',
    overview: 'Learn how to reconcile your bank statements with Merchant OS records.',
    interactiveSteps: [
      {
        title: 'Access Reconciliation',
        description: 'Open the reconciliation tool',
        instruction: 'Go to Accounting > Bank Accounts. Select the bank account to reconcile, then click "Reconcile".',
        highlight: 'Accounting > Bank Accounts > Reconcile'
      },
      {
        title: 'Enter Statement Details',
        description: 'Start reconciliation session',
        instruction: 'Enter the statement end date and the closing balance from your bank statement. Click "Start Reconciliation".',
        highlight: 'Statement date and balance fields'
      },
      {
        title: 'Match Transactions',
        description: 'Reconcile each item',
        instruction: 'You\'ll see Merchant OS transactions on the left and bank statement items on the right. Match them by clicking matching items. Auto-match suggests likely matches.',
        highlight: 'Transaction matching interface'
      },
      {
        title: 'Handle Unmatched Items',
        description: 'Deal with discrepancies',
        instruction: 'If items don\'t match, check for: Missing transactions (add them), Duplicate entries (remove), Different amounts (investigate), Bank charges not recorded (add expense).',
        highlight: 'Unmatched items section'
      },
      {
        title: 'Review Summary',
        description: 'Check reconciliation status',
        instruction: 'The difference should show R0.00. If not, review unmatched items. The "Matched" count shows progress.',
        highlight: 'Reconciliation summary'
      },
      {
        title: 'Complete Reconciliation',
        description: 'Finalize the process',
        instruction: 'When difference is R0.00, click "Complete Reconciliation". This locks the reconciliation and updates your books. A reconciliation report is generated.',
        highlight: 'Complete button'
      }
    ],
    tips: [
      'Reconcile weekly or monthly for accuracy',
      'Keep bank statements organized by date',
      'Investigate discrepancies immediately',
      'Bank charges and interest are often missed',
      'Auto-reconciliation suggestions can speed up the process'
    ]
  },
  'acc-5': {
    title: 'VAT Returns (VAT 201)',
    type: 'article',
    overview: 'Understand VAT reporting and how to prepare your VAT 201 return.',
    content: `
# VAT Returns Guide (South Africa)

## VAT Basics

### VAT Rates in South Africa
- **Standard Rate**: 15% (most goods and services)
- **Zero Rate**: 0% (basic foodstuffs, exports)
- **Exempt**: No VAT (financial services, education)

### VAT Registration Threshold
- Mandatory: Turnover exceeds R1 million in 12-month period
- Voluntary: Turnover exceeds R50,000

### VAT Return Period
- Category A: Every 2 months (most businesses)
- Category B: Every 4 months (seasonal businesses)
- Category C: Every 6 months (small businesses under R30m)

## VAT 201 Form Explained

The VAT 201 return reports:

### Output VAT (VAT on Sales)
- **Block 1**: Standard rate supplies (15%)
- **Block 2**: Zero-rate supplies (0%)
- **Block 3**: Exempt supplies
- **Block 5**: Total output VAT

### Input VAT (VAT on Purchases)
- **Block 14**: Input VAT claimed

### Calculation
- **Block 11**: VAT payable (Output > Input)
- **Block 12**: VAT refundable (Input > Output)

## Generating VAT Report in Merchant OS

1. Go to Accounting > VAT Returns
2. Select the VAT period
3. Click "Generate Report"
4. System calculates:
   - Total sales (incl. VAT)
   - VAT on sales (output)
   - Total purchases (incl. VAT)
   - VAT on purchases (input)
   - Net VAT payable/refundable

5. Review breakdown by:
   - Tax type
   - Individual transactions
   - Adjustments

6. Export for eFiling:
   - Download PDF summary
   - Export to CSV for records

## Common Adjustments

### Bad Debts
If you wrote off bad debts:
- Claim input VAT refund
- Add to deductions

### Private Use
If business assets used privately:
- Apportion input VAT
- Add to output VAT

### Entertainment
Limited entertainment deductions:
- Only certain meals deductible
- Partial claim

## Best Practices

1. **Reconcile monthly** - Don't wait for VAT period
2. **Keep valid tax invoices** - Required for input claims
3. **File on time** - Last business day of month following period
4. **Pay on time** - Late payment attracts penalties
5. **Keep records** - 5 years retention required

## eFiling Integration

Merchant OS can connect to SARS eFiling:
1. Configure in Accounting > Settings
2. Authorize access
3. Pre-populate return from Merchant OS data
4. Review and submit
    `,
    steps: [
      'Ensure all transactions are recorded for the VAT period',
      'Generate VAT report from Accounting > VAT Returns',
      'Review output VAT (sales) and input VAT (purchases)',
      'Make any necessary adjustments',
      'File return on SARS eFiling by deadline'
    ]
  },
  'acc-6': {
    title: 'Financial Reports',
    type: 'video',
    overview: 'Overview of the financial reports available in Merchant OS.',
    videoTranscript: `
FINANCIAL REPORTING IN MERCHANT OS

Merchant OS provides comprehensive financial reporting for business analysis and compliance.

AVAILABLE REPORTS:

1. INCOME STATEMENT (Profit & Loss)
   Shows profitability over a period:
   - Revenue by category
   - Cost of Goods Sold
   - Gross Profit
   - Operating Expenses
   - Net Profit
   
   Uses: Performance tracking, tax planning

2. BALANCE SHEET
   Shows financial position at a point:
   - Assets (Current + Fixed)
   - Liabilities (Current + Long-term)
   - Equity
   - Net Assets
   
   Uses: Financial health assessment, loan applications

3. TRIAL BALANCE
   Lists all account balances:
   - Debit balances
   - Credit balances
   - Should balance (equal)
   
   Uses: Checking accounting accuracy, preparing reports

4. GENERAL LEDGER
   Detailed transaction history:
   - All accounts
   - Date range filtering
   - Running balances
   
   Uses: Audit trail, detailed analysis

5. CASH FLOW STATEMENT
   Shows cash movement:
   - Operating activities
   - Investing activities
   - Financing activities
   
   Uses: Cash management, planning

6. AGED RECEIVABLES
   Outstanding customer invoices:
   - Current
   - 30 days
   - 60 days
   - 90+ days
   
   Uses: Collections, credit management

7. AGED PAYABLES
   Outstanding supplier bills:
   - By supplier
   - By age
   
   Uses: Cash flow planning, supplier management

GENERATING REPORTS:

1. Go to Accounting > Reports
2. Select report type
3. Set parameters:
   - Date range
   - Location (if multi-location)
   - Comparison period
4. Click "Generate"
5. View on screen
6. Export options:
   - PDF (presentation)
   - Excel (analysis)
   - CSV (data)

REPORT SCHEDULING:

Set up automatic reports:
1. Go to Accounting > Settings > Scheduled Reports
2. Select report and frequency
3. Set recipients (email)
4. Reports delivered automatically

KEY METRICS TO TRACK:

- Gross Profit Margin: (Revenue - COGS) / Revenue
- Net Profit Margin: Net Profit / Revenue
- Current Ratio: Current Assets / Current Liabilities
- Quick Ratio: (Current Assets - Inventory) / Current Liabilities
- Debt to Equity: Total Liabilities / Equity
    `,
    keyPoints: [
      'Income Statement shows profitability over time',
      'Balance Sheet shows financial position at a moment',
      'Trial Balance verifies accounting accuracy',
      'Aged reports help manage receivables and payables',
      'Reports can be scheduled and delivered automatically'
    ]
  },

  // ===== BOOKINGS & SERVICE MANAGEMENT MODULE =====
  'book-1': {
    title: 'Setting Up Services',
    type: 'interactive',
    overview: 'Create and configure services for appointment-based businesses.',
    interactiveSteps: [
      {
        title: 'Navigate to Services',
        description: 'Access service configuration',
        instruction: 'Go to Bookings in the left navigation, then click the "Services" tab. This is where you manage all your bookable services.',
        highlight: 'Bookings > Services'
      },
      {
        title: 'Create a Service Category',
        description: 'Organize services into groups',
        instruction: 'Click "Add Category" to create service groups (e.g., "Hair Services", "Nail Services", "Massage"). Categories help customers find what they need.',
        highlight: 'Add Category button'
      },
      {
        title: 'Add a Service',
        description: 'Create a bookable service',
        instruction: 'Click "Add Service". Enter service name (e.g., "Haircut - Ladies"), select category, and add a description that customers will see.',
        highlight: 'Add Service form'
      },
      {
        title: 'Set Duration & Pricing',
        description: 'Time and cost configuration',
        instruction: 'Set the service duration in minutes (e.g., 30, 60, 90). Enter the price. You can also add variable pricing for different staff levels.',
        highlight: 'Duration and price fields'
      },
      {
        title: 'Assign Staff',
        description: 'Who can perform this service',
        instruction: 'Select which staff members can perform this service. Each staff member\'s availability will affect booking slots.',
        highlight: 'Staff assignment section'
      },
      {
        title: 'Configure Buffer Time',
        description: 'Gap between appointments',
        instruction: 'Set buffer time (e.g., 10 minutes) if you need time between appointments for cleanup or preparation.',
        highlight: 'Buffer time setting'
      },
      {
        title: 'Enable Online Booking',
        description: 'Customer self-service',
        instruction: 'Toggle "Available Online" to let customers book this service through your online booking widget. Set maximum advance booking days.',
        highlight: 'Online booking toggle'
      }
    ],
    tips: [
      'Create clear service names that customers understand',
      'Group services logically for easy navigation',
      'Consider adding service add-ons for upselling',
      'Set realistic durations to avoid running late',
      'Review and update pricing regularly'
    ]
  },
  'book-2': {
    title: 'Managing Staff & Availability',
    type: 'video',
    overview: 'Configure staff profiles and manage their booking availability.',
    videoTranscript: `
STAFF MANAGEMENT FOR BOOKINGS

Proper staff configuration ensures smooth appointment scheduling.

STAFF PROFILES:

Each staff member needs a profile with:
- Name and photo
- Role/Title
- Services they can perform
- Commission rate (if applicable)
- Contact information

To add staff:
1. Go to Bookings > Staff
2. Click "Add Staff Member"
3. Fill in details
4. Assign services
5. Set commission rates
6. Save

STAFF AVAILABILITY:

Set working hours:
1. Select staff member
2. Click "Availability"
3. Set hours for each day:
   - Start time
   - End time
   - Break times
   
Example:
- Monday: 09:00 - 17:00 (Lunch 12:00-13:00)
- Tuesday: 09:00 - 17:00 (Lunch 12:00-13:00)
- Wednesday: 09:00 - 20:00 (Late night)
- Thursday: 09:00 - 17:00
- Friday: 09:00 - 17:00
- Saturday: 09:00 - 13:00
- Sunday: Off

BLOCKING TIME:

For time off:
1. Go to Staff Calendar
2. Select staff member
3. Click "Block Time"
4. Select date and time range
5. Add reason (optional)
6. Save

Types of blocks:
- Leave/ Vacation
- Training
- Meeting
- Personal
- Emergency

SERVICE ASSIGNMENTS:

Not all staff can do all services:
1. Edit staff profile
2. Check services they can perform
3. Set service-specific duration
   (Some staff may take longer)
4. Set service-specific pricing
   (Senior staff may charge more)

PERFORMANCE TRACKING:

View per staff member:
- Appointments completed
- Revenue generated
- Average rating
- Customer retention
- Commission earned

This helps identify top performers and training needs.
    `,
    keyPoints: [
      'Each staff member has assigned services they can perform',
      'Set working hours and break times for accurate availability',
      'Block time for leave, meetings, and training',
      'Service-specific duration and pricing per staff level',
      'Track staff performance metrics for optimization'
    ]
  },
  'book-3': {
    title: 'Appointment Calendar',
    type: 'interactive',
    overview: 'Learn how to use the appointment calendar for managing bookings.',
    interactiveSteps: [
      {
        title: 'Open the Calendar',
        description: 'Access appointment scheduling',
        instruction: 'Go to Bookings in the left navigation. The Calendar view opens by default, showing today\'s appointments. Use the date picker to navigate to other days.',
        highlight: 'Bookings > Calendar'
      },
      {
        title: 'View Modes',
        description: 'Different calendar perspectives',
        instruction: 'Toggle between Day, Week, and Month views. Day view shows time slots in detail. Week view shows the week at a glance. Filter by staff member using the dropdown.',
        highlight: 'View mode buttons'
      },
      {
        title: 'Create Appointment',
        description: 'Book a new appointment',
        instruction: 'Click on an empty time slot or the "New Appointment" button. Select customer (or add new), choose service, select staff, and confirm time. Click "Save" to book.',
        highlight: 'Empty time slot / New Appointment button'
      },
      {
        title: 'Edit Appointment',
        description: 'Modify existing booking',
        instruction: 'Click on any appointment to open details. You can change time (drag and drop), reschedule, change staff, add notes, or cancel. Changes are logged.',
        highlight: 'Click on appointment'
      },
      {
        title: 'Check-in & Complete',
        description: 'Update appointment status',
        instruction: 'When customer arrives, click "Check In". When service is complete, click "Complete". This triggers any automated follow-up messages.',
        highlight: 'Status buttons in appointment'
      },
      {
        title: 'Handle No-Shows',
        description: 'Mark missed appointments',
        instruction: 'If customer doesn\'t arrive, click "No Show". This records it on their profile and can trigger policies (deposit requirement, cancellation fee).',
        highlight: 'No Show button'
      }
    ],
    tips: [
      'Color-code appointments by service type or staff',
      'Use drag-and-drop to reschedule quickly',
      'Enable appointment reminders to reduce no-shows',
      'Add notes during appointments for future reference',
      'Review daily schedule each morning'
    ]
  },
  'book-4': {
    title: 'Online Booking Widget',
    type: 'article',
    overview: 'Set up and customize your online booking widget for customer self-service.',
    content: `
# Online Booking Widget Guide

## What is the Booking Widget?

The online booking widget allows customers to book appointments 24/7 through your website or a direct link, even when your business is closed.

## Enabling the Widget

1. Go to Bookings > Settings > Online Booking
2. Toggle "Enable Online Booking" to ON
3. Configure your booking settings
4. Share your booking link

## Widget Settings

### Business Information
- Business name
- Logo
- Contact details
- Address with map

### Booking Rules
- **Advance Booking**: How far ahead can customers book?
  - Minimum: 1 hour
  - Maximum: 30, 60, 90 days
  
- **Cancellation Policy**: When can customers cancel?
  - Free cancellation: 24 hours before
  
- **Deposit Requirements**: Require deposit?
  - Percentage of service price
  - Fixed amount
  - No deposit

### Service Availability
- Select which services are bookable online
- Hide services that require phone booking
- Show pricing (or hide)

### Staff Display
- Let customers choose specific staff
- Or assign automatically
- Show staff photos and bios

## Integration Options

### Direct Link
Share your unique booking URL:
\`https://book.groway.co.za/yourbusiness\`

Add to:
- Email signature
- Social media profiles
- Business cards

### Website Embed
Add booking widget to your website:

**Option 1: Popup Widget**
Add script to your website header:
\`\`\`
<script src="https://book.groway.co.za/widget.js" 
        data-business="yourbusiness">
</script>
\`\`\`

**Option 2: Embedded Calendar**
Insert iframe where you want it:
\`\`\`
<iframe src="https://book.groway.co.za/embed/yourbusiness" 
        width="100%" height="600">
</iframe>
\`\`\`

### Social Media
Add "Book Now" button to:
- Facebook Page
- Instagram Profile
- Google Business Profile

## Customization

### Branding
- Colors to match your brand
- Custom welcome message
- Terms and conditions

### Notifications
- Email confirmation to customer
- SMS reminder before appointment
- Follow-up after appointment

## Tracking & Analytics

View in Bookings > Reports:
- Online bookings vs. manual
- Most popular services
- Conversion rate
- Peak booking times

## Best Practices

1. **Keep availability updated** - Block time for staff leave
2. **Respond to online requests quickly** - Within business hours
3. **Use quality photos** - Staff and service images
4. **Clear service descriptions** - Help customers choose
5. **Mobile-friendly** - Most bookings are on phones
    `,
    steps: [
      'Enable online booking in Bookings Settings',
      'Select which services are available online',
      'Configure booking rules (advance, cancellation)',
      'Set up deposit requirements if applicable',
      'Share link and embed on website'
    ]
  },
  'book-5': {
    title: 'SMS Reminders & Deposits',
    type: 'video',
    overview: 'Configure automated reminders and deposit collection to reduce no-shows.',
    videoTranscript: `
REDUCING NO-SHOWS WITH AUTOMATION

No-shows cost your business money. Automated reminders and deposits significantly reduce missed appointments.

SMS REMINDERS:

Configure automatic reminders:
1. Go to Bookings > Settings > Reminders
2. Enable SMS Reminders
3. Set reminder schedule:
   - 24 hours before appointment
   - 2 hours before appointment
   - Or custom timing

4. Customize message template:
   "Hi {{customer_name}}, this is a reminder of your 
   {{service_name}} appointment at {{business_name}} 
   on {{date}} at {{time}}. Reply CANCEL to cancel."

SMS Costs:
- Per message sent
- Configure SMS provider in Integrations
- Budget for reminder costs

EMAIL REMINDERS:

Free alternative to SMS:
- Same scheduling options
- Rich content with images
- Include confirmation link
- Lower open rate than SMS

DEPOSIT COLLECTION:

Require deposits for bookings:

1. Go to Bookings > Settings > Deposits
2. Enable "Require Deposit"
3. Set deposit type:
   - Percentage (e.g., 50% of service)
   - Fixed amount (e.g., R100)
   - Per service (different amounts)

4. Configure collection:
   - Pay at booking
   - Pay within X hours of booking
   - Auto-cancel if not paid

5. Payment methods:
   - Credit/Debit Card (PayFast, Yoco)
   - EFT/Ozow QR
   - Wallet/Loyalty Points

Deposit Rules:
- Deposit is held until appointment
- Deducted from final payment
- Forfeit if no-show (configurable)
- Refundable if cancelled in time

NO-SHOW POLICIES:

Configure consequences:
1. First no-show: Warning
2. Second no-show: Deposit required for future bookings
3. Third no-show: Blocked from online booking

These settings are in Bookings > Settings > Policies.

NOTIFICATION TEMPLATES:

Customize all customer communications:

- Booking Confirmation
- Reminder (24hr, 2hr)
- Reschedule Notification
- Cancellation Confirmation
- Follow-up/Feedback Request

Use personalization tokens for relevance.

ANALYTICS:

Track effectiveness:
- Reminder delivery rate
- No-show rate (before/after)
- Deposit collection rate
- Revenue saved
    `,
    keyPoints: [
      'SMS reminders have highest delivery and read rates',
      'Send multiple reminders (24hr + 2hr before)',
      'Deposits significantly reduce no-shows',
      'Configure no-show policies to protect your business',
      'Track no-show rates to measure effectiveness'
    ]
  }
}

// Sample training modules
const initialModules: TrainingModule[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with Merchant OS',
    description: 'Learn the basics of setting up your business on Groway',
    duration: '15 min',
    category: 'getting-started',
    completed: false,
    progress: 0,
    lessons: [
      { id: 'gs-1', title: 'Welcome to Groway Merchant OS', duration: '2 min', type: 'video', completed: false },
      { id: 'gs-2', title: 'Selecting Your Business Vertical', duration: '3 min', type: 'interactive', completed: false },
      { id: 'gs-3', title: 'Understanding the Dashboard', duration: '4 min', type: 'video', completed: false },
      { id: 'gs-4', title: 'Quick Setup Checklist', duration: '3 min', type: 'article', completed: false },
      { id: 'gs-5', title: 'Getting Started Quiz', duration: '3 min', type: 'quiz', completed: false },
    ]
  },
  {
    id: 'pos-basics',
    title: 'Point of Sale Fundamentals',
    description: 'Master the POS system for fast and accurate sales',
    duration: '20 min',
    category: 'pos',
    completed: false,
    progress: 0,
    lessons: [
      { id: 'pos-1', title: 'Navigating the POS Screen', duration: '3 min', type: 'video', completed: false },
      { id: 'pos-2', title: 'Adding Items to Cart', duration: '4 min', type: 'interactive', completed: false },
      { id: 'pos-3', title: 'Processing Payments', duration: '5 min', type: 'video', completed: false },
      { id: 'pos-4', title: 'Handling Discounts & Offers', duration: '3 min', type: 'article', completed: false },
      { id: 'pos-5', title: 'Printing Receipts', duration: '2 min', type: 'video', completed: false },
      { id: 'pos-6', title: 'POS Quiz', duration: '3 min', type: 'quiz', completed: false },
    ]
  },
  {
    id: 'inventory-management',
    title: 'Inventory Management',
    description: 'Track stock, manage suppliers, and optimize ordering',
    duration: '25 min',
    category: 'inventory',
    completed: false,
    progress: 0,
    lessons: [
      { id: 'inv-1', title: 'Understanding Inventory Dashboard', duration: '4 min', type: 'video', completed: false },
      { id: 'inv-2', title: 'Adding Products & SKUs', duration: '5 min', type: 'interactive', completed: false },
      { id: 'inv-3', title: 'Stock Movements & Adjustments', duration: '4 min', type: 'video', completed: false },
      { id: 'inv-4', title: 'Running a Stocktake', duration: '5 min', type: 'interactive', completed: false },
      { id: 'inv-5', title: 'Reorder Points & Alerts', duration: '3 min', type: 'article', completed: false },
      { id: 'inv-6', title: 'GroSupply Integration', duration: '4 min', type: 'video', completed: false },
    ]
  },
  {
    id: 'customer-management',
    title: 'Customer & Loyalty Management',
    description: 'Build customer relationships and loyalty programs',
    duration: '18 min',
    category: 'customers',
    completed: false,
    progress: 0,
    lessons: [
      { id: 'crm-1', title: 'Customer Profiles', duration: '3 min', type: 'video', completed: false },
      { id: 'crm-2', title: 'RFM Segmentation Explained', duration: '4 min', type: 'article', completed: false },
      { id: 'crm-3', title: 'Setting Up Loyalty Tiers', duration: '4 min', type: 'interactive', completed: false },
      { id: 'crm-4', title: 'Creating Marketing Campaigns', duration: '4 min', type: 'video', completed: false },
      { id: 'crm-5', title: 'WhatsApp Business Integration', duration: '3 min', type: 'article', completed: false },
    ]
  },
  {
    id: 'accounting-basics',
    title: 'Accounting & Financial Reports',
    description: 'Manage invoices, track expenses, and generate reports',
    duration: '22 min',
    category: 'accounting',
    completed: false,
    progress: 0,
    lessons: [
      { id: 'acc-1', title: 'Chart of Accounts Overview', duration: '4 min', type: 'video', completed: false },
      { id: 'acc-2', title: 'Creating Invoices', duration: '5 min', type: 'interactive', completed: false },
      { id: 'acc-3', title: 'Managing Bills & Expenses', duration: '4 min', type: 'video', completed: false },
      { id: 'acc-4', title: 'Bank Reconciliation', duration: '4 min', type: 'interactive', completed: false },
      { id: 'acc-5', title: 'VAT Returns (VAT 201)', duration: '3 min', type: 'article', completed: false },
      { id: 'acc-6', title: 'Financial Reports', duration: '2 min', type: 'video', completed: false },
    ]
  },
  {
    id: 'bookings-services',
    title: 'Bookings & Service Management',
    description: 'Manage appointments for service businesses',
    duration: '20 min',
    category: 'advanced',
    completed: false,
    progress: 0,
    lessons: [
      { id: 'book-1', title: 'Setting Up Services', duration: '4 min', type: 'interactive', completed: false },
      { id: 'book-2', title: 'Managing Staff & Availability', duration: '4 min', type: 'video', completed: false },
      { id: 'book-3', title: 'Appointment Calendar', duration: '4 min', type: 'interactive', completed: false },
      { id: 'book-4', title: 'Online Booking Widget', duration: '4 min', type: 'article', completed: false },
      { id: 'book-5', title: 'SMS Reminders & Deposits', duration: '4 min', type: 'video', completed: false },
    ]
  },
]

// Support ticket interface
interface SupportTicket {
  id: string
  subject: string
  status: 'open' | 'in-progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  createdAt: string
  category: string
}

// FAQ interface
interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  helpful: number
}

const faqs: FAQ[] = [
  {
    id: '1',
    question: 'How do I add a new product to inventory?',
    answer: 'Navigate to Inventory > Products tab, then click the "Add Product" button. Fill in the product details including name, SKU, price, cost, and stock quantity. You can also set reorder points and batch tracking options.',
    category: 'Inventory',
    helpful: 156
  },
  {
    id: '2',
    question: 'How do I process a refund?',
    answer: 'Go to Transactions, find the transaction you want to refund, click on it to view details, and select "Refund". You can process full or partial refunds. The refund will be processed back to the original payment method.',
    category: 'POS',
    helpful: 134
  },
  {
    id: '3',
    question: 'How do I set up my loyalty program?',
    answer: 'Navigate to CRM & Loyalty > Loyalty tab. You can create tiers (Bronze, Silver, Gold, Platinum), set points earning rules, and define rewards. Customers automatically earn points on purchases.',
    category: 'CRM',
    helpful: 98
  },
  {
    id: '4',
    question: 'How does offline mode work?',
    answer: 'Merchant OS works offline for up to 72 hours. Sales made offline are stored locally and automatically sync when connection is restored. You\'ll see an offline indicator in the header when not connected.',
    category: 'System',
    helpful: 87
  },
  {
    id: '5',
    question: 'How do I connect my payment terminal?',
    answer: 'Go to Hardware > Payment Terminals. Click "Connect Device" and follow the pairing instructions for your specific terminal (Yoco, Pax, Verifone). The system will detect the device automatically.',
    category: 'Hardware',
    helpful: 112
  },
  {
    id: '6',
    question: 'How do I export financial reports?',
    answer: 'In Accounting > Reports tab, select the report type and date range. Click "Export" to download as PDF or Excel. You can also schedule automatic report generation and email delivery.',
    category: 'Accounting',
    helpful: 76
  },
]

export function TrainingView() {
  const [modules, setModules] = useState<TrainingModule[]>(initialModules)
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('modules')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  
  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  
  // Interactive tutorial state
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  
  // Calculate overall progress
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const completedLessons = modules.reduce((sum, m) => sum + m.lessons.filter(l => l.completed).length, 0)
  const overallProgress = Math.round((completedLessons / totalLessons) * 100)
  
  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'getting-started': return GraduationCap
      case 'pos': return Store
      case 'inventory': return Package
      case 'customers': return Users
      case 'accounting': return Calculator
      case 'advanced': return Zap
      default: return BookOpen
    }
  }
  
  // Get lesson type icon
  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video
      case 'article': return FileText
      case 'quiz': return Target
      case 'interactive': return Lightbulb
      default: return BookOpen
    }
  }
  
  // Mark lesson as complete
  const markLessonComplete = (moduleId: string, lessonId: string) => {
    setModules(prev => prev.map(m => {
      if (m.id === moduleId) {
        const updatedLessons = m.lessons.map(l => 
          l.id === lessonId ? { ...l, completed: true } : l
        )
        const progress = Math.round((updatedLessons.filter(l => l.completed).length / updatedLessons.length) * 100)
        return { 
          ...m, 
          lessons: updatedLessons,
          progress,
          completed: progress === 100
        }
      }
      return m
    }))
    setLessonDialogOpen(false)
    setSelectedLesson(null)
    // Reset quiz and interactive states
    setQuizAnswers({})
    setQuizSubmitted(false)
    setQuizScore(0)
    setCurrentStep(0)
    setCompletedSteps(new Set())
  }
  
  // Open lesson
  const openLesson = (module: TrainingModule, lesson: Lesson) => {
    setSelectedModule(module)
    setSelectedLesson(lesson)
    setLessonDialogOpen(true)
    // Reset states when opening new lesson
    setQuizAnswers({})
    setQuizSubmitted(false)
    setQuizScore(0)
    setCurrentStep(0)
    setCompletedSteps(new Set())
  }
  
  // Toggle module expansion
  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }
  
  // Filter modules by category
  const filteredModules = modules.filter(m => {
    if (!searchQuery) return true
    return m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           m.description.toLowerCase().includes(searchQuery.toLowerCase())
  })
  
  // Get modules by category
  const modulesByCategory = {
    'getting-started': modules.filter(m => m.category === 'getting-started'),
    'pos': modules.filter(m => m.category === 'pos'),
    'inventory': modules.filter(m => m.category === 'inventory'),
    'customers': modules.filter(m => m.category === 'customers'),
    'accounting': modules.filter(m => m.category === 'accounting'),
    'advanced': modules.filter(m => m.category === 'advanced'),
  }
  
  // Get lesson content
  const getLessonContent = (lessonId: string): LessonContentData | undefined => {
    return lessonContentMap[lessonId]
  }
  
  // Handle quiz answer selection
  const handleQuizAnswer = (questionIndex: number, answerIndex: number) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }))
  }
  
  // Submit quiz
  const submitQuiz = () => {
    const content = getLessonContent(selectedLesson?.id || '')
    if (!content?.quizQuestions) return
    
    let correct = 0
    content.quizQuestions.forEach((q, index) => {
      if (quizAnswers[index] === q.correctAnswer) {
        correct++
      }
    })
    
    setQuizScore(correct)
    setQuizSubmitted(true)
  }
  
  // Complete interactive step
  const completeStep = () => {
    const content = getLessonContent(selectedLesson?.id || '')
    if (!content?.interactiveSteps) return
    
    setCompletedSteps(prev => new Set([...prev, currentStep]))
    
    if (currentStep < content.interactiveSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    }
  }
  
  // Navigate to previous lesson
  const goToPreviousLesson = () => {
    if (!selectedModule || !selectedLesson) return
    const currentIndex = selectedModule.lessons.indexOf(selectedLesson)
    if (currentIndex > 0) {
      const prevLesson = selectedModule.lessons[currentIndex - 1]
      setSelectedLesson(prevLesson)
      // Reset states
      setQuizAnswers({})
      setQuizSubmitted(false)
      setQuizScore(0)
      setCurrentStep(0)
      setCompletedSteps(new Set())
    }
  }
  
  // Navigate to next lesson
  const goToNextLesson = () => {
    if (!selectedModule || !selectedLesson) return
    const currentIndex = selectedModule.lessons.indexOf(selectedLesson)
    if (currentIndex < selectedModule.lessons.length - 1) {
      const nextLesson = selectedModule.lessons[currentIndex + 1]
      setSelectedLesson(nextLesson)
      // Reset states
      setQuizAnswers({})
      setQuizSubmitted(false)
      setQuizScore(0)
      setCurrentStep(0)
      setCompletedSteps(new Set())
    }
  }
  
  // Render lesson content based on type
  const renderLessonContent = () => {
    if (!selectedLesson) return null
    
    const content = getLessonContent(selectedLesson.id)
    if (!content) {
      return (
        <div className="bg-[#FAFAFA] rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-[#757575] mx-auto mb-4" />
          <p className="text-[#757575]">Content for this lesson is being prepared.</p>
        </div>
      )
    }
    
    // Video Lesson - Show detailed transcript/tutorial
    if (selectedLesson.type === 'video') {
      return (
        <div className="space-y-4">
          {/* Video placeholder with play icon */}
          <div className="bg-gradient-to-br from-[#00897B] to-[#00695C] rounded-lg p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
              <Play className="h-10 w-10 text-white" />
            </div>
            <p className="text-white/90 text-sm">Video Tutorial</p>
            <p className="text-white font-medium mt-1">{content.title}</p>
          </div>
          
          {/* Overview */}
          <div className="bg-[#E0F2F1] rounded-lg p-4">
            <h4 className="font-semibold text-[#00897B] mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Overview
            </h4>
            <p className="text-sm text-[#1A1A1A]">{content.overview}</p>
          </div>
          
          {/* Video Transcript/Tutorial Content */}
          {content.videoTranscript && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-[#1A1A1A] mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#00897B]" />
                Tutorial Content
              </h4>
              <div className="prose prose-sm max-w-none">
                {content.videoTranscript.split('\n').map((line, index) => {
                  const trimmedLine = line.trim()
                  if (!trimmedLine) return <br key={index} />
                  if (trimmedLine.startsWith('•')) {
                    return (
                      <div key={index} className="flex items-start gap-2 text-sm text-[#1A1A1A] mb-1">
                        <span className="text-[#00897B]">•</span>
                        <span>{trimmedLine.substring(1).trim()}</span>
                      </div>
                    )
                  }
                  if (trimmedLine.match(/^[A-Z][A-Z\s]+:$/)) {
                    return (
                      <h5 key={index} className="font-semibold text-[#00897B] mt-4 mb-2">
                        {trimmedLine}
                      </h5>
                    )
                  }
                  if (trimmedLine.match(/^[0-9]+\./)) {
                    return (
                      <div key={index} className="flex items-start gap-2 text-sm text-[#1A1A1A] mb-1 ml-4">
                        <span>{trimmedLine}</span>
                      </div>
                    )
                  }
                  return (
                    <p key={index} className="text-sm text-[#1A1A1A] mb-2">
                      {trimmedLine}
                    </p>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Key Points */}
          {content.keyPoints && (
            <div className="bg-[#FFF8E1] border border-[#FFB300]/30 rounded-lg p-4">
              <h4 className="font-semibold text-[#FF8F00] mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Key Takeaways
              </h4>
              <ul className="space-y-2">
                {content.keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                    <CheckCircle2 className="h-4 w-4 text-[#00897B] mt-0.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )
    }
    
    // Article Lesson
    if (selectedLesson.type === 'article') {
      return (
        <div className="space-y-4">
          {/* Overview */}
          <div className="bg-[#E0F2F1] rounded-lg p-4">
            <h4 className="font-semibold text-[#00897B] mb-2">{content.overview}</h4>
          </div>
          
          {/* Article Content */}
          {content.content && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="prose prose-sm max-w-none">
                {content.content.split('\n').map((line, index) => {
                  const trimmedLine = line.trim()
                  if (!trimmedLine) return <br key={index} />
                  if (trimmedLine.startsWith('# ')) {
                    return (
                      <h2 key={index} className="text-lg font-bold text-[#1A1A1A] mt-4 mb-2">
                        {trimmedLine.substring(2)}
                      </h2>
                    )
                  }
                  if (trimmedLine.startsWith('## ')) {
                    return (
                      <h3 key={index} className="text-base font-semibold text-[#00897B] mt-4 mb-2">
                        {trimmedLine.substring(3)}
                      </h3>
                    )
                  }
                  if (trimmedLine.startsWith('- [ ]')) {
                    return (
                      <div key={index} className="flex items-center gap-2 text-sm text-[#1A1A1A] mb-1 ml-4">
                        <div className="w-4 h-4 border border-gray-300 rounded" />
                        <span>{trimmedLine.substring(6)}</span>
                      </div>
                    )
                  }
                  if (trimmedLine.startsWith('- ')) {
                    return (
                      <div key={index} className="flex items-start gap-2 text-sm text-[#1A1A1A] mb-1 ml-4">
                        <span className="text-[#00897B]">•</span>
                        <span>{trimmedLine.substring(2)}</span>
                      </div>
                    )
                  }
                  if (trimmedLine.match(/^\d+\./)) {
                    return (
                      <div key={index} className="text-sm text-[#1A1A1A] mb-1 ml-4">
                        {trimmedLine}
                      </div>
                    )
                  }
                  return (
                    <p key={index} className="text-sm text-[#1A1A1A] mb-2">
                      {trimmedLine}
                    </p>
                  )
                })}
              </div>
            </div>
          )}
          
          {/* Steps */}
          {content.steps && (
            <div className="bg-[#E3F2FD] border border-[#2196F3]/30 rounded-lg p-4">
              <h4 className="font-semibold text-[#1976D2] mb-3 flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Quick Steps
              </h4>
              <ol className="space-y-2">
                {content.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#1976D2] text-white text-xs flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-[#1A1A1A]">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )
    }
    
    // Interactive Lesson
    if (selectedLesson.type === 'interactive') {
      const steps = content.interactiveSteps || []
      const currentStepData = steps[currentStep]
      const progress = steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0
      
      return (
        <div className="space-y-4">
          {/* Overview */}
          <div className="bg-[#E0F2F1] rounded-lg p-4">
            <h4 className="font-semibold text-[#00897B] mb-2">{content.overview}</h4>
          </div>
          
          {/* Progress */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#1A1A1A]">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm text-[#757575]">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Step indicators */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  index === currentStep
                    ? 'bg-[#00897B] text-white'
                    : completedSteps.has(index)
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-[#757575]'
                }`}
              >
                {completedSteps.has(index) ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="w-5 h-5 rounded-full border border-current text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                )}
                <span className="hidden sm:inline">{step.title}</span>
              </button>
            ))}
          </div>
          
          {/* Current Step Content */}
          {currentStepData && (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-[#00897B] text-white p-4">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm">
                    {currentStep + 1}
                  </span>
                  {currentStepData.title}
                </h4>
                <p className="text-white/80 text-sm mt-1">{currentStepData.description}</p>
              </div>
              <div className="p-4">
                <div className="bg-[#FAFAFA] rounded-lg p-4 mb-4">
                  <h5 className="font-medium text-[#1A1A1A] mb-2 flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-[#00897B]" />
                    Instructions
                  </h5>
                  <p className="text-sm text-[#1A1A1A]">{currentStepData.instruction}</p>
                </div>
                {currentStepData.highlight && (
                  <div className="bg-[#FFF8E1] border border-[#FFB300]/30 rounded-lg p-3 mb-4">
                    <p className="text-sm text-[#FF8F00] flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span className="font-medium">Look for:</span> {currentStepData.highlight}
                    </p>
                  </div>
                )}
                <Button
                  onClick={completeStep}
                  className="w-full bg-[#00897B] hover:bg-[#00695C]"
                >
                  {currentStep < steps.length - 1 ? (
                    <>
                      Mark Complete & Continue
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Complete Tutorial
                      <CheckCircle2 className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
          {/* Tips */}
          {content.tips && (
            <div className="bg-[#FFF8E1] border border-[#FFB300]/30 rounded-lg p-4">
              <h4 className="font-semibold text-[#FF8F00] mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Pro Tips
              </h4>
              <ul className="space-y-2">
                {content.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-[#1A1A1A]">
                    <Star className="h-4 w-4 text-[#FFB300] mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )
    }
    
    // Quiz Lesson
    if (selectedLesson.type === 'quiz') {
      const questions = content.quizQuestions || []
      const allAnswered = questions.length > 0 && questions.every((_, index) => quizAnswers[index] !== undefined)
      
      return (
        <div className="space-y-4">
          {/* Overview */}
          <div className="bg-[#E0F2F1] rounded-lg p-4">
            <h4 className="font-semibold text-[#00897B] mb-2">{content.overview}</h4>
            <p className="text-sm text-[#1A1A1A]">
              Answer all {questions.length} questions to test your understanding.
            </p>
          </div>
          
          {/* Questions */}
          {questions.map((q, qIndex) => {
            const selectedAnswer = quizAnswers[qIndex]
            const isCorrect = selectedAnswer === q.correctAnswer
            
            return (
              <div key={qIndex} className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-[#1A1A1A] mb-3 flex items-start gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#00897B] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {qIndex + 1}
                  </span>
                  {q.question}
                </h4>
                <div className="space-y-2 ml-8">
                  {q.options.map((option, aIndex) => {
                    const isSelected = selectedAnswer === aIndex
                    const isCorrectAnswer = aIndex === q.correctAnswer
                    
                    let optionClass = 'border-gray-200 hover:border-[#00897B]'
                    if (quizSubmitted) {
                      if (isCorrectAnswer) {
                        optionClass = 'border-green-500 bg-green-50'
                      } else if (isSelected && !isCorrect) {
                        optionClass = 'border-red-500 bg-red-50'
                      }
                    } else if (isSelected) {
                      optionClass = 'border-[#00897B] bg-[#E0F2F1]'
                    }
                    
                    return (
                      <button
                        key={aIndex}
                        onClick={() => !quizSubmitted && handleQuizAnswer(qIndex, aIndex)}
                        disabled={quizSubmitted}
                        className={`w-full p-3 text-left rounded-lg border transition-colors ${optionClass} ${
                          quizSubmitted ? 'cursor-default' : 'cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-medium">
                            {String.fromCharCode(65 + aIndex)}
                          </span>
                          <span className="text-sm text-[#1A1A1A]">{option}</span>
                          {quizSubmitted && isCorrectAnswer && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                          )}
                          {quizSubmitted && isSelected && !isCorrect && (
                            <X className="h-4 w-4 text-red-500 ml-auto" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
                
                {/* Explanation after submit */}
                {quizSubmitted && (
                  <div className={`mt-3 ml-8 p-3 rounded-lg ${
                    isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className="text-sm text-[#1A1A1A]">
                      <span className="font-medium">{isCorrect ? '✓ Correct!' : '✗ Incorrect.'}</span>{' '}
                      {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            )
          })}
          
          {/* Submit/Results */}
          {!quizSubmitted ? (
            <Button
              onClick={submitQuiz}
              disabled={!allAnswered}
              className="w-full bg-[#00897B] hover:bg-[#00695C] disabled:bg-gray-300"
            >
              Submit Quiz
            </Button>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center ${
                  quizScore === questions.length ? 'bg-green-100' :
                  quizScore >= questions.length / 2 ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  {quizScore === questions.length ? (
                    <Trophy className="h-8 w-8 text-green-500" />
                  ) : (
                    <Target className={`h-8 w-8 ${
                      quizScore >= questions.length / 2 ? 'text-yellow-500' : 'text-red-500'
                    }`} />
                  )}
                </div>
                <h4 className="font-semibold text-[#1A1A1A] text-lg">
                  {quizScore === questions.length ? 'Perfect Score!' :
                   quizScore >= questions.length / 2 ? 'Good Job!' : 'Keep Learning!'}
                </h4>
                <p className="text-[#757575] text-sm mt-1">
                  You got {quizScore} out of {questions.length} questions correct ({Math.round((quizScore / questions.length) * 100)}%)
                </p>
                {quizScore < questions.length && (
                  <p className="text-sm text-[#00897B] mt-2">
                    Review the explanations above to improve your understanding.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )
    }
    
    return null
  }
  
  return (
    <div className="h-full flex flex-col bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1A1A1A] flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-[#00897B]" />
              Training & Support
            </h1>
            <p className="text-sm text-[#757575]">Learn to master Merchant OS</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-[#E0F2F1] text-[#00897B] border-[#00897B]/30">
              <Trophy className="h-3 w-3 mr-1" />
              {completedLessons}/{totalLessons} Lessons
            </Badge>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#757575]">Overall Progress</span>
            <span className="font-medium text-[#00897B]">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4">
            <TabsList className="h-12 bg-transparent">
              <TabsTrigger value="modules" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <BookOpen className="h-4 w-4 mr-2" />
                Training Modules
              </TabsTrigger>
              <TabsTrigger value="faq" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <HelpCircle className="h-4 w-4 mr-2" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="support" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <MessageCircle className="h-4 w-4 mr-2" />
                Contact Support
              </TabsTrigger>
              <TabsTrigger value="resources" className="data-[state=active]:bg-[#E0F2F1] data-[state=active]:text-[#00897B]">
                <FileText className="h-4 w-4 mr-2" />
                Resources
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-auto">
            {/* Training Modules Tab */}
            <TabsContent value="modules" className="m-0 p-4 space-y-4">
              {/* Recommended Section */}
              {overallProgress < 100 && (
                <Card className="bg-gradient-to-r from-[#00897B]/10 to-[#4CAF50]/10 border-[#00897B]/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#00897B] text-white flex items-center justify-center">
                        <Lightbulb className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[#1A1A1A] mb-1">Continue Learning</h3>
                        <p className="text-sm text-[#757575] mb-2">
                          Complete your training to unlock all features
                        </p>
                        {modules.filter(m => !m.completed).length > 0 && (
                          <Button 
                            size="sm" 
                            className="bg-[#00897B] hover:bg-[#00695C]"
                            onClick={() => {
                              const nextModule = modules.find(m => !m.completed)
                              if (nextModule) {
                                const nextLesson = nextModule.lessons.find(l => !l.completed)
                                if (nextLesson) openLesson(nextModule, nextLesson)
                              }
                            }}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Continue
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Module Categories */}
              {Object.entries(modulesByCategory).map(([category, categoryModules]) => (
                categoryModules.length > 0 && (
                  <div key={category} className="space-y-3">
                    <h3 className="text-sm font-semibold text-[#757575] uppercase tracking-wide flex items-center gap-2">
                      {getCategoryIcon(category) && (
                        <div className="w-5 h-5 rounded bg-gray-200 flex items-center justify-center">
                          {(() => {
                            const Icon = getCategoryIcon(category)
                            return <Icon className="h-3 w-3 text-[#757575]" />
                          })()}
                        </div>
                      )}
                      {category.replace('-', ' ')}
                    </h3>
                    <div className="grid gap-3">
                      {categoryModules.map(module => {
                        const isExpanded = expandedModules.has(module.id)
                        
                        return (
                        <Card key={module.id} className="hover:border-[#00897B]/30 transition-colors">
                          <CardContent className="p-4">
                            {/* Module Header */}
                            <button 
                              className="w-full flex items-start gap-3 text-left"
                              onClick={() => toggleModuleExpansion(module.id)}
                            >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                module.completed 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-[#E0F2F1] text-[#00897B]'
                              }`}>
                                {module.completed ? (
                                  <CheckCircle2 className="h-5 w-5" />
                                ) : (
                                  <GraduationCap className="h-5 w-5" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <h4 className="font-semibold text-[#1A1A1A]">{module.title}</h4>
                                  <div className="flex items-center gap-2">
                                    {module.completed && (
                                      <Badge className="bg-green-100 text-green-700 text-[10px]">
                                        Completed
                                      </Badge>
                                    )}
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-[#757575]" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-[#757575]" />
                                    )}
                                  </div>
                                </div>
                                <p className="text-xs text-[#757575] mb-2">{module.description}</p>
                                <div className="flex items-center gap-4 text-xs text-[#757575]">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {module.duration}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <BookOpen className="h-3 w-3" />
                                    {module.lessons.length} lessons
                                  </span>
                                  <span className="flex items-center gap-1">
                                    {module.lessons.filter(l => l.completed).length}/{module.lessons.length} done
                                  </span>
                                </div>
                                <div className="mt-2">
                                  <Progress value={module.progress} className="h-1.5" />
                                </div>
                              </div>
                            </button>
                            
                            {/* Expandable Lessons List */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                {module.lessons.map((lesson, index) => {
                                  const LessonIcon = getLessonTypeIcon(lesson.type)
                                  return (
                                    <button
                                      key={lesson.id}
                                      onClick={() => openLesson(module, lesson)}
                                      className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#FAFAFA] hover:bg-[#E0F2F1] transition-colors text-left"
                                    >
                                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white border border-gray-200 text-xs font-medium text-[#757575]">
                                        {index + 1}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <LessonIcon className="h-4 w-4 text-[#00897B]" />
                                          <span className="text-sm font-medium text-[#1A1A1A]">{lesson.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                          <span className="text-xs text-[#757575]">{lesson.duration}</span>
                                          <Badge variant="outline" className="text-[10px] capitalize">{lesson.type}</Badge>
                                        </div>
                                      </div>
                                      {lesson.completed ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                      ) : (
                                        <Play className="h-4 w-4 text-[#00897B]" />
                                      )}
                                    </button>
                                  )
                                })}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                        )
                      })}
                    </div>
                  </div>
                )
              ))}
            </TabsContent>
            
            {/* FAQ Tab */}
            <TabsContent value="faq" className="m-0 p-4 space-y-4">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 px-4 rounded-lg border border-gray-200 focus:outline-none focus:border-[#00897B]"
                />
              </div>
              
              {faqs.filter(f => 
                !searchQuery || 
                f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                f.answer.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(faq => (
                <Card key={faq.id} className="hover:border-[#00897B]/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center flex-shrink-0">
                        <HelpCircle className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-[#1A1A1A] mb-2">{faq.question}</h4>
                        <p className="text-sm text-[#757575]">{faq.answer}</p>
                        <div className="flex items-center justify-between mt-3">
                          <Badge variant="outline" className="text-[10px]">{faq.category}</Badge>
                          <button className="flex items-center gap-1 text-xs text-[#00897B] hover:text-[#00695C]">
                            <ThumbsUp className="h-3 w-3" />
                            Helpful ({faq.helpful})
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            
            {/* Contact Support Tab */}
            <TabsContent value="support" className="m-0 p-4 space-y-4">
              {/* Contact Options */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:border-[#00897B]/30 transition-colors cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center mx-auto mb-3">
                      <MessageCircle className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-[#1A1A1A] mb-1">Live Chat</h3>
                    <p className="text-xs text-[#757575] mb-3">Chat with our support team</p>
                    <Badge className="bg-green-100 text-green-700">Available</Badge>
                  </CardContent>
                </Card>
                
                <Card className="hover:border-[#00897B]/30 transition-colors cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center mx-auto mb-3">
                      <Phone className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-[#1A1A1A] mb-1">Phone Support</h3>
                    <p className="text-xs text-[#757575] mb-3">Mon-Fri, 8am-6pm SAST</p>
                    <p className="text-sm font-medium text-[#00897B]">+27 11 123 4567</p>
                  </CardContent>
                </Card>
                
                <Card className="hover:border-[#00897B]/30 transition-colors cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-lg bg-[#E0F2F1] text-[#00897B] flex items-center justify-center mx-auto mb-3">
                      <Mail className="h-6 w-6" />
                    </div>
                    <h3 className="font-semibold text-[#1A1A1A] mb-1">Email Support</h3>
                    <p className="text-xs text-[#757575] mb-3">Response within 24 hours</p>
                    <p className="text-sm font-medium text-[#00897B]">support@groway.co.za</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Submit Ticket */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Submit a Support Ticket</CardTitle>
                  <CardDescription>Describe your issue and we'll get back to you</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Category</label>
                      <select className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#00897B]">
                        <option>Technical Issue</option>
                        <option>Billing Question</option>
                        <option>Feature Request</option>
                        <option>Account Access</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Priority</label>
                      <select className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#00897B]">
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Subject</label>
                    <input 
                      type="text" 
                      placeholder="Brief description of your issue"
                      className="w-full h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-[#00897B]"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1A1A1A] mb-1 block">Description</label>
                    <textarea 
                      placeholder="Provide detailed information about your issue..."
                      rows={4}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#00897B] resize-none"
                    />
                  </div>
                  <Button className="w-full bg-[#00897B] hover:bg-[#00695C]">
                    Submit Ticket
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Resources Tab */}
            <TabsContent value="resources" className="m-0 p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* User Guides */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-[#00897B]" />
                      User Guides
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { name: 'Merchant OS User Manual', size: '2.4 MB', updated: 'Mar 2026' },
                      { name: 'Quick Start Guide', size: '890 KB', updated: 'Feb 2026' },
                      { name: 'Inventory Management Guide', size: '1.2 MB', updated: 'Mar 2026' },
                      { name: 'Accounting & VAT Guide', size: '1.8 MB', updated: 'Feb 2026' },
                    ].map((doc, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#757575]" />
                          <div>
                            <p className="text-sm font-medium text-[#1A1A1A]">{doc.name}</p>
                            <p className="text-xs text-[#757575]">{doc.size} • {doc.updated}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                
                {/* Video Tutorials */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Video className="h-4 w-4 text-[#00897B]" />
                      Video Tutorials
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { name: 'Getting Started with POS', duration: '5:23' },
                      { name: 'Setting Up Inventory', duration: '8:45' },
                      { name: 'Managing Bookings', duration: '6:12' },
                      { name: 'Financial Reports Explained', duration: '10:30' },
                    ].map((video, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded bg-[#E0F2F1] flex items-center justify-center">
                            <Play className="h-4 w-4 text-[#00897B]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#1A1A1A]">{video.name}</p>
                            <p className="text-xs text-[#757575]">{video.duration}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#757575]" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
                
                {/* Webinars */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#00897B]" />
                      Upcoming Webinars
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { name: 'New Features Deep Dive', date: 'Mar 15, 2026', time: '10:00 SAST' },
                      { name: 'Tax Year End Best Practices', date: 'Feb 28, 2026', time: '14:00 SAST' },
                    ].map((webinar, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">{webinar.name}</p>
                          <p className="text-xs text-[#757575]">{webinar.date} • {webinar.time}</p>
                        </div>
                        <Button variant="outline" size="sm">Register</Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                
                {/* API Documentation */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Code className="h-4 w-4 text-[#00897B]" />
                      Developer Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <a href="#" className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-[#757575]" />
                        <span className="text-sm font-medium text-[#1A1A1A]">API Documentation</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#757575]" />
                    </a>
                    <a href="#" className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-[#757575]" />
                        <span className="text-sm font-medium text-[#1A1A1A]">Integration Guides</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#757575]" />
                    </a>
                    <a href="#" className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-[#757575]" />
                        <span className="text-sm font-medium text-[#1A1A1A]">SDK Downloads</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[#757575]" />
                    </a>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
      
      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedLesson && selectedModule && (
            <>
              <DialogHeader className="flex-shrink-0">
                <div className="flex items-center gap-2 text-sm text-[#757575] mb-2">
                  <span>{selectedModule.title}</span>
                  <ChevronRight className="h-3 w-3" />
                  <span className="text-[#00897B]">{selectedLesson.title}</span>
                </div>
                <DialogTitle className="flex items-center gap-2">
                  {(() => {
                    const Icon = getLessonTypeIcon(selectedLesson.type)
                    return <Icon className="h-5 w-5 text-[#00897B]" />
                  })()}
                  {selectedLesson.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {selectedLesson.duration}
                  </span>
                  <Badge variant="outline" className="capitalize">{selectedLesson.type}</Badge>
                  {selectedLesson.completed && (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto py-4">
                {renderLessonContent()}
              </div>
              
              <DialogFooter className="flex-shrink-0 flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline"
                    onClick={goToPreviousLesson}
                    disabled={selectedModule.lessons.indexOf(selectedLesson) === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {!selectedLesson.completed && (
                    <Button 
                      className="bg-[#00897B] hover:bg-[#00695C]"
                      onClick={() => markLessonComplete(selectedModule.id, selectedLesson.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={goToNextLesson}
                    disabled={selectedModule.lessons.indexOf(selectedLesson) === selectedModule.lessons.length - 1}
                  >
                    Next Lesson
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
