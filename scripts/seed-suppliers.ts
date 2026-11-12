import { PrismaClient } from '@prisma/client'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

// South African business data
const SUPPLIER_TYPES = ['manufacturer', 'distributor', 'wholesaler', 'farmer'] as const
const TIERS = ['platinum', 'gold', 'silver', 'bronze'] as const
const PROVINCES = [
  'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 
  'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'
]
const CITIES_BY_PROVINCE: Record<string, string[]> = {
  'Gauteng': ['Johannesburg', 'Pretoria', 'Sandton', 'Centurion', 'Midrand', 'Randburg', 'Roodepoort', 'Germiston', 'Benoni', 'Boksburg'],
  'Western Cape': ['Cape Town', 'Stellenbosch', 'Paarl', 'Durbanville', 'Somerset West', 'George', 'Worcester', 'Bellville'],
  'KwaZulu-Natal': ['Durban', 'Pietermaritzburg', 'Umhlanga', 'Ballito', 'Richards Bay', 'Newcastle', 'Hillcrest'],
  'Eastern Cape': ['Port Elizabeth', 'East London', 'Grahamstown', 'Mthatha', 'King William\'s Town'],
  'Limpopo': ['Polokwane', 'Tzaneen', 'Phalaborwa', 'Louis Trichardt', 'Messina'],
  'Mpumalanga': ['Nelspruit', 'Witbank', 'Secunda', 'Middelburg', 'Lydenburg'],
  'North West': ['Rustenburg', 'Potchefstroom', 'Klerksdorp', 'Mahikeng', 'Brits'],
  'Free State': ['Bloemfontein', 'Welkom', 'Sasolburg', 'Bethlehem', 'Kroonstad'],
  'Northern Cape': ['Kimberley', 'Upington', 'Springbok', 'Kuruman', 'De Aar']
}

const VERTICALS = [
  'Food & Beverage', 'Liquor & Nightlife', 'Grocery & FMCG', 'Health & Beauty',
  'Fashion & Apparel', 'Health & Pharmacy', 'Hospitality', 'Hardware & Building',
  'Electronics & Tech', 'Sport & Leisure', 'Childcare & Education', 'Professional Services'
]

const CATEGORIES_BY_VERTICAL: Record<string, string[]> = {
  'Food & Beverage': ['Fresh Produce', 'Dairy', 'Meat', 'Beverages', 'Dry Goods', 'Frozen Foods', 'Bakery', 'Spices & Condiments', 'Oils & Sauces', 'Snacks'],
  'Liquor & Nightlife': ['Spirits', 'Wine', 'Beer', 'Ciders', 'Mixers', 'Liqueurs', 'Champagne', 'Craft Beer'],
  'Grocery & FMCG': ['Household', 'Personal Care', 'Cleaning', 'Stationery', 'Confectionery', 'Pet Food', 'Baby Products', 'Canned Goods'],
  'Health & Beauty': ['Haircare', 'Skincare', 'Cosmetics', 'Nail Products', 'Spa Equipment', 'Salon Furniture', 'Hair Tools', 'Treatments'],
  'Fashion & Apparel': ['Clothing', 'Footwear', 'Accessories', 'Jewelry', 'Bags', 'Watches', 'Sportswear', 'Workwear'],
  'Health & Pharmacy': ['Medicines', 'Medical Equipment', 'First Aid', 'Vitamins', 'Personal Care', 'Mobility Aids', 'Testing Supplies'],
  'Hospitality': ['Linen', 'Toiletries', 'Cleaning Supplies', 'Furniture', 'Kitchen Equipment', 'Guest Amenities', 'Stationery'],
  'Hardware & Building': ['Tools', 'Paint', 'Plumbing', 'Electrical', 'Building Materials', 'Garden', 'Security', 'Adhesives'],
  'Electronics & Tech': ['Computers', 'Phones', 'Accessories', 'Audio', 'Gaming', 'Networking', 'Cameras', 'Wearables'],
  'Sport & Leisure': ['Fitness Equipment', 'Sports Gear', 'Outdoor Equipment', 'Cycling', 'Team Sports', 'Water Sports', 'Camping'],
  'Childcare & Education': ['Toys', 'Educational Materials', 'Furniture', 'Safety Equipment', 'Art Supplies', 'Books', 'Sports Equipment'],
  'Professional Services': ['Office Supplies', 'Furniture', 'Technology', 'Printing', 'Cleaning', 'Security', 'Catering', 'Stationery']
}

const NAME_PREFIXES: Record<string, string[]> = {
  'manufacturer': ['South African', 'African', 'Premium', 'Quality', 'Fresh', 'Natural', 'Pure', 'Local', 'National', 'Continental'],
  'distributor': ['Central', 'National', 'Regional', 'Wholesale', 'Bulk', 'Direct', 'Express', 'Metro', 'City', 'Universal'],
  'wholesaler': ['Mega', 'Super', 'Big', 'Value', 'Budget', 'Economy', 'Discount', 'Warehouse', 'Bulk Buy', 'Cash & Carry'],
  'farmer': ['Green', 'Organic', 'Farm Fresh', 'Harvest', 'Sunny', 'Valley', 'Meadow', 'Highland', 'River', 'Country']
}

const NAME_MIDDLES = [
  'Food', 'Fresh', 'Quality', 'Premium', 'Nature', 'Harvest', 'Supply', 'Source',
  'Produce', 'Goods', 'Products', 'Solutions', 'Trading', 'Distribution', 'Wholesale',
  'Market', 'Foods', 'Enterprises', 'Industries', 'Group', 'Holdings', 'Partners'
]

const NAME_SUFFIXES = [
  'Pty Ltd', 'Ltd', 'SA', 'Group', 'Holdings', 'Enterprises', 'Distributors',
  'Suppliers', 'Wholesale', 'Traders', 'International', 'Africa', 'Southern Africa'
]

const PAYMENT_TERMS = ['cod', 'net7', 'net15', 'net30', 'net60']
const BBBEE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8]

const FIRST_NAMES = [
  'Thabo', 'Mpho', 'Lerato', 'Sipho', 'Nomsa', 'Johan', 'Pieter', 'Maria',
  'David', 'Sarah', 'Michael', 'Natalie', 'James', 'Elizabeth', 'William',
  'Grace', 'Thomas', 'Anna', 'Peter', 'Catherine', 'John', 'Margaret',
  'Charles', 'Ruth', 'George', 'Dorothy', 'Paul', 'Patricia', 'Mark', 'Jennifer',
  'Sizwe', 'Zodwa', 'Bongani', 'Nokuthula', 'Thandi', 'Mandla', 'Precious',
  'Vusimuzi', 'Ntombi', 'Sibusiso', 'Lindiwe', 'Khuliso', 'Mphumeleli', 'Tshepiso'
]

const LAST_NAMES = [
  'Mokoena', 'Nkosi', 'Ndlovu', 'Zulu', 'Dlamini', 'Meyer', 'van der Merwe', 'Botha',
  'Mahlangu', 'Mabaso', 'Ngcobo', 'Mthembu', 'Zwane', 'Molefe', 'Khumalo', 'Pretorius',
  'Naidoo', 'Pillay', 'Singh', 'Maharaj', 'van Niekerk', 'Coetzee', 'Jordaan', 'Smit',
  'Mokoatle', 'Maseko', 'Mabuza', 'Kunene', 'Nxumalo', 'Mdluli', 'Mhlongo', 'Ndaba',
  'Govender', 'Reddy', 'Naidoo', 'Chetty', 'Khan', 'Ismail', 'Venter', 'de Klerk'
]

function randomItem<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomItems<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

function generateSupplierCode(index: number): string {
  return `SUP-${String(index).padStart(4, '0')}`
}

function generatePhoneNumber(): string {
  const areaCodes = ['010', '011', '012', '021', '027', '031', '032', '033', '034', '035', '036', '040', '041', '042', '043', '044', '045', '046', '047', '048', '049', '051', '053', '054', '056', '057', '058']
  const areaCode = randomItem(areaCodes)
  const number = Math.floor(Math.random() * 9000000) + 1000000
  return `${areaCode}-${String(number).slice(0, 3)}-${String(number).slice(3)}`
}

function generateEmail(name: string): string {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'webmail.co.za', 'email.co.za', 'mail.co.za', 'company.co.za', 'business.co.za']
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${cleanName.substring(0, 15)}${Math.floor(Math.random() * 100)}@${randomItem(domains)}`
}

function generateWebsite(name: string): string {
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12)
  const tlds = ['.co.za', '.com', '.org.za', '.net.za']
  return `www.${cleanName}${randomItem(tlds)}`
}

async function main() {
  console.log('Starting supplier seed...')
  
  // Clear existing suppliers
  console.log('Clearing existing suppliers...')
  await prisma.supplier.deleteMany({})
  
  const totalSuppliers = 350
  let inserted = 0
  
  for (let i = 1; i <= totalSuppliers; i++) {
    const type = randomItem(SUPPLIER_TYPES)
    const tier = randomItem(TIERS)
    const province = randomItem(PROVINCES)
    const city = randomItem(CITIES_BY_PROVINCE[province] || ['Johannesburg'])
    
    // Select 1-3 verticals
    const supplierVerticals = randomItems(VERTICALS, 1, 3)
    
    // Get categories for these verticals
    const allCategories: string[] = []
    supplierVerticals.forEach(v => {
      if (CATEGORIES_BY_VERTICAL[v]) {
        allCategories.push(...CATEGORIES_BY_VERTICAL[v])
      }
    })
    const categories = [...new Set(randomItems(allCategories, 3, 8))]
    
    // Generate company name
    const prefix = randomItem(NAME_PREFIXES[type])
    const middle = randomItem(NAME_MIDDLES)
    const suffix = randomItem(NAME_SUFFIXES)
    const name = `${prefix} ${middle} ${suffix}`
    
    // Generate contact person
    const contactFirstName = randomItem(FIRST_NAMES)
    const contactLastName = randomItem(LAST_NAMES)
    const contactPerson = `${contactFirstName} ${contactLastName}`
    
    // Generate address
    const streetNumber = Math.floor(Math.random() * 9999) + 1
    const streetNames = ['Main', 'Church', 'Voortrekker', 'Nelson Mandela', 'Kerk', 'Pretorius', 'Andries', 'Paul Kruger', 'Bree', 'Long', 'Loop', 'Adderley', 'Rissik', 'Commissioner', 'Albertina', 'Malibongwe', 'William Nicol', 'Sandton', 'Rivonia', 'Louis Botha']
    const streetTypes = ['Street', 'Road', 'Avenue', 'Drive', 'Lane', 'Boulevard', 'Way', 'Close']
    const address = `${streetNumber} ${randomItem(streetNames)} ${randomItem(streetTypes)}`
    
    // Generate stats based on tier
    let rating: number
    let reviewCount: number
    let fulfillmentRate: number
    let deliveryDays: number
    
    switch (tier) {
      case 'platinum':
        rating = 4.5 + Math.random() * 0.5
        reviewCount = Math.floor(Math.random() * 500) + 200
        fulfillmentRate = 97 + Math.random() * 3
        deliveryDays = Math.floor(Math.random() * 2) + 1
        break
      case 'gold':
        rating = 4.2 + Math.random() * 0.5
        reviewCount = Math.floor(Math.random() * 200) + 50
        fulfillmentRate = 94 + Math.random() * 4
        deliveryDays = Math.floor(Math.random() * 3) + 2
        break
      case 'silver':
        rating = 3.8 + Math.random() * 0.6
        reviewCount = Math.floor(Math.random() * 100) + 20
        fulfillmentRate = 90 + Math.random() * 6
        deliveryDays = Math.floor(Math.random() * 4) + 3
        break
      case 'bronze':
      default:
        rating = 3.5 + Math.random() * 0.7
        reviewCount = Math.floor(Math.random() * 50) + 5
        fulfillmentRate = 85 + Math.random() * 10
        deliveryDays = Math.floor(Math.random() * 5) + 4
        break
    }
    
    const minOrderValues = [0, 500, 1000, 2000, 5000, 10000]
    
    try {
      await prisma.supplier.create({
        data: {
          id: `sup_${nanoid(12)}`,
          name,
          code: generateSupplierCode(i),
          contactPerson,
          email: generateEmail(name.replace(/\s+/g, '').substring(0, 10)),
          phone: generatePhoneNumber(),
          website: generateWebsite(name),
          address,
          city,
          province,
          postalCode: String(Math.floor(Math.random() * 9000) + 1000),
          supplierType: type,
          tier,
          bbbeeLevel: randomItem(BBBEE_LEVELS),
          rating: Math.round(rating * 10) / 10,
          reviewCount,
          deliveryDays,
          minOrderValue: randomItem(minOrderValues),
          paymentTerms: randomItem(PAYMENT_TERMS),
          categories: JSON.stringify(categories),
          verticals: JSON.stringify(supplierVerticals),
          fulfillmentRate: Math.round(fulfillmentRate * 10) / 10,
          status: 'active',
          verificationStatus: tier === 'platinum' || tier === 'gold' ? 'verified' : (Math.random() > 0.3 ? 'verified' : 'pending'),
          updatedAt: new Date()
        }
      })
      inserted++
      
      if (inserted % 50 === 0) {
        console.log(`Inserted ${inserted}/${totalSuppliers} suppliers...`)
      }
    } catch (error) {
      console.error(`Error inserting supplier ${i}:`, error)
    }
  }
  
  const finalCount = await prisma.supplier.count()
  console.log(`\nSeed complete! Total suppliers: ${finalCount}`)
}

main()
  .catch((e) => {
    console.error('Error seeding suppliers:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
