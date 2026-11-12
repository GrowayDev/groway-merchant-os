import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// SKU data parsed from Excel catalog
const skuData = [
  // Food & Beverage - QSR
  { sku: 'FB-QSR-001', vertical: 'Food & Bev', subVertical: 'QSR', category: 'Burger', description: 'Beef Burger Patty (100g frozen)', costPrice: 8.5, supplier: 'Eskort Ltd', leadDays: 2, minOrderQty: 50 },
  { sku: 'FB-QSR-002', vertical: 'Food & Bev', subVertical: 'QSR', category: 'Burger', description: 'Chicken Burger Fillet (120g frozen)', costPrice: 9.2, supplier: 'Rainbow Chicken Ltd', leadDays: 2, minOrderQty: 50 },
  { sku: 'FB-QSR-003', vertical: 'Food & Bev', subVertical: 'QSR', category: 'Burger', description: 'Brioche Burger Bun', costPrice: 3.8, supplier: 'Albany Bakeries', leadDays: 1, minOrderQty: 48 },
  { sku: 'FB-QSR-004', vertical: 'Food & Bev', subVertical: 'QSR', category: 'Fries', description: 'Frozen Chips (McCain 2.5kg)', costPrice: 55, supplier: 'McCain Foods SA', leadDays: 3, minOrderQty: 10 },
  { sku: 'FB-QSR-005', vertical: 'Food & Bev', subVertical: 'QSR', category: 'Sauces', description: 'Tomato Sauce 3L Bulk', costPrice: 48, supplier: 'Tiger Brands', leadDays: 2, minOrderQty: 6 },
  { sku: 'FB-QSR-006', vertical: 'Food & Bev', subVertical: 'QSR', category: 'Sauces', description: 'Mayonnaise 5L Bulk', costPrice: 95, supplier: 'Tiger Brands', leadDays: 2, minOrderQty: 4 },
  { sku: 'FB-QSR-007', vertical: 'Food & Bev', subVertical: 'QSR', category: 'Chicken', description: 'Chicken Wings (frozen 5kg)', costPrice: 42, supplier: 'Astral Foods', leadDays: 2, minOrderQty: 5 },
  { sku: 'FB-QSR-008', vertical: 'Food & Bev', subVertical: 'QSR', category: 'Chicken', description: 'Chicken Strips (frozen 2kg)', costPrice: 68, supplier: 'Astral Foods', leadDays: 2, minOrderQty: 10 },
  
  // Food & Beverage - Sit-Down
  { sku: 'FB-SD-001', vertical: 'Food & Bev', subVertical: 'Sit-Down', category: 'Beef', description: 'Sirloin Steak (300g)', costPrice: 120, supplier: 'Karan Beef', leadDays: 1, minOrderQty: 10 },
  { sku: 'FB-SD-002', vertical: 'Food & Bev', subVertical: 'Sit-Down', category: 'Beef', description: 'Rump Steak (300g)', costPrice: 110, supplier: 'Karan Beef', leadDays: 1, minOrderQty: 10 },
  { sku: 'FB-SD-003', vertical: 'Food & Bev', subVertical: 'Sit-Down', category: 'Lamb', description: 'Lamb Chops (4pc)', costPrice: 145, supplier: 'Chalmar Beef & Lamb', leadDays: 2, minOrderQty: 8 },
  { sku: 'FB-SD-004', vertical: 'Food & Bev', subVertical: 'Sit-Down', category: 'Seafood', description: 'Hake Fillet (1kg)', costPrice: 85, supplier: 'Sea Harvest Group', leadDays: 2, minOrderQty: 5 },
  { sku: 'FB-SD-005', vertical: 'Food & Bev', subVertical: 'Sit-Down', category: 'Seafood', description: 'Prawns (1kg)', costPrice: 180, supplier: 'Oceana Group', leadDays: 3, minOrderQty: 3 },
  
  // Food & Beverage - Coffee Shop
  { sku: 'FB-CS-001', vertical: 'Food & Bev', subVertical: 'Coffee Shop', category: 'Coffee', description: 'Espresso Beans 1kg', costPrice: 185, supplier: 'Nestlé SA Professional', leadDays: 3, minOrderQty: 6 },
  { sku: 'FB-CS-002', vertical: 'Food & Bev', subVertical: 'Coffee Shop', category: 'Coffee', description: 'Cappuccino Powder 500g', costPrice: 85, supplier: 'Nestlé SA Professional', leadDays: 3, minOrderQty: 12 },
  { sku: 'FB-CS-003', vertical: 'Food & Bev', subVertical: 'Coffee Shop', category: 'Milk', description: 'Fresh Milk 2L', costPrice: 38, supplier: 'Clover SA', leadDays: 1, minOrderQty: 12 },
  { sku: 'FB-CS-004', vertical: 'Food & Bev', subVertical: 'Coffee Shop', category: 'Syrup', description: 'Monin Caramel Syrup 700ml', costPrice: 95, supplier: 'Monin SA', leadDays: 5, minOrderQty: 6 },
  
  // Food & Beverage - Bakery
  { sku: 'FB-BK-001', vertical: 'Food & Bev', subVertical: 'Bakery', category: 'Flour', description: 'Cake Flour 50kg', costPrice: 420, supplier: 'Premier Foods', leadDays: 1, minOrderQty: 2 },
  { sku: 'FB-BK-002', vertical: 'Food & Bev', subVertical: 'Bakery', category: 'Flour', description: 'Bread Flour 50kg', costPrice: 380, supplier: 'Premier Foods', leadDays: 1, minOrderQty: 2 },
  { sku: 'FB-BK-003', vertical: 'Food & Bev', subVertical: 'Bakery', category: 'Yeast', description: 'Instant Yeast 500g', costPrice: 45, supplier: 'Premier Foods', leadDays: 1, minOrderQty: 10 },
  { sku: 'FB-BK-004', vertical: 'Food & Bev', subVertical: 'Bakery', category: 'Butter', description: 'Butter 1kg', costPrice: 125, supplier: 'Clover SA', leadDays: 1, minOrderQty: 6 },
  
  // Liquor & Nightlife
  { sku: 'LQ-LS-001', vertical: 'Liquor & Nightlife', subVertical: 'Liquor Store', category: 'Beer', description: 'Castle Lager 340ml (24-pack)', costPrice: 195, supplier: 'SAB (AB InBev SA)', leadDays: 1, minOrderQty: 1 },
  { sku: 'LQ-LS-002', vertical: 'Liquor & Nightlife', subVertical: 'Liquor Store', category: 'Beer', description: 'Heineken 330ml (24-pack)', costPrice: 220, supplier: 'Heineken Beverages SA', leadDays: 1, minOrderQty: 1 },
  { sku: 'LQ-LS-003', vertical: 'Liquor & Nightlife', subVertical: 'Liquor Store', category: 'Spirits', description: 'Jameson Whiskey 750ml', costPrice: 195, supplier: 'Pernod Ricard SA', leadDays: 3, minOrderQty: 6 },
  { sku: 'LQ-LS-004', vertical: 'Liquor & Nightlife', subVertical: 'Liquor Store', category: 'Spirits', description: 'Jack Daniels 750ml', costPrice: 205, supplier: 'Brown-Forman SA', leadDays: 3, minOrderQty: 6 },
  { sku: 'LQ-LS-005', vertical: 'Liquor & Nightlife', subVertical: 'Liquor Store', category: 'Wine', description: 'KWV Brandy 750ml', costPrice: 165, supplier: 'KWV Wines & Spirits', leadDays: 3, minOrderQty: 6 },
  { sku: 'LQ-LS-006', vertical: 'Liquor & Nightlife', subVertical: 'Liquor Store', category: 'Cider', description: 'Savanna Dry 6-pack', costPrice: 98, supplier: 'Distell Group', leadDays: 2, minOrderQty: 4 },
  
  // Grocery & FMCG
  { sku: 'GR-SUP-001', vertical: 'Grocery & FMCG', subVertical: 'Superette', category: 'Staples', description: 'Ace Instant Maize Meal 5kg', costPrice: 52, supplier: 'Tiger Brands', leadDays: 1, minOrderQty: 5 },
  { sku: 'GR-SUP-002', vertical: 'Grocery & FMCG', subVertical: 'Superette', category: 'Staples', description: 'Tastic Rice 5kg', costPrice: 68, supplier: 'Pioneer Foods', leadDays: 1, minOrderQty: 5 },
  { sku: 'GR-SUP-003', vertical: 'Grocery & FMCG', subVertical: 'Superette', category: 'Staples', description: 'Snowflake Flour 2.5kg', costPrice: 32, supplier: 'Premier Foods', leadDays: 1, minOrderQty: 12 },
  { sku: 'GR-SUP-004', vertical: 'Grocery & FMCG', subVertical: 'Superette', category: 'Dairy', description: 'Full Cream Milk 2L (Clover)', costPrice: 29, supplier: 'Clover SA', leadDays: 1, minOrderQty: 6 },
  { sku: 'GR-SUP-005', vertical: 'Grocery & FMCG', subVertical: 'Superette', category: 'Dairy', description: 'Eggs Large 12-pack', costPrice: 48, supplier: 'Quantum Foods', leadDays: 1, minOrderQty: 6 },
  { sku: 'GR-SUP-006', vertical: 'Grocery & FMCG', subVertical: 'Superette', category: 'Beverages', description: 'Coca-Cola 2L', costPrice: 28, supplier: 'Coca-Cola Beverages SA', leadDays: 1, minOrderQty: 6 },
  { sku: 'GR-SUP-007', vertical: 'Grocery & FMCG', subVertical: 'Superette', category: 'Meat', description: 'Boerewors (1kg)', costPrice: 89, supplier: 'Eskort Ltd', leadDays: 1, minOrderQty: 5 },
  { sku: 'GR-SUP-008', vertical: 'Grocery & FMCG', subVertical: 'Superette', category: 'Meat', description: 'Beef Mince (1kg)', costPrice: 95, supplier: 'Karan Beef', leadDays: 1, minOrderQty: 5 },
  
  // Health & Beauty
  { sku: 'HB-HS-001', vertical: 'Health & Beauty', subVertical: 'Hair Salon', category: 'Colour', description: 'L\'Oréal Majirel Hair Colour 50ml', costPrice: 68, supplier: 'L\'Oréal SA Professional', leadDays: 5, minOrderQty: 12 },
  { sku: 'HB-HS-002', vertical: 'Health & Beauty', subVertical: 'Hair Salon', category: 'Colour', description: 'Wella Koleston Perfect 60ml', costPrice: 58, supplier: 'Wella Professional (P&G)', leadDays: 5, minOrderQty: 12 },
  { sku: 'HB-HS-003', vertical: 'Health & Beauty', subVertical: 'Hair Salon', category: 'Bleach', description: 'Schwarzkopf Blond Me Bleach 450g', costPrice: 185, supplier: 'Schwarzkopf Professional SA', leadDays: 5, minOrderQty: 6 },
  { sku: 'HB-HS-004', vertical: 'Health & Beauty', subVertical: 'Hair Salon', category: 'Shampoo', description: 'Kerastase Bain Satin 1L', costPrice: 345, supplier: 'L\'Oréal SA Professional', leadDays: 7, minOrderQty: 2 },
  { sku: 'HB-NS-001', vertical: 'Health & Beauty', subVertical: 'Nail Salon', category: 'Gel', description: 'Gel Polish Set (12 colors)', costPrice: 280, supplier: 'Nail Supplies SA', leadDays: 5, minOrderQty: 3 },
  { sku: 'HB-NS-002', vertical: 'Health & Beauty', subVertical: 'Nail Salon', category: 'Acrylic', description: 'Acrylic Powder 500g', costPrice: 95, supplier: 'Nail Supplies SA', leadDays: 5, minOrderQty: 5 },
  { sku: 'HB-BR-001', vertical: 'Health & Beauty', subVertical: 'Barber', category: 'Clippers', description: 'Wahl Professional Clippers', costPrice: 850, supplier: 'Barber Supplies SA', leadDays: 5, minOrderQty: 1 },
  { sku: 'HB-TT-001', vertical: 'Health & Beauty', subVertical: 'Tattoo Studio', category: 'Ink', description: 'Eternal Ink Set (10 colors)', costPrice: 450, supplier: 'Tattoo Supplies SA', leadDays: 7, minOrderQty: 2 },
  
  // Fashion & Apparel
  { sku: 'FA-CB-001', vertical: 'Fashion & Apparel', subVertical: 'Clothing Boutique', category: 'Denim', description: 'Women\'s Skinny Jeans (Blue Wash)', costPrice: 180, supplier: 'The Foschini Group (TFG)', leadDays: 14, minOrderQty: 12 },
  { sku: 'FA-CB-002', vertical: 'Fashion & Apparel', subVertical: 'Clothing Boutique', category: 'Tops', description: 'Ladies Linen Blouse (White)', costPrice: 125, supplier: 'Rex Trueform Clothing', leadDays: 14, minOrderQty: 12 },
  { sku: 'FA-SS-001', vertical: 'Fashion & Apparel', subVertical: 'Shoe Store', category: 'Sneakers', description: 'Tsonga Veldskoen (All Sizes)', costPrice: 480, supplier: 'Tsonga Footwear', leadDays: 14, minOrderQty: 6 },
  { sku: 'FA-SS-002', vertical: 'Fashion & Apparel', subVertical: 'Shoe Store', category: 'Formal', description: 'Men\'s Oxford Shoe (Black)', costPrice: 295, supplier: 'Bata Shoe Company SA', leadDays: 7, minOrderQty: 6 },
  { sku: 'FA-TX-001', vertical: 'Fashion & Apparel', subVertical: 'Tailor', category: 'Thread', description: 'Gutermann Thread Set (24 spools)', costPrice: 180, supplier: 'Gutermann SA (Coats)', leadDays: 5, minOrderQty: 5 },
  
  // Health & Pharmacy
  { sku: 'PH-FP-001', vertical: 'Health & Pharmacy', subVertical: 'Full Pharmacy', category: 'OTC', description: 'Panado Tablets 24-pack (Paracetamol)', costPrice: 28, supplier: 'Adcock Ingram', leadDays: 3, minOrderQty: 24 },
  { sku: 'PH-FP-002', vertical: 'Health & Pharmacy', subVertical: 'Full Pharmacy', category: 'OTC', description: 'Disprin CV 300mg 28-pk', costPrice: 32, supplier: 'Bayer SA', leadDays: 3, minOrderQty: 24 },
  { sku: 'PH-FP-003', vertical: 'Health & Pharmacy', subVertical: 'Full Pharmacy', category: 'OTC', description: 'Allergex Tablets 10-pk', costPrice: 38, supplier: 'Aspen Pharmacare', leadDays: 3, minOrderQty: 24 },
  { sku: 'PH-FP-004', vertical: 'Health & Pharmacy', subVertical: 'Full Pharmacy', category: 'Vitamins', description: 'Centrum Adults (30 tabs)', costPrice: 85, supplier: 'Pfizer SA', leadDays: 3, minOrderQty: 12 },
  { sku: 'PH-FP-005', vertical: 'Health & Pharmacy', subVertical: 'Full Pharmacy', category: 'Vitamins', description: 'Vitamin C 1000mg 30-tabs (Vital)', costPrice: 42, supplier: 'Vital Health Foods', leadDays: 3, minOrderQty: 24 },
  
  // Hospitality
  { sku: 'HO-HT-001', vertical: 'Hospitality', subVertical: 'Hotel', category: 'Toiletries', description: 'Shampoo Sachet 10ml (150-pk)', costPrice: 185, supplier: 'Heavenly Amenities', leadDays: 7, minOrderQty: 5 },
  { sku: 'HO-HT-002', vertical: 'Hospitality', subVertical: 'Hotel', category: 'Toiletries', description: 'Conditioner Sachet 10ml (150-pk)', costPrice: 185, supplier: 'Heavenly Amenities', leadDays: 7, minOrderQty: 5 },
  { sku: 'HO-HT-003', vertical: 'Hospitality', subVertical: 'Hotel', category: 'Linen', description: 'Cotton Pillow Case (12-pk)', costPrice: 285, supplier: 'Linen SA', leadDays: 7, minOrderQty: 5 },
  { sku: 'HO-HT-004', vertical: 'Hospitality', subVertical: 'Hotel', category: 'Linen', description: 'Bath Towel White 70x140cm (6-pk)', costPrice: 480, supplier: 'Linen SA', leadDays: 7, minOrderQty: 3 },
  { sku: 'HO-BB-001', vertical: 'Hospitality', subVertical: 'B&B', category: 'Breakfast', description: 'Cereal Variety Pack 12-pack', costPrice: 95, supplier: 'Nestlé SA', leadDays: 3, minOrderQty: 6 },
  
  // Hardware & Building
  { sku: 'HW-HS-001', vertical: 'Hardware & Building', subVertical: 'Hardware Store', category: 'Fasteners', description: 'Wood Screws 4x50mm (200-pk)', costPrice: 28, supplier: 'Hilti SA', leadDays: 3, minOrderQty: 10 },
  { sku: 'HW-HS-002', vertical: 'Hardware & Building', subVertical: 'Hardware Store', category: 'Adhesives', description: 'Sikaflex 11FC Sealant 300ml', costPrice: 58, supplier: 'Sika SA', leadDays: 5, minOrderQty: 12 },
  { sku: 'HW-HS-003', vertical: 'Hardware & Building', subVertical: 'Hardware Store', category: 'Tools', description: 'Stanley Tape Measure 8m', costPrice: 95, supplier: 'Bosch SA', leadDays: 5, minOrderQty: 6 },
  { sku: 'HW-HS-004', vertical: 'Hardware & Building', subVertical: 'Hardware Store', category: 'Safety', description: 'Safety Boots Steel-Toe S1P', costPrice: 285, supplier: 'Bata Industrial', leadDays: 7, minOrderQty: 6 },
  { sku: 'HW-BS-001', vertical: 'Hardware & Building', subVertical: 'Building Supplies', category: 'Cement', description: 'PPC Cement 50kg', costPrice: 125, supplier: 'PPC Cement', leadDays: 2, minOrderQty: 10 },
  { sku: 'HW-BS-002', vertical: 'Hardware & Building', subVertical: 'Building Supplies', category: 'Paint', description: 'Dulux Paint 20L White', costPrice: 650, supplier: 'AkzoNobel SA (Dulux)', leadDays: 3, minOrderQty: 2 },
  
  // Electronics & Tech
  { sku: 'ET-PA-001', vertical: 'Electronics & Tech', subVertical: 'Phone & Accessories', category: 'Phones', description: 'Samsung Galaxy A15 4G', costPrice: 2850, supplier: 'Samsung SA', leadDays: 3, minOrderQty: 1 },
  { sku: 'ET-PA-002', vertical: 'Electronics & Tech', subVertical: 'Phone & Accessories', category: 'Phones', description: 'iPhone 15 128GB', costPrice: 14500, supplier: 'Apple SA / iStore', leadDays: 7, minOrderQty: 1 },
  { sku: 'ET-PA-003', vertical: 'Electronics & Tech', subVertical: 'Phone & Accessories', category: 'Chargers', description: 'USB-C 20W Fast Charger', costPrice: 48, supplier: 'Samsung SA', leadDays: 3, minOrderQty: 10 },
  { sku: 'ET-PA-004', vertical: 'Electronics & Tech', subVertical: 'Phone & Accessories', category: 'Cases', description: 'Universal Phone Case Silicone', costPrice: 18, supplier: 'Rectron SA (Ingram Micro)', leadDays: 3, minOrderQty: 20 },
  { sku: 'ET-PC-001', vertical: 'Electronics & Tech', subVertical: 'Computer & IT', category: 'Laptops', description: 'HP Laptop 15.6" i5', costPrice: 8500, supplier: 'HP SA', leadDays: 7, minOrderQty: 1 },
  { sku: 'ET-PC-002', vertical: 'Electronics & Tech', subVertical: 'Computer & IT', category: 'Printers', description: 'Epson EcoTank L3250', costPrice: 3800, supplier: 'Epson SA', leadDays: 5, minOrderQty: 1 },
  
  // Sport & Leisure
  { sku: 'SL-GY-001', vertical: 'Sport & Leisure', subVertical: 'Gym', category: 'Equipment', description: 'Dumbbells Rubber 2kg (pair)', costPrice: 185, supplier: 'Trojan Sports SA', leadDays: 7, minOrderQty: 5 },
  { sku: 'SL-GY-002', vertical: 'Sport & Leisure', subVertical: 'Gym', category: 'Equipment', description: 'Olympic Barbell 20kg', costPrice: 1850, supplier: 'Trojan Sports SA', leadDays: 7, minOrderQty: 1 },
  { sku: 'SL-GY-003', vertical: 'Sport & Leisure', subVertical: 'Gym', category: 'Supplements', description: 'Whey Protein 2kg', costPrice: 420, supplier: 'USN SA', leadDays: 3, minOrderQty: 6 },
  { sku: 'SL-SC-001', vertical: 'Sport & Leisure', subVertical: 'Sports Club', category: 'Football', description: 'Mitre Football Pro', costPrice: 285, supplier: 'Mitre SA', leadDays: 7, minOrderQty: 6 },
  { sku: 'SL-SC-002', vertical: 'Sport & Leisure', subVertical: 'Sports Club', category: 'Cricket', description: 'Gray-Nicolls Cricket Bat', costPrice: 850, supplier: 'Gray-Nicolls SA', leadDays: 14, minOrderQty: 3 },
  
  // Childcare & Education
  { sku: 'CC-DC-001', vertical: 'Childcare & Education', subVertical: 'Crèche/Daycare', category: 'Nappies', description: 'Huggies Nappies Size 4 (72pk)', costPrice: 320, supplier: 'Kimberly-Clark SA', leadDays: 1, minOrderQty: 5 },
  { sku: 'CC-DC-002', vertical: 'Childcare & Education', subVertical: 'Crèche/Daycare', category: 'Nappies', description: 'Pampers Premium Size 4 (64pk)', costPrice: 340, supplier: 'Proctor & Gamble SA', leadDays: 1, minOrderQty: 5 },
  { sku: 'CC-DC-003', vertical: 'Childcare & Education', subVertical: 'Crèche/Daycare', category: 'Formula', description: 'NAN Optipro 1 800g', costPrice: 245, supplier: 'Nestlé SA', leadDays: 3, minOrderQty: 6 },
  { sku: 'CC-SC-001', vertical: 'Childcare & Education', subVertical: 'After-School Care', category: 'Stationery', description: 'Faber-Castell Pencils 12pk', costPrice: 45, supplier: 'Faber-Castell SA', leadDays: 5, minOrderQty: 10 },
  { sku: 'CC-SC-002', vertical: 'Childcare & Education', subVertical: 'After-School Care', category: 'Paper', description: 'A4 Bond Paper 500 sheets', costPrice: 65, supplier: 'Sappi SA', leadDays: 1, minOrderQty: 5 },
  
  // Professional Services
  { sku: 'PS-AR-001', vertical: 'Professional Services', subVertical: 'Auto Repair', category: 'Oil', description: 'Castrol GTX 5W-30 5L', costPrice: 285, supplier: 'Castrol SA', leadDays: 3, minOrderQty: 5 },
  { sku: 'PS-AR-002', vertical: 'Professional Services', subVertical: 'Auto Repair', category: 'Batteries', description: 'Willard Car Battery 12V', costPrice: 1250, supplier: 'Willard Batteries', leadDays: 2, minOrderQty: 1 },
  { sku: 'PS-AR-003', vertical: 'Professional Services', subVertical: 'Auto Repair', category: 'Parts', description: 'Oil Filter Universal', costPrice: 45, supplier: 'Midas Auto Parts', leadDays: 3, minOrderQty: 10 },
  { sku: 'PS-FH-001', vertical: 'Professional Services', subVertical: 'Funeral Home', category: 'Caskets', description: 'Standard Casket Oak', costPrice: 3500, supplier: 'Funeralware SA', leadDays: 3, minOrderQty: 1 },
  { sku: 'PS-FH-002', vertical: 'Professional Services', subVertical: 'Funeral Home', category: 'Supplies', description: 'Memorial Book (50 pages)', costPrice: 85, supplier: 'AVBOB Wholesale', leadDays: 3, minOrderQty: 10 },
  { sku: 'PS-AC-001', vertical: 'Professional Services', subVertical: 'Accounting', category: 'Software', description: 'Sage Accounting License', costPrice: 299, supplier: 'Sage SA', leadDays: 0, minOrderQty: 1 },
  { sku: 'PS-AC-002', vertical: 'Professional Services', subVertical: 'Accounting', category: 'Software', description: 'Xero Accounting License', costPrice: 249, supplier: 'Xero SA', leadDays: 0, minOrderQty: 1 },
]

// GET /api/grosupply/sync-skus - Get sync status
export async function GET() {
  try {
    const skuCount = await db.supplierProduct.count()
    const supplierCount = await db.supplier.count()
    
    return NextResponse.json({
      status: 'ready',
      currentSKUs: skuCount,
      currentSuppliers: supplierCount,
      availableSKUs: skuData.length,
      message: skuCount === 0 
        ? 'Database is empty. Use POST to sync SKUs.' 
        : `Database has ${skuCount} SKUs mapped to suppliers.`
    })
  } catch (error) {
    console.error('Error checking sync status:', error)
    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    )
  }
}

// POST /api/grosupply/sync-skus - Sync all SKUs
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clearExisting = searchParams.get('clear') === 'true'
    
    // Clear existing data if requested
    if (clearExisting) {
      await db.supplierProduct.deleteMany({})
    }
    
    // Check if already seeded
    const existingCount = await db.supplierProduct.count()
    if (existingCount > 0 && !clearExisting) {
      return NextResponse.json({
        message: 'SKUs already synced. Use ?clear=true to reset.',
        existingSKUs: existingCount
      }, { status: 400 })
    }
    
    let createdCount = 0
    let skippedCount = 0
    let supplierNotFoundCount = 0
    
    // Sync SKUs
    for (const sku of skuData) {
      try {
        // Find supplier by name (fuzzy match)
        const supplier = await db.supplier.findFirst({
          where: {
            OR: [
              { name: { contains: sku.supplier } },
              { name: { contains: sku.supplier.split(' ')[0] } }
            ]
          }
        })
        
        if (!supplier) {
          supplierNotFoundCount++
          continue
        }
        
        // Check if SKU already exists for this supplier
        const existing = await db.supplierProduct.findUnique({
          where: {
            supplierId_sku: {
              supplierId: supplier.id,
              sku: sku.sku
            }
          }
        })
        
        if (existing) {
          skippedCount++
          continue
        }
        
        await db.supplierProduct.create({
          data: {
            supplierId: supplier.id,
            sku: sku.sku,
            skuName: sku.description,
            category: sku.category,
            vertical: sku.vertical,
            subVertical: sku.subVertical,
            costPrice: sku.costPrice,
            leadDays: sku.leadDays,
            minOrderQty: sku.minOrderQty,
            isPrimary: true,
            inStock: true
          }
        })
        createdCount++
      } catch (err) {
        console.error(`Error syncing SKU ${sku.sku}:`, err)
        skippedCount++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'SKUs synced successfully',
      created: createdCount,
      skipped: skippedCount,
      supplierNotFound: supplierNotFoundCount,
      total: skuData.length
    })
  } catch (error) {
    console.error('Error syncing SKUs:', error)
    return NextResponse.json(
      { error: 'Failed to sync SKUs' },
      { status: 500 }
    )
  }
}

// DELETE /api/grosupply/sync-skus - Clear all SKUs
export async function DELETE() {
  try {
    const deleted = await db.supplierProduct.deleteMany({})
    
    return NextResponse.json({
      success: true,
      message: 'All SKUs deleted',
      deletedCount: deleted.count
    })
  } catch (error) {
    console.error('Error clearing SKUs:', error)
    return NextResponse.json(
      { error: 'Failed to clear SKUs' },
      { status: 500 }
    )
  }
}
