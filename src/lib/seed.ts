import { db } from '@/lib/db';
import { nanoid } from 'nanoid';

// SEED DATA CONSTANTS - These never change and are always available
const WHOLESALERS = [
  { name: 'Makro', code: 'MAK', province: 'Gauteng', city: 'Johannesburg' },
  { name: 'Jumbo/CBW', code: 'JCB', province: 'Gauteng', city: 'Johannesburg' },
  { name: 'Shoprite C&C', code: 'SCC', province: 'Western Cape', city: 'Cape Town' },
  { name: 'Bidfood', code: 'BID', province: 'Gauteng', city: 'Johannesburg' },
  { name: 'Africa C&C', code: 'ACC', province: 'KwaZulu-Natal', city: 'Durban' },
  { name: 'Devland', code: 'DEV', province: 'Gauteng', city: 'Johannesburg' },
  { name: 'SPAR Wholesale', code: 'SPW', province: 'KwaZulu-Natal', city: 'Durban' },
  { name: 'Specialists', code: 'SPE', province: 'Gauteng', city: 'Pretoria' },
];

const SUPPLIERS = [
  // Food & Beverage Suppliers
  { name: 'Fresh Produce Distributors SA', type: 'distributor', tier: 'platinum', vertical: 'Food & Beverage', province: 'Gauteng' },
  { name: 'Cape Meat Suppliers', type: 'manufacturer', tier: 'gold', vertical: 'Food & Beverage', province: 'Western Cape' },
  { name: 'Dairy Fresh Holdings', type: 'distributor', tier: 'platinum', vertical: 'Food & Beverage', province: 'KwaZulu-Natal' },
  { name: 'Bread Basket Wholesale', type: 'wholesaler', tier: 'gold', vertical: 'Food & Beverage', province: 'Gauteng' },
  { name: 'Ocean Fresh Seafood', type: 'distributor', tier: 'gold', vertical: 'Food & Beverage', province: 'Western Cape' },
  { name: 'Spice Route Trading', type: 'distributor', tier: 'silver', vertical: 'Food & Beverage', province: 'Gauteng' },
  { name: 'Farm Fresh Eggs Co', type: 'farmer', tier: 'silver', vertical: 'Food & Beverage', province: 'Free State' },
  { name: 'Craft Beverage Distributors', type: 'distributor', tier: 'gold', vertical: 'Food & Beverage', province: 'Gauteng' },
  // Grocery & FMCG
  { name: 'Consumer Goods SA', type: 'distributor', tier: 'platinum', vertical: 'Grocery & FMCG', province: 'Gauteng' },
  { name: 'FMCG Direct Trading', type: 'wholesaler', tier: 'gold', vertical: 'Grocery & FMCG', province: 'KwaZulu-Natal' },
  { name: 'National Grocery Supplies', type: 'distributor', tier: 'gold', vertical: 'Grocery & FMCG', province: 'Western Cape' },
  { name: 'Unilever SA Distribution', type: 'distributor', tier: 'platinum', vertical: 'Grocery & FMCG', province: 'Gauteng' },
  { name: 'P&G South Africa', type: 'manufacturer', tier: 'platinum', vertical: 'Grocery & FMCG', province: 'Gauteng' },
  { name: 'Nestlé SA Supplies', type: 'distributor', tier: 'gold', vertical: 'Grocery & FMCG', province: 'Gauteng' },
  { name: 'Tiger Brands Distribution', type: 'manufacturer', tier: 'platinum', vertical: 'Grocery & FMCG', province: 'Gauteng' },
  { name: 'Clover Industries', type: 'manufacturer', tier: 'gold', vertical: 'Grocery & FMCG', province: 'Gauteng' },
  // Hardware & Building
  { name: 'Build It Wholesale', type: 'wholesaler', tier: 'gold', vertical: 'Hardware & Building', province: 'Gauteng' },
  { name: 'Hardware Direct SA', type: 'distributor', tier: 'silver', vertical: 'Hardware & Building', province: 'Western Cape' },
  { name: 'Power Tools Trading', type: 'distributor', tier: 'silver', vertical: 'Hardware & Building', province: 'KwaZulu-Natal' },
  { name: 'Paint & Plastics Co', type: 'manufacturer', tier: 'gold', vertical: 'Hardware & Building', province: 'Gauteng' },
  { name: 'Building Materials SA', type: 'wholesaler', tier: 'gold', vertical: 'Hardware & Building', province: 'Gauteng' },
  { name: 'Plumbing World Suppliers', type: 'distributor', tier: 'silver', vertical: 'Hardware & Building', province: 'Western Cape' },
  // Health & Beauty
  { name: 'Beauty Supplies SA', type: 'distributor', tier: 'gold', vertical: 'Health & Beauty', province: 'Gauteng' },
  { name: 'Salon Pro Equipment', type: 'distributor', tier: 'silver', vertical: 'Health & Beauty', province: 'KwaZulu-Natal' },
  { name: 'Cosmetics Direct', type: 'distributor', tier: 'gold', vertical: 'Health & Beauty', province: 'Gauteng' },
  { name: 'Hair Care Wholesale', type: 'wholesaler', tier: 'silver', vertical: 'Health & Beauty', province: 'Western Cape' },
  { name: 'Nail & Beauty Supplies', type: 'distributor', tier: 'silver', vertical: 'Health & Beauty', province: 'Gauteng' },
  // Health & Pharmacy
  { name: 'Pharma Distributors SA', type: 'distributor', tier: 'platinum', vertical: 'Health & Pharmacy', province: 'Gauteng' },
  { name: 'Medical Supplies Co', type: 'wholesaler', tier: 'gold', vertical: 'Health & Pharmacy', province: 'Western Cape' },
  { name: 'Healthcare Products SA', type: 'distributor', tier: 'gold', vertical: 'Health & Pharmacy', province: 'KwaZulu-Natal' },
  { name: 'Vitamin & Supplements Direct', type: 'distributor', tier: 'silver', vertical: 'Health & Pharmacy', province: 'Gauteng' },
  { name: 'Surgical Equipment SA', type: 'distributor', tier: 'gold', vertical: 'Health & Pharmacy', province: 'Gauteng' },
  { name: 'Diagnostic Supplies', type: 'distributor', tier: 'silver', vertical: 'Health & Pharmacy', province: 'Western Cape' },
  // Hospitality
  { name: 'Hotel Supplies SA', type: 'wholesaler', tier: 'gold', vertical: 'Hospitality', province: 'Gauteng' },
  { name: 'Restaurant Equipment Co', type: 'distributor', tier: 'gold', vertical: 'Hospitality', province: 'Western Cape' },
  { name: 'Catering Wholesale', type: 'wholesaler', tier: 'silver', vertical: 'Hospitality', province: 'KwaZulu-Natal' },
  { name: 'Linen & Laundry Supplies', type: 'distributor', tier: 'silver', vertical: 'Hospitality', province: 'Gauteng' },
  { name: 'Kitchen Pro Equipment', type: 'distributor', tier: 'gold', vertical: 'Hospitality', province: 'Gauteng' },
  { name: 'Guest Amenities Co', type: 'distributor', tier: 'silver', vertical: 'Hospitality', province: 'Western Cape' },
  { name: 'Cleaning Solutions SA', type: 'manufacturer', tier: 'gold', vertical: 'Hospitality', province: 'Gauteng' },
  // Liquor & Nightlife
  { name: 'Premium Liquor Distributors', type: 'distributor', tier: 'gold', vertical: 'Liquor & Nightlife', province: 'Gauteng' },
  { name: 'Wine & Spirits SA', type: 'wholesaler', tier: 'gold', vertical: 'Liquor & Nightlife', province: 'Western Cape' },
  { name: 'Craft Beer Supplies', type: 'distributor', tier: 'silver', vertical: 'Liquor & Nightlife', province: 'KwaZulu-Natal' },
  { name: 'Distell Distribution', type: 'manufacturer', tier: 'platinum', vertical: 'Liquor & Nightlife', province: 'Western Cape' },
  { name: 'Brandhouse Beverages', type: 'distributor', tier: 'platinum', vertical: 'Liquor & Nightlife', province: 'Gauteng' },
  { name: 'Bar Equipment SA', type: 'distributor', tier: 'silver', vertical: 'Liquor & Nightlife', province: 'Gauteng' },
  // Electronics & Tech
  { name: 'Tech Supplies SA', type: 'distributor', tier: 'gold', vertical: 'Electronics & Tech', province: 'Gauteng' },
  { name: 'Electronics Wholesale', type: 'wholesaler', tier: 'silver', vertical: 'Electronics & Tech', province: 'Western Cape' },
  { name: 'Mobile Accessories Direct', type: 'distributor', tier: 'silver', vertical: 'Electronics & Tech', province: 'KwaZulu-Natal' },
  { name: 'Computer Parts SA', type: 'distributor', tier: 'silver', vertical: 'Electronics & Tech', province: 'Gauteng' },
  // Sport & Leisure
  { name: 'Sports Equipment SA', type: 'distributor', tier: 'gold', vertical: 'Sport & Leisure', province: 'Gauteng' },
  { name: 'Outdoor Adventures Co', type: 'wholesaler', tier: 'silver', vertical: 'Sport & Leisure', province: 'Western Cape' },
  { name: 'Fitness Supplies Direct', type: 'distributor', tier: 'silver', vertical: 'Sport & Leisure', province: 'KwaZulu-Natal' },
  { name: 'Camping World SA', type: 'distributor', tier: 'silver', vertical: 'Sport & Leisure', province: 'Gauteng' },
  { name: 'Team Sports Wholesale', type: 'wholesaler', tier: 'silver', vertical: 'Sport & Leisure', province: 'Gauteng' },
  { name: 'Gym Equipment Co', type: 'distributor', tier: 'gold', vertical: 'Sport & Leisure', province: 'Western Cape' },
  // Fashion & Apparel
  { name: 'Fashion Distributors SA', type: 'distributor', tier: 'gold', vertical: 'Fashion & Apparel', province: 'Gauteng' },
  { name: 'Clothing Wholesale Co', type: 'wholesaler', tier: 'silver', vertical: 'Fashion & Apparel', province: 'KwaZulu-Natal' },
  { name: 'Footwear Direct', type: 'distributor', tier: 'silver', vertical: 'Fashion & Apparel', province: 'Western Cape' },
  { name: 'Textile Traders SA', type: 'distributor', tier: 'silver', vertical: 'Fashion & Apparel', province: 'Gauteng' },
  { name: 'Accessories World', type: 'wholesaler', tier: 'bronze', vertical: 'Fashion & Apparel', province: 'Gauteng' },
  { name: 'Denim Supplies Co', type: 'distributor', tier: 'silver', vertical: 'Fashion & Apparel', province: 'Western Cape' },
  { name: 'Formal Wear Wholesale', type: 'wholesaler', tier: 'bronze', vertical: 'Fashion & Apparel', province: 'Gauteng' },
  { name: 'Kids Clothing SA', type: 'distributor', tier: 'silver', vertical: 'Fashion & Apparel', province: 'KwaZulu-Natal' },
  // Professional Services
  { name: 'Office Supplies SA', type: 'distributor', tier: 'gold', vertical: 'Professional Services', province: 'Gauteng' },
  { name: 'Stationery Wholesale', type: 'wholesaler', tier: 'silver', vertical: 'Professional Services', province: 'Western Cape' },
  { name: 'Printing Solutions Co', type: 'distributor', tier: 'silver', vertical: 'Professional Services', province: 'KwaZulu-Natal' },
  { name: 'IT Services Direct', type: 'distributor', tier: 'gold', vertical: 'Professional Services', province: 'Gauteng' },
  { name: 'Business Equipment SA', type: 'distributor', tier: 'silver', vertical: 'Professional Services', province: 'Gauteng' },
  { name: 'Furniture Wholesale Co', type: 'wholesaler', tier: 'silver', vertical: 'Professional Services', province: 'Western Cape' },
  { name: 'Security Solutions SA', type: 'distributor', tier: 'gold', vertical: 'Professional Services', province: 'Gauteng' },
  { name: 'Training Materials Co', type: 'distributor', tier: 'bronze', vertical: 'Professional Services', province: 'Gauteng' },
  // Childcare & Education
  { name: 'School Supplies SA', type: 'distributor', tier: 'gold', vertical: 'Childcare & Education', province: 'Gauteng' },
  { name: 'Educational Toys Co', type: 'distributor', tier: 'silver', vertical: 'Childcare & Education', province: 'Western Cape' },
  { name: 'Baby Products Wholesale', type: 'wholesaler', tier: 'silver', vertical: 'Childcare & Education', province: 'KwaZulu-Natal' },
  { name: 'Nursery Equipment SA', type: 'distributor', tier: 'silver', vertical: 'Childcare & Education', province: 'Gauteng' },
];

const CATALOG_PRODUCTS = [
  // Food & Beverage Products
  { sku: 'FP-001', description: 'Fresh Tomatoes 10kg Box', category: 'Fresh Produce', vertical: 'Food & Beverage', packSize: '10kg', unit: 'box', costPrice: 85.00, retailPrice: 120.00 },
  { sku: 'FP-002', description: 'Onions Brown 10kg Bag', category: 'Fresh Produce', vertical: 'Food & Beverage', packSize: '10kg', unit: 'bag', costPrice: 65.00, retailPrice: 95.00 },
  { sku: 'FP-003', description: 'Potatoes 10kg Bag', category: 'Fresh Produce', vertical: 'Food & Beverage', packSize: '10kg', unit: 'bag', costPrice: 75.00, retailPrice: 110.00 },
  { sku: 'FP-004', description: 'Carrots 5kg Bag', category: 'Fresh Produce', vertical: 'Food & Beverage', packSize: '5kg', unit: 'bag', costPrice: 45.00, retailPrice: 65.00 },
  { sku: 'FP-005', description: 'Cabbage Whole', category: 'Fresh Produce', vertical: 'Food & Beverage', packSize: '1pc', unit: 'piece', costPrice: 12.00, retailPrice: 18.00 },
  { sku: 'MT-001', description: 'Beef Mince 1kg', category: 'Meat', vertical: 'Food & Beverage', packSize: '1kg', unit: 'pack', costPrice: 95.00, retailPrice: 145.00 },
  { sku: 'MT-002', description: 'Chicken Portions 2kg', category: 'Meat', vertical: 'Food & Beverage', packSize: '2kg', unit: 'pack', costPrice: 85.00, retailPrice: 125.00 },
  { sku: 'MT-003', description: 'Boerewors 1kg', category: 'Meat', vertical: 'Food & Beverage', packSize: '1kg', unit: 'pack', costPrice: 110.00, retailPrice: 165.00 },
  { sku: 'DR-001', description: 'Full Cream Milk 2L', category: 'Dairy', vertical: 'Food & Beverage', packSize: '2L', unit: 'bottle', costPrice: 28.00, retailPrice: 42.00 },
  { sku: 'DR-002', description: 'Cheddar Cheese 1kg', category: 'Dairy', vertical: 'Food & Beverage', packSize: '1kg', unit: 'block', costPrice: 145.00, retailPrice: 210.00 },
  { sku: 'DR-003', description: 'Butter 500g', category: 'Dairy', vertical: 'Food & Beverage', packSize: '500g', unit: 'block', costPrice: 68.00, retailPrice: 98.00 },
  { sku: 'DR-004', description: 'Eggs Large 30s', category: 'Dairy', vertical: 'Food & Beverage', packSize: '30', unit: 'tray', costPrice: 75.00, retailPrice: 110.00 },
  { sku: 'BR-001', description: 'White Bread', category: 'Bakery', vertical: 'Food & Beverage', packSize: '700g', unit: 'loaf', costPrice: 14.00, retailPrice: 20.00 },
  { sku: 'BR-002', description: 'Brown Bread', category: 'Bakery', vertical: 'Food & Beverage', packSize: '700g', unit: 'loaf', costPrice: 15.00, retailPrice: 22.00 },
  { sku: 'BR-003', description: 'Burger Buns 6s', category: 'Bakery', vertical: 'Food & Beverage', packSize: '6', unit: 'pack', costPrice: 18.00, retailPrice: 28.00 },
  // Grocery & FMCG Products
  { sku: 'GR-001', description: 'Rice 5kg', category: 'Grocery', vertical: 'Grocery & FMCG', packSize: '5kg', unit: 'bag', costPrice: 85.00, retailPrice: 125.00 },
  { sku: 'GR-002', description: 'Cooking Oil 5L', category: 'Grocery', vertical: 'Grocery & FMCG', packSize: '5L', unit: 'bottle', costPrice: 125.00, retailPrice: 185.00 },
  { sku: 'GR-003', description: 'Sugar 2.5kg', category: 'Grocery', vertical: 'Grocery & FMCG', packSize: '2.5kg', unit: 'bag', costPrice: 48.00, retailPrice: 72.00 },
  { sku: 'GR-004', description: 'Flour 2.5kg', category: 'Grocery', vertical: 'Grocery & FMCG', packSize: '2.5kg', unit: 'bag', costPrice: 42.00, retailPrice: 65.00 },
  { sku: 'GR-005', description: 'Maize Meal 5kg', category: 'Grocery', vertical: 'Grocery & FMCG', packSize: '5kg', unit: 'bag', costPrice: 55.00, retailPrice: 82.00 },
  { sku: 'CL-001', description: 'Washing Powder 2kg', category: 'Cleaning', vertical: 'Grocery & FMCG', packSize: '2kg', unit: 'box', costPrice: 65.00, retailPrice: 98.00 },
  { sku: 'CL-002', description: 'Dishwashing Liquid 750ml', category: 'Cleaning', vertical: 'Grocery & FMCG', packSize: '750ml', unit: 'bottle', costPrice: 22.00, retailPrice: 35.00 },
  { sku: 'CL-003', description: 'Bleach 5L', category: 'Cleaning', vertical: 'Grocery & FMCG', packSize: '5L', unit: 'bottle', costPrice: 45.00, retailPrice: 68.00 },
  { sku: 'BV-001', description: 'Coca-Cola 2L', category: 'Beverages', vertical: 'Grocery & FMCG', packSize: '2L', unit: 'bottle', costPrice: 22.00, retailPrice: 35.00 },
  { sku: 'BV-002', description: 'Orange Juice 1L', category: 'Beverages', vertical: 'Grocery & FMCG', packSize: '1L', unit: 'carton', costPrice: 18.00, retailPrice: 28.00 },
  { sku: 'BV-003', description: 'Bottled Water 500ml 24s', category: 'Beverages', vertical: 'Grocery & FMCG', packSize: '24x500ml', unit: 'case', costPrice: 95.00, retailPrice: 145.00 },
  // Hardware & Building Products
  { sku: 'HW-001', description: 'Cement 50kg', category: 'Building Materials', vertical: 'Hardware & Building', packSize: '50kg', unit: 'bag', costPrice: 95.00, retailPrice: 145.00 },
  { sku: 'HW-002', description: 'Concrete Bricks (100s)', category: 'Building Materials', vertical: 'Hardware & Building', packSize: '100', unit: 'pallet', costPrice: 850.00, retailPrice: 1200.00 },
  { sku: 'HW-003', description: 'Roofing Sheets 3m', category: 'Building Materials', vertical: 'Hardware & Building', packSize: '3m', unit: 'sheet', costPrice: 185.00, retailPrice: 280.00 },
  { sku: 'HW-004', description: 'Paint White 20L', category: 'Paint', vertical: 'Hardware & Building', packSize: '20L', unit: 'bucket', costPrice: 450.00, retailPrice: 680.00 },
  { sku: 'HW-005', description: 'Paint Brushes Set', category: 'Paint', vertical: 'Hardware & Building', packSize: '5pc', unit: 'set', costPrice: 85.00, retailPrice: 130.00 },
  { sku: 'HW-006', description: 'PVC Pipes 50mm x 6m', category: 'Plumbing', vertical: 'Hardware & Building', packSize: '6m', unit: 'pipe', costPrice: 125.00, retailPrice: 195.00 },
  { sku: 'HW-007', description: 'Electrical Cable 100m', category: 'Electrical', vertical: 'Hardware & Building', packSize: '100m', unit: 'roll', costPrice: 650.00, retailPrice: 980.00 },
  { sku: 'HW-008', description: 'Power Drill 750W', category: 'Tools', vertical: 'Hardware & Building', packSize: '1', unit: 'unit', costPrice: 450.00, retailPrice: 720.00 },
  // Health & Beauty Products
  { sku: 'HB-001', description: 'Shampoo 1L Professional', category: 'Hair Care', vertical: 'Health & Beauty', packSize: '1L', unit: 'bottle', costPrice: 85.00, retailPrice: 135.00 },
  { sku: 'HB-002', description: 'Conditioner 1L Professional', category: 'Hair Care', vertical: 'Health & Beauty', packSize: '1L', unit: 'bottle', costPrice: 85.00, retailPrice: 135.00 },
  { sku: 'HB-003', description: 'Hair Color Set', category: 'Hair Care', vertical: 'Health & Beauty', packSize: '1', unit: 'kit', costPrice: 45.00, retailPrice: 75.00 },
  { sku: 'HB-004', description: 'Nail Polish Set 12s', category: 'Nail Care', vertical: 'Health & Beauty', packSize: '12', unit: 'set', costPrice: 95.00, retailPrice: 155.00 },
  { sku: 'HB-005', description: 'Facial Cream 500ml', category: 'Skin Care', vertical: 'Health & Beauty', packSize: '500ml', unit: 'jar', costPrice: 65.00, retailPrice: 105.00 },
  { sku: 'HB-006', description: 'Massage Oil 1L', category: 'Spa Products', vertical: 'Health & Beauty', packSize: '1L', unit: 'bottle', costPrice: 55.00, retailPrice: 90.00 },
  // Health & Pharmacy Products
  { sku: 'PH-001', description: 'Paracetamol 500mg 100s', category: 'Medicines', vertical: 'Health & Pharmacy', packSize: '100', unit: 'bottle', costPrice: 35.00, retailPrice: 55.00 },
  { sku: 'PH-002', description: 'Vitamin C 1000mg 30s', category: 'Vitamins', vertical: 'Health & Pharmacy', packSize: '30', unit: 'bottle', costPrice: 45.00, retailPrice: 75.00 },
  { sku: 'PH-003', description: 'Bandages Assorted 50s', category: 'First Aid', vertical: 'Health & Pharmacy', packSize: '50', unit: 'box', costPrice: 28.00, retailPrice: 45.00 },
  { sku: 'PH-004', description: 'Hand Sanitizer 5L', category: 'Hygiene', vertical: 'Health & Pharmacy', packSize: '5L', unit: 'bottle', costPrice: 95.00, retailPrice: 145.00 },
  { sku: 'PH-005', description: 'Face Masks 50s', category: 'Hygiene', vertical: 'Health & Pharmacy', packSize: '50', unit: 'box', costPrice: 45.00, retailPrice: 75.00 },
  // Hospitality Products
  { sku: 'HO-001', description: 'Hotel Towel Set', category: 'Linen', vertical: 'Hospitality', packSize: '4pc', unit: 'set', costPrice: 185.00, retailPrice: 295.00 },
  { sku: 'HO-002', description: 'Bed Sheets Queen', category: 'Linen', vertical: 'Hospitality', packSize: '1', unit: 'set', costPrice: 225.00, retailPrice: 350.00 },
  { sku: 'HO-003', description: 'Guest Amenities Kit', category: 'Amenities', vertical: 'Hospitality', packSize: '50', unit: 'box', costPrice: 450.00, retailPrice: 720.00 },
  { sku: 'HO-004', description: 'Commercial Coffee Machine', category: 'Equipment', vertical: 'Hospitality', packSize: '1', unit: 'unit', costPrice: 8500.00, retailPrice: 14500.00 },
  { sku: 'HO-005', description: 'Commercial Fridge 600L', category: 'Equipment', vertical: 'Hospitality', packSize: '1', unit: 'unit', costPrice: 12500.00, retailPrice: 19500.00 },
  // Liquor & Nightlife Products
  { sku: 'LQ-001', description: 'Beer Crates 24x340ml', category: 'Beer', vertical: 'Liquor & Nightlife', packSize: '24', unit: 'crate', costPrice: 185.00, retailPrice: 295.00 },
  { sku: 'LQ-002', description: 'Red Wine Box 5L', category: 'Wine', vertical: 'Liquor & Nightlife', packSize: '5L', unit: 'box', costPrice: 145.00, retailPrice: 225.00 },
  { sku: 'LQ-003', description: 'Vodka 750ml Premium', category: 'Spirits', vertical: 'Liquor & Nightlife', packSize: '750ml', unit: 'bottle', costPrice: 185.00, retailPrice: 295.00 },
  { sku: 'LQ-004', description: 'Whisky 750ml', category: 'Spirits', vertical: 'Liquor & Nightlife', packSize: '750ml', unit: 'bottle', costPrice: 285.00, retailPrice: 450.00 },
  { sku: 'LQ-005', description: 'Bar Glass Set 12s', category: 'Equipment', vertical: 'Liquor & Nightlife', packSize: '12', unit: 'set', costPrice: 185.00, retailPrice: 295.00 },
];

// Main seed function
export async function seedDatabase() {
  console.log('Starting database seed...');
  const results = {
    suppliers: 0,
    wholesalers: 0,
    catalogProducts: 0,
    skipped: {
      suppliers: 0,
      wholesalers: 0,
      catalogProducts: 0,
    }
  };

  try {
    // Check if data already exists
    const existingSuppliers = await db.supplier.count();
    const existingWholesalers = await db.wholesaler.count();
    const existingProducts = await db.catalogProduct.count();

    // Seed Suppliers
    if (existingSuppliers === 0) {
      console.log('Seeding suppliers...');
      for (const supplier of SUPPLIERS) {
        await db.supplier.create({
          data: {
            id: `sup_${nanoid(12)}`,
            name: supplier.name,
            code: `SUP-${nanoid(6).toUpperCase()}`,
            supplierType: supplier.type,
            tier: supplier.tier,
            verticals: [supplier.vertical],
            status: 'active',
            verificationStatus: 'verified',
            rating: 4.5,
            reviewCount: Math.floor(Math.random() * 50) + 10,
            province: supplier.province,
            city: supplier.city,
            deliveryDays: Math.floor(Math.random() * 3) + 1,
            minOrderValue: 500,
            paymentTerms: 'Net 30',
            bbbeeLevel: Math.floor(Math.random() * 4) + 1,
            fulfillmentRate: 85 + Math.floor(Math.random() * 15),
            updatedAt: new Date(),
          }
        });
        results.suppliers++;
      }
    } else {
      results.skipped.suppliers = existingSuppliers;
    }

    // Seed Wholesalers
    if (existingWholesalers === 0) {
      console.log('Seeding wholesalers...');
      for (const wholesaler of WHOLESALERS) {
        await db.wholesaler.create({
          data: {
            id: `whl_${nanoid(12)}`,
            name: wholesaler.name,
            code: wholesaler.code,
            province: wholesaler.province,
            city: wholesaler.city,
            status: 'active',
            updatedAt: new Date(),
          }
        });
        results.wholesalers++;
      }
    } else {
      results.skipped.wholesalers = existingWholesalers;
    }

    // Seed Catalog Products
    if (existingProducts === 0) {
      console.log('Seeding catalog products...');
      for (const product of CATALOG_PRODUCTS) {
        await db.catalogProduct.create({
          data: {
            id: `cp_${nanoid(12)}`,
            sku: product.sku,
            sourceType: 'wholesale',
            vertical: product.vertical,
            category: product.category,
            description: product.description,
            packSize: product.packSize,
            unit: product.unit,
            costPrice: product.costPrice,
            retailPrice: product.retailPrice,
            grossMargin: ((product.retailPrice - product.costPrice) / product.retailPrice) * 100,
            vatRate: 15.0,
            inStock: true,
            status: 'active',
            updatedAt: new Date(),
          }
        });
        results.catalogProducts++;
      }
    } else {
      results.skipped.catalogProducts = existingProducts;
    }

    console.log('Database seed complete:', results);
    return { success: true, results };
  } catch (error) {
    console.error('Database seed error:', error);
    return { success: false, error: String(error) };
  }
}

// Force reseed function
export async function forceReseedDatabase() {
  console.log('Force reseeding database...');
  
  try {
    // Delete existing data
    await db.catalogProduct.deleteMany({});
    await db.supplier.deleteMany({});
    await db.wholesaler.deleteMany({});
    
    console.log('Existing data deleted, reseeding...');
    return await seedDatabase();
  } catch (error) {
    console.error('Force reseed error:', error);
    return { success: false, error: String(error) };
  }
}

// Check database health
export async function checkDatabaseHealth() {
  try {
    const suppliers = await db.supplier.count();
    const wholesalers = await db.wholesaler.count();
    const catalogProducts = await db.catalogProduct.count();
    
    const isHealthy = suppliers > 0 && wholesalers > 0 && catalogProducts > 0;
    
    return {
      isHealthy,
      counts: {
        suppliers,
        wholesalers,
        catalogProducts,
      },
      message: isHealthy 
        ? 'Database is healthy' 
        : 'Database needs seeding - some tables are empty',
    };
  } catch (error) {
    return {
      isHealthy: false,
      counts: { suppliers: 0, wholesalers: 0, catalogProducts: 0 },
      message: `Database check failed: ${error}`,
    };
  }
}
