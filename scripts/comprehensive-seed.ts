import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

// Demo users
const DEMO_USERS = [
  { email: 'demo@groway.co.za', firstName: 'Demo', lastName: 'User', role: 'admin' },
  { email: 'salon@groway.co.za', firstName: 'Salon', lastName: 'Manager', role: 'merchant' },
  { email: 'restaurant@groway.co.za', firstName: 'Restaurant', lastName: 'Owner', role: 'merchant' },
  { email: 'spaza@groway.co.za', firstName: 'Spaza', lastName: 'Shop', role: 'merchant' },
  { email: 'barber@groway.co.za', firstName: 'Barber', lastName: 'Shop', role: 'merchant' },
  { email: 'admin@groway.co.za', firstName: 'Admin', lastName: 'User', role: 'admin' },
  { email: 'staff@groway.co.za', firstName: 'Staff', lastName: 'Member', role: 'staff' },
];

// Merchant verticals
const MERCHANT_VERTICALS = [
  { name: 'Demo Restaurant', vertical: 'food_beverage', email: 'restaurant@groway.co.za' },
  { name: 'Demo Salon', vertical: 'salon_spa', email: 'salon@groway.co.za' },
  { name: 'Demo Barber Shop', vertical: 'barber', email: 'barber@groway.co.za' },
  { name: 'Demo Spaza Shop', vertical: 'retail', email: 'spaza@groway.co.za' },
  { name: 'Demo Grocery Store', vertical: 'grocery', email: 'demo@groway.co.za' },
];

// Supplier categories
const SUPPLIER_CATEGORIES = [
  'Food & Beverage', 'Electronics', 'Clothing', 'Hardware', 'Health & Beauty',
  'Automotive', 'Office Supplies', 'Agriculture', 'Construction', 'Pharmaceuticals'
];

// Product categories
const PRODUCT_CATEGORIES = [
  'Beverages', 'Snacks', 'Dairy', 'Bakery', 'Meat', 'Produce', 'Frozen', 'Dry Goods',
  'Personal Care', 'Household', 'Electronics', 'Hardware', 'Automotive', 'Office', 'Health'
];

// South African supplier names
const SUPPLIER_NAMES = [
  'South African Breweries', 'Clover Industries', 'Tiger Brands', 'Pioneer Foods', 'RCL Foods',
  'Rainbow Chicken', 'Astral Foods', 'Woolworths Suppliers', 'Shoprite Suppliers', 'Pick n Pay Distribution',
  'Massmart Wholesale', 'Bidvest Group', 'Imperial Logistics', 'Barloworld', 'Bidcorp',
  'Nampak', 'Mondi Group', 'Sappi', 'Sasol', 'Engen Petroleum',
  'BP Southern Africa', 'Shell South Africa', 'TotalEnergies', 'Afrox', 'AECI',
  'Johnson & Johnson SA', 'Unilever SA', 'Procter & Gamble', 'Nestle SA', 'Cadbury SA',
  'Coca-Cola Beverages SA', 'PepsiCo SA', 'Distell Group', 'Heineken SA', 'Diageo SA',
  'Mediclinic', 'Netcare', 'Life Healthcare', 'Dis-Chem', 'Clicks Group',
  'Builders Warehouse', 'Cashbuild', 'Build it', 'Chamberlains', 'Diy Depot',
  'Game Stores', 'Makro', 'Jumbo Cash & Carry', 'Trade Centre', 'DCP',
  'Metro Wholesale', 'Cambridge Food', 'Food Lover\'s Market', 'Fruit & Veg City', 'Meat World',
  'South Africansupplier.com', 'Exporters SA', 'Importers Africa', 'Trade Africa', 'Global Suppliers SA',
  'Premier Foods', 'Pride Milling', 'GWK', 'Senwes', 'NWK',
  'VKB', 'OVK', 'Suidwes', 'Noordwes', 'Kaap Agri',
  'OTK', 'TLK', 'WPK', 'MPK', 'EPK',
  'KZN Suppliers', 'Gauteng Distributors', 'Western Cape Foods', 'Eastern Cape Produce', 'Limpopo Farming',
  'Mpumalanga Mills', 'North West Grain', 'Free State Dairy', 'Northern Cape Mining', 'KwaZulu Sugar',
  'Coastal Seafood', 'Inland Fisheries', 'Highland Beef', 'Lowveld Citrus', 'Karoo Lamb',
  'Swartland Grain', 'Boland Wine', 'Stellenbosch Produce', 'Paarl Dairy', 'Franschhoek Gourmet',
  'Durban Spices', 'Johannesburg Electronics', 'Cape Town Fashion', 'Pretoria Auto', 'Port Elizabeth Marine',
  'Bloemfontein Medical', 'East London Timber', 'Nelspruit Fruit', 'Kimberley Diamonds', 'Polokwane Mining',
  'Rustenburg Platinum', 'Witbank Coal', 'Middelburg Steel', 'Wellesley Food', 'RCL Weston',
  'Empire Partners', 'Fortress Logistics', 'Summit Distribution', 'Apex Trading', 'Pinnacle Foods',
  'Zenith Suppliers', 'Vertex Distribution', 'Matrix Trading', 'Nova Foods', 'Stellar Logistics',
  'Quantum Distribution', 'Kinetic Trading', 'Fusion Foods', 'Evolution Supplies', 'Genesis Distribution',
  'Horizon Trading', 'Infinity Suppliers', 'Pulse Distribution', 'Vital Foods', 'Essential Supplies',
  'Core Trading', 'Prime Distribution', 'Elite Suppliers', 'Apex Foods', 'Summit Trading',
  'Global Foods SA', 'African Traders', 'Cape Wholesalers', 'Gauteng Foods', 'Durban Distributors',
  'JHB Fresh Produce', 'CPT Seafood', 'KZN Dairy', 'EC Beef', 'WC Wine',
  'Premier Meats', 'Elite Poultry', 'Sunrise Dairy', 'Golden Grain', 'Silver Line',
  'Blue Ocean Seafood', 'Green Valley Produce', 'Red Barn Meats', 'Yellow Sun Bakery', 'Purple Iris Flowers',
  'Orange Grove Citrus', 'Brown Earth Organics', 'White Mountain Dairy', 'Black Gold Coffee', 'Clear Water Beverages',
  'Fresh Farm Produce', 'Organic Harvest', 'Nature\'s Best', 'Farm Fresh SA', 'Garden Route Produce',
  'Inland Meats', 'Coastal Catch', 'Highland Honey', 'Valley Vineyards', 'Mountain Spring Water',
  'Desert Sun Dates', 'Forest Fresh Herbs', 'Plains Grain', 'River Valley Rice', 'Lake District Fish',
  'Bay Fresh Seafood', 'Harbour Foods', 'Port City Produce', 'Coastal Coconuts', 'Island Spices',
  'Table Mountain Tea', 'Drakensberg Herbs', 'Kalahari Salt', 'Okavango Delta Rice', 'Zambezi River Fish',
  'Limpopo Valley Citrus', 'Mpumalanga Mangoes', 'KZN Banana Co', 'EC Pineapple Co', 'WC Apple Orchards',
  'Vaal River Irrigation', 'Orange River Grapes', 'Breede Valley Wines', 'Olifants River Citrus', 'Great Fish River Produce',
  'Kei River Farming', 'Umgeni Water Works', 'Tugela River Dairy', 'Thukela Valley Maize', 'Pongola Sugar',
  'Malelane Tropical', 'Hazyview Avocados', 'Tzaneen Citrus', 'Letsitele Mangoes', 'Hoedspruit Litchis',
  'Mokopane Potatoes', 'Bela Bela Tomatoes', 'Rustenburg Onions', 'Schoonspruit Cabbages', 'Ceres Apples',
  'Wolseley Pears', 'Tulbagh Peaches', 'Ceres Stone Fruit', 'Wellington Grapes', 'Paarl Berries',
  'Stellenbosch Olives', 'Somerset West Nuts', 'Grabouw Apples', 'Elgin Pears', 'Vyeboom Berries',
  'Villiersdorp Stone Fruit', 'Franschhoek Wine', 'Drakenstein Citrus', 'Wellington Dried Fruit', 'Paarl Wine',
  'Robertson Wines', 'Worcester Brandy', 'Swellendam Grain', 'Bredasdorp Wool', 'Caledon Wheat',
  'Hermanus Abalone', 'Gansbaai Shark', 'Kleinmond Crayfish', 'Pringle Bay Mussels', 'Betty\'s Bay Oysters',
  'Struisbaai Fish', 'Arniston Seafood', 'Waenhuiskrans Perlemoen', 'Malagas Mussels', 'Witsand Whale Watching',
  'Riversdale Dairy', 'Albertinia Aloe', 'Mossel Bay Oils', 'George Timber', 'Knysna Oysters',
  'Plettenberg Bay Fish', 'Tsitsikamma Honey', 'Humansdorp Dairy', 'Jeffreys Bay Surf', 'St Francis Bay Fish',
  'Port Elizabeth Automotive', 'Uitenhage Motors', 'Despatch Leather', 'Grahamstown Education', 'Port Alfred Marina',
  'East London Industry', 'King William\'s Town History', 'Queenstown Wool', 'Cradock Lamb', 'Graaff-Reinet Karoo',
  'Middelburg Engineering', 'Colesberg Horse', 'Richmond Books', 'Hanover Merino', 'De Aar Solar',
  'Kimberley Diamond', 'Upington Dried Fruit', 'Kuruman Manganese', 'Springbok Copper', 'Port Nolloth Fish',
  'Richtersveld Gems', 'Namaqua Wines', 'Calvinia Meat', 'Brandvlei Salt', 'Kenhardt Wool',
  'Keimoes Raisins', 'Kakamas Dates', 'Augrabies Falls', 'Kgalagadi Park', 'Kalahari Gemsbok',
  'Mafikeng Platinum', 'Rustenburg Chrome', 'Brits Titanium', 'Klerksdorp Gold', 'Orkney Uranium',
  'Stilfontein Antimony', 'Hartebeespoort Tourism', 'Sun City Resort', 'Pilanesberg Game', 'Madikwe Safari',
  'Mahikeng Capital', 'Vryburg Beef', 'Schweizer-Reneke Maize', 'Wolmaransstad Diamonds', 'Coligny Sunflower',
  'Lichtenburg Cement', 'Delareyville Grain', 'Sannieshof Beef', 'Ottoshoop Manganese', 'Zeerust Chrome',
  'Groot Marico River', 'Swartruggens Platinum', 'Koster Maize', 'Rustenburg Water', 'Mooinooi Platinum',
  'Bapong Mining', 'Belfast Titanium', 'Waterval Boven Rail', 'Nelspruit Citrus', 'White River Timber',
  'Hazyview Tourism', 'Sabie Pulp', 'Graskop Waterfalls', 'Pilgrims Rest Gold', 'Lydenburg Chrome',
  'Burgersfort Platinum', 'Steelpoort Chrome', 'Ohrigstad Caves', 'Hoedspruit Airbase', 'Phalaborwa Copper',
  'Tzaneen Tea', 'Modjadjiskloof Cycad', 'Duiwelskloof Fruit', 'Louis Trichardt Avocado', 'Messina Copper',
  'Musina Diamond', 'Alldays Wildlife', 'Vivo Game', 'Bela Bela Spa', 'Warmbaths Resort',
  'Settlers Citrus', 'Potgietersrus Platinum', 'Mokopane Vanadium', 'Naboomspruit Granite', 'Mookgopong Tourism',
  'Modimolle Resort', 'Lephalale Coal', 'Ellisras Power', 'Vaalwater Tourism', 'Thabazimbi Iron',
  'Northam Platinum', 'Rooiberg Tin', 'Warmbaths Mineral', 'Bela Bela Game', 'Kosmos Resort',
  'Hartbeespoort Dam', 'Brits Industrial', 'Ga-Rankuwa Medical', 'Mabopane Retail', 'Soshanguve Housing',
  'Mamelodi Township', 'Atteridgeville Transport', 'Centurion Business', 'Pretoria CBD', 'Menlyn Retail',
  'Brooklyn Mall', 'Hatfield Student', 'Arcadia Government', 'Sunry Park Cricket', 'Monte Casino',
  'Sandton Business', 'Rosebank Retail', 'Melrose Arch', 'Fourways Mall', 'Northgate Shopping',
  'Westgate Retail', 'Eastgate Mall', 'Southgate Centre', 'Bedford Centre', 'Clearwater Mall',
  'Cresta Shopping', 'Northmead Mall', 'Benmore Centre', 'Sandton City', 'Maponya Mall',
  'Soweto Tourism', 'Diepkloof Housing', 'Orlando Towers', 'Vilakazi Street', 'Hector Pieterson',
  'Apartheid Museum', 'Constitution Hill', 'Gold Reef City', 'FNB Stadium', 'Orlando Stadium',
  'Ellis Park Rugby', 'Wanderers Cricket', 'Balfour Park', 'Kings Park Soccer', 'Moses Mabhida',
  'uShaka Marine', 'Gateway Mall', 'La Lucia Mall', 'Musgrave Centre', 'The Pavilion',
  'Westville University', 'Pinetown Industrial', 'New Germany Manufacturing', 'Queensburgh Retail', 'Chatsworth Housing',
  'Phoenix Industrial', 'Verulam Retail', 'Tongaat Sugar', 'Ballito Beach', 'Umhlanga Rocks',
  'Durban North', 'Durban South', 'Durban Central', 'Point Waterfront', 'Harbour Projects',
  'International Convention', 'Ricky Fish', 'Florida Road', 'Florida Park', 'Greyville Racecourse',
];

// Generate suppliers
function generateSuppliers(count: number) {
  const suppliers = [];
  for (let i = 0; i < count; i++) {
    const nameIndex = i % SUPPLIER_NAMES.length;
    const categoryIndex = i % SUPPLIER_CATEGORIES.length;
    suppliers.push({
      id: `supplier-${i + 1}`,
      name: SUPPLIER_NAMES[nameIndex],
      category: SUPPLIER_CATEGORIES[categoryIndex],
      contactEmail: `supplier${i + 1}@example.com`,
      contactPhone: `+27${Math.floor(Math.random() * 900000000) + 100000000}`,
      address: `${Math.floor(Math.random() * 999) + 1} Supplier Street`,
      city: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein'][i % 6],
      province: ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo'][i % 6],
      postalCode: `${Math.floor(Math.random() * 9000) + 1000}`,
      country: 'South Africa',
      status: i < count * 0.8 ? 'active' : 'pending',
      rating: (Math.random() * 2 + 3).toFixed(1),
      totalOrders: Math.floor(Math.random() * 500),
      totalValue: Math.floor(Math.random() * 1000000),
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    });
  }
  return suppliers;
}

// Generate catalog products
function generateProducts(count: number) {
  const products = [];
  const productNames = [
    'Rice 5kg', 'Flour 10kg', 'Sugar 2kg', 'Salt 1kg', 'Cooking Oil 2L',
    'Pasta 500g', 'Tomato Sauce 500ml', 'Mayonnaise 500ml', 'Baked Beans 400g', 'Corn Flakes 500g',
    'Milk 1L', 'Cheese 250g', 'Butter 250g', 'Yogurt 1kg', 'Cream 250ml',
    'Bread Loaf', 'Rolls 6-pack', 'Croissants 4-pack', 'Muffins 6-pack', 'Cookies 200g',
    'Chicken 1kg', 'Beef Mince 500g', 'Pork Chops 1kg', 'Lamb Chops 1kg', 'Sausages 500g',
    'Apples 1kg', 'Oranges 1kg', 'Bananas 1kg', 'Potatoes 1kg', 'Onions 1kg',
    'Carrots 500g', 'Tomatoes 500g', 'Cabbage 1 unit', 'Lettuce 1 unit', 'Peppers 250g',
    'Frozen Peas 500g', 'Frozen Mixed Veg 500g', 'Ice Cream 2L', 'Frozen Chips 1kg', 'Frozen Chicken 1kg',
    'Coffee 250g', 'Tea Bags 100s', 'Sugar 1kg', 'Creamer 500g', 'Hot Chocolate 400g',
    'Cola 2L', 'Lemonade 2L', 'Orange Juice 1L', 'Apple Juice 1L', 'Mineral Water 500ml',
    'Soap 6-pack', 'Shampoo 500ml', 'Conditioner 500ml', 'Toothpaste 100ml', 'Toilet Paper 9-roll',
    'Detergent 2kg', 'Fabric Softener 2L', 'Dishwashing Liquid 750ml', 'Bleach 1L', 'Cleaner 500ml',
    'Nails 500g', 'Screws 500g', 'Hammer', 'Screwdriver Set', 'Drill Bits',
    'Light Bulb LED', 'Extension Cord 5m', 'Power Strip', 'Batteries AA 4-pack', 'Batteries AAA 4-pack',
    'Engine Oil 5L', 'Coolant 1L', 'Brake Fluid 500ml', 'Car Wash 1L', 'Tire Shine 500ml',
    'Paper A4 500s', 'Pens 10-pack', 'Notebook A5', 'Stapler', 'Paper Clips 100s',
    'Vitamins 30s', 'Pain Relief 20s', 'Bandages 20s', 'Antiseptic 100ml', 'First Aid Kit',
    'Dog Food 2kg', 'Cat Food 1kg', 'Bird Seed 1kg', 'Fish Food 100g', 'Pet Shampoo 250ml',
    'Wine Bottle', 'Beer 6-pack', 'Spirits 750ml', 'Champagne', 'Whiskey 750ml',
    'Snack Chips 150g', 'Nuts 200g', 'Chocolate Bar', 'Biscuits 200g', 'Popcorn 100g',
    'Baby Formula 900g', 'Diapers 30s', 'Baby Wipes 80s', 'Baby Oil 300ml', 'Baby Powder 400g',
    'Hair Gel 150ml', 'Hair Spray 250ml', 'Hair Color', 'Face Cream 50ml', 'Body Lotion 400ml',
    'Sunscreen 100ml', 'Insect Repellent 100ml', 'Candles 6-pack', 'Matches Box', 'Lighter',
    'Gift Bag Medium', 'Gift Wrap Roll', 'Greeting Card', 'Balloon Set', 'Party Decorations',
  ];
  
  for (let i = 0; i < count; i++) {
    const nameIndex = i % productNames.length;
    const categoryIndex = i % PRODUCT_CATEGORIES.length;
    const supplierId = `supplier-${(i % 350) + 1}`;
    
    products.push({
      id: `product-${i + 1}`,
      sku: `SKU-${String(i + 1).padStart(6, '0')}`,
      name: productNames[nameIndex],
      description: `High quality ${productNames[nameIndex].toLowerCase()} from trusted supplier`,
      category: PRODUCT_CATEGORIES[categoryIndex],
      supplierId,
      unitPrice: (Math.random() * 500 + 10).toFixed(2),
      wholesalePrice: (Math.random() * 400 + 8).toFixed(2),
      minimumOrder: Math.floor(Math.random() * 10) + 1,
      unit: ['each', 'kg', 'L', 'pack', 'box'][i % 5],
      inStock: Math.random() > 0.1,
      stockQuantity: Math.floor(Math.random() * 1000),
      status: i < count * 0.85 ? 'active' : 'inactive',
      createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    });
  }
  return products;
}

// Kitchen stations
const KITCHEN_STATIONS = [
  { id: 'station-grill', name: 'Grill Station', type: 'hot', color: '#ef4444', sortOrder: 1 },
  { id: 'station-fryer', name: 'Fryer Station', type: 'hot', color: '#f97316', sortOrder: 2 },
  { id: 'station-cold', name: 'Cold Station', type: 'cold', color: '#06b6d4', sortOrder: 3 },
  { id: 'station-dessert', name: 'Dessert Station', type: 'cold', color: '#a855f7', sortOrder: 4 },
  { id: 'station-bar-hot', name: 'Bar - Hot Drinks', type: 'bar', color: '#84cc16', sortOrder: 5 },
  { id: 'station-bar-cold', name: 'Bar - Cold Drinks', type: 'bar', color: '#22c55e', sortOrder: 6 },
  { id: 'station-salad', name: 'Salad Station', type: 'cold', color: '#10b981', sortOrder: 7 },
  { id: 'station-pizza', name: 'Pizza Station', type: 'hot', color: '#f59e0b', sortOrder: 8 },
];

// Floor sections
const FLOOR_SECTIONS = [
  { id: 'section-indoor', name: 'Indoor Dining', color: '#3b82f6', sortOrder: 1 },
  { id: 'section-outdoor', name: 'Outdoor Patio', color: '#22c55e', sortOrder: 2 },
  { id: 'section-vip', name: 'VIP Area', color: '#a855f7', sortOrder: 3 },
  { id: 'section-bar', name: 'Bar Area', color: '#f59e0b', sortOrder: 4 },
  { id: 'section-private', name: 'Private Room', color: '#ef4444', sortOrder: 5 },
];

async function main() {
  console.log('Starting comprehensive database seed...\n');
  
  // 1. Create demo users
  console.log('Creating demo users...');
  const passwordHash = await hash('demo1234', SALT_ROUNDS);
  
  for (const user of DEMO_USERS) {
    try {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
          id: `user-${user.email.split('@')[0]}`,
          email: user.email,
          passwordHash,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      console.error('USER ERROR:', e.toString());
    }
  }
  console.log('Demo users created\n');
  
  // 2. Create merchants
  console.log('Creating merchants...');
  for (const merchant of MERCHANT_VERTICALS) {
    try {
      await prisma.merchant.upsert({
        where: { id: `merchant-${merchant.vertical}` },
        update: {},
        create: {
          id: `merchant-${merchant.vertical}`,
          name: merchant.name,
          code: `MCH-${merchant.vertical.substring(0, 6).toUpperCase()}`,
          vertical: merchant.vertical,
          email: merchant.email,
          phone: '+27123456789',
          addressLine1: '123 Business Street',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2000',
          country: 'South Africa',
          currency: 'ZAR',
          timezone: 'Africa/Johannesburg',
          plan: 'professional',
          updatedAt: new Date(),
        },
      });
      
      // Create default branch
      await prisma.branch.upsert({
        where: { id: `branch-${merchant.vertical}-main` },
        update: {},
        create: {
          id: `branch-${merchant.vertical}-main`,
          merchantId: `merchant-${merchant.vertical}`,
          name: `${merchant.name} - Main`,
          addressLine1: '123 Business Street',
          city: 'Johannesburg',
          province: 'Gauteng',
          postalCode: '2000',
          country: 'South Africa',
          phone: '+27123456789',
          email: merchant.email,
          isDefault: true,
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      console.log(`  Merchant ${merchant.name} may already exist`);
    }
  }
  console.log('Merchants created\n');
  
  // 3. Create suppliers (350)
  console.log('Creating 350 suppliers...');
  const suppliers = generateSuppliers(350);
  let supplierCount = 0;
  for (const supplier of suppliers) {
    try {
      await prisma.supplier.create({ data: supplier });
      supplierCount++;
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`Created ${supplierCount} suppliers\n`);
  
  // 4. Create catalog products (150)
  console.log('Creating 150 catalog products...');
  const products = generateProducts(150);
  let productCount = 0;
  for (const product of products) {
    try {
      await prisma.catalogProduct.create({ data: product });
      productCount++;
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log(`Created ${productCount} catalog products\n`);
  
  // 5. Create kitchen stations for restaurant merchant
  console.log('Creating kitchen stations...');
  for (const station of KITCHEN_STATIONS) {
    try {
      await prisma.kitchenStation.create({
        data: {
          id: station.id,
          merchantId: 'merchant-food_beverage',
          branchId: 'branch-food_beverage-main',
          name: station.name,
          type: station.type,
          color: station.color,
          sortOrder: station.sortOrder,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log('Kitchen stations created\n');
  
  // 6. Create floor sections
  console.log('Creating floor sections...');
  for (const section of FLOOR_SECTIONS) {
    try {
      await prisma.floorSection.create({
        data: {
          id: section.id,
          merchantId: 'merchant-food_beverage',
          branchId: 'branch-food_beverage-main',
          name: section.name,
          color: section.color,
          sortOrder: section.sortOrder,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log('Floor sections created\n');
  
  // 7. Create restaurant tables (10 configurations)
  console.log('Creating restaurant tables...');
  const tablesPerSection = 10;
  let tableCount = 0;
  for (const section of FLOOR_SECTIONS) {
    for (let i = 1; i <= tablesPerSection; i++) {
      const tableId = `table-${section.id}-${i}`;
      try {
        await prisma.restaurantTable.create({
          data: {
            id: tableId,
            merchantId: 'merchant-food_beverage',
            branchId: 'branch-food_beverage-main',
            sectionId: section.id,
            number: `${section.id.split('-')[1].charAt(0).toUpperCase()}${i}`,
            capacity: [2, 4, 6, 8][i % 4],
            shape: ['square', 'round', 'rectangle'][i % 3],
            status: 'available',
            positionX: (i % 5) * 100 + 50,
            positionY: Math.floor(i / 5) * 100 + 50,
            width: 80,
            height: 80,
            updatedAt: new Date(),
          },
        });
        tableCount++;
      } catch (e) {
        // Skip duplicates
      }
    }
  }
  console.log(`Created ${tableCount} restaurant tables\n`);
  
  // 8. Update/Create consumer wallet with R 12,450.00
  console.log('Updating consumer wallet...');
  try {
    // Check if consumer user exists
    const existingUser = await prisma.consumerUser.findFirst();
    let consumerUserId = existingUser?.id || 'consumer-demo';
    
    if (!existingUser) {
      await prisma.consumerUser.create({
        data: {
          id: consumerUserId,
          phone: '+27820000001',
          email: 'demo@wallet.co.za',
          firstName: 'Demo',
          lastName: 'User',
          idType: 'passport',
          nationality: 'South African',
          kycStatus: 'verified',
          kycVerifiedAt: new Date(),
          failedPinAttempts: 0,
          languagePreference: 'en',
          accountStatus: 'active',
          updatedAt: new Date(),
        },
      });
    }
    
    // Update or create wallet with R 12,450.00 balance
    await prisma.consumerWallet.upsert({
      where: { userId: consumerUserId },
      update: {
        dailySpendLimit: BigInt(100000),
        pendingCents: BigInt(0),
        currency: 'ZAR',
        updatedAt: new Date(),
      },
      create: {
        id: "wallet-demo",
        balanceCents: BigInt(1245000),
        userId: consumerUserId,
        dailySpendLimit: BigInt(100000),
        pendingCents: BigInt(0),
        currency: 'ZAR',
        updatedAt: new Date(),
      },
    });
    console.log('Consumer wallet updated with R 12,450.00\n');
  } catch (e) {
    console.log('Consumer wallet update error:', (e as Error).message);
  }
  
  // 9. Create some wholesalers
  console.log('Creating wholesalers...');
  for (let i = 1; i <= 10; i++) {
    try {
      await prisma.wholesaler.create({
        data: {
          id: `wholesaler-${i}`,
          name: `Wholesaler ${i}`,
          contactEmail: `wholesaler${i}@example.com`,
          contactPhone: `+27${Math.floor(Math.random() * 900000000) + 100000000}`,
          address: `${i} Wholesaler Street`,
          city: ['Johannesburg', 'Cape Town', 'Durban'][i % 3],
          updatedAt: new Date(),
        },
      });
    } catch (e) {
      // Skip duplicates
    }
  }
  console.log('Wholesalers created\n');
  
  // Final count
  console.log('=== Final Database Counts ===');
  const counts = {
    Users: await prisma.user.count(),
    Merchants: await prisma.merchant.count(),
    Branches: await prisma.branch.count(),
    Suppliers: await prisma.supplier.count(),
    CatalogProducts: await prisma.catalogProduct.count(),
    ConsumerUsers: await prisma.consumerUser.count(),
    ConsumerWallets: await prisma.consumerWallet.count(),
    KitchenStations: await prisma.kitchenStation.count(),
    FloorSections: await prisma.floorSection.count(),
    RestaurantTables: await prisma.restaurantTable.count(),
    Wholesalers: await prisma.wholesaler.count(),
  };
  
  console.table(counts);
  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
