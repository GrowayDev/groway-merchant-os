import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const prisma = new PrismaClient()

// Supplier data from Groway SKU Catalog - All 63 suppliers with vertical alignments
const suppliers = [
  { name: 'SAB (AB InBev SA)', code: 'SAB', website: 'sabmiller.co.za', verticals: ['Food & Beverage', 'Liquor & Nightlife'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 1, minOrderUnit: '1 case', notes: 'Castle, Hansa, Carling Black Label. Excise duty compliant.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Heineken Beverages SA', code: 'HEINEKEN', website: 'heineken.co.za', verticals: ['Food & Beverage', 'Liquor & Nightlife'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 1, minOrderUnit: '1 case', notes: 'Heineken, Amstel, Windhoek, Tafel. SARB excise reg.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Distell Group', code: 'DISTELL', website: 'distell.co.za', verticals: ['Liquor & Nightlife'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 2, minOrderUnit: '1 case', notes: 'KWV, Klipdrift, Savanna, Hunter\'s, Durbanville Hills.', supplierType: 'manufacturer', city: 'Stellenbosch', province: 'Western Cape' },
  { name: 'Diageo SA', code: 'DIAGEO', website: 'diageo.com', verticals: ['Liquor & Nightlife'], tier: 'silver', bbbeeLevel: 1, deliveryDays: 2, minOrderUnit: '3 bottles', notes: 'Johnnie Walker, Smirnoff, Baileys, Ciroc, Tanqueray.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Pernod Ricard SA', code: 'PERNOD', website: 'pernod-ricard.com', verticals: ['Liquor & Nightlife'], tier: 'silver', bbbeeLevel: 1, deliveryDays: 3, minOrderUnit: '6 bottles', notes: 'Jameson, Chivas, Absolut, Ballantine\'s.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Brown-Forman SA', code: 'BROWNFORMAN', website: 'brown-forman.com', verticals: ['Liquor & Nightlife'], tier: 'silver', bbbeeLevel: 1, deliveryDays: 3, minOrderUnit: '6 bottles', notes: 'Jack Daniel\'s, Woodford Reserve, Chambord.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Tiger Brands', code: 'TIGER', website: 'tigerbrands.co.za', verticals: ['Grocery & FMCG', 'Food & Beverage'], tier: 'gold', bbbeeLevel: 4, deliveryDays: 1, minOrderUnit: '1 case', notes: 'All Gold, Ace, Koo, Purity, Tastic, Oros. Category leader.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Pioneer Foods (PepsiCo)', code: 'PIONEER', website: 'pioneerfoodssa.co.za', verticals: ['Grocery & FMCG', 'Food & Beverage'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 1, minOrderUnit: '5 units', notes: 'Sasko, Spekko, Ceres, Bokomo, Weet-Bix, Corn Flakes.', supplierType: 'manufacturer', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Premier Foods', code: 'PREMIER', website: 'premierfm.co.za', verticals: ['Grocery & FMCG', 'Food & Beverage'], tier: 'gold', bbbeeLevel: 4, deliveryDays: 1, minOrderUnit: '5 units', notes: 'Snowflake, Albany, Iwisa, Blue Ribbon. Bread & flour leader.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Clover SA', code: 'CLOVER', website: 'clover.co.za', verticals: ['Grocery & FMCG', 'Hospitality'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 1, minOrderUnit: '6 units', notes: 'Milk, cheese, yogurt, Tropika, Aquartz. Chilled delivery.', supplierType: 'manufacturer', city: 'Pretoria', province: 'Gauteng' },
  { name: 'Coca-Cola Beverages SA', code: 'CCBSA', website: 'coca-colabeverages.co.za', verticals: ['Food & Beverage', 'Grocery & FMCG'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 1, minOrderUnit: '1 tray', notes: 'Coke, Fanta, Sprite, Powerade, Schweppes, Minute Maid.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Unilever SA', code: 'UNILEVER', website: 'unilever.co.za', verticals: ['Grocery & FMCG', 'Health & Beauty'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 1, minOrderUnit: '1 case', notes: 'Dove, Sunlight, Omo, Stork, Lifebuoy, Knorr, Rajah.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Illovo Sugar (Huletts)', code: 'ILLOVO', website: 'illovo.co.za', verticals: ['Grocery & FMCG', 'Food & Beverage'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 2, minOrderUnit: '2 bags', notes: 'Huletts, White Sugar, Brown Sugar. Major SA refiner.', supplierType: 'manufacturer', city: 'Durban', province: 'KwaZulu-Natal' },
  { name: 'Astral Foods / County Fair', code: 'ASTRAL', website: 'astralfoods.com', verticals: ['Food & Beverage', 'Grocery & FMCG'], tier: 'gold', bbbeeLevel: 4, deliveryDays: 1, minOrderUnit: '5 kg', notes: 'Goldi, County Fair, Festive. SA\'s largest poultry producer.', supplierType: 'manufacturer', city: 'Centurion', province: 'Gauteng' },
  { name: 'Rainbow Chicken', code: 'RAINBOW', website: 'rainbowchicken.co.za', verticals: ['Food & Beverage', 'Grocery & FMCG'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 1, minOrderUnit: '5 kg', notes: 'Fresh and frozen chicken products. National distribution.', supplierType: 'manufacturer', city: 'Hammarsdale', province: 'KwaZulu-Natal' },
  { name: 'Karan Beef', code: 'KARAN', website: 'karanbeef.co.za', verticals: ['Grocery & FMCG', 'Food & Beverage'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 1, minOrderUnit: '10 kg', notes: 'SA\'s largest cattle feedlot. Chilled beef. HACCP certified.', supplierType: 'farmer', city: 'Heidelberg', province: 'Gauteng' },
  { name: 'Eskort Ltd', code: 'ESKORT', website: 'eskort.co.za', verticals: ['Grocery & FMCG', 'Food & Beverage'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 1, minOrderUnit: '5 kg', notes: 'Bacon, ham, sausages, boerewors. SABS HACCP.', supplierType: 'manufacturer', city: 'Pretoria', province: 'Gauteng' },
  { name: 'Oceana Group', code: 'OCEANA', website: 'oceana.co.za', verticals: ['Grocery & FMCG'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 3, minOrderUnit: '12 cans', notes: 'Lucky Star pilchards, canned fish. Major SA seafood.', supplierType: 'manufacturer', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Quantum Foods', code: 'QUANTUM', website: 'quantumfoods.co.za', verticals: ['Grocery & FMCG', 'Hospitality'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 1, minOrderUnit: '1 tray', notes: 'Eggs (Eggs2Go, Nulaid). National egg distribution.', supplierType: 'farmer', city: 'Wellington', province: 'Western Cape' },
  { name: 'PPC Cement', code: 'PPC', website: 'ppc.co.za', verticals: ['Hardware & Building'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 2, minOrderUnit: '1 bag', notes: 'Ordinary Portland Cement. Nationwide. Bulk pricing.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Holcim SA (Lafarge)', code: 'HOLCIM', website: 'lafarge.co.za', verticals: ['Hardware & Building'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 2, minOrderUnit: '1 bag', notes: 'Supa Set, OPC. Major SA cement manufacturer.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Corobrik', code: 'COROBRK', website: 'corobrik.com', verticals: ['Hardware & Building'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 5, minOrderUnit: '1000 units', notes: 'Face bricks, pavers. SABS certified. SA-wide branches.', supplierType: 'manufacturer', city: 'Durban', province: 'KwaZulu-Natal' },
  { name: 'Cape Gate Steel', code: 'CAPEGATE', website: 'capegate.co.za', verticals: ['Hardware & Building'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 5, minOrderUnit: '5 bars', notes: 'Rebar, wire, sheets, pipes. ISO 9001. SA manufacturer.', supplierType: 'manufacturer', city: 'Vereeniging', province: 'Gauteng' },
  { name: 'Plascon SA', code: 'PLASCON', website: 'plascon.co.za', verticals: ['Hardware & Building'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 3, minOrderUnit: '1 bucket', notes: 'Interior/exterior paint. Major SA paint brand.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'AkzoNobel SA (Dulux)', code: 'DULUX', website: 'dulux.co.za', verticals: ['Hardware & Building'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 3, minOrderUnit: '1 bucket', notes: 'Dulux, Armstead. Interior/exterior. Colour mixing in-store.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Marley Pipe Systems', code: 'MARLEY', website: 'marley.co.za', verticals: ['Hardware & Building'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 3, minOrderUnit: '5 lengths', notes: 'CPVC, PVC, HDPE pipes. Fittings. SANS certified.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Aberdare Cables', code: 'ABERDARE', website: 'aberdare.co.za', verticals: ['Hardware & Building'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 3, minOrderUnit: '1 roll', notes: 'Electrical cable. SANS 1418. SA manufacturer.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Sika SA', code: 'SIKA', website: 'sika.co.za', verticals: ['Hardware & Building'], tier: 'silver', bbbeeLevel: 2, deliveryDays: 5, minOrderUnit: '12 units', notes: 'Sikaflex, SikaTop, SikaBond. Global construction chemicals.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Bosch SA', code: 'BOSCH', website: 'bosch.co.za', verticals: ['Hardware & Building', 'Electronics & Tech'], tier: 'silver', bbbeeLevel: 1, deliveryDays: 5, minOrderUnit: '1 unit', notes: 'Power tools, SDS drills, grinders. German quality.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Bata Industrial', code: 'BATA', website: 'bata.co.za', verticals: ['Hardware & Building', 'Fashion & Apparel'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 7, minOrderUnit: '1 pair', notes: 'Steel-toe, safety footwear. OHS Act compliant. SA-made.', supplierType: 'manufacturer', city: 'Durban', province: 'KwaZulu-Natal' },
  { name: 'L\'Oréal SA Professional', code: 'LOREAL', website: 'loreal.co.za', verticals: ['Health & Beauty'], tier: 'silver', bbbeeLevel: 1, deliveryDays: 5, minOrderUnit: '12 tubes', notes: 'Majirel, Inoa, Kérastase, Wella professional.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Wella Professional (P&G)', code: 'WELLA', website: 'wella.co.za', verticals: ['Health & Beauty'], tier: 'silver', bbbeeLevel: 1, deliveryDays: 5, minOrderUnit: '12 tubes', notes: 'Koleston, System Professional, WellaPlex.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Lycon SA', code: 'LYCON', website: 'lycon.com.au', verticals: ['Health & Beauty'], tier: 'silver', bbbeeLevel: 2, deliveryDays: 7, minOrderUnit: '6 units', notes: 'Strip wax, hard wax, pre & post wax. Premium professional.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Nail Supplies SA', code: 'NAILSUP', website: 'nailsupplies.co.za', verticals: ['Health & Beauty'], tier: 'bronze', bbbeeLevel: 4, deliveryDays: 5, minOrderUnit: '5 units', notes: 'Gel, acrylic, UV lamps, nail art. SA distributor.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Barber Supplies SA', code: 'BARBER', website: 'barbersupplies.co.za', verticals: ['Health & Beauty'], tier: 'bronze', bbbeeLevel: 4, deliveryDays: 5, minOrderUnit: '5 units', notes: 'Clippers, shears, blades, Barbicide. Professional only.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Tattoo Supplies SA', code: 'TATTOO', website: 'tattoosupplies.co.za', verticals: ['Health & Beauty'], tier: 'bronze', bbbeeLevel: 3, deliveryDays: 7, minOrderUnit: '5 units', notes: 'Eternal, Intenze, FK Irons equipment. SAHPRA-aware.', supplierType: 'distributor', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Adcock Ingram', code: 'ADCOCK', website: 'adcock.co.za', verticals: ['Health & Pharmacy'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 3, minOrderUnit: '24 units', notes: 'Panado, Corenza, Betadine, Bioplus. SAHPRA registered.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Aspen Pharmacare', code: 'ASPEN', website: 'aspenpharma.com', verticals: ['Health & Pharmacy'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 3, minOrderUnit: '24 units', notes: 'Generic medicines, Allergex. SAHPRA. SA manufacturer.', supplierType: 'manufacturer', city: 'Durban', province: 'KwaZulu-Natal' },
  { name: 'Pfizer SA', code: 'PFIZER', website: 'pfizer.co.za', verticals: ['Health & Pharmacy'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 3, minOrderUnit: '12 units', notes: 'Centrum, Caltrate, Advil, Diflucan. Multinational.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'USN SA', code: 'USN', website: 'usn.co.za', verticals: ['Health & Pharmacy', 'Sport & Leisure'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 3, minOrderUnit: '5 units', notes: 'Whey, creatine, pre-workout. SA-made sports nutrition.', supplierType: 'manufacturer', city: 'Pretoria', province: 'Gauteng' },
  { name: 'Vital Health Foods', code: 'VITAL', website: 'vital.co.za', verticals: ['Health & Pharmacy'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 3, minOrderUnit: '12 units', notes: 'Vital Plus, Omega-3, vitamins. SA natural health leader.', supplierType: 'manufacturer', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Heavenly Amenities', code: 'HEAVENLY', website: 'heavenlyamenities.co.za', verticals: ['Hospitality'], tier: 'silver', bbbeeLevel: 2, deliveryDays: 7, minOrderUnit: '50 units', notes: 'Hotel toiletries: shampoo, soap, gel. Custom branding.', supplierType: 'manufacturer', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Linen SA', code: 'LINEN', website: 'linenco.co.za', verticals: ['Hospitality'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 7, minOrderUnit: '1 pack', notes: 'T300 cotton linen, towels, bath mats. Hospitality grade.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Bidvest Catering Supplies', code: 'BIDVEST', website: 'bidvest.co.za', verticals: ['Food & Beverage', 'Hospitality'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 5, minOrderUnit: '1 unit', notes: 'Full catering equipment, disposables. National.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Bidpaper Plus', code: 'BIDPAPER', website: 'bidpaper.co.za', verticals: ['Food & Beverage', 'Grocery & FMCG'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 5, minOrderUnit: '500 units', notes: 'Eco packaging, bags, cups, containers. FSC options.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Samsung SA', code: 'SAMSUNG', website: 'samsung.com/za', verticals: ['Electronics & Tech'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 3, minOrderUnit: '1 unit', notes: 'Phones, TVs, appliances. ICASA certified.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Apple SA / iStore', code: 'APPLE', website: 'istore.co.za', verticals: ['Electronics & Tech'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 7, minOrderUnit: '1 unit', notes: 'iPhone, MacBook, iPad. Official SA distributor.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Logitech SA', code: 'LOGITECH', website: 'logitech.com', verticals: ['Electronics & Tech'], tier: 'silver', bbbeeLevel: 1, deliveryDays: 5, minOrderUnit: '3 units', notes: 'Peripherals, webcams, headsets. Major IT accessories.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'HP SA', code: 'HP', website: 'hp.com/za', verticals: ['Electronics & Tech'], tier: 'silver', bbbeeLevel: 1, deliveryDays: 7, minOrderUnit: '1 unit', notes: 'Laptops, printers, toner. Global brand.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Lenovo SA', code: 'LENOVO', website: 'lenovo.com/za', verticals: ['Electronics & Tech'], tier: 'silver', bbbeeLevel: 1, deliveryDays: 7, minOrderUnit: '1 unit', notes: 'IdeaPad, ThinkPad. Education and SME market.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Trojan Sports SA', code: 'TROJAN', website: 'trojansports.co.za', verticals: ['Sport & Leisure'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 7, minOrderUnit: '5 units', notes: 'SA-made sports equipment. Major local brand.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'adidas SA', code: 'ADIDAS', website: 'adidas.co.za', verticals: ['Sport & Leisure', 'Fashion & Apparel'], tier: 'silver', bbbeeLevel: 1, deliveryDays: 7, minOrderUnit: '6 units', notes: 'Sport footwear, balls, apparel.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Gray-Nicolls SA', code: 'GRAYNIC', website: 'graynicolls.co.za', verticals: ['Sport & Leisure'], tier: 'silver', bbbeeLevel: 2, deliveryDays: 14, minOrderUnit: '3 units', notes: 'Cricket equipment. Official SA distributor.', supplierType: 'distributor', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Funeralware SA', code: 'FUNERAL', website: 'funeralware.co.za', verticals: ['Professional Services'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 3, minOrderUnit: '1 unit', notes: 'Coffins, caskets, urns. National delivery.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Castrol SA', code: 'CASTROL', website: 'castrol.co.za', verticals: ['Professional Services'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 3, minOrderUnit: '5 units', notes: 'Motor oils, lubricants. BP Group brand.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Willard Batteries', code: 'WILLARD', website: 'willard.co.za', verticals: ['Professional Services'], tier: 'gold', bbbeeLevel: 3, deliveryDays: 2, minOrderUnit: '1 unit', notes: 'Car batteries. SA manufacturer. Nationwide.', supplierType: 'manufacturer', city: 'Port Elizabeth', province: 'Eastern Cape' },
  { name: 'Kazang (Mastercard)', code: 'KAZANG', website: 'kazang.co.za', verticals: ['Grocery & FMCG', 'Food & Beverage', 'Liquor & Nightlife', 'Health & Beauty', 'Fashion & Apparel', 'Health & Pharmacy', 'Hospitality', 'Hardware & Building', 'Electronics & Tech', 'Sport & Leisure', 'Childcare & Education', 'Professional Services'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 0, minOrderUnit: '1 integration', notes: 'Prepaid services, airtime, electricity tokens. API-based.', supplierType: 'distributor', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Kimberly-Clark SA', code: 'KIMBERLY', website: 'huggies.co.za', verticals: ['Childcare & Education'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 1, minOrderUnit: '1 pack', notes: 'Huggies nappies, wipes, Kleenex, Scott.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Nestlé SA', code: 'NESTLE', website: 'nestle.co.za', verticals: ['Childcare & Education', 'Hospitality'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 3, minOrderUnit: '6 units', notes: 'Purity, Nescafé, Milo, Nestum, Maggi.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Faber-Castell SA', code: 'FABER', website: 'faber-castell.co.za', verticals: ['Childcare & Education'], tier: 'bronze', bbbeeLevel: 1, deliveryDays: 5, minOrderUnit: '5 units', notes: 'Crayons, pens, pencils. Education stationery.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Sappi SA', code: 'SAPPI', website: 'sappi.com', verticals: ['Childcare & Education', 'Professional Services'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 1, minOrderUnit: '1 ream', notes: 'Paper, printing media. SA manufacturer.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  // Additional suppliers from the SKU catalog
  { name: 'McCain Foods SA', code: 'MCCAIN', website: 'mccain.co.za', verticals: ['Food & Beverage'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 3, minOrderUnit: '10 bags', notes: 'Frozen chips, potato products. Global leader.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Sea Harvest Group', code: 'SEAHARVEST', website: 'seaharvest.co.za', verticals: ['Food & Beverage', 'Grocery & FMCG'], tier: 'silver', bbbeeLevel: 1, deliveryDays: 2, minOrderUnit: '10 kg', notes: 'Frozen fish, seafood. Leading SA seafood company.', supplierType: 'manufacturer', city: 'Cape Town', province: 'Western Cape' },
  { name: 'Chalmar Beef & Lamb', code: 'CHALMAR', website: 'chalmar.co.za', verticals: ['Food & Beverage'], tier: 'silver', bbbeeLevel: 2, deliveryDays: 2, minOrderUnit: '10 kg', notes: 'Premium beef and lamb. Farm to table.', supplierType: 'farmer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Schwarzkopf Professional', code: 'SCHWARZ', website: 'schwarzkopf.co.za', verticals: ['Health & Beauty'], tier: 'silver', bbbeeLevel: 1, deliveryDays: 5, minOrderUnit: '6 units', notes: 'Blond Me, Igora, professional hair care.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Moët Hennessy SA', code: 'MOET', website: 'mh-sa.co.za', verticals: ['Liquor & Nightlife'], tier: 'silver', bbbeeLevel: 1, deliveryDays: 5, minOrderUnit: '3 units', notes: 'Hennessy, Moët, Dom Pérignon. Premium spirits.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Diemersdal Estate', code: 'DIEMERSDAL', website: 'diemersdal.co.za', verticals: ['Liquor & Nightlife'], tier: 'silver', bbbeeLevel: 3, deliveryDays: 5, minOrderUnit: '6 bottles', notes: 'Premium Durbanville wines. Wine farm.', supplierType: 'farmer', city: 'Durbanville', province: 'Western Cape' },
  { name: 'Spier Wines', code: 'SPIER', website: 'spier.co.za', verticals: ['Liquor & Nightlife'], tier: 'silver', bbbeeLevel: 2, deliveryDays: 5, minOrderUnit: '6 bottles', notes: 'Stellenbosch wines. Estate grown.', supplierType: 'farmer', city: 'Stellenbosch', province: 'Western Cape' },
  { name: 'KWV', code: 'KWV', website: 'kwv.co.za', verticals: ['Liquor & Nightlife'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 3, minOrderUnit: '12 bottles', notes: 'Classic SA wines and brandy.', supplierType: 'manufacturer', city: 'Paarl', province: 'Western Cape' },
  { name: 'PepsiCo SA (Simba)', code: 'SIMBA', website: 'pepsico.co.za', verticals: ['Grocery & FMCG', 'Food & Beverage'], tier: 'gold', bbbeeLevel: 2, deliveryDays: 1, minOrderUnit: '48 units', notes: 'Simba chips, Lay\'s, Doritos. High-velocity snacks.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Beauty Supplies SA', code: 'BEAUTYSUP', website: 'beautysupplies.co.za', verticals: ['Health & Beauty'], tier: 'bronze', bbbeeLevel: 3, deliveryDays: 5, minOrderUnit: '5 units', notes: 'General beauty supplies, foils, gloves.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Medline SA', code: 'MEDLINE', website: 'medlinesa.co.za', verticals: ['Health & Beauty', 'Health & Pharmacy'], tier: 'bronze', bbbeeLevel: 2, deliveryDays: 5, minOrderUnit: '5 units', notes: 'Medical supplies, gloves, disinfectants.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Packit', code: 'PACKIT', website: 'packitsa.co.za', verticals: ['Food & Beverage', 'Grocery & FMCG'], tier: 'bronze', bbbeeLevel: 3, deliveryDays: 5, minOrderUnit: '500 units', notes: 'Paper bags, packaging. SA packaging solutions.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Willowton Group', code: 'WILLOWTON', website: 'willowton.co.za', verticals: ['Food & Beverage', 'Grocery & FMCG'], tier: 'silver', bbbeeLevel: 2, deliveryDays: 3, minOrderUnit: '2 drums', notes: 'Sunflower oil, cooking oils. Major SA producer.', supplierType: 'manufacturer', city: 'Pietermaritzburg', province: 'KwaZulu-Natal' },
  { name: 'Cerebos', code: 'CEREBOS', website: 'cerebos.co.za', verticals: ['Food & Beverage', 'Grocery & FMCG'], tier: 'bronze', bbbeeLevel: 3, deliveryDays: 5, minOrderUnit: '2 bags', notes: 'Salt, spices. Zero-rated staple.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Derby SA / Barber Supplies', code: 'DERBY', website: 'barbersupplies.co.za', verticals: ['Health & Beauty'], tier: 'bronze', bbbeeLevel: 4, deliveryDays: 5, minOrderUnit: '5 units', notes: 'Derby blades, barber supplies. Professional only.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Joico SA', code: 'JOICO', website: 'joico.com', verticals: ['Health & Beauty'], tier: 'bronze', bbbeeLevel: 2, deliveryDays: 7, minOrderUnit: '3 units', notes: 'K-Pak, professional hair treatments.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Matrix (L\'Oréal)', code: 'MATRIX', website: 'loreal.co.za', verticals: ['Health & Beauty'], tier: 'silver', bbbeeLevel: 1, deliveryDays: 5, minOrderUnit: '4 units', notes: 'Biolage, Total Results. Professional salon.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'P&G SA', code: 'PG', website: 'pg.com', verticals: ['Health & Beauty', 'Grocery & FMCG'], tier: 'silver', bbbeeLevel: 1, deliveryDays: 3, minOrderUnit: '12 units', notes: 'Gillette, Pantene, Head & Shoulders.', supplierType: 'manufacturer', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'MTN', code: 'MTN', website: 'mtn.co.za', verticals: ['Grocery & FMCG'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 0, minOrderUnit: '1 voucher', notes: 'Airtime, data. Commission-based.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
  { name: 'Vodacom', code: 'VODACOM', website: 'vodacom.co.za', verticals: ['Grocery & FMCG'], tier: 'gold', bbbeeLevel: 1, deliveryDays: 0, minOrderUnit: '1 voucher', notes: 'Airtime, data. Commission-based.', supplierType: 'distributor', city: 'Johannesburg', province: 'Gauteng' },
]

// Map vertical names to standard format
const verticalNameMap: Record<string, string> = {
  'Food & Bev': 'Food & Beverage',
  'Food & Beverage': 'Food & Beverage',
  'Liquor & Nightlife': 'Liquor & Nightlife',
  'Grocery & FMCG': 'Grocery & FMCG',
  'Health & Beauty': 'Health & Beauty',
  'Fashion & Apparel': 'Fashion & Apparel',
  'Health & Pharmacy': 'Health & Pharmacy',
  'Hospitality': 'Hospitality',
  'Hardware & Building': 'Hardware & Building',
  'Electronics & Tech': 'Electronics & Tech',
  'Sport & Leisure': 'Sport & Leisure',
  'Childcare & Education': 'Childcare & Education',
  'Professional Services': 'Professional Services',
}

async function main() {
  console.log('Starting supplier seed...')
  
  // Clear existing suppliers
  await prisma.supplier.deleteMany({})
  console.log('Cleared existing suppliers')
  
  // Insert new suppliers
  for (const supplier of suppliers) {
    // Normalize vertical names
    const normalizedVerticals = supplier.verticals.map(v => verticalNameMap[v] || v)
    
    await prisma.supplier.create({
      data: {
        id: randomUUID(),
        name: supplier.name,
        code: supplier.code,
        website: supplier.website,
        verticals: JSON.stringify(normalizedVerticals),
        tier: supplier.tier,
        bbbeeLevel: supplier.bbbeeLevel,
        deliveryDays: supplier.deliveryDays,
        minOrderUnit: supplier.minOrderUnit,
        notes: supplier.notes,
        supplierType: supplier.supplierType,
        city: supplier.city,
        province: supplier.province,
        status: 'active',
        verificationStatus: 'verified',
        verifiedAt: new Date(),
        updatedAt: new Date(),
        rating: supplier.tier === 'gold' ? 4.7 + Math.random() * 0.3 : 
                supplier.tier === 'silver' ? 4.4 + Math.random() * 0.3 : 
                4.0 + Math.random() * 0.3,
        reviewCount: Math.floor(Math.random() * 300) + 50,
        fulfillmentRate: supplier.tier === 'gold' ? 96 + Math.random() * 3 :
                        supplier.tier === 'silver' ? 94 + Math.random() * 3 :
                        92 + Math.random() * 3,
      }
    })
  }
  
  console.log(`Seeded ${suppliers.length} suppliers`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
