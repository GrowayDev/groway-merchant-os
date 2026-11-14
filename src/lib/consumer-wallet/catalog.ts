/**
 * Consumer Wallet Catalog — South Africa + Malawi
 * Real providers, municipalities, airlines, bus operators, grant types,
 * insurance categories, loan purposes, employment statuses, income bands.
 */

// CREDIT / LOAN
export const LOAN_PURPOSES = [
  { value: 'debt_consolidation', label: 'Debt Consolidation', desc: 'Combine multiple debts into one payment' },
  { value: 'home_improvement', label: 'Home Improvement', desc: 'Renovations, repairs, extensions' },
  { value: 'education', label: 'Education / School Fees', desc: 'School, university, training' },
  { value: 'medical', label: 'Medical Expenses', desc: 'Healthcare, dental, emergencies' },
  { value: 'business_startup', label: 'Business Start-up', desc: 'Capital for a new business' },
  { value: 'business_expansion', label: 'Business Expansion', desc: 'Grow an existing business' },
  { value: 'vehicle', label: 'Vehicle Purchase', desc: 'Car, bakkie, motorcycle' },
  { value: 'wedding', label: 'Wedding', desc: 'Wedding expenses' },
  { value: 'funeral', label: 'Funeral Expenses', desc: 'Funeral costs' },
  { value: 'emergency', label: 'Emergency', desc: 'Unexpected urgent expenses' },
  { value: 'furniture', label: 'Furniture / Appliances', desc: 'Household items' },
  { value: 'other', label: 'Other', desc: 'Specify in notes' },
] as const

export const EMPLOYMENT_STATUSES = [
  { value: 'employed_fulltime', label: 'Employed — Full Time', minIncome: 5000 },
  { value: 'employed_parttime', label: 'Employed — Part Time', minIncome: 3000 },
  { value: 'self_employed', label: 'Self-Employed / Business Owner', minIncome: 3000 },
  { value: 'contract', label: 'Contract Worker', minIncome: 4000 },
  { value: 'casual', label: 'Casual / Seasonal Worker', minIncome: 2000 },
  { value: 'pensioner', label: 'Pensioner / Retired', minIncome: 1800 },
  { value: 'grant_beneficiary', label: 'Grant Beneficiary (SASSA)', minIncome: 890 },
  { value: 'unemployed', label: 'Unemployed', minIncome: 0 },
] as const

export const INCOME_BANDS = [
  { value: '0-2000', label: 'R0 – R2,000', min: 0, max: 2000 },
  { value: '2000-5000', label: 'R2,001 – R5,000', min: 2001, max: 5000 },
  { value: '5000-10000', label: 'R5,001 – R10,000', min: 5001, max: 10000 },
  { value: '10000-20000', label: 'R10,001 – R20,000', min: 10001, max: 20000 },
  { value: '20000-50000', label: 'R20,001 – R50,000', min: 20001, max: 50000 },
  { value: '50000+', label: 'R50,000+', min: 50001, max: 999999999 },
  { value: 'custom', label: 'Custom amount', min: 0, max: 0 },
] as const

export const LOAN_TYPES = [
  { value: 'personal', label: 'Personal Loan', desc: 'Unsecured, short to medium term', maxAmount: 250000, terms: [6, 12, 24, 36, 48] },
  { value: 'business', label: 'Business Loan', desc: 'For business purposes', maxAmount: 500000, terms: [12, 24, 36, 48, 60] },
  { value: 'payday', label: 'Payday Advance', desc: 'Short-term, repay on payday', maxAmount: 8000, terms: [1] },
  { value: 'secured', label: 'Secured Loan', desc: 'Backed by asset (vehicle, property)', maxAmount: 1000000, terms: [12, 24, 36, 48, 60] },
] as const

export const DEBT_COUNSELLING_PROVIDERS = [
  { id: 'ncr-dc-001', name: 'DebtSafe', phone: '0861 332 837', email: 'help@debtsafe.co.za', ncrReg: 'NCRDC2350', url: 'https://www.debtsafe.co.za' },
  { id: 'ncr-dc-002', name: 'DebtBusters', phone: '0861 332 853', email: 'info@debtbusters.co.za', ncrReg: 'NCRDC140', url: 'https://www.debtbusters.co.za' },
  { id: 'ncr-dc-003', name: 'National Debt Counsellors', phone: '0861 113 598', email: 'info@ndc.co.za', ncrReg: 'NCRDC1974', url: 'https://www.ndc.co.za' },
  { id: 'ncr-dc-004', name: 'ZeroDebt', phone: '087 820 6800', email: 'info@zerodebt.co.za', ncrReg: 'NCRDC2515', url: 'https://www.zerodebt.co.za' },
  { id: 'ncr-dc-005', name: 'Debt Rescue', phone: '0861 332 732', email: 'help@debtrescue.co.za', ncrReg: 'NCRDC626', url: 'https://www.debtrescue.co.za' },
]

// INSURANCE
export const INSURANCE_CATEGORIES = [
  { value: 'funeral', label: 'Funeral Cover', icon: '🕊️', desc: 'Cover funeral expenses for you and family', requiresMedical: false },
  { value: 'life', label: 'Life Insurance', icon: '❤️', desc: 'Lump sum paid to beneficiaries', requiresMedical: true },
  { value: 'health', label: 'Health / Medical Aid', icon: '🏥', desc: 'Day-to-day and hospital cover', requiresMedical: true },
  { value: 'vehicle', label: 'Vehicle Insurance', icon: '🚗', desc: 'Comprehensive or third-party cover', requiresMedical: false },
  { value: 'home', label: 'Home / Household', icon: '🏠', desc: 'Building and contents cover', requiresMedical: false },
  { value: 'business', label: 'Business Insurance', icon: '🏢', desc: 'Protect your business assets', requiresMedical: false },
  { value: 'travel', label: 'Travel Insurance', icon: '✈️', desc: 'Cover while travelling', requiresMedical: false },
  { value: 'gap', label: 'Medical Gap Cover', icon: '⚕️', desc: 'Covers medical aid shortfalls', requiresMedical: false },
  { value: 'income_protection', label: 'Income Protection', icon: '💼', desc: 'Replace income if unable to work', requiresMedical: true },
  { value: 'dread_disease', label: 'Dread Disease', icon: '🎗️', desc: 'Cover for critical illness', requiresMedical: true },
] as const

export const INSURANCE_PROVIDERS = [
  { id: 'ins-001', name: 'Hollard', categories: ['funeral', 'life', 'vehicle', 'home', 'business', 'travel', 'gap', 'income_protection'], phone: '0860 123 400' },
  { id: 'ins-002', name: 'Old Mutual', categories: ['funeral', 'life', 'health', 'income_protection', 'dread_disease'], phone: '0860 223 263' },
  { id: 'ins-003', name: 'Sanlam', categories: ['funeral', 'life', 'health', 'income_protection', 'dread_disease'], phone: '0860 726 526' },
  { id: 'ins-004', name: 'Discovery', categories: ['life', 'health', 'income_protection', 'dread_disease'], phone: '0860 756 543' },
  { id: 'ins-005', name: 'Liberty', categories: ['life', 'funeral', 'income_protection', 'dread_disease'], phone: '0860 456 789' },
  { id: 'ins-006', name: 'OUTsurance', categories: ['vehicle', 'home', 'business', 'life', 'funeral'], phone: '0860 600 800' },
  { id: 'ins-007', name: 'MiWay', categories: ['vehicle', 'home', 'business', 'life', 'funeral'], phone: '0860 600 900' },
  { id: 'ins-008', name: '1Life', categories: ['life', 'funeral', 'dread_disease'], phone: '0860 123 345' },
]

// GRANT+ (SASSA)
export const SASSA_GRANT_TYPES = [
  { value: 'old_age', label: 'Old Age Pension Grant', amount: 1890, frequency: 'monthly', desc: 'For persons 60+ years', ageReq: 60 },
  { value: 'disability', label: 'Disability Grant', amount: 1890, frequency: 'monthly', desc: 'For persons with disabilities (18-59)' },
  { value: 'child_support', label: 'Child Support Grant', amount: 530, frequency: 'monthly', desc: 'For children under 18', perChild: true },
  { value: 'foster_child', label: 'Foster Child Grant', amount: 1130, frequency: 'monthly', desc: 'For foster parents' },
  { value: 'care_dependency', label: 'Care Dependency Grant', amount: 1890, frequency: 'monthly', desc: 'For children requiring special care' },
  { value: 'war_veterans', label: 'War Veterans Grant', amount: 1910, frequency: 'monthly', desc: 'For veterans who fought in WW2/Korean War' },
  { value: 'grant_in_aid', label: 'Grant-in-Aid', amount: 530, frequency: 'monthly', desc: 'Supplement for those needing full-time care' },
  { value: 'social_relief', label: 'Social Relief of Distress (SRD)', amount: 350, frequency: 'monthly', desc: 'Temporary assistance for dire need' },
]

export const SASSA_PAYMENT_DATES_2026 = [
  { month: 'January 2026', date: '2026-01-05' },
  { month: 'February 2026', date: '2026-02-04' },
  { month: 'March 2026', date: '2026-03-04' },
  { month: 'April 2026', date: '2026-04-06' },
  { month: 'May 2026', date: '2026-05-05' },
  { month: 'June 2026', date: '2026-06-04' },
  { month: 'July 2026', date: '2026-07-06' },
  { month: 'August 2026', date: '2026-08-05' },
  { month: 'September 2026', date: '2026-09-07' },
  { month: 'October 2026', date: '2026-10-05' },
  { month: 'November 2026', date: '2026-11-04' },
  { month: 'December 2026', date: '2026-12-03' },
]

// BILLS & UTILITIES
export const ELECTRICITY_PROVIDERS = [
  { id: 'za-eskom', name: 'Eskom Prepaid', country: 'ZA', type: 'electricity', sts: true },
  { id: 'za-joburg', name: 'City Power Johannesburg', country: 'ZA', type: 'electricity', sts: true },
  { id: 'za-cape', name: 'City of Cape Town', country: 'ZA', type: 'electricity', sts: true },
  { id: 'za-ekurhuleni', name: 'City of Ekurhuleni', country: 'ZA', type: 'electricity', sts: true },
  { id: 'za-tshwane', name: 'City of Tshwane', country: 'ZA', type: 'electricity', sts: true },
  { id: 'za-ethkwini', name: 'eThekwini Electricity', country: 'ZA', type: 'electricity', sts: true },
  { id: 'za-buffalo', name: 'Buffalo City Metro', country: 'ZA', type: 'electricity', sts: true },
  { id: 'za-mangaung', name: 'Mangaung Metro', country: 'ZA', type: 'electricity', sts: true },
  { id: 'mw-escom', name: 'ESCOM Malawi', country: 'MW', type: 'electricity', sts: true },
  { id: 'mw-lilongwe', name: 'Lilongwe City Council', country: 'MW', type: 'electricity', sts: true },
  { id: 'mw-blantyre', name: 'Blantyre City Council', country: 'MW', type: 'electricity', sts: true },
]

export const MUNICIPALITIES = [
  { id: 'za-joburg', name: 'City of Johannesburg', country: 'ZA', province: 'Gauteng' },
  { id: 'za-cape', name: 'City of Cape Town', country: 'ZA', province: 'Western Cape' },
  { id: 'za-ekurhuleni', name: 'City of Ekurhuleni', country: 'ZA', province: 'Gauteng' },
  { id: 'za-tshwane', name: 'City of Tshwane', country: 'ZA', province: 'Gauteng' },
  { id: 'za-ethkwini', name: 'eThekwini Municipality', country: 'ZA', province: 'KwaZulu-Natal' },
  { id: 'za-buffalo', name: 'Buffalo City Metro', country: 'ZA', province: 'Eastern Cape' },
  { id: 'za-mangaung', name: 'Mangaung Metro', country: 'ZA', province: 'Free State' },
  { id: 'mw-lilongwe', name: 'Lilongwe City Council', country: 'MW', province: 'Central Region' },
  { id: 'mw-blantyre', name: 'Blantyre City Council', country: 'MW', province: 'Southern Region' },
  { id: 'mw-mzuzu', name: 'Mzuzu City Council', country: 'MW', province: 'Northern Region' },
  { id: 'mw-zomba', name: 'Zomba City Council', country: 'MW', province: 'Southern Region' },
]

export const TRAFFIC_FINE_AUTHORITIES = [
  { id: 'za-rtia', name: 'RTIA (AARTO)', country: 'ZA', desc: 'Road Traffic Infringement Agency' },
  { id: 'za-joburg-metro', name: 'Johannesburg Metro Police', country: 'ZA' },
  { id: 'za-cape-traffic', name: 'City of Cape Town Traffic', country: 'ZA' },
  { id: 'mw-lilongwe-traffic', name: 'Lilongwe Traffic Police', country: 'MW' },
  { id: 'mw-blantyre-traffic', name: 'Blantyre Traffic Police', country: 'MW' },
]

// AIRTIME
export const AIRTIME_PROVIDERS = [
  { id: 'vodacom', name: 'Vodacom', country: 'ZA', voiceDenominations: [5, 10, 15, 20, 29, 30, 50, 110, 275, 299, 500, 1000],
    dataBundles: [
      { id: 'vc-1gb', name: '1GB Data', price: 49, validity: '30 days' },
      { id: 'vc-2gb', name: '2GB Data', price: 89, validity: '30 days' },
      { id: 'vc-5gb', name: '5GB Data', price: 199, validity: '30 days' },
      { id: 'vc-1gb-daily', name: '1GB Daily', price: 12, validity: '1 day' },
    ] },
  { id: 'mtn', name: 'MTN', country: 'ZA', voiceDenominations: [5, 10, 15, 20, 30, 50, 100, 200, 500, 1000],
    dataBundles: [
      { id: 'mtn-1gb', name: '1GB Data', price: 49, validity: '30 days' },
      { id: 'mtn-2gb', name: '2GB Data', price: 85, validity: '30 days' },
      { id: 'mtn-5gb', name: '5GB Data', price: 199, validity: '30 days' },
    ] },
  { id: 'cellc', name: 'Cell C', country: 'ZA', voiceDenominations: [5, 10, 20, 30, 50, 100, 200, 500, 1000],
    dataBundles: [
      { id: 'cc-1gb', name: '1GB Data', price: 45, validity: '30 days' },
      { id: 'cc-2gb', name: '2GB Data', price: 79, validity: '30 days' },
    ] },
  { id: 'telkom', name: 'Telkom', country: 'ZA', voiceDenominations: [5, 10, 15, 25, 35, 50, 100, 200, 500],
    dataBundles: [
      { id: 'tk-1gb', name: '1GB Data', price: 35, validity: '30 days' },
      { id: 'tk-5gb', name: '5GB Data', price: 149, validity: '30 days' },
    ] },
  { id: 'airtel-mw', name: 'Airtel Malawi', country: 'MW', voiceDenominations: [50, 100, 200, 500, 1000, 2000, 5000],
    dataBundles: [
      { id: 'am-1gb', name: '1GB Data', price: 500, validity: '7 days' },
      { id: 'am-2gb', name: '2GB Data', price: 900, validity: '30 days' },
    ] },
  { id: 'tnm-mw', name: 'TNM', country: 'MW', voiceDenominations: [50, 100, 200, 500, 1000, 2000, 5000],
    dataBundles: [
      { id: 'tnm-1gb', name: '1GB Data', price: 500, validity: '7 days' },
      { id: 'tnm-2gb', name: '2GB Data', price: 900, validity: '30 days' },
    ] },
]

// TRAVEL
export const AIRLINES = [
  { id: 'saa', name: 'South African Airways', code: 'SA', country: 'ZA', iata: '083' },
  { id: 'flysafair', name: 'FlySafair', code: 'FA', country: 'ZA', iata: '019' },
  { id: 'kulula', name: 'kulula.com', code: 'MN', country: 'ZA', iata: '123' },
  { id: 'airlink', name: 'Airlink', code: '4Z', country: 'ZA', iata: '749' },
  { id: 'malawian', name: 'Malawian Airlines', code: '3W', country: 'MW', iata: '921' },
]

export const AIRPORTS = [
  { code: 'JNB', name: 'OR Tambo International', city: 'Johannesburg', country: 'ZA' },
  { code: 'CPT', name: 'Cape Town International', city: 'Cape Town', country: 'ZA' },
  { code: 'DUR', name: 'King Shaka International', city: 'Durban', country: 'ZA' },
  { code: 'PLZ', name: 'Chief Dawid Stuurman', city: 'Gqeberha', country: 'ZA' },
  { code: 'BFN', name: 'Bram Fischer International', city: 'Bloemfontein', country: 'ZA' },
  { code: 'LLW', name: 'Kamuzu International', city: 'Lilongwe', country: 'MW' },
  { code: 'BLZ', name: 'Chileka International', city: 'Blantyre', country: 'MW' },
]

export const BUS_OPERATORS = [
  { id: 'greyhound', name: 'Greyhound', country: 'ZA', phone: '087 352 0303' },
  { id: 'intercape', name: 'Intercape', country: 'ZA', phone: '0861 287 262' },
  { id: 'translux', name: 'Translux', country: 'ZA', phone: '0861 767 767' },
  { id: 'citytocity', name: 'City to City', country: 'ZA', phone: '0861 767 767' },
  { id: 'eldoret', name: 'Eldo Coaches', country: 'ZA', phone: '011 333 3000' },
  { id: 'ayrton', name: 'Ayrton Express', country: 'MW', phone: '+265 1 820 000' },
]

export const BUS_CITIES = [
  { id: 'jhb', name: 'Johannesburg', country: 'ZA' },
  { id: 'pt', name: 'Pretoria', country: 'ZA' },
  { id: 'dbn', name: 'Durban', country: 'ZA' },
  { id: 'cpt', name: 'Cape Town', country: 'ZA' },
  { id: 'bf', name: 'Bloemfontein', country: 'ZA' },
  { id: 'pl', name: 'Polokwane', country: 'ZA' },
  { id: 'pe', name: 'Gqeberha', country: 'ZA' },
  { id: 'el', name: 'East London', country: 'ZA' },
  { id: 'llw', name: 'Lilongwe', country: 'MW' },
  { id: 'blz', name: 'Blantyre', country: 'MW' },
  { id: 'mzu', name: 'Mzuzu', country: 'MW' },
  { id: 'zmb', name: 'Zomba', country: 'MW' },
]

export const TRAIN_OPERATORS = [
  { id: 'gautrain', name: 'Gautrain', country: 'ZA', routes: [
    { from: 'Park Station', to: 'OR Tambo Airport', price: 175, duration: '42 min' },
    { from: 'Park Station', to: 'Pretoria', price: 62, duration: '55 min' },
    { from: 'Sandton', to: 'OR Tambo Airport', price: 175, duration: '15 min' },
  ]},
  { id: 'shosholoza', name: 'Shosholoza Meyl', country: 'ZA', routes: [
    { from: 'Johannesburg', to: 'Cape Town', price: 450, duration: '26 hours' },
    { from: 'Johannesburg', to: 'Durban', price: 320, duration: '12 hours' },
  ]},
]

// EVENTS & ENTERTAINMENT
export const EVENT_CATEGORIES = [
  { value: 'music', label: 'Music', icon: '🎵', desc: 'Concerts, live performances, festivals' },
  { value: 'sports', label: 'Sports', icon: '⚽', desc: 'Football, rugby, cricket matches' },
  { value: 'movies', label: 'Movies', icon: '🎬', desc: 'Cinema showings at major chains' },
  { value: 'comedy', label: 'Comedy', icon: '😂', desc: 'Stand-up comedy shows' },
  { value: 'theatre', label: 'Theatre', icon: '🎭', desc: 'Stage plays and musicals' },
  { value: 'festivals', label: 'Festivals', icon: '🎪', desc: 'Cultural and music festivals' },
] as const

export const MOVIE_CHAINS = [
  { id: 'ster-kinekor', name: 'Ster-Kinekor', country: 'ZA', venues: [
    { id: 'sk-sandton', name: 'Sandton City', location: 'Sandton, JHB' },
    { id: 'sk-rosebank', name: 'Zone at Rosebank', location: 'Rosebank, JHB' },
    { id: 'sk-mall-of-africa', name: 'Mall of Africa', location: 'Waterfall City, JHB' },
    { id: 'sk-capegate', name: 'Capegate', location: 'Cape Town' },
    { id: 'sk-gateway', name: 'Gateway Theatre', location: 'Durban' },
  ]},
  { id: 'nu-metro', name: 'Nu Metro', country: 'ZA', venues: [
    { id: 'nm-montecasino', name: 'Montecasino', location: 'Fourways, JHB' },
    { id: 'nm-empwaya', name: 'Emperors Palace', location: 'Kempton Park, JHB' },
    { id: 'nm-v-and-a', name: 'V&A Waterfront', location: 'Cape Town' },
  ]},
] as const

// Event ticket types with realistic pricing tiers
export const EVENT_TICKET_TYPES = [
  { value: 'regular', label: 'Regular', multiplier: 1.0, desc: 'Standard admission' },
  { value: 'vip', label: 'VIP', multiplier: 2.5, desc: 'Premium seating, complimentary refreshments' },
  { value: 'premium', label: 'Premium', multiplier: 1.8, desc: 'Reserved, better views' },
  { value: 'student', label: 'Student / Senior', multiplier: 0.7, desc: 'Discounted admission (ID required)' },
] as const

// REMITTANCE
export const REMITTANCE_COUNTRIES = [
  { code: 'ZW', name: 'Zimbabwe', dialCode: '+263', currency: 'ZWL', flag: '🇿🇼' },
  { code: 'MZ', name: 'Mozambique', dialCode: '+258', currency: 'MZN', flag: '🇲🇿' },
  { code: 'MW', name: 'Malawi', dialCode: '+265', currency: 'MWK', flag: '🇲🇼' },
  { code: 'ZM', name: 'Zambia', dialCode: '+260', currency: 'ZMW', flag: '🇿🇲' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', currency: 'NGN', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', currency: 'KES', flag: '🇰🇪' },
]

export const COLLECTION_POINTS = [
  { value: 'bank', label: 'Bank Deposit', desc: 'Direct deposit to recipient bank account', icon: '🏦' },
  { value: 'mobile_money', label: 'Mobile Money', desc: 'Sent to recipient mobile wallet', icon: '📱' },
  { value: 'cash_pickup', label: 'Cash Pickup', desc: 'Pickup at agent location', icon: '🏪' },
  { value: 'airtime', label: 'Airtime Top-up', desc: 'Top up recipient phone directly', icon: '📞' },
]

// PAY+ (NCR compliant)
export const PAYPLUS_PROVIDERS = [
  { id: 'pp-fnb', name: 'FNB Pay+', bank: 'FNB', ncrReg: 'NCRCP20', maxAmount: 5000, serviceFee: 60 },
  { id: 'pp-stdbank', name: 'Standard Bank Personal Loan', bank: 'Standard Bank', ncrReg: 'NCRCP28', maxAmount: 8000, serviceFee: 80 },
  { id: 'pp-absa', name: 'ABSA Express Loan', bank: 'ABSA', ncrReg: 'NCRCP9', maxAmount: 5000, serviceFee: 50 },
  { id: 'pp-capitec', name: 'Capitec Multi-Loan', bank: 'Capitec', ncrReg: 'NCRCP17', maxAmount: 4000, serviceFee: 35 },
  { id: 'pp-african', name: 'African Bank MyLife Loan', bank: 'African Bank', ncrReg: 'NCRCP10', maxAmount: 12000, serviceFee: 120 },
]

// BNPL
export const BNPL_PROVIDERS = [
  { id: 'payjustnow', name: 'PayJustNow', desc: '3 instalments, 0% interest', maxAmount: 25000, terms: [3] },
  { id: 'mobicred', name: 'MobiCred', desc: 'Flexible credit line', maxAmount: 30000, terms: [6, 12, 24] },
  { id: 'payflex', name: 'Payflex', desc: '4 payments, 0% interest', maxAmount: 15000, terms: [4] },
  { id: 'grobnpl', name: 'GroCredit BNPL', desc: 'Groway native BNPL, linked to Merchant OS', maxAmount: 20000, terms: [3, 6] },
]

// SAVINGS
export const SAVINGS_TYPES = [
  { value: 'goal', label: 'Goal-based Savings', icon: '🎯', desc: 'Save towards a specific target' },
  { value: 'pocket', label: 'Savings Pocket', icon: '💰', desc: 'Flexible savings, withdraw anytime' },
  { value: 'fixed', label: 'Fixed Deposit', icon: '🔒', desc: 'Lock money for higher interest' },
  { value: 'stokvel', label: 'Stokvel / Group Savings', icon: '👥', desc: 'Save together with family/friends' },
  { value: 'auto', label: 'Auto-Save', icon: '🤖', desc: 'Automatically save on every transaction' },
]

// BANKS
export const BANKS = [
  { id: 'fnb', name: 'FNB', code: '250655', payShapSupported: true },
  { id: 'stdbank', name: 'Standard Bank', code: '051001', payShapSupported: true },
  { id: 'absa', name: 'ABSA', code: '632005', payShapSupported: true },
  { id: 'nedbank', name: 'Nedbank', code: '198765', payShapSupported: true },
  { id: 'capitec', name: 'Capitec', code: '470010', payShapSupported: true },
  { id: 'discovery', name: 'Discovery Bank', code: '921000', payShapSupported: true },
  { id: 'tymebank', name: 'TymeBank', code: '920000', payShapSupported: true },
]

// HELPERS
export function generateCaseRef(prefix = 'CASE'): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}
export function generateReceiptNo(prefix = 'RCP'): string {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}
export function generatePin(length = 12): string {
  let pin = ''; for (let i = 0; i < length; i++) pin += Math.floor(Math.random() * 10); return pin
}
export function generateSTSRechargeToken(): string {
  let token = ''; for (let i = 0; i < 20; i++) token += Math.floor(Math.random() * 10); return token
}
