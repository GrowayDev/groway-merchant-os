'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Store, 
  ArrowLeft,
  Check,
  ChevronRight,
  Utensils,
  Wine,
  ShoppingBag,
  Scissors,
  Shirt,
  Pill,
  Hotel,
  Wrench,
  Smartphone,
  Dumbbell,
  Baby,
  Building2,
  Sparkles,
  Zap,
  Package,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  HelpCircle,
  Bell,
  Search,
  Menu,
  X,
  LayoutGrid,
  List,
  Plus,
  Calculator,
  Receipt,
  QrCode,
  ShoppingCart,
  Leaf,
  Tractor,
  Wheat,
  TreeDeciduous,
  Fish,
  Bird,
  Drum,
  Milk,
  Flower2,
  Grape,
  Sun,
  Droplets,
  Wind
} from 'lucide-react'
import { SubVerticalWizard } from './components/SubVerticalWizard'
import { POSLayout } from './components/POSLayout'
import { OfflineModeProvider } from './components/OfflineModeManager'

// Business Verticals with sub-verticals
export const businessVerticals = [
  { 
    id: 'fnb',
    name: 'Food & Beverage', 
    icon: Utensils, 
    subCount: 8, 
    description: 'QSR, Sit-Down, Shisa Nyama, Coffee Shop, Bakery, Food Truck, Cloud Kitchen, Catering',
    subVerticals: [
      { id: 'qsr', name: 'Quick Service Restaurant (QSR)', skuCount: 245, features: ['Drive-through mode', 'Combo builder', 'KDS integration'] },
      { id: 'sitdown', name: 'Sit-Down Restaurant', skuCount: 312, features: ['Table management', 'Course ordering', 'Bill splitting'] },
      { id: 'shisa-nyama', name: 'Shisa Nyama', skuCount: 178, features: ['Braai pit tracking', 'Meat by weight', 'Pap & sides combos'] },
      { id: 'coffee-shop', name: 'Coffee Shop', skuCount: 156, features: ['Coffee customization', 'Loyalty stamps', 'Mobile ordering'] },
      { id: 'bakery', name: 'Bakery', skuCount: 189, features: ['Batch tracking', 'Expiry alerts', 'Custom orders'] },
      { id: 'food-truck', name: 'Food Truck', skuCount: 89, features: ['GPS tracking', 'Mobile POS', 'Event mode'] },
      { id: 'cloud-kitchen', name: 'Cloud Kitchen', skuCount: 234, features: ['Multi-brand orders', 'Delivery integration', 'Prep timer'] },
      { id: 'catering', name: 'Catering Service', skuCount: 167, features: ['Event quotes', 'Menu packages', 'Deposit handling'] },
    ]
  },
  { 
    id: 'liquor',
    name: 'Liquor & Nightlife', 
    icon: Wine, 
    subCount: 6, 
    description: 'Liquor Store, Bar/Pub, Nightclub, Shebeen, Bottle Store, Wine Farm',
    subVerticals: [
      { id: 'liquor-store', name: 'Liquor Store', skuCount: 456, features: ['Age verification', 'Case discounts', 'Loyalty points'] },
      { id: 'bar-pub', name: 'Bar/Pub', skuCount: 234, features: ['Tab management', 'Happy hour', 'Table tabs'] },
      { id: 'nightclub', name: 'Nightclub', skuCount: 167, features: ['Entry tickets', 'VIP sections', 'Guest list'] },
      { id: 'shebeen', name: 'Shebeen', skuCount: 89, features: ['Simple pricing', 'Credit tabs', 'Wholesale'] },
      { id: 'bottle-store', name: 'Bottle Store', skuCount: 312, features: ['Bulk pricing', 'Deposit system', 'Delivery'] },
      { id: 'wine-farm', name: 'Wine Farm', skuCount: 198, features: ['Tasting menu', 'Cellar door', 'Wine club'] },
    ]
  },
  { 
    id: 'grocery',
    name: 'Grocery & FMCG', 
    icon: ShoppingBag, 
    subCount: 7, 
    description: 'Superette, Spaza Shop, Butchery, Deli, Farm Stall, Cash & Carry, Bakery Retail',
    subVerticals: [
      { id: 'superette', name: 'Superette', skuCount: 1234, features: ['Barcode scanning', 'Promotions', 'Loyalty'] },
      { id: 'spaza', name: 'Spaza Shop', skuCount: 567, features: ['Simple POS', 'Credit customers', 'Airtime'] },
      { id: 'butchery', name: 'Butchery', skuCount: 234, features: ['Weight pricing', 'Custom cuts', 'Bulk orders'] },
      { id: 'deli', name: 'Deli', skuCount: 345, features: ['Weight items', 'Made-to-order', 'Platters'] },
      { id: 'farm-stall', name: 'Farm Stall', skuCount: 289, features: ['Fresh produce', 'Seasonal items', 'Local products'] },
      { id: 'cash-carry', name: 'Cash & Carry', skuCount: 2345, features: ['Wholesale pricing', 'Bulk discounts', 'Business accounts'] },
      { id: 'bakery-retail', name: 'Bakery Retail', skuCount: 178, features: ['Fresh daily', 'Custom orders', 'Wholesale'] },
    ]
  },
  { 
    id: 'health-beauty',
    name: 'Health & Beauty', 
    icon: Scissors, 
    subCount: 7, 
    description: 'Hair Salon, Barber, Nail Salon, Spa & Wellness, Aesthetic Clinic, Tattoo Studio, Lash & Brow',
    subVerticals: [
      { id: 'hair-salon', name: 'Hair Salon', skuCount: 145, features: ['Appointment booking', 'Stylist roster', 'Service combos'] },
      { id: 'barber', name: 'Barber Shop', skuCount: 78, features: ['Quick services', 'Queue management', 'Membership'] },
      { id: 'nail-salon', name: 'Nail Salon', skuCount: 134, features: ['Design catalog', 'Appointment', 'Loyalty'] },
      { id: 'spa-wellness', name: 'Spa & Wellness', skuCount: 189, features: ['Treatment menu', 'Package deals', 'Gift vouchers'] },
      { id: 'aesthetic-clinic', name: 'Aesthetic Clinic', skuCount: 156, features: ['Consultations', 'Treatment plans', 'Consent forms'] },
      { id: 'tattoo-studio', name: 'Tattoo Studio', skuCount: 89, features: ['Custom quotes', 'Deposit handling', 'Aftercare'] },
      { id: 'lash-brow', name: 'Lash & Brow Studio', skuCount: 67, features: ['Service menu', 'Appointments', 'Loyalty'] },
    ]
  },
  { 
    id: 'fashion',
    name: 'Fashion & Apparel', 
    icon: Shirt, 
    subCount: 6, 
    description: 'Clothing Boutique, Shoe Store, Accessories, Uniform Supplier, Second-hand/Thrift, Tailor',
    subVerticals: [
      { id: 'clothing-boutique', name: 'Clothing Boutique', skuCount: 345, features: ['Size matrix', 'Style catalog', 'Lay-bye'] },
      { id: 'shoe-store', name: 'Shoe Store', skuCount: 234, features: ['Size/width matrix', 'Special orders', 'Repairs'] },
      { id: 'accessories', name: 'Accessories Store', skuCount: 267, features: ['Style matching', 'Gift wrapping', 'Returns'] },
      { id: 'uniform-supplier', name: 'Uniform Supplier', skuCount: 189, features: ['Bulk orders', 'Embroidery', 'Corporate accounts'] },
      { id: 'thrift', name: 'Second-hand/Thrift', skuCount: 456, features: ['Unique items', 'Consignment', 'Donations'] },
      { id: 'tailor', name: 'Tailor Shop', skuCount: 89, features: ['Custom measurements', 'Alterations', 'Fittings'] },
    ]
  },
  { 
    id: 'health-pharmacy',
    name: 'Health & Pharmacy', 
    icon: Pill, 
    subCount: 6, 
    description: 'Full Pharmacy, Health Shop (OTC), Herbal Medicine, Optometry, Dentistry, Veterinary',
    subVerticals: [
      { id: 'pharmacy', name: 'Full Pharmacy', skuCount: 1567, features: ['Script processing', 'SAHPRA compliance', 'Dispensing labels'] },
      { id: 'health-shop', name: 'Health Shop (OTC)', skuCount: 567, features: ['OTC only', 'Supplements', 'Advice notes'] },
      { id: 'herbal-medicine', name: 'Herbal Medicine', skuCount: 234, features: ['Traditional remedies', 'Consultations', 'Custom blends'] },
      { id: 'optometry', name: 'Optometry Practice', skuCount: 345, features: ['Eye tests', 'Frame catalog', 'Lens options'] },
      { id: 'dentistry', name: 'Dental Practice', skuCount: 189, features: ['Treatment codes', 'Medical aid', 'Appointments'] },
      { id: 'veterinary', name: 'Veterinary Practice', skuCount: 267, features: ['Pet records', 'Vaccinations', 'Prescriptions'] },
    ]
  },
  { 
    id: 'hospitality',
    name: 'Hospitality', 
    icon: Hotel, 
    subCount: 7, 
    description: 'Hotel, Guest House, B&B, Backpackers, Lodge, Self-Catering, Airbnb-style',
    subVerticals: [
      { id: 'hotel', name: 'Hotel', skuCount: 234, features: ['Room management', 'Check-in/out', 'Billing'] },
      { id: 'guest-house', name: 'Guest House', skuCount: 89, features: ['Room booking', 'Breakfast', 'Payments'] },
      { id: 'bnb', name: 'Bed & Breakfast', skuCount: 67, features: ['Simple booking', 'Breakfast incl.', 'Calendar'] },
      { id: 'backpackers', name: 'Backpackers/Hostel', skuCount: 78, features: ['Dorm beds', 'Activities', 'Check-in'] },
      { id: 'lodge', name: 'Lodge', skuCount: 145, features: ['Game drives', 'Packages', 'Transfers'] },
      { id: 'self-catering', name: 'Self-Catering', skuCount: 56, features: ['Unit types', 'Cleaning fees', 'Deposits'] },
      { id: 'airbnb-style', name: 'Airbnb-style Host', skuCount: 34, features: ['Guest management', 'Cleaning', 'Reviews'] },
    ]
  },
  { 
    id: 'hardware',
    name: 'Hardware & Building', 
    icon: Wrench, 
    subCount: 6, 
    description: 'Hardware Store, Building Supplies, Paint Shop, Plumbing, Electrical, Agri-Supply',
    subVerticals: [
      { id: 'hardware-store', name: 'Hardware Store', skuCount: 2345, features: ['Bulk pricing', 'Delivery', 'Contractor accounts'] },
      { id: 'building-supplies', name: 'Building Supplies', skuCount: 1234, features: ['Quote builder', 'Delivery', 'Bulk orders'] },
      { id: 'paint-shop', name: 'Paint Shop', skuCount: 345, features: ['Color matching', 'Custom mixing', 'Coverage calc'] },
      { id: 'plumbing', name: 'Plumbing Supplies', skuCount: 567, features: ['Parts catalog', 'Contractor prices', 'Quotes'] },
      { id: 'electrical', name: 'Electrical Supplies', skuCount: 489, features: ['Parts catalog', 'Certification', 'Safety'] },
      { id: 'agri-supply', name: 'Agri-Supply', skuCount: 678, features: ['Seasonal stock', 'Bulk feed', 'Equipment'] },
    ]
  },
  { 
    id: 'electronics',
    name: 'Electronics & Tech', 
    icon: Smartphone, 
    subCount: 4, 
    description: 'Phone & Accessories, Computer & IT, Electronics Retail, Repair Workshop',
    subVerticals: [
      { id: 'phone-accessories', name: 'Phone & Accessories', skuCount: 456, features: ['Device catalog', 'Repairs', 'Trade-in'] },
      { id: 'computer-it', name: 'Computer & IT Store', skuCount: 567, features: ['Build-to-order', 'Service contracts', 'Warranty'] },
      { id: 'electronics-retail', name: 'Electronics Retail', skuCount: 789, features: ['Extended warranty', 'Installation', 'Finance'] },
      { id: 'repair-workshop', name: 'Repair Workshop', skuCount: 234, features: ['Service tickets', 'Parts tracking', 'Quotes'] },
    ]
  },
  { 
    id: 'sport-leisure',
    name: 'Sport & Leisure', 
    icon: Dumbbell, 
    subCount: 6, 
    description: 'Gym, Fitness Studio, Sports Club, Events Venue, Entertainment Centre, Escape Room',
    subVerticals: [
      { id: 'gym', name: 'Gym', skuCount: 89, features: ['Memberships', 'Check-in', 'PT sessions'] },
      { id: 'fitness-studio', name: 'Fitness Studio', skuCount: 67, features: ['Class packs', 'Memberships', 'Booking'] },
      { id: 'sports-club', name: 'Sports Club', skuCount: 145, features: ['Memberships', 'Bar tab', 'Facility booking'] },
      { id: 'events-venue', name: 'Events Venue', skuCount: 234, features: ['Venue hire', 'Catering', 'Deposits'] },
      { id: 'entertainment', name: 'Entertainment Centre', skuCount: 178, features: ['Game credits', 'Party packs', 'Memberships'] },
      { id: 'escape-room', name: 'Escape Room', skuCount: 34, features: ['Room booking', 'Time slots', 'Group packages'] },
    ]
  },
  { 
    id: 'childcare',
    name: 'Childcare & Education', 
    icon: Baby, 
    subCount: 5, 
    description: 'Crèche/Daycare, After-School Care, Tutoring Centre, Driving School, Skills Training',
    subVerticals: [
      { id: 'creche', name: 'Crèche/Daycare', skuCount: 45, features: ['Monthly fees', 'Attendance', 'Reports'] },
      { id: 'after-school', name: 'After-School Care', skuCount: 34, features: ['Daily rates', 'Activities', 'Pickup tracking'] },
      { id: 'tutoring', name: 'Tutoring Centre', skuCount: 56, features: ['Subject packages', 'Booking', 'Progress'] },
      { id: 'driving-school', name: 'Driving School', skuCount: 23, features: ['Lesson packages', 'Booking', 'Test prep'] },
      { id: 'skills-training', name: 'Skills Training Centre', skuCount: 78, features: ['Course catalog', 'Certificates', 'Payments'] },
    ]
  },
  {
    id: 'professional-services',
    name: 'Professional Services',
    icon: Building2,
    subCount: 12,
    description: 'Trade Services, Legal & Financial, Property & Construction, Health Practices, Education',
    subVerticals: [
      // Trade Services
      { id: 'auto-repair', name: 'Auto Repair Shop', skuCount: 345, features: ['Service menu', 'Parts billing', 'Job cards', 'Time tracking'] },
      { id: 'dry-cleaning', name: 'Dry Cleaner / Laundry', skuCount: 67, features: ['Item pricing', 'Order tracking', 'Delivery', 'Subscription'] },
      { id: 'funeral-home', name: 'Funeral Home', skuCount: 89, features: ['Package builder', 'Payment plans', 'Policy claims', 'Compliance'] },
      
      // Professional Associations - Legal & Financial
      { id: 'legal-services', name: 'Legal Practice', skuCount: 45, features: ['Matter billing', 'Trust account', 'Time billing', 'FICA/AML'] },
      { id: 'accounting', name: 'Accounting Practice', skuCount: 34, features: ['Client billing', 'Recurring fees', 'Project billing', 'CPD tracking'] },
      
      // Professional Associations - Property & Construction
      { id: 'real-estate', name: 'Estate Agents', skuCount: 156, features: ['Property listings', 'Trust account', 'Commission tracking', 'EAAB compliance'] },
      { id: 'architecture', name: 'Architecture', skuCount: 78, features: ['Project billing', 'Time tracking', 'SACAP compliance', 'Drawing management'] },
      { id: 'engineering', name: 'Engineering Services', skuCount: 89, features: ['Project billing', 'Time tracking', 'ECSA compliance', 'Spec management'] },
      { id: 'quantity-surveying', name: 'Quantity Surveying', skuCount: 56, features: ['Project billing', 'Time tracking', 'SACQSP compliance', 'Cost estimates'] },
      
      // Professional Associations - Health
      { id: 'medical-practice', name: 'Medical Practice', skuCount: 234, features: ['Appointments', 'Medical aid billing', 'HPCSA compliance', 'Patient records'] },
      { id: 'dental-practice', name: 'Dental Practice', skuCount: 145, features: ['Appointments', 'Medical aid billing', 'HPCSA compliance', 'Treatment plans'] },
      
      // Education
      { id: 'tutoring-school', name: 'Tutoring / School', skuCount: 56, features: ['Enrollment', 'Fee schedules', 'Progress reports', 'Scheduling'] },
    ]
  },
  {
    id: 'agriculture',
    name: 'Agriculture & Farming',
    icon: Leaf,
    subCount: 14,
    description: 'Livestock, Crops, Poultry, Dairy, Horticulture, Aquaculture, Game Farming, Equine, Piggery, Goat Farming, Sheep Farming, Animal Feed, Agricultural Services, Organic Farming',
    subVerticals: [
      // Livestock
      { id: 'cattle-farming', name: 'Cattle Farming', skuCount: 234, features: ['Herd management', 'Breeding records', 'Weight tracking', 'Health records', 'Auction sales'] },
      { id: 'sheep-farming', name: 'Sheep Farming', skuCount: 189, features: ['Flock management', 'Wool production', 'Lambing records', 'Dipping schedule', 'Market ready'] },
      { id: 'goat-farming', name: 'Goat Farming', skuCount: 156, features: ['Herd tracking', 'Breeding cycles', 'Meat/Dairy production', 'Health management'] },
      { id: 'piggery', name: 'Piggery / Pig Farming', skuCount: 178, features: ['Pen management', 'Feed conversion', 'Breeding cycles', 'Weight tracking', 'Slaughter ready'] },
      { id: 'poultry-farming', name: 'Poultry Farming', skuCount: 267, features: ['Flock tracking', 'Egg production', 'Feed management', 'Broiler cycles', 'Vaccination'] },
      { id: 'dairy-farming', name: 'Dairy Farming', skuCount: 198, features: ['Milk production', 'Cow tracking', 'Feed rations', 'Quality testing', 'Supply contracts'] },
      { id: 'equine', name: 'Equine / Horse Stud', skuCount: 89, features: ['Stud book', 'Breeding records', 'Training logs', 'Vaccination', 'Racing records'] },
      { id: 'game-farming', name: 'Game Farming', skuCount: 145, features: ['Game counts', 'Hunting packages', 'Trophy records', 'Breeding programs', 'Eco-tourism'] },
      
      // Crops & Horticulture
      { id: 'crop-farming', name: 'Crop Farming', skuCount: 345, features: ['Field management', 'Planting schedules', 'Yield tracking', 'Input costs', 'Harvest records'] },
      { id: 'horticulture', name: 'Horticulture', skuCount: 234, features: ['Greenhouse management', 'Irrigation schedules', 'Varieties catalog', 'Seasonal planning'] },
      { id: 'orchards', name: 'Orchards / Vineyards', skuCount: 189, features: ['Tree tracking', 'Harvest schedules', 'Irrigation', 'Pest management', 'Wine production'] },
      
      // Aquaculture
      { id: 'aquaculture', name: 'Aquaculture / Fish Farming', skuCount: 123, features: ['Pond management', 'Stocking rates', 'Feed conversion', 'Water quality', 'Harvest tracking'] },
      
      // Services & Support
      { id: 'animal-feed', name: 'Animal Feed Production', skuCount: 178, features: ['Feed formulations', 'Raw materials', 'Production batches', 'Quality testing', 'Distribution'] },
      { id: 'agricultural-services', name: 'Agricultural Services', skuCount: 67, features: ['Contract work', 'Equipment hire', 'Consultation', 'Soil testing', 'Spraying services'] },
    ]
  },
]

// VAS Tiles per vertical
export const vasTilesByVertical: Record<string, string[]> = {
  'fnb': ['Gopay Payments', 'QR Digital Menu', 'GroSupply', 'Airtime', 'Geo-Discovery', 'Mini Online Store'],
  'liquor': ['Gopay Payments', 'GroSupply', 'Airtime', 'Geo-Discovery', 'Vouchers'],
  'grocery': ['Gopay Payments', 'GroSupply', 'Airtime', 'Utility Bills', 'Vouchers', 'GroCredit'],
  'health-beauty': ['Gopay Payments', 'Appointments', 'Loyalty', 'Geo-Discovery', 'Mini Online Store'],
  'fashion': ['Gopay Payments', 'Lay-bye', 'Gift Cards', 'Geo-Discovery', 'Mini Online Store'],
  'health-pharmacy': ['Gopay Payments', 'Medical Aid Claims', 'Script Reminders', 'GroSupply', 'Geo-Discovery'],
  'hospitality': ['Gopay Payments', 'Bookings', 'QR Check-in', 'Geo-Discovery', 'Mini Online Store'],
  'hardware': ['Gopay Payments', 'GroSupply', 'Quotes', 'Delivery', 'Contractor Accounts'],
  'electronics': ['Gopay Payments', 'Warranty', 'Repair Tracking', 'GroSupply', 'Trade-in'],
  'sport-leisure': ['Gopay Payments', 'Memberships', 'Booking', 'Geo-Discovery', 'Loyalty'],
  'childcare': ['Gopay Payments', 'Attendance', 'Billing', 'Parent Portal', 'Reports'],
  'professional-services': ['Gopay Payments', 'Trust Account', 'Commission Tracking', 'EAAB Compliance', 'Document Storage', 'Invoicing'],
  'agriculture': ['Gopay Payments', 'GroSupply', 'Farm Management', 'Livestock Tracking', 'Auction Sales', 'Weather Services', 'Market Prices'],
}

// Steps for the wizard
const wizardSteps = [
  { id: 'vertical', title: 'Select Vertical', description: 'Choose your business type' },
  { id: 'subvertical', title: 'Select Sub-Vertical', description: 'Specify your business category' },
  { id: 'configure', title: 'Configure', description: 'Review auto-configured settings' },
]

// App state types
type AppState = 'wizard' | 'pos'

export default function MerchantOSApp() {
  const [appState, setAppState] = useState<AppState>('wizard')
  const [selectedVertical, setSelectedVertical] = useState<typeof businessVerticals[0] | null>(null)
  const [selectedSubVertical, setSelectedSubVertical] = useState<typeof businessVerticals[0]['subVerticals'][0] | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const handleVerticalSelect = (vertical: typeof businessVerticals[0]) => {
    setSelectedVertical(vertical)
  }

  const handleSubVerticalSelect = (subVertical: typeof businessVerticals[0]['subVerticals'][0]) => {
    setSelectedSubVertical(subVertical)
  }

  const handleStartPOS = () => {
    setAppState('pos')
  }

  const handleBackToWizard = () => {
    setAppState('wizard')
    setSelectedVertical(null)
    setSelectedSubVertical(null)
  }

  if (appState === 'pos' && selectedVertical && selectedSubVertical) {
    return (
      <OfflineModeProvider>
        <POSLayout 
          vertical={selectedVertical}
          subVertical={selectedSubVertical}
          vasTiles={vasTilesByVertical[selectedVertical.id] || []}
          onBack={handleBackToWizard}
        />
      </OfflineModeProvider>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA]">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <img 
                src="/groway-logo.png" 
                alt="Groway" 
                className="h-7 w-auto"
              />
              <Badge variant="outline" className="text-[10px] border-[#00897B]/30 text-[#00897B]">
                Merchant OS
              </Badge>
            </Link>
            
            {/* Navigation */}
            <div className="flex items-center gap-3">
              <Link href="/merchant-os">
                <Button variant="ghost" size="sm" className="text-xs">
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Marketing Page
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <SubVerticalWizard
          verticals={businessVerticals}
          selectedVertical={selectedVertical}
          selectedSubVertical={selectedSubVertical}
          onVerticalSelect={handleVerticalSelect}
          onSubVerticalSelect={handleSubVerticalSelect}
          onStartPOS={handleStartPOS}
          vasTiles={selectedVertical ? vasTilesByVertical[selectedVertical.id] || [] : []}
        />
      </main>

      {/* Footer */}
      <footer className="py-4 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-xs text-[#757575]">
            <span>© 2026 Groway Merchant OS</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Badge variant="outline" className="text-[9px] border-green-300 text-green-700">Phase 1</Badge>
                Multi-Vertical POS Core
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
