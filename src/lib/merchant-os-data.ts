// Merchant OS Data - 12 Verticals, 47 Sub-Verticals, Pre-loaded SKUs
import { BusinessVertical, Product, VASItem, ComplianceRequirement, Customer, StaffMember } from './merchant-os-types';

// ============================================================================
// 1. BUSINESS VERTICALS & SUB-VERTICALS (12 × 47)
// ============================================================================

export const businessVerticals: BusinessVertical[] = [
  {
    id: 'food-beverage',
    name: 'Food & Beverage',
    icon: 'Utensils',
    subCount: 8,
    description: 'Restaurants, cafes, take-aways, and food services',
    vatDefault: 'standard',
    hasBooking: true,
    hasInventory: true,
    subVerticals: [
      { id: 'qsr', name: 'Quick Service Restaurant', parentId: 'food-beverage', description: 'Fast food, drive-through, take-away', posLayout: 'restaurant', features: ['kds', 'drive_through', 'combos', 'self_service_kiosk'], requiresLicense: false },
      { id: 'sit-down', name: 'Sit-Down Restaurant', parentId: 'food-beverage', description: 'Full service dining', posLayout: 'restaurant', features: ['table_management', 'kds', 'reservations', 'course_management'], requiresLicense: false },
      { id: 'shisa-nyama', name: 'Shisa Nyama', parentId: 'food-beverage', description: 'Township braai culture', posLayout: 'hybrid', features: ['braai_tracker', 'tab_model', 'stokvel_payments'], requiresLicense: false },
      { id: 'tavern', name: 'Tavern / Shebeen', parentId: 'food-beverage', description: 'Informal liquor & food', posLayout: 'bar', features: ['tab_model', 'cash_first', 'loyalty_stamp'], requiresLicense: true, licenseType: 'Liquor License' },
      { id: 'coffee-shop', name: 'Coffee & Tea', parentId: 'food-beverage', description: 'Cafes, roasters, tea rooms', posLayout: 'service', features: ['barista_view', 'loyalty_cups', 'wifi_vouchers', 'preorders'], requiresLicense: false },
      { id: 'bakery', name: 'Bakery & Patisserie', parentId: 'food-beverage', description: 'Bread, cakes, pastries', posLayout: 'retail', features: ['custom_cakes', 'preorders', 'delivery'], requiresLicense: false },
      { id: 'food-truck', name: 'Food Truck', parentId: 'food-beverage', description: 'Mobile food vendor', posLayout: 'service', features: ['offline_mode', 'geo_location', 'simplified_menu'], requiresLicense: false },
      { id: 'catering', name: 'Catering & Cloud Kitchen', parentId: 'food-beverage', description: 'Event catering, delivery-only', posLayout: 'hybrid', features: ['event_orders', 'delivery_integration', 'meal_prep'], requiresLicense: false },
    ],
    compliance: []
  },
  {
    id: 'liquor-nightlife',
    name: 'Liquor & Nightlife',
    icon: 'Wine',
    subCount: 6,
    description: 'Liquor stores, bars, clubs, and nightlife',
    vatDefault: 'standard',
    hasBooking: false,
    hasInventory: true,
    subVerticals: [
      { id: 'liquor-store', name: 'Liquor Store', parentId: 'liquor-nightlife', description: 'Off-premise alcohol sales', posLayout: 'retail', features: ['age_verification', 'promo_packs', 'case_discounts'], requiresLicense: true, licenseType: 'Liquor License' },
      { id: 'bar-pub', name: 'Bar & Pub', parentId: 'liquor-nightlife', description: 'On-premise alcohol', posLayout: 'bar', features: ['tab_model', 'happy_hour', 'tap_system'], requiresLicense: true, licenseType: 'Liquor License' },
      { id: 'nightclub', name: 'Nightclub', parentId: 'liquor-nightlife', description: 'Nightlife entertainment', posLayout: 'bar', features: ['cover_charge', 'vip_sections', 'bottle_service'], requiresLicense: true, licenseType: 'Liquor License' },
      { id: 'shebeen', name: 'Shebeen', parentId: 'liquor-nightlife', description: 'Informal liquor outlet', posLayout: 'bar', features: ['cash_first', 'tab_model', 'simple_pricing'], requiresLicense: true, licenseType: 'Liquor License' },
      { id: 'bottle-store', name: 'Bottle Store', parentId: 'liquor-nightlife', description: 'Quick liquor retail', posLayout: 'retail', features: ['cash_first', 'quick_sale'], requiresLicense: true, licenseType: 'Liquor License' },
      { id: 'wine-farm', name: 'Wine Farm', parentId: 'liquor-nightlife', description: 'Winery & tastings', posLayout: 'hybrid', features: ['tastings', 'tours', 'club_membership'], requiresLicense: true, licenseType: 'Liquor License' },
    ],
    compliance: []
  },
  {
    id: 'grocery-fmcg',
    name: 'Grocery & FMCG',
    icon: 'ShoppingBag',
    subCount: 7,
    description: 'Supermarkets, spaza shops, and grocery retail',
    vatDefault: 'standard',
    hasBooking: false,
    hasInventory: true,
    subVerticals: [
      { id: 'superette', name: 'Superette', parentId: 'grocery-fmcg', description: 'Small supermarket', posLayout: 'retail', features: ['quick_checkout', 'loyalty_points', 'specials'], requiresLicense: false },
      { id: 'spaza-shop', name: 'Spaza Shop', parentId: 'grocery-fmcg', description: 'Informal township store', posLayout: 'retail', features: ['cash_first', 'quick_add', 'informal_trader'], requiresLicense: false },
      { id: 'butchery', name: 'Butchery', parentId: 'grocery-fmcg', description: 'Fresh meat retail', posLayout: 'retail', features: ['weight_pricing', 'custom_cuts', 'combos'], requiresLicense: false },
      { id: 'deli', name: 'Deli', parentId: 'grocery-fmcg', description: 'Specialty foods & prepared items', posLayout: 'hybrid', features: ['prepared_foods', 'custom_platters', 'weight_pricing'], requiresLicense: false },
      { id: 'farm-stall', name: 'Farm Stall', parentId: 'grocery-fmcg', description: 'Roadside fresh produce', posLayout: 'retail', features: ['seasonal_produce', 'bulk_sales'], requiresLicense: false },
      { id: 'cash-carry', name: 'Cash & Carry', parentId: 'grocery-fmcg', description: 'Bulk/wholesale retail', posLayout: 'retail', features: ['bulk_pricing', 'business_accounts'], requiresLicense: false },
      { id: 'bakery-retail', name: 'Bakery Retail', parentId: 'grocery-fmcg', description: 'In-store bakery', posLayout: 'retail', features: ['fresh_baked', 'pre_orders'], requiresLicense: false },
    ],
    compliance: []
  },
  {
    id: 'health-beauty',
    name: 'Health & Beauty',
    icon: 'Scissors',
    subCount: 7,
    description: 'Salons, spas, and wellness services',
    vatDefault: 'standard',
    hasBooking: true,
    hasInventory: true,
    subVerticals: [
      { id: 'hair-salon', name: 'Hair Salon', parentId: 'health-beauty', description: 'Hair styling & treatments', posLayout: 'service', features: ['booking', 'stylist_grid', 'commission', 'loyalty'], requiresLicense: false },
      { id: 'barber', name: 'Barber Shop', parentId: 'health-beauty', description: 'Men\'s grooming', posLayout: 'service', features: ['booking', 'walkin_queue', 'membership'], requiresLicense: false },
      { id: 'nail-salon', name: 'Nail Salon', parentId: 'health-beauty', description: 'Manicure & pedicure', posLayout: 'service', features: ['booking', 'group_bookings', 'memberships'], requiresLicense: false },
      { id: 'spa-wellness', name: 'Spa & Wellness', parentId: 'health-beauty', description: 'Massage, treatments, relaxation', posLayout: 'service', features: ['booking', 'packages', 'gift_vouchers', 'membership'], requiresLicense: false },
      { id: 'aesthetic-clinic', name: 'Aesthetic Clinic', parentId: 'health-beauty', description: 'Cosmetic treatments', posLayout: 'service', features: ['consultation', 'treatment_plans', 'consent_forms'], requiresLicense: false },
      { id: 'tattoo-studio', name: 'Tattoo Studio', parentId: 'health-beauty', description: 'Body art & piercings', posLayout: 'service', features: ['deposits', 'custom_designs', 'consent_forms'], requiresLicense: false },
      { id: 'lash-brow', name: 'Lash & Brow Studio', parentId: 'health-beauty', description: 'Eyelash and eyebrow services', posLayout: 'service', features: ['booking', 'membership', 'packages'], requiresLicense: false },
    ],
    compliance: []
  },
  {
    id: 'fashion-apparel',
    name: 'Fashion & Apparel',
    icon: 'Shirt',
    subCount: 6,
    description: 'Clothing, shoes, and accessories retail',
    vatDefault: 'standard',
    hasBooking: false,
    hasInventory: true,
    subVerticals: [
      { id: 'clothing-boutique', name: 'Clothing Boutique', parentId: 'fashion-apparel', description: 'Fashion retail', posLayout: 'retail', features: ['size_matrix', 'special_orders', 'loyalty'], requiresLicense: false },
      { id: 'shoe-store', name: 'Shoe Store', parentId: 'fashion-apparel', description: 'Footwear retail', posLayout: 'retail', features: ['size_matrix', 'special_orders'], requiresLicense: false },
      { id: 'accessories', name: 'Accessories', parentId: 'fashion-apparel', description: 'Bags, jewelry, watches', posLayout: 'retail', features: ['gift_wrapping', 'special_orders'], requiresLicense: false },
      { id: 'uniform-supplier', name: 'Uniform Supplier', parentId: 'fashion-apparel', description: 'Work & school uniforms', posLayout: 'retail', features: ['bulk_orders', 'customization', 'b2b_accounts'], requiresLicense: false },
      { id: 'thrift', name: 'Second-hand / Thrift', parentId: 'fashion-apparel', description: 'Pre-owned clothing', posLayout: 'retail', features: ['consignment', 'buy_sell'], requiresLicense: false },
      { id: 'tailor', name: 'Tailor & Alterations', parentId: 'fashion-apparel', description: 'Custom tailoring', posLayout: 'service', features: ['measurements', 'fitting_appointments', 'deposits'], requiresLicense: false },
    ],
    compliance: []
  },
  {
    id: 'health-pharmacy',
    name: 'Health & Pharmacy',
    icon: 'Pill',
    subCount: 6,
    description: 'Pharmacies, health shops, medical services',
    vatDefault: 'standard',
    hasBooking: true,
    hasInventory: true,
    subVerticals: [
      { id: 'pharmacy', name: 'Full Pharmacy', parentId: 'health-pharmacy', description: 'Prescription & OTC medicines', posLayout: 'retail', features: ['prescription_tracking', 'sahpra_compliance', 'schedule_drugs', 'medical_aid_billing'], requiresLicense: true, licenseType: 'SAHPRA License' },
      { id: 'health-shop', name: 'Health Shop (OTC)', parentId: 'health-pharmacy', description: 'Vitamins, supplements, OTC', posLayout: 'retail', features: ['wellness_consultation', 'loyalty'], requiresLicense: false },
      { id: 'traditional-medicine', name: 'Herbal / Traditional Medicine', parentId: 'health-pharmacy', description: 'Traditional healing products', posLayout: 'retail', features: ['custom_mixing', 'consultation'], requiresLicense: false },
      { id: 'optometry', name: 'Optometry', parentId: 'health-pharmacy', description: 'Eye care & glasses', posLayout: 'service', features: ['eye_tests', 'prescription_glasses', 'contact_lenses', 'medical_aid_billing'], requiresLicense: false },
      { id: 'dentistry', name: 'Dentistry', parentId: 'health-pharmacy', description: 'Dental services', posLayout: 'service', features: ['appointments', 'treatment_plans', 'medical_aid_billing'], requiresLicense: false },
      { id: 'veterinary', name: 'Veterinary', parentId: 'health-pharmacy', description: 'Pet & animal health', posLayout: 'hybrid', features: ['appointments', 'prescription', 'pet_records'], requiresLicense: true, licenseType: 'Veterinary Council' },
    ],
    compliance: []
  },
  {
    id: 'hospitality',
    name: 'Hospitality',
    icon: 'Hotel',
    subCount: 7,
    description: 'Hotels, guest houses, and lodging',
    vatDefault: 'standard',
    hasBooking: true,
    hasInventory: true,
    subVerticals: [
      { id: 'hotel', name: 'Hotel', parentId: 'hospitality', description: 'Full service hotel', posLayout: 'service', features: ['room_management', 'folio_billing', 'reservations', 'room_service', 'multi_pos'], requiresLicense: false },
      { id: 'guest-house', name: 'Guest House', parentId: 'hospitality', description: 'Boutique accommodation', posLayout: 'service', features: ['room_management', 'breakfast_billing', 'reservations'], requiresLicense: false },
      { id: 'b-and-b', name: 'B&B', parentId: 'hospitality', description: 'Bed & breakfast', posLayout: 'service', features: ['room_management', 'breakfast_billing'], requiresLicense: false },
      { id: 'backpackers', name: 'Backpackers', parentId: 'hospitality', description: 'Budget accommodation', posLayout: 'service', features: ['dorm_beds', 'activities_booking'], requiresLicense: false },
      { id: 'lodge', name: 'Lodge', parentId: 'hospitality', description: 'Game lodge, nature retreat', posLayout: 'service', features: ['full_board', 'activities', 'game_drives'], requiresLicense: false },
      { id: 'self-catering', name: 'Self-Catering', parentId: 'hospitality', description: 'Self-contained units', posLayout: 'service', features: ['unit_management', 'deposit_tracking'], requiresLicense: false },
      { id: 'airbnb', name: 'Airbnb-style', parentId: 'hospitality', description: 'Short-term rental', posLayout: 'service', features: ['calendar_sync', 'cleaning_scheduling'], requiresLicense: false },
    ],
    compliance: []
  },
  {
    id: 'hardware-building',
    name: 'Hardware & Building',
    icon: 'Wrench',
    subCount: 6,
    description: 'Hardware, building supplies, trade',
    vatDefault: 'standard',
    hasBooking: false,
    hasInventory: true,
    subVerticals: [
      { id: 'hardware-store', name: 'Hardware Store', parentId: 'hardware-building', description: 'General hardware', posLayout: 'retail', features: ['trade_pricing', 'accounts_receivable', 'bulk_discounts'], requiresLicense: false },
      { id: 'building-supplies', name: 'Building Supplies', parentId: 'hardware-building', description: 'Construction materials', posLayout: 'retail', features: ['bulk_pricing', 'delivery', 'quotes'], requiresLicense: false },
      { id: 'paint-shop', name: 'Paint Shop', parentId: 'hardware-building', description: 'Paint & coatings', posLayout: 'retail', features: ['color_mixing', 'bulk_discounts'], requiresLicense: false },
      { id: 'plumbing', name: 'Plumbing Supplies', parentId: 'hardware-building', description: 'Plumbing materials', posLayout: 'retail', features: ['trade_accounts', 'special_orders'], requiresLicense: false },
      { id: 'electrical', name: 'Electrical Supplies', parentId: 'hardware-building', description: 'Electrical materials', posLayout: 'retail', features: ['trade_accounts', 'special_orders'], requiresLicense: false },
      { id: 'agri-supply', name: 'Agri-Supply', parentId: 'hardware-building', description: 'Farm & agricultural', posLayout: 'retail', features: ['seasonal_stock', 'bulk_pricing', 'accounts'], requiresLicense: false },
    ],
    compliance: []
  },
  {
    id: 'electronics-tech',
    name: 'Electronics & Tech',
    icon: 'Smartphone',
    subCount: 4,
    description: 'Electronics, phones, computers, repair',
    vatDefault: 'standard',
    hasBooking: false,
    hasInventory: true,
    subVerticals: [
      { id: 'phone-store', name: 'Phone & Accessories', parentId: 'electronics-tech', description: 'Mobile devices & accessories', posLayout: 'retail', features: ['imei_tracking', 'rico_compliance', 'airtime_integration'], requiresLicense: false },
      { id: 'computer-it', name: 'Computer & IT', parentId: 'electronics-tech', description: 'Computers, laptops, IT equipment', posLayout: 'retail', features: ['serial_tracking', 'special_orders'], requiresLicense: false },
      { id: 'electronics-retail', name: 'Electronics Retail', parentId: 'electronics-tech', description: 'TVs, appliances, electronics', posLayout: 'retail', features: ['warranty_tracking', 'delivery'], requiresLicense: false },
      { id: 'repair-workshop', name: 'Repair Workshop', parentId: 'electronics-tech', description: 'Electronics repair services', posLayout: 'service', features: ['repair_tracking', 'deposits', 'warranty'], requiresLicense: false },
    ],
    compliance: []
  },
  {
    id: 'sport-leisure',
    name: 'Sport & Leisure',
    icon: 'Dumbbell',
    subCount: 6,
    description: 'Gyms, sports, events, entertainment',
    vatDefault: 'standard',
    hasBooking: true,
    hasInventory: true,
    subVerticals: [
      { id: 'gym', name: 'Gym', parentId: 'sport-leisure', description: 'Fitness center', posLayout: 'service', features: ['membership', 'checkin', 'pt_sessions', 'product_sales'], requiresLicense: false },
      { id: 'fitness-studio', name: 'Fitness Studio', parentId: 'sport-leisure', description: 'Boutique fitness, yoga, pilates', posLayout: 'service', features: ['class_booking', 'packages', 'membership'], requiresLicense: false },
      { id: 'sports-club', name: 'Sports Club', parentId: 'sport-leisure', description: 'Sports facilities & training', posLayout: 'hybrid', features: ['membership', 'court_booking', 'events'], requiresLicense: false },
      { id: 'events-venue', name: 'Events Venue', parentId: 'sport-leisure', description: 'Events & functions', posLayout: 'service', features: ['venue_booking', 'catering_addons', 'deposit_tracking'], requiresLicense: false },
      { id: 'entertainment', name: 'Entertainment Centre', parentId: 'sport-leisure', description: 'Gaming, bowling, arcades', posLayout: 'hybrid', features: ['time_billing', 'package_deals', 'group_bookings'], requiresLicense: false },
      { id: 'escape-room', name: 'Escape Room', parentId: 'sport-leisure', description: 'Escape games, adventure', posLayout: 'service', features: ['slot_booking', 'group_pricing'], requiresLicense: false },
    ],
    compliance: []
  },
  {
    id: 'childcare-education',
    name: 'Childcare & Education',
    icon: 'Baby',
    subCount: 5,
    description: 'Schools, daycares, tutoring',
    vatDefault: 'exempt',
    hasBooking: false,
    hasInventory: true,
    subVerticals: [
      { id: 'creche', name: 'Crèche / Daycare', parentId: 'childcare-education', description: 'Childcare services', posLayout: 'service', features: ['monthly_fees', 'attendance', 'meal_tracking'], requiresLicense: false },
      { id: 'after-school', name: 'After-School Care', parentId: 'childcare-education', description: 'After-school programs', posLayout: 'service', features: ['pickup_tracking', 'activity_fees'], requiresLicense: false },
      { id: 'tutoring', name: 'Tutoring Centre', parentId: 'childcare-education', description: 'Academic tutoring', posLayout: 'service', features: ['session_booking', 'package_deals', 'progress_tracking'], requiresLicense: false },
      { id: 'driving-school', name: 'Driving School', parentId: 'childcare-education', description: 'Driver training', posLayout: 'service', features: ['lesson_booking', 'package_deals', 'test_prep'], requiresLicense: false },
      { id: 'skills-training', name: 'Skills Training', parentId: 'childcare-education', description: 'Vocational training', posLayout: 'service', features: ['course_enrollment', 'certification_tracking'], requiresLicense: false },
    ],
    compliance: []
  },
  {
    id: 'professional-services',
    name: 'Professional Services',
    icon: 'Building2',
    subCount: 12,
    description: 'Professional and personal services',
    vatDefault: 'standard',
    hasBooking: false,
    hasInventory: false,
    subVerticals: [
      // Trade Services
      { id: 'auto-repair', name: 'Auto Repair', parentId: 'professional-services', description: 'Vehicle repair & services', posLayout: 'service', features: ['job_cards', 'parts_billing', 'time_tracking'], requiresLicense: false },
      { id: 'dry-cleaning', name: 'Dry Cleaning / Laundry', parentId: 'professional-services', description: 'Laundry services', posLayout: 'service', features: ['order_tracking', 'delivery', 'subscription'], requiresLicense: false },
      { id: 'funeral-home', name: 'Funeral Home', parentId: 'professional-services', description: 'Funeral services', posLayout: 'service', features: ['package_builder', 'payment_plans', 'compliance'], requiresLicense: false },
      
      // Professional Associations - Legal & Financial
      { id: 'legal-services', name: 'Legal Practice', parentId: 'professional-services', description: 'Legal practice (Attorneys, Advocates)', posLayout: 'service', features: ['matter_billing', 'trust_account', 'time_billing', 'fica_aml'], requiresLicense: true, licenseType: 'Legal Practice Council' },
      { id: 'accounting', name: 'Accounting Practice', parentId: 'professional-services', description: 'Accountants & Auditors (SAICA, IRBA)', posLayout: 'service', features: ['client_billing', 'recurring_fees', 'project_billing', 'cpd_tracking'], requiresLicense: true, licenseType: 'SAICA/IRBA Registration' },
      
      // Professional Associations - Property & Construction
      { id: 'real-estate', name: 'Estate Agents', parentId: 'professional-services', description: 'Real estate & property services', posLayout: 'service', features: ['property_listings', 'trust_account', 'commission_tracking', 'eaab_compliance'], requiresLicense: true, licenseType: 'EAAB Fidelity Fund Certificate' },
      { id: 'architecture', name: 'Architecture', parentId: 'professional-services', description: 'Architectural services', posLayout: 'service', features: ['project_billing', 'time_tracking', 'sacap_compliance'], requiresLicense: true, licenseType: 'SACAP Registration' },
      { id: 'engineering', name: 'Engineering Services', parentId: 'professional-services', description: 'Professional engineering', posLayout: 'service', features: ['project_billing', 'time_tracking', 'ecsa_compliance'], requiresLicense: true, licenseType: 'ECSA Registration' },
      { id: 'quantity-surveying', name: 'Quantity Surveying', parentId: 'professional-services', description: 'QS services', posLayout: 'service', features: ['project_billing', 'time_tracking', 'asqs_compliance'], requiresLicense: true, licenseType: 'SACQSP Registration' },
      
      // Professional Associations - Health
      { id: 'medical-practice', name: 'Medical Practice', parentId: 'professional-services', description: 'Doctors & medical specialists', posLayout: 'service', features: ['appointments', 'medical_aid_billing', 'hpcsa_compliance'], requiresLicense: true, licenseType: 'HPCSA Registration' },
      { id: 'dental-practice', name: 'Dental Practice', parentId: 'professional-services', description: 'Dental services', posLayout: 'service', features: ['appointments', 'medical_aid_billing', 'hpcsa_compliance'], requiresLicense: true, licenseType: 'HPCSA Registration' },
      
      // Education
      { id: 'tutoring-school', name: 'Tutoring / School', parentId: 'professional-services', description: 'Educational services', posLayout: 'service', features: ['enrollment', 'fee_schedules', 'progress_reports'], requiresLicense: false },
    ],
    compliance: []
  },
  {
    id: 'agriculture',
    name: 'Agriculture & Farming',
    icon: 'Leaf',
    subCount: 14,
    description: 'Livestock, crops, poultry, dairy, horticulture, aquaculture, and agricultural services',
    vatDefault: 'standard',
    hasBooking: false,
    hasInventory: true,
    subVerticals: [
      // Livestock
      { id: 'cattle-farming', name: 'Cattle Farming', parentId: 'agriculture', description: 'Beef and dairy cattle', posLayout: 'service', features: ['herd_management', 'breeding_records', 'weight_tracking', 'health_records', 'auction_sales'], requiresLicense: false },
      { id: 'sheep-farming', name: 'Sheep Farming', parentId: 'agriculture', description: 'Sheep for meat and wool', posLayout: 'service', features: ['flock_management', 'wool_production', 'lambing_records', 'dipping_schedule'], requiresLicense: false },
      { id: 'goat-farming', name: 'Goat Farming', parentId: 'agriculture', description: 'Goat meat and dairy', posLayout: 'service', features: ['herd_tracking', 'breeding_cycles', 'meat_dairy_production'], requiresLicense: false },
      { id: 'piggery', name: 'Piggery / Pig Farming', parentId: 'agriculture', description: 'Pig farming operations', posLayout: 'service', features: ['pen_management', 'feed_conversion', 'breeding_cycles', 'weight_tracking'], requiresLicense: false },
      { id: 'poultry-farming', name: 'Poultry Farming', parentId: 'agriculture', description: 'Chickens for meat and eggs', posLayout: 'service', features: ['flock_tracking', 'egg_production', 'feed_management', 'broiler_cycles', 'vaccination'], requiresLicense: false },
      { id: 'dairy-farming', name: 'Dairy Farming', parentId: 'agriculture', description: 'Milk production', posLayout: 'service', features: ['milk_production', 'cow_tracking', 'feed_rations', 'quality_testing', 'supply_contracts'], requiresLicense: false },
      { id: 'equine', name: 'Equine / Horse Stud', parentId: 'agriculture', description: 'Horse breeding and training', posLayout: 'service', features: ['stud_book', 'breeding_records', 'training_logs', 'vaccination', 'racing_records'], requiresLicense: false },
      { id: 'game-farming', name: 'Game Farming', parentId: 'agriculture', description: 'Game animals and hunting', posLayout: 'service', features: ['game_counts', 'hunting_packages', 'trophy_records', 'breeding_programs', 'eco_tourism'], requiresLicense: true, licenseType: 'Game Farm Permit' },
      
      // Crops & Horticulture
      { id: 'crop-farming', name: 'Crop Farming', parentId: 'agriculture', description: 'Field crops and grains', posLayout: 'service', features: ['field_management', 'planting_schedules', 'yield_tracking', 'input_costs', 'harvest_records'], requiresLicense: false },
      { id: 'horticulture', name: 'Horticulture', parentId: 'agriculture', description: 'Fruits and vegetables', posLayout: 'service', features: ['greenhouse_management', 'irrigation_schedules', 'varieties_catalog', 'seasonal_planning'], requiresLicense: false },
      { id: 'orchards', name: 'Orchards / Vineyards', parentId: 'agriculture', description: 'Fruit trees and vineyards', posLayout: 'service', features: ['tree_tracking', 'harvest_schedules', 'irrigation', 'pest_management', 'wine_production'], requiresLicense: false },
      
      // Aquaculture
      { id: 'aquaculture', name: 'Aquaculture / Fish Farming', parentId: 'agriculture', description: 'Fish and aquatic farming', posLayout: 'service', features: ['pond_management', 'stocking_rates', 'feed_conversion', 'water_quality', 'harvest_tracking'], requiresLicense: true, licenseType: 'Aquaculture License' },
      
      // Services & Support
      { id: 'animal-feed', name: 'Animal Feed Production', parentId: 'agriculture', description: 'Feed manufacturing', posLayout: 'retail', features: ['feed_formulations', 'raw_materials', 'production_batches', 'quality_testing', 'distribution'], requiresLicense: false },
      { id: 'agricultural-services', name: 'Agricultural Services', parentId: 'agriculture', description: 'Contract farming and services', posLayout: 'service', features: ['contract_work', 'equipment_hire', 'consultation', 'soil_testing', 'spraying_services'], requiresLicense: false },
    ],
    compliance: []
  },
];

// ============================================================================
// 2. PRE-LOADED SKUs (per vertical - ~100+ products total)
// ============================================================================

export const products: Product[] = [
  // ========== FOOD & BEVERAGE - QSR ==========
  { id: 'qsr-001', name: 'Burger - Classic', sku: 'QSR-BURG-001', category: 'Main Meals', vertical: 'food-beverage', subVertical: 'qsr', sellingPrice: 8500, costPrice: 3200, stock: 50, minStock: 10, maxStock: 100, unit: 'each', vatRate: 15, isService: false, hasVariants: true, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true, variants: [{ id: 'v1', productId: 'qsr-001', name: 'Regular', sku: 'QSR-BURG-001-R', priceModifier: 0, stock: 30 }, { id: 'v2', productId: 'qsr-001', name: 'Large', sku: 'QSR-BURG-001-L', priceModifier: 2000, stock: 20 }] },
  { id: 'qsr-002', name: 'Chicken Wings (6pc)', sku: 'QSR-WING-001', category: 'Starters', vertical: 'food-beverage', subVertical: 'qsr', sellingPrice: 6500, costPrice: 2800, stock: 40, minStock: 8, maxStock: 80, unit: 'each', vatRate: 15, isService: false, hasVariants: true, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true, variants: [{ id: 'v3', productId: 'qsr-002', name: 'Hot', sku: 'QSR-WING-001-H', priceModifier: 0, stock: 20 }, { id: 'v4', productId: 'qsr-002', name: 'Mild', sku: 'QSR-WING-001-M', priceModifier: 0, stock: 20 }] },
  { id: 'qsr-003', name: 'Fries - Regular', sku: 'QSR-FRY-001', category: 'Sides', vertical: 'food-beverage', subVertical: 'qsr', sellingPrice: 2500, costPrice: 800, stock: 100, minStock: 20, maxStock: 200, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'qsr-004', name: 'Fries - Large', sku: 'QSR-FRY-002', category: 'Sides', vertical: 'food-beverage', subVertical: 'qsr', sellingPrice: 3500, costPrice: 1200, stock: 100, minStock: 20, maxStock: 200, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'qsr-005', name: 'Soft Drink - 500ml', sku: 'QSR-DRK-001', category: 'Beverages', vertical: 'food-beverage', subVertical: 'qsr', sellingPrice: 2000, costPrice: 900, stock: 200, minStock: 50, maxStock: 400, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'qsr-006', name: 'Combo - Burger + Fries + Drink', sku: 'QSR-COMBO-001', category: 'Combos', vertical: 'food-beverage', subVertical: 'qsr', sellingPrice: 11500, costPrice: 4900, stock: 50, minStock: 10, maxStock: 100, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true, posLabel: 'Combo 1' },
  { id: 'qsr-007', name: 'Fish & Chips', sku: 'QSR-FISH-001', category: 'Main Meals', vertical: 'food-beverage', subVertical: 'qsr', sellingPrice: 7900, costPrice: 3500, stock: 35, minStock: 7, maxStock: 70, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'qsr-008', name: 'Chicken Wrap', sku: 'QSR-WRP-001', category: 'Main Meals', vertical: 'food-beverage', subVertical: 'qsr', sellingPrice: 5500, costPrice: 2100, stock: 30, minStock: 6, maxStock: 60, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'qsr-009', name: 'Milkshake - 500ml', sku: 'QSR-MSH-001', category: 'Beverages', vertical: 'food-beverage', subVertical: 'qsr', sellingPrice: 3500, costPrice: 1200, stock: 50, minStock: 10, maxStock: 100, unit: 'each', vatRate: 15, isService: false, hasVariants: true, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true, variants: [{ id: 'v5', productId: 'qsr-009', name: 'Vanilla', sku: 'QSR-MSH-001-V', priceModifier: 0, stock: 20 }, { id: 'v6', productId: 'qsr-009', name: 'Chocolate', sku: 'QSR-MSH-001-C', priceModifier: 0, stock: 15 }, { id: 'v7', productId: 'qsr-009', name: 'Strawberry', sku: 'QSR-MSH-001-S', priceModifier: 0, stock: 15 }] },
  { id: 'qsr-010', name: 'Hot Wings (10pc)', sku: 'QSR-HWING-001', category: 'Starters', vertical: 'food-beverage', subVertical: 'qsr', sellingPrice: 9900, costPrice: 4500, stock: 25, minStock: 5, maxStock: 50, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },

  // ========== FOOD & BEVERAGE - SHISA NYAMA ==========
  { id: 'sn-001', name: 'Beef Ribs (1kg)', sku: 'SN-RIB-001', category: 'Meat', vertical: 'food-beverage', subVertical: 'shisa-nyama', sellingPrice: 19900, costPrice: 9500, stock: 20, minStock: 5, maxStock: 40, unit: 'kg', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'sn-002', name: 'Boerewors (500g)', sku: 'SN-WORS-001', category: 'Meat', vertical: 'food-beverage', subVertical: 'shisa-nyama', sellingPrice: 8900, costPrice: 4200, stock: 30, minStock: 8, maxStock: 60, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'sn-003', name: 'Pork Chops (1kg)', sku: 'SN-PORK-001', category: 'Meat', vertical: 'food-beverage', subVertical: 'shisa-nyama', sellingPrice: 15900, costPrice: 7500, stock: 15, minStock: 4, maxStock: 30, unit: 'kg', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'sn-004', name: 'Chicken (whole)', sku: 'SN-CHK-001', category: 'Meat', vertical: 'food-beverage', subVertical: 'shisa-nyama', sellingPrice: 8900, costPrice: 4000, stock: 25, minStock: 6, maxStock: 50, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'sn-005', name: 'Pap (large portion)', sku: 'SN-PAP-001', category: 'Sides', vertical: 'food-beverage', subVertical: 'shisa-nyama', sellingPrice: 2500, costPrice: 600, stock: 100, minStock: 20, maxStock: 200, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'sn-006', name: 'Chakalaka', sku: 'SN-CHK-LK', category: 'Sides', vertical: 'food-beverage', subVertical: 'shisa-nyama', sellingPrice: 2000, costPrice: 500, stock: 50, minStock: 10, maxStock: 100, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'sn-007', name: 'Cold Drink - 2L', sku: 'SN-DRK-2L', category: 'Beverages', vertical: 'food-beverage', subVertical: 'shisa-nyama', sellingPrice: 3200, costPrice: 1500, stock: 40, minStock: 10, maxStock: 80, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'sn-008', name: 'Beer - Quart', sku: 'SN-BEER-Q', category: 'Beverages', vertical: 'food-beverage', subVertical: 'shisa-nyama', sellingPrice: 2500, costPrice: 1200, stock: 60, minStock: 15, maxStock: 120, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'sn-009', name: 'Braai Pack (Mix)', sku: 'SN-PACK-01', category: 'Combos', vertical: 'food-beverage', subVertical: 'shisa-nyama', sellingPrice: 35000, costPrice: 18000, stock: 10, minStock: 2, maxStock: 20, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true, posLabel: 'Family Pack' },
  { id: 'sn-010', name: 'Bread Rolls (6pc)', sku: 'SN-ROLL-6', category: 'Sides', vertical: 'food-beverage', subVertical: 'shisa-nyama', sellingPrice: 1500, costPrice: 400, stock: 80, minStock: 20, maxStock: 160, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },

  // ========== HEALTH & BEAUTY - HAIR SALON ==========
  { id: 'salon-001', name: 'Haircut - Men', sku: 'SAL-CUT-M', category: 'Services', vertical: 'health-beauty', subVertical: 'hair-salon', sellingPrice: 12000, costPrice: 0, stock: 999, minStock: 0, maxStock: 999, unit: 'service', vatRate: 15, isService: true, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'salon-002', name: 'Haircut - Women', sku: 'SAL-CUT-W', category: 'Services', vertical: 'health-beauty', subVertical: 'hair-salon', sellingPrice: 25000, costPrice: 0, stock: 999, minStock: 0, maxStock: 999, unit: 'service', vatRate: 15, isService: true, hasVariants: true, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true, variants: [{ id: 'vs1', productId: 'salon-002', name: 'Short', sku: 'SAL-CUT-W-S', priceModifier: 0, stock: 999 }, { id: 'vs2', productId: 'salon-002', name: 'Long', sku: 'SAL-CUT-W-L', priceModifier: 10000, stock: 999 }] },
  { id: 'salon-003', name: 'Wash & Blow Dry', sku: 'SAL-WASH-01', category: 'Services', vertical: 'health-beauty', subVertical: 'hair-salon', sellingPrice: 15000, costPrice: 0, stock: 999, minStock: 0, maxStock: 999, unit: 'service', vatRate: 15, isService: true, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'salon-004', name: 'Hair Coloring', sku: 'SAL-COL-001', category: 'Services', vertical: 'health-beauty', subVertical: 'hair-salon', sellingPrice: 35000, costPrice: 0, stock: 999, minStock: 0, maxStock: 999, unit: 'service', vatRate: 15, isService: true, hasVariants: true, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true, variants: [{ id: 'vc1', productId: 'salon-004', name: 'Full Head', sku: 'SAL-COL-FH', priceModifier: 0, stock: 999 }, { id: 'vc2', productId: 'salon-004', name: 'Highlights', sku: 'SAL-COL-HL', priceModifier: 15000, stock: 999 }] },
  { id: 'salon-005', name: 'Braids - Full Head', sku: 'SAL-BRD-001', category: 'Services', vertical: 'health-beauty', subVertical: 'hair-salon', sellingPrice: 45000, costPrice: 0, stock: 999, minStock: 0, maxStock: 999, unit: 'service', vatRate: 15, isService: true, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'salon-006', name: 'Relaxer Treatment', sku: 'SAL-REX-001', category: 'Services', vertical: 'health-beauty', subVertical: 'hair-salon', sellingPrice: 30000, costPrice: 0, stock: 999, minStock: 0, maxStock: 999, unit: 'service', vatRate: 15, isService: true, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'salon-007', name: 'Weave Install', sku: 'SAL-WV-001', category: 'Services', vertical: 'health-beauty', subVertical: 'hair-salon', sellingPrice: 55000, costPrice: 0, stock: 999, minStock: 0, maxStock: 999, unit: 'service', vatRate: 15, isService: true, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'salon-008', name: 'Shampoo - Retail', sku: 'SAL-RET-001', category: 'Products', vertical: 'health-beauty', subVertical: 'hair-salon', sellingPrice: 8500, costPrice: 3500, stock: 20, minStock: 5, maxStock: 40, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'salon-009', name: 'Conditioner - Retail', sku: 'SAL-RET-002', category: 'Products', vertical: 'health-beauty', subVertical: 'hair-salon', sellingPrice: 9500, costPrice: 4000, stock: 18, minStock: 5, maxStock: 36, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'salon-010', name: 'Hair Oil - Retail', sku: 'SAL-RET-003', category: 'Products', vertical: 'health-beauty', subVertical: 'hair-salon', sellingPrice: 7500, costPrice: 2800, stock: 15, minStock: 3, maxStock: 30, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },

  // ========== GROCERY & FMCG - SPASA SHOP ==========
  { id: 'spaza-001', name: 'Maize Meal 5kg', sku: 'SPZ-MAZ-5', category: 'Staples', vertical: 'grocery-fmcg', subVertical: 'spaza-shop', sellingPrice: 8990, costPrice: 7200, stock: 30, minStock: 8, maxStock: 60, unit: 'each', vatRate: 0, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'spaza-002', name: 'Rice 2kg', sku: 'SPZ-RIC-2', category: 'Staples', vertical: 'grocery-fmcg', subVertical: 'spaza-shop', sellingPrice: 5990, costPrice: 4500, stock: 25, minStock: 6, maxStock: 50, unit: 'each', vatRate: 0, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'spaza-003', name: 'Cooking Oil 2L', sku: 'SPZ-OIL-2', category: 'Cooking', vertical: 'grocery-fmcg', subVertical: 'spaza-shop', sellingPrice: 7500, costPrice: 5800, stock: 20, minStock: 5, maxStock: 40, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'spaza-004', name: 'Sugar 2.5kg', sku: 'SPZ-SGR-25', category: 'Staples', vertical: 'grocery-fmcg', subVertical: 'spaza-shop', sellingPrice: 6900, costPrice: 5200, stock: 25, minStock: 6, maxStock: 50, unit: 'each', vatRate: 0, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'spaza-005', name: 'Bread - White', sku: 'SPZ-BRD-W', category: 'Bakery', vertical: 'grocery-fmcg', subVertical: 'spaza-shop', sellingPrice: 1790, costPrice: 1400, stock: 40, minStock: 10, maxStock: 80, unit: 'each', vatRate: 0, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'spaza-006', name: 'Milk 1L', sku: 'SPZ-MLK-1', category: 'Dairy', vertical: 'grocery-fmcg', subVertical: 'spaza-shop', sellingPrice: 2090, costPrice: 1600, stock: 35, minStock: 8, maxStock: 70, unit: 'each', vatRate: 0, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true, shelfLifeDays: 7 },
  { id: 'spaza-007', name: 'Coke 2L', sku: 'SPZ-CKE-2', category: 'Beverages', vertical: 'grocery-fmcg', subVertical: 'spaza-shop', sellingPrice: 2900, costPrice: 2100, stock: 30, minStock: 8, maxStock: 60, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'spaza-008', name: 'Cigarettes - 20pk', sku: 'SPZ-CIG-20', category: 'Tobacco', vertical: 'grocery-fmcg', subVertical: 'spaza-shop', sellingPrice: 4500, costPrice: 3800, stock: 50, minStock: 15, maxStock: 100, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'spaza-009', name: 'Detergent 1kg', sku: 'SPZ-DET-1', category: 'Household', vertical: 'grocery-fmcg', subVertical: 'spaza-shop', sellingPrice: 3500, costPrice: 2600, stock: 20, minStock: 5, maxStock: 40, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'spaza-010', name: 'Airtime - Vodacom', sku: 'SPZ-AIR-VD', category: 'VAS', vertical: 'grocery-fmcg', subVertical: 'spaza-shop', sellingPrice: 0, costPrice: 0, stock: 999, minStock: 0, maxStock: 999, unit: 'service', vatRate: 0, isService: true, hasVariants: true, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true, variants: [{ id: 'va1', productId: 'spaza-010', name: 'R5', sku: 'SPZ-AIR-VD-5', priceModifier: 500, stock: 999 }, { id: 'va2', productId: 'spaza-010', name: 'R10', sku: 'SPZ-AIR-VD-10', priceModifier: 1000, stock: 999 }, { id: 'va3', productId: 'spaza-010', name: 'R20', sku: 'SPZ-AIR-VD-20', priceModifier: 2000, stock: 999 }, { id: 'va4', productId: 'spaza-010', name: 'R50', sku: 'SPZ-AIR-VD-50', priceModifier: 5000, stock: 999 }] },

  // ========== HEALTH & PHARMACY - PHARMACY ==========
  { id: 'pharm-001', name: 'Panado 500mg (24 tabs)', sku: 'PHM-PAN-24', category: 'Medicines', vertical: 'health-pharmacy', subVertical: 'pharmacy', sellingPrice: 4500, costPrice: 2800, stock: 100, minStock: 25, maxStock: 200, unit: 'each', vatRate: 0, isService: false, hasVariants: false, requiresBatchTracking: true, isComplianceRestricted: false, isAvailable: true, shelfLifeDays: 730 },
  { id: 'pharm-002', name: 'Nurofen 200mg (24 caps)', sku: 'PHM-NUR-24', category: 'Medicines', vertical: 'health-pharmacy', subVertical: 'pharmacy', sellingPrice: 7900, costPrice: 5200, stock: 60, minStock: 15, maxStock: 120, unit: 'each', vatRate: 0, isService: false, hasVariants: false, requiresBatchTracking: true, isComplianceRestricted: false, isAvailable: true, shelfLifeDays: 730 },
  { id: 'pharm-003', name: 'Bandages (5cm x 4m)', sku: 'PHM-BND-01', category: 'First Aid', vertical: 'health-pharmacy', subVertical: 'pharmacy', sellingPrice: 3500, costPrice: 1800, stock: 40, minStock: 10, maxStock: 80, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'pharm-004', name: 'Vitamin C 1000mg (30 tabs)', sku: 'PHM-VTC-30', category: 'Vitamins', vertical: 'health-pharmacy', subVertical: 'pharmacy', sellingPrice: 12000, costPrice: 7000, stock: 50, minStock: 12, maxStock: 100, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: true, isComplianceRestricted: false, isAvailable: true, shelfLifeDays: 1095 },
  { id: 'pharm-005', name: 'Throat Lozenges (24 pack)', sku: 'PHM-THR-24', category: 'Medicines', vertical: 'health-pharmacy', subVertical: 'pharmacy', sellingPrice: 4500, costPrice: 2600, stock: 45, minStock: 12, maxStock: 90, unit: 'each', vatRate: 0, isService: false, hasVariants: false, requiresBatchTracking: true, isComplianceRestricted: false, isAvailable: true, shelfLifeDays: 730 },
  { id: 'pharm-006', name: 'Cough Syrup 200ml', sku: 'PHM-CGH-20', category: 'Medicines', vertical: 'health-pharmacy', subVertical: 'pharmacy', sellingPrice: 8900, costPrice: 5500, stock: 30, minStock: 8, maxStock: 60, unit: 'each', vatRate: 0, isService: false, hasVariants: false, requiresBatchTracking: true, isComplianceRestricted: false, isAvailable: true, shelfLifeDays: 730 },
  { id: 'pharm-007', name: 'Plasters (Box of 50)', sku: 'PHM-PLS-50', category: 'First Aid', vertical: 'health-pharmacy', subVertical: 'pharmacy', sellingPrice: 2500, costPrice: 1200, stock: 60, minStock: 15, maxStock: 120, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'pharm-008', name: 'Sunscreen SPF50 100ml', sku: 'PHM-SUN-50', category: 'Skincare', vertical: 'health-pharmacy', subVertical: 'pharmacy', sellingPrice: 15000, costPrice: 9500, stock: 25, minStock: 6, maxStock: 50, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'pharm-009', name: 'Hand Sanitizer 500ml', sku: 'PHM-SAN-50', category: 'Hygiene', vertical: 'health-pharmacy', subVertical: 'pharmacy', sellingPrice: 5500, costPrice: 3000, stock: 40, minStock: 10, maxStock: 80, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'pharm-010', name: 'Prescription Processing', sku: 'PHM-SCR-001', category: 'Services', vertical: 'health-pharmacy', subVertical: 'pharmacy', sellingPrice: 0, costPrice: 0, stock: 999, minStock: 0, maxStock: 999, unit: 'service', vatRate: 0, isService: true, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },

  // ========== LIQUOR - LIQUOR STORE ==========
  { id: 'lqr-001', name: 'Smirnoff Vodka 750ml', sku: 'LQ-SMR-75', category: 'Spirits', vertical: 'liquor-nightlife', subVertical: 'liquor-store', sellingPrice: 18900, costPrice: 14000, stock: 30, minStock: 8, maxStock: 60, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: true, isAvailable: true },
  { id: 'lqr-002', name: 'J&B Whisky 750ml', sku: 'LQ-JB-75', category: 'Spirits', vertical: 'liquor-nightlife', subVertical: 'liquor-store', sellingPrice: 24500, costPrice: 18000, stock: 25, minStock: 6, maxStock: 50, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: true, isAvailable: true },
  { id: 'lqr-003', name: 'Castle Lager 6-pack', sku: 'LQ-CAST-6', category: 'Beer', vertical: 'liquor-nightlife', subVertical: 'liquor-store', sellingPrice: 9900, costPrice: 7000, stock: 50, minStock: 12, maxStock: 100, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: true, isAvailable: true },
  { id: 'lqr-004', name: 'Carling Black Label 750ml', sku: 'LQ-CBL-75', category: 'Beer', vertical: 'liquor-nightlife', subVertical: 'liquor-store', sellingPrice: 3500, costPrice: 2400, stock: 60, minStock: 15, maxStock: 120, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: true, isAvailable: true },
  { id: 'lqr-005', name: 'Nederburg Wine 750ml', sku: 'LQ-NED-75', category: 'Wine', vertical: 'liquor-nightlife', subVertical: 'liquor-store', sellingPrice: 9900, costPrice: 6500, stock: 35, minStock: 8, maxStock: 70, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: true, isAvailable: true },
  { id: 'lqr-006', name: '4th Street Wine 750ml', sku: 'LQ-4ST-75', category: 'Wine', vertical: 'liquor-nightlife', subVertical: 'liquor-store', sellingPrice: 5500, costPrice: 3500, stock: 45, minStock: 12, maxStock: 90, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: true, isAvailable: true },
  { id: 'lqr-007', name: 'Savanna Dry Cider 6-pack', sku: 'LQ-SAV-6', category: 'Cider', vertical: 'liquor-nightlife', subVertical: 'liquor-store', sellingPrice: 11900, costPrice: 8200, stock: 40, minStock: 10, maxStock: 80, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: true, isAvailable: true },
  { id: 'lqr-008', name: "Hunter's Gold 6-pack", sku: 'LQ-HUN-6', category: 'Cider', vertical: 'liquor-nightlife', subVertical: 'liquor-store', sellingPrice: 10900, costPrice: 7500, stock: 35, minStock: 8, maxStock: 70, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: true, isAvailable: true },
  { id: 'lqr-009', name: 'Ice Cubes (bag)', sku: 'LQ-ICE-01', category: 'Extras', vertical: 'liquor-nightlife', subVertical: 'liquor-store', sellingPrice: 1000, costPrice: 300, stock: 100, minStack: 25, maxStock: 200, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
  { id: 'lqr-010', name: 'Soft Drink Mixer 2L', sku: 'LQ-MIX-2L', category: 'Mixers', vertical: 'liquor-nightlife', subVertical: 'liquor-store', sellingPrice: 3000, costPrice: 1800, stock: 50, minStock: 12, maxStock: 100, unit: 'each', vatRate: 15, isService: false, hasVariants: false, requiresBatchTracking: false, isComplianceRestricted: false, isAvailable: true },
];

// ============================================================================
// 3. VAS SERVICES
// ============================================================================

export const vasItems: VASItem[] = [
  // Airtime & Data
  { id: 'vas-airtime-voda', category: 'airtime', provider: 'Vodacom', name: 'Vodacom Airtime', amounts: [5, 10, 20, 50, 100, 200], commission: 5, icon: 'Smartphone', isLive: true },
  { id: 'vas-airtime-mtn', category: 'airtime', provider: 'MTN', name: 'MTN Airtime', amounts: [5, 10, 20, 50, 100, 200], commission: 5, icon: 'Smartphone', isLive: true },
  { id: 'vas-airtime-cellc', category: 'airtime', provider: 'Cell C', name: 'Cell C Airtime', amounts: [5, 10, 20, 50, 100, 200], commission: 5, icon: 'Smartphone', isLive: true },
  { id: 'vas-airtime-telkom', category: 'airtime', provider: 'Telkom', name: 'Telkom Airtime', amounts: [5, 10, 20, 50, 100, 200], commission: 5, icon: 'Smartphone', isLive: true },
  
  // Data Bundles
  { id: 'vas-data-voda', category: 'data', provider: 'Vodacom', name: 'Vodacom Data', amounts: [25, 49, 85, 149, 299, 599], commission: 3, icon: 'Wifi', isLive: true },
  { id: 'vas-data-mtn', category: 'data', provider: 'MTN', name: 'MTN Data', amounts: [19, 49, 85, 159, 299, 549], commission: 3, icon: 'Wifi', isLive: true },
  
  // Electricity
  { id: 'vas-elec-eskom', category: 'electricity', provider: 'Eskom', name: 'Prepaid Electricity', amounts: [20, 50, 100, 200, 500, 1000], commission: 2, icon: 'Zap', isLive: true },
  { id: 'vas-elec-municipal', category: 'electricity', provider: 'Municipal', name: 'Municipal Electricity', amounts: [50, 100, 200, 500, 1000], commission: 2, icon: 'Zap', isLive: true },
  
  // Vouchers
  { id: 'vas-voucher-netflix', category: 'vouchers', provider: 'Netflix', name: 'Netflix Gift Card', amounts: [99, 149, 199], commission: 4, icon: 'Tv', isLive: true },
  { id: 'vas-voucher-showmax', category: 'vouchers', provider: 'Showmax', name: 'Showmax Voucher', amounts: [99, 199, 399], commission: 4, icon: 'Tv', isLive: true },
  { id: 'vas-voucher-steam', category: 'vouchers', provider: 'Steam', name: 'Steam Wallet', amounts: [50, 100, 200, 500], commission: 4, icon: 'Gamepad2', isLive: true },
  { id: 'vas-voucher-betting', category: 'vouchers', provider: 'Betting', name: 'Betting Voucher', amounts: [10, 20, 50, 100, 200], commission: 3, icon: 'Ticket', isLive: true },
  { id: 'vas-voucher-ott', category: 'vouchers', provider: 'OTT Voucher', name: 'OTT Voucher', amounts: [10, 20, 50, 100, 200], commission: 3, icon: 'Ticket', isLive: true },
  
  // Bill Payments
  { id: 'vas-water', category: 'water', provider: 'Municipal', name: 'Water Payment', amounts: [50, 100, 200, 500], commission: 2, icon: 'Droplets', isLive: true },
  { id: 'vas-dstv', category: 'municipal', provider: 'DStv', name: 'DStv Payment', amounts: [99, 299, 499, 699, 839], commission: 2, icon: 'Tv', isLive: true },
];

// ============================================================================
// 4. SAMPLE CUSTOMERS
// ============================================================================

export const sampleCustomers: Customer[] = [
  { id: 'cust-001', name: 'John Dlamini', phone: '+27 82 123 4567', email: 'john@example.com', loyaltyTier: 'gold', loyaltyPoints: 2450, totalSpent: 152000, visitCount: 45, lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { id: 'cust-002', name: 'Sarah Mokoena', phone: '+27 71 234 5678', loyaltyTier: 'silver', loyaltyPoints: 1250, totalSpent: 85000, visitCount: 28, lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  { id: 'cust-003', name: 'Thabo Ndlovu', phone: '+27 83 345 6789', loyaltyTier: 'bronze', loyaltyPoints: 450, totalSpent: 32000, visitCount: 12, lastVisit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
  { id: 'cust-004', name: 'Nomsa Khumalo', phone: '+27 79 456 7890', loyaltyTier: 'platinum', loyaltyPoints: 5200, totalSpent: 289000, visitCount: 78, lastVisit: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
  { id: 'cust-005', name: 'David Pretorius', phone: '+27 84 567 8901', loyaltyTier: 'gold', loyaltyPoints: 3100, totalSpent: 175000, visitCount: 52, lastVisit: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
];

// ============================================================================
// 5. SAMPLE STAFF
// ============================================================================

export const sampleStaff: StaffMember[] = [
  { id: 'staff-001', name: 'Mpho Radebe', role: 'Manager', hourlyRate: 8500, skills: ['management', 'pos', 'reports'], isWorking: true, currentShift: 'morning' },
  { id: 'staff-002', name: 'Lerato Mokoena', role: 'Cashier', hourlyRate: 4500, skills: ['pos', 'customer_service'], isWorking: true, currentShift: 'morning' },
  { id: 'staff-003', name: 'Sipho Zulu', role: 'Cashier', hourlyRate: 4500, skills: ['pos', 'customer_service'], isWorking: true, currentShift: 'afternoon' },
  { id: 'staff-004', name: 'Thandi Nkosi', role: 'Stylist', hourlyRate: 6500, skills: ['hair_styling', 'coloring', 'braids'], isWorking: true, currentShift: 'morning' },
  { id: 'staff-005', name: 'Bongani Sithole', role: 'Barber', hourlyRate: 5500, skills: ['haircuts', 'shaves', 'beard_trimming'], isWorking: false },
];

// ============================================================================
// 6. COMPLIANCE REQUIREMENTS
// ============================================================================

export const complianceRequirements: ComplianceRequirement[] = [
  {
    id: 'comp-liquor',
    name: 'Liquor Act 59 of 2003',
    description: 'South African liquor licensing and sales regulations',
    regulator: 'National Liquor Authority',
    requiredDocuments: ['Liquor License', 'ID Verification', 'Tax Clearance'],
    restrictions: ['No sales on Sundays before 13:00', 'No sales to under 18s', 'Age verification required'],
    verticals: ['liquor-nightlife', 'food-beverage']
  },
  {
    id: 'comp-sahpra',
    name: 'SAHPRA - Medicines Act 101 of 1965',
    description: 'Pharmaceutical products and schedule drug regulations',
    regulator: 'SAHPRA',
    requiredDocuments: ['Pharmacy License', 'Pharmacist Registration', 'Section 22A Permit (Schedule 5/6)'],
    restrictions: ['Prescription required for Schedule 3+', 'Pharmacist on duty required', 'Patient record keeping'],
    verticals: ['health-pharmacy']
  },
  {
    id: 'comp-rico',
    name: 'RICA - Regulation of Interception of Communications Act',
    description: 'SIM card and cell phone registration requirements',
    regulator: 'Department of Communications',
    requiredDocuments: ['ID Document', 'Proof of Address'],
    restrictions: ['IMEI tracking for all devices sold', 'RICA required for SIM activation'],
    verticals: ['electronics-tech']
  },
  {
    id: 'comp-food',
    name: 'Foodstuffs, Cosmetics and Disinfectants Act 54 of 1972',
    description: 'Food safety and handling regulations',
    regulator: 'Department of Health',
    requiredDocuments: ['Health Certificate', 'Food Safety Training'],
    restrictions: ['Allergen disclosure (R638)', 'Temperature control logs', 'Expiry date tracking'],
    verticals: ['food-beverage', 'grocery-fmcg']
  },
];

// ============================================================================
// 7. HELPER FUNCTIONS
// ============================================================================

export function getProductsByVertical(verticalId: string): Product[] {
  return products.filter(p => p.vertical === verticalId);
}

export function getProductsBySubVertical(subVerticalId: string): Product[] {
  return products.filter(p => p.subVertical === subVerticalId);
}

export function formatPrice(cents: number): string {
  const rand = cents / 100;
  return `R ${rand.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatPriceShort(cents: number): string {
  const rand = cents / 100;
  return `R${rand.toLocaleString('en-ZA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function getVerticalById(id: string): BusinessVertical | undefined {
  return businessVerticals.find(v => v.id === id);
}

export function getSubVerticalById(verticalId: string, subVerticalId: string) {
  const vertical = getVerticalById(verticalId);
  return vertical?.subVerticals.find(sv => sv.id === subVerticalId);
}

export function getVASByCategory(category: VASItem['category']): VASItem[] {
  return vasItems.filter(v => v.category === category && v.isLive);
}
