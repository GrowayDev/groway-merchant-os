/**
 * Groway Master Seed v1.0 — populates the entire platform from an empty DB.
 * Run: cd /home/z/my-project && bun scripts/master-seed.ts
 *
 * Sections: demo auth · suppliers (original 63 + researched additions) · wholesalers ·
 * catalog products · supplier catalogs · merchant inventory · POS sales history ·
 * GoPay (devices/transactions/settlements) · enterprise · admin · SAPE full dataset.
 * Idempotent: wipes only the tables it seeds, in FK-safe order.
 */
import { PrismaClient } from '@prisma/client'
import { createHmac, randomUUID } from 'crypto'
import { readFileSync } from 'fs'

const db = new PrismaClient()

// ---------- helpers ----------
let seedState = 42
function rnd(): number {
  seedState = (seedState * 1103515245 + 12345) % 2147483648
  return seedState / 2147483648
}
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)]
const between = (a: number, b: number) => a + rnd() * (b - a)
const iBetween = (a: number, b: number) => Math.floor(between(a, b + 1))
const daysAgo = (d: number, h = 9) => {
  const t = new Date()
  t.setDate(t.getDate() - d)
  t.setHours(h, iBetween(0, 59), 0, 0)
  return t
}
const daysAhead = (d: number) => {
  const t = new Date()
  t.setDate(t.getDate() + d)
  return t
}
const DEMO_HASH = '$2b$10$D865SOzfaJ1wrC6RDkV2MeNjU7Izxkpdp8gSFqRfGnPizcrVcat0y' // demo1234
const SIGNING_KEY = process.env.SAPE_SIGNING_KEY || 'sape-dev-signing-key'
const hmac = (s: string) => createHmac('sha256', SIGNING_KEY).update(s).digest('hex')

const FIRST = ['Thabo', 'Lerato', 'Sipho', 'Nomsa', 'Johan', 'Anele', 'Pieter', 'Zanele', 'Sibusiso', 'Mercia', 'Katlego', 'Precious', 'Andile', 'Charmaine', 'Vusi', 'Naledi']
const LAST = ['Mokoena', 'Nkosi', 'van der Merwe', 'Dlamini', 'Botha', 'Mahlangu', 'Naidoo', 'Khumalo', 'Pretorius', 'Zulu', 'Ndlovu', 'Jacobs', 'Molefe', 'Pillay']
const BANKS = ['FNB', 'Standard Bank', 'ABSA', 'Nedbank', 'Capitec']
const person = (i: number) => `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`
const phone = (i: number) => `+27${iBetween(60, 84)}${String(1000000 + ((i * 8237) % 8999999)).slice(0, 7)}`
const emailFor = (name: string, domain: string) => `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@${domain}`

const VERTICALS = [
  'Grocery & FMCG', 'Food & Beverage', 'Liquor & Nightlife', 'Health & Beauty',
  'Health & Pharmacy', 'Hospitality', 'Hardware & Building', 'Electronics & Tech',
  'Fashion & Apparel', 'Sport & Leisure', 'Childcare & Education', 'Professional Services',
]

// ---------- original 63 suppliers (from prisma/seed-suppliers.ts — verbatim) ----------
function loadOriginalSuppliers(): any[] {
  const src = readFileSync('/home/z/my-project/prisma/seed-suppliers.ts', 'utf8')
  const start = src.indexOf('const suppliers = [')
  const end = src.indexOf('\n]', start)
  const arrayText = src.slice(src.indexOf('[', start), end + 2)
  // eslint-disable-next-line no-eval
  return eval(arrayText)
}

// ---------- researched additions: real SA wholesale suppliers for thin verticals ----------
const EXTRA_SUPPLIERS: any[] = [
  // Electronics & Tech distributors
  { name: 'Mustek Limited', code: 'MUSTEK', website: 'mustek.co.za', verticals: ['Electronics & Tech'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 2, minOrderUnit: '1 unit', notes: 'National distributor: Acer, Canon, Fujitsu, Sebata. Mega Warehouse JHB.', supplierType: 'distributor', city: 'Midrand', province: 'Gauteng' },
  { name: 'Tarsus Distribution', code: 'TARSUS', website: 'tarsus.co.za', verticals: ['Electronics & Tech'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 2, minOrderUnit: '1 unit', notes: 'HP, Apple, Dell, Lenovo distribution. Nationally.uch.', supplierType: 'distributor', city: 'Midrand', province: 'Gauteng' },
  { name: 'Rectron', code: 'RECTRON', website: 'rectron.co.za', verticals: ['Electronics & Tech'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 1, minOrderUnit: '1 unit', notes: 'Asus, Microsoft, Canon, HP. B-BBEE level 1. Same-day JHB.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Drive Control Corporation', code: 'DCC', website: 'dcc.co.za', verticals: ['Electronics & Tech'], tier: 'silver', bbbeeLevel: 2, deliveryDays: 2, minOrderUnit: '1 unit', notes: 'Networking, storage, PC components. Samsung, Acer, TP-Link.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Ingram Micro South Africa', code: 'INGRAM', website: 'ingrammicro.co.za', verticals: ['Electronics & Tech'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 3, minOrderUnit: '1 unit', notes: 'Global tech distributor. Cloud, devices, AV.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  // Health & Pharmacy manufacturers
  { name: 'Aspen Pharmacare', code: 'ASPEN', website: 'aspenpharma.com', verticals: ['Health & Pharmacy'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 2, minOrderUnit: '1 case', notes: 'SA largest pharma manufacturer. GMP accredited. Schedule distribution.', supplierType: 'manufacturer', city: 'Durban', province: 'KwaZulu-Natal' },
  { name: 'Adcock Ingram', code: 'ADCOCK', website: 'adcock.co.za', verticals: ['Health & Pharmacy'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 2, minOrderUnit: '1 case', notes: 'Panado, Corenza, Citrotec. OTC & hospital ranges.', supplierType: 'manufacturer', city: 'Midrand', province: 'Gauteng' },
  { name: 'Cipla SA', code: 'CIPLA', website: 'cipla.co.za', verticals: ['Health & Pharmacy'], tier: 'silver', bbbeeLevel: 2, deliveryDays: 3, minOrderUnit: '1 case', notes: 'Generics and respiratory. SAHPRA licensed.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Pharma Dynamics', code: 'PHARMAD', website: 'pharmadynamics.co.za', verticals: ['Health & Pharmacy'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 3, minOrderUnit: '1 case', notes: 'Cardiovascular & CNS generics. Mydol, Dindevan.', supplierType: 'manufacturer', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Litha Healthcare', code: 'LITHA', website: 'litha.co.za', verticals: ['Health & Pharmacy'], tier: 'silver', bbbeeLevel: 2, deliveryDays: 3, minOrderUnit: '1 case', notes: 'Vaccines, OTC, infant nutrition. Part of Ascendis.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  // Fashion & Apparel manufacturers
  { name: 'Seardel Group', code: 'SEARDEL', website: 'seardel.co.za', verticals: ['Fashion & Apparel'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 5, minOrderUnit: '1 pack', notes: "SA's largest clothing manufacturer. Prestige, Sliver, Bonwit.", supplierType: 'manufacturer', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Monatic (House of Monatic)', code: 'MONATIC', website: 'monatic.co.za', verticals: ['Fashion & Apparel'], tier: 'silver', bbbeeLevel: 2, deliveryDays: 5, minOrderUnit: '12 units', notes: 'Bellville clothing manufacturer. Corporate & school wear.', supplierType: 'manufacturer', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Carry Manufacturing', code: 'CARRY', website: 'carry.co.za', verticals: ['Fashion & Apparel'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 7, minOrderUnit: '24 units', notes: 'Workwear, overalls, PPE clothing. SABS compliant.', supplierType: 'manufacturer', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Pals Clothing', code: 'PALSCLOTHING', website: 'palsclothing.co.za', verticals: ['Fashion & Apparel'], tier: 'bronze', bbbeeLevel: 4, deliveryDays: 7, minOrderUnit: '24 units', notes: 'Schoolwear, knitwear, sports uniforms. Local CMT.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'aDiv apparel', code: 'ADIV', website: 'adiv.co.za', verticals: ['Fashion & Apparel'], tier: 'bronze', bbbeeLevel: 4, deliveryDays: 7, minOrderUnit: '12 units', notes: 'Streetwear and basics manufacturer. Quick-turn CMT.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  // Sport & Leisure
  { name: 'The Pro Shop Group', code: 'PROSHOP', website: 'proshop.co.za', verticals: ['Sport & Leisure'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 3, minOrderUnit: '6 units', notes: 'Golf equipment wholesale: Callaway, TaylorMade, Titleist.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Sportsmans Warehouse Wholesale', code: 'SPORTSMANS', website: 'sportsmanswarehouse.co.za', verticals: ['Sport & Leisure'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 4, minOrderUnit: '12 units', notes: 'Team sport kit, school sport, fitness. Bulk team orders.', supplierType: 'distributor', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Cape Union Mart Group', code: 'CUM', website: 'capeunionmart.co.za', verticals: ['Sport & Leisure'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 5, minOrderUnit: '6 units', notes: 'Outdoor, camping, hiking gear. K-Way, Old Flag private label.', supplierType: 'distributor', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Leisure Sports Distributors', code: 'LEISURESPORTS', website: 'leisuresports.co.za', verticals: ['Sport & Leisure'], tier: 'bronze', bbbeeLevel: 4, deliveryDays: 5, minOrderUnit: '12 units', notes: 'Cricket, rugby, netball equipment. School sport specialist.', supplierType: 'distributor', city: 'Durban', province: 'KwaZulu-Natal' },
  { name: 'Fitco Gym Supplies', code: 'FITCO', website: 'fitco.co.za', verticals: ['Sport & Leisure'], tier: 'bronze', bbbeeLevel: 2, deliveryDays: 6, minOrderUnit: '1 unit', notes: 'Gym equipment, weights, mats. Commercial & home.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  // Childcare & Education
  { name: 'Shuter & Shooter Publishers', code: 'SHUTERS', website: 'shuters.co.za', verticals: ['Childcare & Education'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 5, minOrderUnit: '10 units', notes: 'KZN-based edu publisher. CAPS-aligned titles, dictionaries.', supplierType: 'manufacturer', city: 'Pietermaritzburg', province: 'KwaZulu-Natal' },
  { name: 'Oxford University Press SA', code: 'OXFORDSA', website: 'oup.com.za', verticals: ['Childcare & Education'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 5, minOrderUnit: '10 units', notes: 'CAPS textbooks, dictionaries, readers. National edu contracts.', supplierType: 'manufacturer', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Macmillan Education SA', code: 'MACMILLAN', website: 'macmillaneducation.co.za', verticals: ['Childcare & Education'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 6, minOrderUnit: '10 units', notes: 'Textbooks, teacher guides, e-learning. CAPS & IEB.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Cambridge University Press SA', code: 'CAMBRIDGE', website: 'cambridge.org', verticals: ['Childcare & Education'], tier: 'silver', bbbeeLevel: 4, deliveryDays: 6, minOrderUnit: '10 units', notes: 'International & CAPS curricula. Exam prep materials.', supplierType: 'manufacturer', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Smartplay Education Supplies', code: 'SMARTPLAY', website: 'smartplay.co.za', verticals: ['Childcare & Education'], tier: 'bronze', bbbeeLevel: 2, deliveryDays: 4, minOrderUnit: '5 units', notes: 'ECD kits, educational toys, classroom furniture. SABS tested.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Kidz Trading Wholesale', code: 'KIDZTRADING', website: 'kidztrading.co.za', verticals: ['Childcare & Education'], tier: 'bronze', bbbeeLevel: 4, deliveryDays: 5, minOrderUnit: '12 units', notes: 'Toys, nursery furniture, baby care. Import & local.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  // Professional Services / office supplies
  { name: 'Waltons Stationery', code: 'WALTONS', website: 'waltons.co.za', verticals: ['Professional Services'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 2, minOrderUnit: '1 box', notes: 'Largest SA stationery wholesaler. Bidvest group. Next-day.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Croxley SA', code: 'CROXLEY', website: 'croxley.co.za', verticals: ['Professional Services'], tier: 'silver', bbbeeLevel: 2, deliveryDays: 3, minOrderUnit: '1 box', notes: 'Paper, office products, print. SA paper mill (Enstra).', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Bidvest Office & Print', code: 'BIDVESTOFF', website: 'bidvest.co.za', verticals: ['Professional Services'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 2, minOrderUnit: '1 unit', notes: 'Print, copy, office solutions. Konica Minolta. National.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Xerox South Africa', code: 'XEROXSA', website: 'xerox.co.za', verticals: ['Professional Services'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 4, minOrderUnit: '1 unit', notes: 'Printers, copiers, managed print services.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Canon South Africa', code: 'CANONSA', website: 'canon.co.za', verticals: ['Professional Services', 'Electronics & Tech'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 4, minOrderUnit: '1 unit', notes: 'Imaging, printers, cameras. Authorised service network.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  // Liquor additions
  { name: 'Vinimark', code: 'VINIMARK', website: 'vinimark.co.za', verticals: ['Liquor & Nightlife'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 2, minOrderUnit: '1 case', notes: "SA's largest independent wine wholesaler. 60+ estates.", supplierType: 'distributor', city: 'Stellenbosch', province: 'Western Cape' },
  { name: 'DGB (Pty) Ltd', code: 'DGB', website: 'dgb.co.za', verticals: ['Liquor & Nightlife'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 2, minOrderUnit: '1 case', notes: 'Boschendal, Douglas Green, Bellingham. National distribution.', supplierType: 'manufacturer', city: 'Wellington', province: 'Western Cape' },
  // Grocery & FMCG additions
  { name: 'Nestlé East & Southern Africa', code: 'NESTLE', website: 'nestle-esar.com', verticals: ['Grocery & FMCG', 'Food & Beverage'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 2, minOrderUnit: '1 case', notes: 'Nescafé, Ricoffy, Milo, Maggi, Cerelac.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'AVI Limited', code: 'AVI', website: 'avigroup.co.za', verticals: ['Grocery & FMCG'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 2, minOrderUnit: '1 case', notes: 'Five Roses, Freshpak, Willards, National Brands biscuits.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'RCL Foods', code: 'RCL', website: 'rclfoods.com', verticals: ['Grocery & FMCG', 'Food & Beverage'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 2, minOrderUnit: '1 case', notes: 'Selati sugar, Yum Yum, Bobtail, Rainbow. Vector Logistics.', supplierType: 'manufacturer', city: 'Westville', province: 'KwaZulu-Natal' },
  { name: 'Libstar Group', code: 'LIBSTAR', website: 'libstar.co.za', verticals: ['Grocery & FMCG'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 3, minOrderUnit: '1 case', notes: 'Private label food, household. Lancewood, Goldcrest.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Siqalo Foods', code: 'SIQALO', website: 'siqalofoods.com', verticals: ['Grocery & FMCG'], tier: 'silver', bbbeeLevel: 2, deliveryDays: 3, minOrderUnit: '1 case', notes: 'Mellowwood, Sunfoil? No — Siqalo: Zenex margarine, baking fats. Remgro.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  // Hospitality additions
  { name: 'Bidfood South Africa', code: 'BIDFOOD', website: 'bidfood.co.za', verticals: ['Hospitality', 'Food & Beverage'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 1, minOrderUnit: 'R500 order', notes: 'Foodservice leader: catering, bakery, butchery supplies.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Metcash Trading SA (SPAR DC)', code: 'METCASH', website: 'spar.co.za', verticals: ['Hospitality', 'Grocery & FMCG'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 1, minOrderUnit: '1 pallet', notes: 'SPAR distribution centres. Wholesale grocery & fresh.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  // Hardware additions
  { name: 'AfriSam', code: 'AFRISAM', website: 'afrisam.com', verticals: ['Hardware & Building'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 2, minOrderUnit: '1 bag', notes: 'Cement, readymix, aggregate. Eco-friendly CPC range.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Safintra Roofing', code: 'SAFINTRA', website: 'safintra.co.za', verticals: ['Hardware & Building'], tier: 'silver', bbbeeLevel: 2, deliveryDays: 4, minOrderUnit: '10 sheets', notes: 'Roofing sheets, cladding. Saflok 700. National branches.', supplierType: 'manufacturer', city: 'Durban', province: 'KwaZulu-Natal' },
]

const WHOLESALERS = [
  { name: 'Makro', code: 'MAKRO', type: 'cash_and_carry', branches: 22, province: 'National' },
  { name: 'Jumbo/CBW', code: 'JUMBO', type: 'cash_and_carry', branches: 45, province: 'National' },
  { name: 'Shoprite C&C', code: 'SHOPRITE-CC', type: 'cash_and_carry', branches: 68, province: 'National' },
  { name: 'Bidfood', code: 'BIDFOOD-WS', type: 'foodservice', branches: 15, province: 'National' },
  { name: 'Africa C&C', code: 'AFRICA-CC', type: 'cash_and_carry', branches: 12, province: 'Gauteng' },
  { name: 'Devland', code: 'DEVLAND', type: 'cash_and_carry', branches: 8, province: 'Gauteng' },
  { name: 'SPAR Wholesale/Metcash Shield', code: 'SPAR-WS', type: 'distributor', branches: 6, province: 'National' },
  { name: 'Specialists', code: 'SPECIAL', type: 'specialist', branches: 10, province: 'National' },
]

const CATALOG: Record<string, Record<string, string[]>> = {
  'Grocery & FMCG': {
    Household: ['Washing Powder 2kg', 'Dishwashing Liquid 750ml', 'Fabric Softener 2L', 'Multi-purpose Cleaner 2L', 'Bleach 1.5L', 'Bin Liners 20s'],
    'Personal Care': ['Toothpaste 100ml', 'Soap Bar 175g', 'Shampoo 400ml', 'Roll-on 50ml', 'Razor 5-pack'],
    Cleaning: ['Floor Cleaner 2L', 'Glass Cleaner 500ml', 'Disinfectant 5L', 'Scourers 10-pack'],
    Confectionery: ['Chocolate Slab 80g', 'Chips 125g', 'Biscuits 200g', 'Sweets 150g', 'Gum 10-pack'],
    'Pet Food': ['Dog Food 8kg', 'Cat Food 4kg', 'Dog Treats 500g'],
    'Baby Products': ['Nappies Jumbo Pack', 'Baby Wipes 80s', 'Infant Formula 900g', 'Baby Cereal 500g'],
  },
  'Food & Beverage': {
    'Fresh Produce': ['Potatoes 10kg', 'Onions 10kg', 'Tomatoes 5kg', 'Cabbage unit', 'Bananas 5kg', 'Apples 4kg'],
    Dairy: ['Full Cream Milk 6x1L', 'Cheddar Block 1kg', 'Butter 500g', 'Yogurt 1L', 'Maas 2L'],
    Meat: ['Whole Chicken frozen', 'Chicken Portions 5kg', 'Beef Mince 5kg', 'Wors 5kg', 'Pork Chops 5kg'],
    Beverages: ['Coke 2L x6', 'Fanta Orange 2L x6', 'Sprite 2L x6', 'Still Water 12x500ml', 'Juice Blend 12x1L', 'Energy Drink 24x300ml'],
    'Dry Goods': ['Maize Meal 12.5kg', 'Rice 10kg', 'Samp 10kg', 'Cake Flour 12.5kg', 'Sugar 10kg', ' Cooking Oil 5L', 'Baked Beans 12x410g', 'Pilchards 12x400g'],
    Bakery: ['Bread Flour 12.5kg', 'Scones frozen 48s', 'Rolls 100s'],
    Spices: ['Curry Powder 500g', 'Aromat 200g', 'Stock Cubes 48s', 'Salt 1kg'],
  },
  'Liquor & Nightlife': {
    Beer: ['Castle Lager 24x340ml', 'Carling Black Label 24x340ml', 'Heineken 24x330ml', 'Hansa 24x340ml'],
    Spirits: ['Savanna Dry 24x330ml', 'Jameson 750ml x6', 'Smirnoff 1818 6x750ml', 'Klipdrift 6x750ml', 'Gordon Gin 6x750ml'],
    Wine: ['Four Cousins 6x750ml', 'Nederburg 6x750ml', 'Four Elements 6x1L', 'Overmeer 6x750ml'],
    Ciders: ['Hunter\'s Dry 24x330ml', 'Flying Fish 24x340ml', 'Bernini 24x275ml'],
    Mixers: ['Coke 24x300ml', 'Tonic 24x200ml', 'Cranberry Juice 12x1L'],
  },
  'Health & Beauty': {
    Haircare: ['Relaxer Kit', 'Hair Food 250ml', 'Braiding Hair', 'Shampoo 2L salon', 'Conditioner 5L salon'],
    Skincare: ['Petroleum Jelly 500ml', 'Glycerine 250ml', 'Face Cream 250ml', 'Lotion 500ml'],
    Cosmetics: ['Foundation range 12s', 'Lipstick display 24s', 'Eye pencil 48s'],
    'Nail Products': ['Nail Polish 48s display', 'Acrylic Kit', 'Nail Tips 500s'],
    'Salon Equipment': ['Hair Dryer professional', 'Steamer', 'Trolley', 'Salon Chair'],
  },
  'Health & Pharmacy': {
    Medicines: ['Panado 24s', 'Grandpa 24s', 'Cough Syrup 200ml', 'Vitamin C 1000mg 30s', 'Antihistamine 30s'],
    'First Aid': ['Plasters 100s', 'Bandage roll', 'Antiseptic 250ml', 'First Aid Kit 25p'],
    Vitamins: ['Multivitamin 60s', 'Calcium+D 60s', 'Iron 60s', 'Omega-3 60s'],
    'Medical Supplies': ['Examination Gloves 100s', 'Face Masks 50s', 'Thermometer digital', 'Wheelchair basic'],
  },
  Hospitality: {
    Linen: ['Queen Sheet Set', 'Pillow Cases 12pk', 'Bath Towels 12pk', 'Duvet Covers 6pk'],
    Toiletries: ['Guest Soap 100s', 'Shampoo sachets 300s', 'Toilet Paper 48s'],
    'Kitchen Equipment': ['Gas Stove 4-plate', 'Deep Fryer 10L', 'Microwave 34L', 'Kettle commercial', 'Saucepots set'],
    Furniture: ['Dining Chairs 6pk', 'Table 8-seater', 'Bed base set'],
  },
  'Hardware & Building': {
    Tools: ['Power Drill 750W', 'Angle Grinder 900W', 'Hand Tool Set 108pc', 'Wheelbarrow', 'Spade & Fork set'],
    'Building Materials': ['Cement 50kg', 'Face Bricks 1000', 'Roof Sheets 3.6m', 'River Sand m3', 'Stone 19mm m3'],
    Paint: ['Interior Paint 20L', 'Exterior Paint 20L', 'Primer 5L', 'PVA White 20L'],
    Plumbing: ['CPVC Pipe 3m 20mm', 'Tap set', 'Geyser 150L', 'PVC Fittings pack'],
    Electrical: ['Cable 100m 2.5mm', 'Circuit Breaker 20A', 'Light Bulbs LED 10pk', 'Distribution Board 8-way'],
  },
  'Electronics & Tech': {
    Computers: ['Laptop 15.6 i5', 'Desktop i3 bundle', 'Monitor 24"', 'Printer MFP laser'],
    Phones: ['Smartphone 64GB', 'Feature Phone', 'Tablet 10"', 'Phone cases 24s'],
    Accessories: ['Power Bank 20000mAh', 'Chargers 12pk', 'Earphones 24pk', 'USB Cables 24pk'],
    Audio: ['Bluetooth Speaker', 'Party Speaker 8"', 'Soundbar', 'Headphones 12pk'],
    Networking: ['Router 4G LTE', 'Wi-Fi Extender', 'Switch 8-port', 'Cable Cat6 305m'],
    TV: ['TV 32" HD', 'TV 43" FHD', 'TV Bracket', 'Decoder HD'],
  },
  'Fashion & Apparel': {
    Menswear: ['Jeans 12pk mixed', 'T-shirts 24pk', 'Work Shirts 12pk', 'Overall pair'],
    Womenswear: ['Dresses 12pk', 'Skirts 12pk', 'Blouses 12pk'],
    Schoolwear: ['School Shirts 24pk', 'School Trousers 24pk', 'School Dresses 24pk', ' jerseys 12pk'],
    Footwear: ['Sneakers 12pk', 'School Shoes 12pk', 'Safety Boots 6pk'],
    Workwear: ['Overalls 12pk', 'Reflective Vests 24pk', 'Boiler Suits 12pk'],
  },
  'Sport & Leisure': {
    'Team Sport': ['Soccer Balls size 5 x12', 'Netball Balls x12', 'Rugby Balls x12', 'Team Kit Sets 14s', 'Bib Sets 10s'],
    Cricket: ['Cricket Bats', 'Cricket Balls 6pk', 'Batting Pads pair', 'Stumps set'],
    Fitness: ['Dumbbells pair', 'Yoga Mats 12pk', 'Skipping Ropes 24pk', 'Boxing Gloves 12pk'],
    Outdoor: ['Tent 4-person', 'Gas Stove portable', 'Cooler Box 30L', 'Sleeping Bags 6pk'],
  },
  'Childcare & Education': {
    Textbooks: ['Grade 7 Maths CAPS x20', 'Grade 4 Home Language x20', 'Dictionaries English x20'],
    'ECD Materials': ['ECD Kit Level 1', 'Puzzle Sets 12pk', 'Building Blocks 100pc', 'Crayons 24pk x24'],
    Furniture: ['School Deskers 10pk', 'Chairs 10pk', 'Bookshelf', 'Play Mat'],
    Stationery: ['Exercise Books 192pg x50', 'Pens blue 100', 'Pencils HB 144', 'Chalk box'],
  },
  'Professional Services': {
    Stationery: ['Copy Paper A4 5-ream', 'Lever Arch Files 12pk', 'Envelopes C4 100s', 'Pens display 50s'],
    Print: ['Business Cards 1000', 'Flyers A5 1000', 'Ink Cartridge', 'Toner Cartridge'],
    Office: ['Staplers 12pk', 'Calculator 12pk', 'Whiteboard 1200mm', 'Office Chair'],
  },
}

async function main() {
  console.log('=== Groway Master Seed v1.0 ===')
  const t0 = Date.now()

  // ---------- wipe (FK-safe order) ----------
  console.log('Wiping existing seed data...')
  const wipes = [
    'sapeConsumerScan', 'sapeTipOff', 'sapeAuthorityNotification', 'sapeNetworkBlock',
    'sapeVerificationFailure', 'sapePosVerification', 'sapeCustodyEvent', 'sapeProductSerial',
    'sapeProductIdentity', 'sapeAuthenticatedSupplier',
    'enterpriseActivity', 'enterpriseTransfer', 'enterpriseCustomer', 'enterpriseInventory',
    'enterpriseUser', 'enterpriseMerchant', 'enterpriseCorporateClient',
    'gopayTransaction', 'gopaySettlement', 'gopayDevice', 'gopayMerchant',
    'pOSPayment', 'pOSOrder', 'transactionItem', 'transaction',
    'product', 'supplierCatalogProduct', 'supplierCatalog', 'supplierProduct',
    'catalogProduct', 'wholesaler', 'supplier',
    'paymentMethod', 'merchantUser', 'branch', 'adminUser', 'user', 'merchant',
  ]
  for (const table of wipes) {
    try {
      // @ts-expect-error dynamic delegate
      await db[table].deleteMany({})
    } catch { /* table may not exist in this schema version */ }
  }
  console.log('Wipe complete')

  // ---------- 1. Merchant + user + branch + admin ----------
  console.log('Seeding demo auth...')
  const merchant = await db.merchant.create({
    data: {
      id: 'merchant-001',
      code: 'GRW-001',
      name: 'Groway Demo Spaza',
      tradingName: 'Groway Demo Spaza',
      registrationNumber: '2019/123456/07',
      vatNumber: '4123456789',
      vertical: 'grocery',
      subVertical: 'spaza_shop',
      phone: '+27821234567',
      email: 'demo@groway.co.za',
      addressLine1: '12 Vilakazi Street',
      city: 'Soweto',
      province: 'Gauteng',
      postalCode: '1804',
      vatRate: 15,
      vatRegistered: true,
      posEnabled: true,
      onlineStoreEnabled: true,
      deliveryEnabled: true,
      loyaltyEnabled: true,
      plan: 'professional',
      planStatus: 'active',
      status: 'active',
      onboardingComplete: true,
      onboardingStep: 'complete',
      kycStatus: 'verified',
      kycVerifiedAt: daysAgo(60),
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    },
  })
  await db.user.create({
    data: {
      id: 'demo_user_1',
      email: 'demo@groway.co.za',
      name: 'Demo Operator',
      phone: '+27821234567',
      passwordHash: DEMO_HASH,
      pinHash: '$2b$10$i.dXPWNVIsk.rYJ4OfP1buSZh26FOwHeFq1eE9oTzefWb0eERe7XW',
      role: 'owner',
      emailVerified: daysAgo(90),
      updatedAt: new Date(),
    },
  })
  await db.merchantUser.create({
    data: {
      id: 'demo_mu_1',
      merchantId: merchant.id,
      userId: 'demo_user_1',
      role: 'owner',
      branchId: 'branch-001',
      permissions: JSON.stringify(['*']),
      acceptedAt: daysAgo(90),
      isActive: true,
      updatedAt: new Date(),
    },
  })
  await db.branch.create({
    data: {
      updatedAt: new Date(),
      id: 'branch-001',
      merchantId: merchant.id,
      code: 'GRW-001-01',
      name: 'Main Store — Vilakazi St',
      type: 'store',
      managerName: 'Demo Operator',
      phone: '+27821234567',
      city: 'Soweto',
      province: 'Gauteng',
      isMainBranch: true,
    },
  }).catch(async () => {
    // isMainBranch may not exist in schema — retry without
    await db.branch.create({
      data: {
        updatedAt: new Date(),
        id: 'branch-001',
        merchantId: merchant.id,
        code: 'GRW-001-01',
        name: 'Main Store — Vilakazi St',
        type: 'store',
        managerName: 'Demo Operator',
        phone: '+27821234567',
        city: 'Soweto',
        province: 'Gauteng',
      },
    })
  })
  await db.adminUser.create({
    data: {
      id: 'admin_001',
      email: 'admin@groway.co.za',
      name: 'System Admin',
      role: 'super_admin',
      department: 'Operations',
      phone: '+27821111111',
      passwordHash: DEMO_HASH,
      mfaEnabled: false,
      status: 'active',
      updatedAt: new Date(),
    },
  })
  console.log('  merchant-001 / demo@groway.co.za / admin@groway.co.za created')

  // ---------- 2. Suppliers ----------
  console.log('Seeding suppliers (original 63 + researched additions)...')
  const original = loadOriginalSuppliers()
  const seenCodes = new Set<string>(original.map((o: any) => o.code))
  const extras = EXTRA_SUPPLIERS.filter((e) => !seenCodes.has(e.code))
  const all = [...original, ...extras]
  const supplierRows: any[] = []
  let si = 0
  for (const s of all) {
    si++
    const contact = person(si)
    const domain = (s.website || 'supplier.co.za').replace(/^https?:\/\//, '')
    supplierRows.push({
      id: `sup-${String(si).padStart(3, '0')}`,
      name: s.name,
      code: s.code,
      contactPerson: contact,
      email: emailFor(contact, domain),
      phone: phone(si),
      website: s.website,
      address: `${iBetween(1, 220)} ${pick(['Main', 'Church', 'Market', 'Voortrekker', 'Commissioner'])} Road`,
      city: s.city,
      province: s.province,
      postalCode: String(1000 + ((si * 137) % 8999)),
      bankName: BANKS[si % BANKS.length],
      bankAccount: `•••• ${String(1000 + ((si * 913) % 8999))}`,
      bankBranch: String(23000 + ((si * 977) % 59999)),
      supplierType: s.supplierType || 'distributor',
      tier: s.tier || 'silver',
      bbbeeLevel: s.bbbeeLevel ?? 4,
      rating: s.tier === 'gold' ? Math.round(between(4.6, 5) * 10) / 10 : s.tier === 'silver' ? Math.round(between(4.2, 4.8) * 10) / 10 : Math.round(between(3.8, 4.5) * 10) / 10,
      reviewCount: iBetween(40, 380),
      deliveryDays: s.deliveryDays ?? 3,
      minOrderValue: iBetween(0, 2500),
      minOrderUnit: s.minOrderUnit || '1 case',
      paymentTerms: s.tier === 'gold' ? 'net30' : si % 3 === 0 ? 'net15' : si % 7 === 0 ? 'cod' : 'net30',
      categories: JSON.stringify(Object.keys(CATALOG[s.verticals?.[0]] || {}).slice(0, 4)),
      verticals: JSON.stringify(s.verticals),
      fulfillmentRate: s.tier === 'gold' ? Math.round(between(96, 99.5) * 10) / 10 : Math.round(between(92, 97) * 10) / 10,
      notes: s.notes,
      status: 'active',
      verificationStatus: 'verified',
      verifiedAt: daysAgo(iBetween(30, 300)),
      updatedAt: new Date(),
    })
  }
  await db.supplier.createMany({ data: supplierRows })
  console.log(`  ${supplierRows.length} suppliers`)
  const byVertical: Record<string, number> = {}
  for (const s of supplierRows) {
    for (const v of JSON.parse(s.verticals)) byVertical[v] = (byVertical[v] || 0) + 1
  }
  console.log('  coverage:', JSON.stringify(byVertical))

  // ---------- 3. Wholesalers ----------
  const wholesalerRows = await db.wholesaler.createMany({
    data: WHOLESALERS.map((w, i) => ({
      id: `wh-${i + 1}`,
      name: w.name,
      code: w.code,
      type: w.type,
      branches: String(w.branches),
      branchCount: w.branches,
      province: w.province,
      email: `orders@${w.code.toLowerCase().replace(/[^a-z]/g, '')}.co.za`,
      phone: phone(i + 40),
      minOrderUnit: '1 case',
      creditTerms: 'net30',
      deliveryDays: 2,
      status: 'active',
      updatedAt: new Date(),
    })),
  })
  console.log(`  ${wholesalerRows.count} wholesalers`)

  // ---------- 4. Catalog products ----------
  console.log('Seeding catalog products...')
  const catalogRows: any[] = []
  let skuIdx = 1000
  for (const vertical of VERTICALS) {
    const cats = CATALOG[vertical]
    if (!cats) continue
    const vSuppliers = supplierRows.filter((s) => JSON.parse(s.verticals).includes(vertical))
    for (const [category, products] of Object.entries(cats)) {
      for (const productName of products) {
        skuIdx++
        const supplier = vSuppliers.length ? vSuppliers[skuIdx % vSuppliers.length] : supplierRows[skuIdx % supplierRows.length]
        const wholesaler = WHOLESALERS[skuIdx % WHOLESALERS.length]
        const cost = Math.round(between(12, 850) * 100) / 100
        const margin = Math.round(between(15, 48)) / 100
        const retail = Math.round(cost * (1 + margin) * 100) / 100
        const packSizes = ['1x1', '1x6', '1x12', '1x24', '6x1L', '12x500ml', '10kg', '5kg', '50kg', 'Box of 12']
        catalogRows.push({
          id: `cat-${skuIdx}`,
          sku: `SKU-${vertical.slice(0, 2).toUpperCase()}-${skuIdx}`,
          sourceType: 'wholesale',
          wholesalerId: `wh-${(skuIdx % WHOLESALERS.length) + 1}`,
          supplierId: supplier.id,
          vertical,
          category,
          description: productName.trim(),
          brand: pick(['House Brand', 'Premier', 'Goldi', 'Clover', 'Tastic', 'Jungle', 'Lucky Star', 'Koo', 'All Gold', 'Ajax', 'Dawn', 'Huletts', 'Sasko', 'IWISA']),
          packSize: pick(packSizes),
          unit: pick(['each', 'case', 'pack', 'kg', 'box']),
          vatRate: 15,
          costPrice: cost,
          retailPrice: retail,
          grossMargin: margin,
          minOrderQty: iBetween(1, 12),
          leadDays: supplier.deliveryDays || 3,
          inStock: rnd() > 0.08,
          status: 'active',
          updatedAt: new Date(),
        })
      }
    }
  }
  await db.catalogProduct.createMany({ data: catalogRows })
  console.log(`  ${catalogRows.length} catalog products`)

  // ---------- 5. Supplier catalogs + products ----------
  console.log('Seeding supplier catalogs...')
  const allCatalog = await db.catalogProduct.findMany({ select: { id: true, vertical: true } })
  const catByVertical: Record<string, string[]> = {}
  for (const c of allCatalog) {
    catByVertical[c.vertical] = catByVertical[c.vertical] || []
    catByVertical[c.vertical].push(c.id)
  }
  let supplierProductCount = 0
  let catalogLinks = 0
  for (const [idx, s] of supplierRows.entries()) {
    const verts: string[] = JSON.parse(s.verticals)
    const productIds: string[] = []
    for (const v of verts) {
      const pool = catByVertical[v] || []
      productIds.push(...pool.slice(0, iBetween(3, 6)))
    }
    if (!productIds.length) continue
    const supplierProducts = productIds.slice(0, 12).map((pid, j) => {
      const cat = catalogRows.find((c) => c.id === pid)!
      const cost = cat ? cat.costPrice : between(10, 400)
      return {
        id: `sp-${idx}-${j}`,
        supplierId: s.id,
        sku: `${s.code}-${1000 + j}`,
        name: cat ? cat.description : 'Product',
        category: cat ? cat.category : 'General',
        unit: 'each',
        basePrice: Math.round(cost * 1.18 * 100) / 100,
        costPrice: Math.round(cost * 100) / 100,
        minOrderQty: 1,
        leadTime: s.deliveryDays,
        inStock: rnd() > 0.1,
        stockQty: iBetween(20, 900),
        active: true,
        updatedAt: new Date(),
      }
    })
    await db.supplierProduct.createMany({ data: supplierProducts })
    supplierProductCount += supplierProducts.length
    const catalog = await db.supplierCatalog.create({
      data: {
        updatedAt: new Date(),
        id: `sc-${idx}`,
        supplierId: s.id,
        name: `${s.name} — Main Catalogue`,
        description: `Full wholesale catalogue for ${s.name}. ${s.notes || ''}`.slice(0, 240),
        visibility: 'public',
        shareCode: `SHR-${s.code}`,
        status: 'published',
        publishedAt: daysAgo(iBetween(20, 200)),
        productCount: supplierProducts.length,
        viewCount: iBetween(10, 480),
      },
    })
    await db.supplierCatalogProduct.createMany({
      data: supplierProducts.map((sp, j) => ({
        id: `scp-${idx}-${j}`,
        catalogId: catalog.id,
        productId: sp.id,
        featured: j < 3,
        sortOrder: j,
        customPrice: j === 0 ? Math.round(sp.basePrice * 0.97 * 100) / 100 : null,
      })),
    })
    catalogLinks += supplierProducts.length
  }
  console.log(`  ${supplierProductCount} supplier products, ${catalogLinks} catalog links`)

  // ---------- 6. Merchant inventory (Product) ----------
  console.log('Seeding merchant inventory...')
  const groceryPool = catalogRows.filter((c) => c.vertical === 'Grocery & FMCG' || c.vertical === 'Food & Beverage')
  const productRows = groceryPool.slice(0, 60).map((c, i) => ({
    id: `prd-${i + 1}`,
    merchantId: 'merchant-001',
    branchId: 'branch-001',
    sku: c.sku,
    barcode: `600${String(1000000 + i * 7919).slice(0, 7)}`,
    name: c.description,
    type: 'standard',
    unit: c.unit,
    costPrice: c.costPrice,
    sellingPrice: c.retailPrice,
    margin: c.grossMargin,
    vatRate: 15,
    trackInventory: true,
    currentStock: iBetween(3, 120),
    lowStockThreshold: 10,
    reorderPoint: 5,
    reorderQuantity: 24,
    updatedAt: new Date(),
  }))
  await db.product.createMany({ data: productRows })
  console.log(`  ${productRows.length} products`)

  // ---------- 7. POS sales history (30 days) ----------
  console.log('Seeding POS sales history...')
  const methods = [
    { m: 'cash', w: 42 }, { m: 'card', w: 30 }, { m: 'qr', w: 14 }, { m: 'eft', w: 9 }, { m: 'wallet', w: 5 },
  ]
  const weighted = methods.flatMap((x) => Array(x.w).fill(x.m))
  let orderN = 0
  let txnN = 0
  for (let d = 29; d >= 0; d--) {
    const dailyOrders = iBetween(6, 14)
    for (let k = 0; k < dailyOrders; k++) {
      orderN++
      txnN++
      const items = iBetween(1, 5)
      let subtotal = 0
      for (let it = 0; it < items; it++) {
        const p = productRows[iBetween(0, productRows.length - 1)]
        subtotal += p.sellingPrice * iBetween(1, 3)
      }
      subtotal = Math.round(subtotal * 100) / 100
      const tax = Math.round(subtotal * 0.15 * 100) / 100
      const total = Math.round((subtotal + tax) * 100) / 100
      const method = weighted[iBetween(0, weighted.length - 1)]
      const hour = iBetween(7, 19)
      const closedAt = daysAgo(d, hour)
      await db.pOSOrder.create({
        data: {
          updatedAt: new Date(),
          id: `poso-${txnN}`,
          orderNumber: `ORD-2026${String(10000 + txnN)}`,
          type: 'walk-in',
          customerName: rnd() > 0.6 ? person(txnN) : 'Walk-in',
          staffName: 'Demo Operator',
          openedAt: closedAt,
          closedAt,
          status: 'closed',
          kitchenStatus: 'completed',
          subtotal,
          taxAmount: tax,
          total,
          paymentStatus: 'paid',
        },
      })
      await db.pOSPayment.create({
        data: {
          updatedAt: new Date(),
          id: `posp-${txnN}`,
          orderId: `poso-${txnN}`,
          amount: total,
          method,
          status: 'completed',
          cardType: method === 'card' ? pick(['visa', 'mastercard']) : null,
          cardLastFour: method === 'card' ? String(1000 + iBetween(0, 8999)) : null,
          authCode: method === 'card' ? `AP${iBetween(100000, 999999)}` : null,
          terminalId: method === 'card' || method === 'qr' ? `GP-QT-000${iBetween(1, 3)}` : null,
          transactionRef: `TXN-${Date.now()}-${txnN}`,
          processedAt: closedAt,
        },
      })
      await db.transaction.create({
        data: {
          updatedAt: new Date(),
          id: `txn-${txnN}`,
          merchantId: 'merchant-001',
          branchId: 'branch-001',
          number: `TXN-2026${String(50000 + txnN)}`,
          type: 'sale',
          status: 'completed',
          customerName: rnd() > 0.6 ? person(txnN) : 'Walk-in',
          subtotal,
          taxAmount: tax,
          total,
          paymentMethod: method,
          paymentReference: `TXN-${txnN}`,
          staffName: 'Demo Operator',
          completedAt: closedAt,
        },
      })
    }
  }
  console.log(`  ${txnN} orders/transactions over 30 days`)

  // ---------- 8. GoPay (devices, transactions, settlements) ----------
  console.log('Seeding GoPay...')
  await db.gopayMerchant.create({
    data: {
      updatedAt: new Date(),
      id: 'merchant-001',
      businessName: 'Groway Demo Spaza',
      tradingName: 'Groway Demo Spaza',
      email: 'demo@groway.co.za',
      phone: '+27821234567',
      status: 'active',
      kycStatus: 'approved',
      totalRevenue: 0,
      totalTransactions: 0,
      deviceCount: 3,
    },
  })
  const devices = [
    { id: 'gpd-1', serial: 'GP-QT-0001', name: 'Counter QR Terminal', type: 'qr_terminal', loc: 'Till 1 — Main Store' },
    { id: 'gpd-2', serial: 'GP-QT-0002', name: 'Mobile POS Device', type: 'mobile_pos', loc: 'Mobile — Delivery' },
    { id: 'gpd-3', serial: 'GP-CR-0001', name: 'Card Reader', type: 'card_reader', loc: 'Till 2 — Main Store' },
  ]
  for (const [i, dv] of devices.entries()) {
    await db.gopayDevice.create({
      data: {
        updatedAt: new Date(),
        id: dv.id,
        serialNumber: dv.serial,
        name: dv.name,
        type: dv.type,
        merchantId: 'merchant-001',
        status: 'active',
        batteryLevel: iBetween(62, 98),
        signalStrength: iBetween(55, 99),
        lastActive: new Date(Date.now() - iBetween(1, 200) * 60000),
        firmwareVersion: '2.4.1',
        location: dv.loc,
        totalTransactions: 0,
        totalRevenue: 0,
      },
    })
  }
  // GoPay transactions (14 days)
  let gtCount = 0
  for (let d = 13; d >= 0; d--) {
    const daily = iBetween(2, 6)
    for (let k = 0; k < daily; k++) {
      gtCount++
      const settled = d >= 2
      const amount = Math.round(between(45, 950) * 100) / 100
      await db.gopayTransaction.create({
        data: {
          updatedAt: new Date(),
          id: `gpt-${gtCount}`,
          transactionId: `GP-TXN-${String(100000 + gtCount)}`,
          amount,
          currency: 'ZAR',
          type: 'payment',
          status: 'completed',
          paymentMethod: pick(['card', 'qr', 'eft']),
          deviceId: `gpd-${iBetween(1, 3)}`,
          customerMaskedCard: rnd() > 0.5 ? '•••• ' + String(1000 + iBetween(0, 8999)) : null,
          settlementStatus: settled ? 'settled' : 'pending',
          settledAt: settled ? daysAgo(Math.max(0, d - 1), 17) : null,
          createdAt: daysAgo(d, iBetween(8, 18)),
        },
      })
    }
  }
  // Settlements (12 batches over 21 days)
  let settleTotal = 0
  for (let i = 0; i < 12; i++) {
    const d = 21 - i * 2
    const status = d <= 2 ? 'pending' : d <= 5 ? 'processing' : i === 7 ? 'failed' : 'completed'
    const txnCount = iBetween(8, 26)
    const total = Math.round(between(2400, 12500) * 100) / 100
    settleTotal += total
    const scheduled = daysAgo(Math.max(0, d), 17)
    await db.gopaySettlement.create({
      data: {
        updatedAt: new Date(),
        id: `gps-${i + 1}`,
        merchantId: 'merchant-001',
        batchId: `SETT-2026${String(200 + i)}`,
        totalAmount: total,
        transactionCount: txnCount,
        status,
        scheduledAt: scheduled,
        processedAt: status === 'completed' ? daysAgo(Math.max(0, d - 1), 9) : null,
        bankReference: status === 'completed' ? `FNB-${String(700000 + i * 131)}` : null,
      },
    })
  }
  await db.gopayMerchant.update({ where: { id: 'merchant-001' }, data: { totalRevenue: settleTotal, totalTransactions: gtCount } })
  console.log(`  3 devices, ${gtCount} transactions, 12 settlements`)

  // ---------- 9. Payment methods ----------
  await db.paymentMethod.createMany({
    data: [
      { id: 'pm-1', name: 'Card', type: 'card', active: true, icon: 'credit-card', sortOrder: 1, config: JSON.stringify({ processorId: 'yoco', processorName: 'Yoco', description: 'Visa/Mastercard tap & insert', minAmount: 5, maxAmount: 50000, isDefault: true }), feeType: 'percentage', feeAmount: 2.6, updatedAt: new Date() },
      { id: 'pm-2', name: 'QR Code', type: 'qr', active: true, icon: 'qr-code', sortOrder: 2, config: JSON.stringify({ processorId: 'gopay', processorName: 'GoPay', description: 'Scan to pay — PayShap & SnapScan compatible', minAmount: 1, maxAmount: 10000 }), feeType: 'percentage', feeAmount: 1.2, updatedAt: new Date() },
      { id: 'pm-3', name: 'EFT', type: 'eft', active: true, icon: 'landmark', sortOrder: 3, config: JSON.stringify({ processorId: 'ozow', processorName: 'Ozow', description: 'Instant EFT — all major banks', minAmount: 10, maxAmount: 100000 }), feeType: 'percentage', feeAmount: 1.8, updatedAt: new Date() },
      { id: 'pm-4', name: 'Cash', type: 'cash', active: true, icon: 'banknote', sortOrder: 4, config: JSON.stringify({ processorId: 'gopay', processorName: 'GoPay', description: 'Cash drawer with automatic reconciliation', minAmount: 0, maxAmount: 100000 }), feeType: 'fixed', feeAmount: 0, updatedAt: new Date() },
      { id: 'pm-5', name: 'Wallet', type: 'wallet', active: true, icon: 'wallet', sortOrder: 5, config: JSON.stringify({ processorId: 'gopay', processorName: 'GoPay', description: 'GoPay stored-value wallet', minAmount: 1, maxAmount: 5000 }), feeType: 'percentage', feeAmount: 0.8, updatedAt: new Date() },
      { id: 'pm-6', name: 'Voucher', type: 'voucher', active: true, icon: 'ticket', sortOrder: 6, config: JSON.stringify({ processorId: 'gopay', processorName: 'GoPay', description: 'Airtime & grocery vouchers', minAmount: 5, maxAmount: 1000 }), feeType: 'fixed', feeAmount: 0, updatedAt: new Date() },
    ],
  })
  console.log('  6 payment methods')

  // ---------- 10. Enterprise ----------
  console.log('Seeding enterprise...')
  const corps = [
    { code: 'CORP-001', name: 'Soweto Retail Alliance', tier: 'Platinum', merchants: 14, volume: 1850000, limit: 500000, city: 'Johannesburg', province: 'Gauteng' },
    { code: 'CORP-002', name: 'KZN Trow operators (Pty) Ltd', tier: 'Gold', merchants: 9, volume: 920000, limit: 250000, city: 'Durban', province: 'KwaZulu-Natal' },
    { code: 'CORP-003', name: 'Western Cape MinHub Group', tier: 'Silver', merchants: 6, volume: 410000, limit: 120000, city: 'Cape Town', province: 'Western Cape' },
  ]
  const corpIds: string[] = []
  const entMerchantIds: string[] = []
  for (const [ci, c] of corps.entries()) {
    const corpId = `corp-${ci + 1}`
    corpIds.push(corpId)
    await db.enterpriseCorporateClient.create({
      data: {
        updatedAt: new Date(),
        id: corpId,
        code: c.code,
        name: c.name,
        tier: c.tier,
        merchantsCount: c.merchants,
        monthlyVolume: c.volume,
        creditLimit: c.limit,
        creditUsed: Math.round(c.limit * between(0.2, 0.65)),
        status: 'active',
        contactPerson: person(ci + 1),
        contactEmail: emailFor(person(ci + 1), c.name.toLowerCase().replace(/[^a-z]+/g, '') + '.co.za'),
        contactPhone: phone(ci + 1),
        city: c.city,
        province: c.province,
        registrationNumber: `2018/${100000 + ci * 4321}/07`,
        vatNumber: String(4900000000 + ci * 12345),
        notes: '',
      },
    })
    for (let m = 0; m < c.merchants; m++) {
      const mid = `entm-${ci + 1}-${m + 1}`
      entMerchantIds.push(mid)
      await db.enterpriseMerchant.create({
        data: {
          updatedAt: new Date(),
          id: mid,
          code: `${c.code}-M${String(m + 1).padStart(2, '0')}`,
          name: `${c.name.split(' ')[0]} Store ${m + 1}`,
          corporateId: corpId,
          location: `${c.city} — Site ${m + 1}`,
          city: c.city,
          province: c.province,
          status: m % 9 === 8 ? 'pending' : 'active',
          monthlyRevenue: Math.round(c.volume / c.merchants * between(0.6, 1.5)),
          totalTransactions: iBetween(120, 4200),
          openedDate: daysAgo(iBetween(60, 500)).toISOString().slice(0, 10),
          managerName: person(ci * 9 + m + 30),
          managerPhone: phone(ci * 9 + m + 30),
        },
      })
    }
    for (let u = 0; u < 3; u++) {
      const uname = person(ci * 3 + u + 10)
      await db.enterpriseUser.create({
        data: {
          updatedAt: new Date(),
          id: `entu-${ci + 1}-${u + 1}`,
          name: uname,
          email: emailFor(uname, 'groway.co.za'),
          phone: phone(ci * 3 + u + 20),
          role: u === 0 ? 'Admin' : u === 1 ? 'Manager' : 'Viewer',
          corporateId: corpId,
          status: 'active',
          lastLogin: new Date(Date.now() - iBetween(1, 200) * 3600000),
          passwordHash: DEMO_HASH,
          jobTitle: u === 0 ? 'Group Operations Director' : u === 1 ? 'Regional Manager' : 'Analyst',
          department: u === 0 ? 'Operations' : 'Finance',
        },
      })
    }
  }
  // Enterprise inventory + customers + transfers
  for (const [i, mid] of entMerchantIds.slice(0, 12).entries()) {
    for (let p = 0; p < 6; p++) {
      const cat = catalogRows[iBetween(0, catalogRows.length - 1)]
      await db.enterpriseInventory.create({
        data: {
          updatedAt: new Date(),
          id: `enti-${i}-${p}`,
          sku: `${cat.sku}-E`,
          name: cat.description,
          merchantId: mid,
          category: cat.category,
          stock: iBetween(0, 240),
          lowStock: 20,
          costPrice: cat.costPrice,
          sellingPrice: cat.retailPrice,
          value: Math.round(cat.costPrice * between(2, 60) * 100) / 100,
          reorderPoint: 20,
          reorderQty: 48,
          supplier: supplierRows[iBetween(0, supplierRows.length - 1)].name,
          lastRestocked: daysAgo(iBetween(1, 30)),
        },
      })
    }
  }
  for (let i = 0; i < 24; i++) {
    const mid = entMerchantIds[i % entMerchantIds.length]
    await db.enterpriseCustomer.create({
      data: {
        updatedAt: new Date(),
        id: `entc-${i}`,
        code: `EC-${String(1000 + i)}`,
        name: person(i + 5),
        email: emailFor(person(i + 5), 'gmail.com'),
        phone: phone(i + 60),
        merchantId: mid,
        totalSpent: Math.round(between(450, 42000) * 100) / 100,
        visitCount: iBetween(3, 140),
        tier: pick(['Bronze', 'Silver', 'Gold']),
        lastVisit: new Date(Date.now() - iBetween(0, 20) * 86400000),
        firstVisit: daysAgo(iBetween(60, 400)),
        loyaltyPoints: iBetween(0, 4200),
        status: 'active',
      },
    })
  }
  for (let i = 0; i < 8; i++) {
    const from = entMerchantIds[i * 2 % entMerchantIds.length]
    const to = entMerchantIds[(i * 2 + 1) % entMerchantIds.length]
    await db.enterpriseTransfer.create({
      data: {
        updatedAt: new Date(),
        id: `entt-${i}`,
        code: `TRF-2026${String(100 + i)}`,
        fromMerchantId: from,
        toMerchantId: to,
        corporateId: corpIds[i % corpIds.length],
        status: i < 3 ? 'pending' : i < 5 ? 'in_transit' : 'completed',
        itemsCount: iBetween(2, 14),
        totalValue: Math.round(between(800, 24000) * 100) / 100,
        requestedAt: daysAgo(iBetween(1, 20)),
        receivedAt: i >= 5 ? daysAgo(iBetween(1, 10)) : null,
      },
    })
  }
  for (let i = 0; i < 10; i++) {
    await db.enterpriseActivity.create({
      data: {
        id: `enta-${i}`,
        corporateId: corpIds[i % corpIds.length],
        type: pick(['merchant_added', 'transfer', 'payout', 'stock_alert', 'user_login']),
        message: pick(['New merchant onboarded', 'Stock transfer completed', 'Weekly payout processed', 'Low stock alert resolved', 'Manager login from new device']),
        userName: person(i + 2),
        createdAt: new Date(Date.now() - i * 5 * 3600000),
      },
    })
  }
  console.log(`  3 corporates, ${entMerchantIds.length} merchants, users/inventory/customers/transfers`)

  // ---------- 11. SAPE ----------
  console.log('Seeding SAPE...')
  const sapeSuppliers = supplierRows.slice(0, 45)
  for (const [i, s] of sapeSuppliers.entries()) {
    const score = iBetween(68, 98)
    const verified = score >= 70
    await db.sapeAuthenticatedSupplier.create({
      data: {
        updatedAt: new Date(),
        id: `sape-sup-${i + 1}`,
        cicNumber: `CIC-${2015 + (i % 10)}-${String(10000 + i * 137)}`,
        companyName: s.name,
        verificationStatus: verified ? 'VERIFIED' : 'PENDING',
        trustScore: score,
        checkCic: true,
        checkTax: score > 72,
        checkSabs: score > 80,
        checkSahpra: s.verticals.includes('Health'),
        checkNoc: score > 85,
        checkBank: true,
        checkInsurance: score > 76,
        verificationDocs: JSON.stringify({ cic: true, tax: score > 72, source: 'CIPC + SARS auto-check' }),
        verificationDate: verified ? daysAgo(iBetween(10, 200)) : null,
        validUntil: daysAhead(iBetween(120, 360)),
        contactEmail: s.email,
        contactPhone: s.phone,
        city: s.city,
        province: s.province,
        verticals: s.verticals,
        notes: 'Auto-onboarded via GroSupply supplier verification',
      },
    })
  }
  // Product identities + serials + custody
  const gtinBase = ['6001241000017', '6001241000024', '6001241000031', '6001752000014', '6001752000021', '6001087000019', '6001087000026', '6005265000011', '6005265000028', '6009900000015', '6009900000022', '6001188000013', '6001188000020', '6003221000018']
  const productNames = ['Sunflower Oil 750ml', 'Maize Meal 5kg', 'Chicken Stock Cubes 48s', 'Instant Coffee 200g', 'Rooibos Tea 80s', 'Baked Beans 410g', 'Pilchards in Tomato 400g', 'Washing Powder 2kg', 'Toothpaste 100ml', 'Body Lotion 400ml', 'Still Water 1L x6', 'Rice 2kg', 'Sugar 2.5kg', 'Peanut Butter 400g']
  let serialCounter = 0
  let identityCount = 0
  for (let i = 0; i < gtinBase.length; i++) {
    identityCount++
    const manufacturer = sapeSuppliers[i % sapeSuppliers.length]
    const batch = `B2026-${String(100 + i)}`
    const expiry = daysAhead(iBetween(60, 540))
    const prodDate = daysAgo(iBetween(30, 200))
    const signature = hmac(`${gtinBase[i]}|${batch}|${expiry.toISOString()}|sape-sup-${(i % sapeSuppliers.length) + 1}`)
    const expiryYYMMDD = `${String(expiry.getFullYear()).slice(2)}${String(expiry.getMonth() + 1).padStart(2, '0')}`
    const gs1 = `(01)${gtinBase[i]}(17)${expiryYYMMDD}(10)${batch}`
    const identity = await db.sapeProductIdentity.create({
      data: {
        updatedAt: new Date(),
        id: `sape-id-${i + 1}`,
        gtin: gtinBase[i],
        batchNumber: batch,
        expiryDate: expiry,
        productionDate: prodDate,
        manufacturerId: `sape-sup-${(i % sapeSuppliers.length) + 1}`,
        productName: productNames[i],
        signature,
        signatureAlg: 'HMAC-SHA256',
        anchorHash: Buffer.from(signature).toString('base64').slice(0, 44),
        gs1DataMatrix: Buffer.from(gs1).toString('base64'),
        status: 'ACTIVE',
      },
    })
    const serialsPerIdentity = iBetween(8, 14)
    for (let j = 0; j < serialsPerIdentity; j++) {
      serialCounter++
      const serial = `SAPE-${gtinBase[i].slice(-6)}-${batch}-X${String(j).padStart(4, '0')}`
      const roll = rnd()
      const status = roll > 0.88 ? 'SOLD' : roll > 0.85 ? 'BLOCKED' : 'ACTIVE'
      const sold = status === 'SOLD'
      await db.sapeProductSerial.create({
        data: {
          updatedAt: new Date(),
          id: `sape-ser-${serialCounter}`,
          productIdentityId: identity.id,
          serialNumber: serial,
          status,
          currentLocation: sold ? 'Consumer — Soweto' : pick(['GroSupply DC — Midrand', 'Node JHB-SW1', 'Node JHB-SW2', 'Shelf — Groway Demo Spaza']),
          soldAt: sold ? daysAgo(iBetween(1, 20)) : null,
        },
      })
      // custody chain
      const chain = [
        { type: 'MANUFACTURED', loc: `${manufacturer.city} Plant`, actor: manufacturer.name },
        { type: 'RECEIVED_GROSUPPLY', loc: 'GroSupply DC — Midrand', actor: 'GroSupply' },
        { type: 'DISPATCHED_NODE', loc: 'Node JHB-SW1', actor: 'GroSupply Logistics' },
        { type: 'RECEIVED_NODE', loc: 'Node JHB-SW1', actor: 'Node Operator' },
        { type: 'SHELVED', loc: 'Groway Demo Spaza — Vilakazi St', actor: 'Demo Operator' },
      ]
      if (sold) chain.push({ type: 'SOLD', loc: 'Groway Demo Spaza', actor: 'Demo Operator' })
      for (let [ci, ev] of chain.entries()) {
        await db.sapeCustodyEvent.create({
          data: {
            id: `sape-ce-${serialCounter}-${ci}`,
            productSerialId: `sape-ser-${serialCounter}`,
            eventType: ev.type,
            locationLat: -26.2 + between(-0.05, 0.05),
            locationLng: 27.9 + between(-0.05, 0.05),
            locationLabel: ev.loc,
            actorId: `actor-${ci}`,
            actorName: ev.actor,
            timestamp: daysAgo(Math.max(1, 30 - ci * 6), 10 + ci),
            metadata: JSON.stringify({ chainStep: ci + 1 }),
          },
        })
      }
    }
  }
  // POS verifications (14 days)
  let posV = 0
  for (let d = 13; d >= 0; d--) {
    const daily = iBetween(2, 6)
    for (let k = 0; k < daily; k++) {
      posV++
      const verified = rnd() > 0.06
      const serialIdx = iBetween(1, Math.max(1, serialCounter))
      await db.sapePosVerification.create({
        data: {
          id: `sape-pv-${posV}`,
          transactionId: `TXN-2026${String(50000 + posV)}`,
          productSerialId: verified ? `sape-ser-${serialIdx}` : null,
          gtin: verified ? null : gtinBase[iBetween(0, 3)],
          batchNumber: verified ? null : `B2026-1${iBetween(0, 9)}`,
          verificationResult: verified,
          failureReason: verified ? null : pick(['SERIAL_NOT_FOUND', 'SIGNATURE_INVALID', 'EXPIRED']),
          responseTimeMs: verified ? iBetween(78, 340) : iBetween(95, 410),
          operatorId: 'demo_user_1',
          merchantId: 'merchant-001',
          scannedAt: daysAgo(d, iBetween(8, 18)),
        },
      })
    }
  }
  for (let i = 0; i < 6; i++) {
    await db.sapeVerificationFailure.create({
      data: {
        id: `sape-vf-${i}`,
        gtin: gtinBase[iBetween(0, 5)],
        failureReason: pick(['SERIAL_NOT_FOUND', 'SIGNATURE_INVALID', 'EXPIRED', 'NETWORK_BLOCKED']),
        operatorId: 'demo_user_1',
        merchantId: 'merchant-001',
        actionTaken: pick(['Quarantined stock', 'Reported to GroSupply', 'Refused sale', 'Escalated to authority']),
        createdAt: daysAgo(iBetween(1, 12)),
      },
    })
  }
  await db.sapeNetworkBlock.createMany({
    data: [
      { id: 'sape-nb-1', productGtin: '6009999000011', serialNumber: null, blockReason: 'Counterfeit batch detected at Node JHB-E4 — 43 fake units intercepted', authorityNotified: true, authorityNotifiedAt: daysAgo(3, 14), active: true },
      { id: 'sape-nb-2', productGtin: '6009999000028', serialNumber: 'SAPE-999900-B2026-199-X0007', blockReason: 'Parallel import without SAHPRA licence', authorityNotified: true, authorityNotifiedAt: daysAgo(1, 9), active: true },
    ],
  })
  await db.sapeAuthorityNotification.createMany({
    data: [
      { id: 'sape-an-1', authority: 'SAHPRA', notificationType: 'COUNTERFEIT_SUSPECTED', severity: 'CRITICAL', dataPayload: JSON.stringify({ gtin: '6009999000011', location: 'JHB-E4', units: 43 }), referenceNumber: 'AUTH-SAHPRA-2026091', status: 'ACKNOWLEDGED', sentAt: daysAgo(3, 14), acknowledgedAt: daysAgo(3, 15) },
      { id: 'sape-an-2', authority: 'NCC', notificationType: 'UNSAFE_GOODS', severity: 'HIGH', dataPayload: JSON.stringify({ gtin: '6009999000028', reason: 'no SAHPRA licence' }), referenceNumber: 'AUTH-NCC-2026088', status: 'SENT', sentAt: daysAgo(2, 9) },
      { id: 'sape-an-3', authority: 'SARS', notificationType: 'CUSTOMS_FRAUD', severity: 'HIGH', dataPayload: JSON.stringify({ manifest: 'MSCU-88291', discrepancy: 'undeclared goods' }), referenceNumber: 'AUTH-SARS-2026079', status: 'ACKNOWLEDGED', sentAt: daysAgo(6, 11), acknowledgedAt: daysAgo(6, 13) },
      { id: 'sape-an-4', authority: 'SAPS', notificationType: 'TIP_OFF_ESCALATION', severity: 'MEDIUM', dataPayload: JSON.stringify({ outlet: 'unnamed outlet, Tembisa', ref: 'TIP-2026-0031' }), referenceNumber: 'AUTH-SAPS-2026071', status: 'SENT', sentAt: daysAgo(4, 16) },
      { id: 'sape-an-5', authority: 'DTIC', notificationType: 'VIOLATION_REPORT', severity: 'MEDIUM', dataPayload: JSON.stringify({ sector: 'FMCG', counterfeitRate: '4.2%' }), referenceNumber: 'AUTH-DTIC-2026066', status: 'SENT', sentAt: daysAgo(8, 10) },
      { id: 'sape-an-6', authority: 'SABS', notificationType: 'STANDARDS_NONCOMPLIANCE', severity: 'LOW', dataPayload: JSON.stringify({ product: 'extension sockets', standard: 'SANS 164' }), referenceNumber: 'AUTH-SABS-2026059', status: 'ACKNOWLEDGED', sentAt: daysAgo(11, 9), acknowledgedAt: daysAgo(10, 8) },
    ],
  })
  await db.sapeTipOff.createMany({
    data: [
      { id: 'sape-to-1', reporterName: 'Anonymous', reporterContact: 'via WhatsApp', productGtin: '6009999000011', productName: 'Unknown cooking oil', outletAddress: 'Corner shop, Tembisa Section C', description: 'Bottles with poor print quality and mismatched batch codes; no scan result on QR.', status: 'IN_REVIEW', triageNotes: 'Matched active network block — inspection requested.', authorityRouted: 'SAPS', createdAt: daysAgo(4), updatedAt: new Date() },
      { id: 'sape-to-2', reporterName: 'Thabo M.', reporterContact: '+27 82 555 1234', productGtin: null, productName: 'Pain tablets loose', outletAddress: 'Taxi rank stall, Johannesburg CBD', description: 'Loose pain tablets sold without packaging. Suspected counterfeit.', status: 'NEW', createdAt: daysAgo(1), updatedAt: new Date() },
      { id: 'sape-to-3', reporterName: 'Operator — Node JHB-SW2', reporterContact: 'node-dashboard', productGtin: '6009999000028', productName: 'Imported cough syrup', outletAddress: 'Back room, Roodepoort', description: 'Supplier offered stock at 60% below wholesale with no SAPE serials.', status: 'TRIAGED', triageNotes: 'SAHPRA licence check failed. Network block applied.', authorityRouted: 'SAHPRA', createdAt: daysAgo(2), updatedAt: new Date() },
    ],
  })
  for (let i = 0; i < 25; i++) {
    const serialIdx = iBetween(1, Math.max(1, serialCounter))
    await db.sapeConsumerScan.create({
      data: {
        id: `sape-cs-${i}`,
        serialNumber: `SAPE-SCAN-${String(1000 + i)}`,
        gtin: gtinBase[iBetween(0, gtinBase.length - 1)],
        productName: productNames[iBetween(0, productNames.length - 1)],
        scanResult: rnd() > 0.1 ? 'VERIFIED' : 'FAILED',
        scanSource: pick(['qr', 'serial_entry']),
        deviceInfo: pick(['Android — Chrome', 'iPhone — Safari', 'Android — WhatsApp QR']),
        locationLabel: pick(['Soweto', 'Tembisa', 'Alexandra', 'Khayelitsha', 'Durban CBD']),
        scannedAt: new Date(Date.now() - i * 9 * 3600000),
      },
    })
  }
  console.log(`  ${identityCount} identities, ${serialCounter} serials, ${posV} POS verifications, blocks/notifications/tip-offs/scans`)

  // ---------- summary ----------
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1)
  console.log(`\n=== SEED COMPLETE in ${elapsed}s ===`)
  const counts: Array<[string, number]> = []
  for (const t of ['merchant', 'user', 'branch', 'adminUser', 'supplier', 'wholesaler', 'catalogProduct', 'supplierProduct', 'supplierCatalog', 'product', 'pOSOrder', 'pOSPayment', 'transaction', 'gopayDevice', 'gopayTransaction', 'gopaySettlement', 'paymentMethod', 'enterpriseCorporateClient', 'enterpriseMerchant', 'sapeAuthenticatedSupplier', 'sapeProductIdentity', 'sapeProductSerial', 'sapeCustodyEvent', 'sapePosVerification']) {
    // @ts-expect-error dynamic delegate
    counts.push([t, await db[t].count()])
  }
  for (const [t, c] of counts) console.log(`  ${t}: ${c}`)
  await db.$disconnect()
}

main().catch(async (e) => {
  console.error('SEED FAILED:', e)
  await db.$disconnect()
  process.exit(1)
})
