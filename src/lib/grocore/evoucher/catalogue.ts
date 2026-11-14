import { VoucherProduct, DeviceFinanceProduct } from './types'

export const SA_MNOS = [
  { id: 'vodacom', name: 'Vodacom', country: 'ZA', commodities: ['airtime', 'data'] },
  { id: 'mtn-za', name: 'MTN South Africa', country: 'ZA', commodities: ['airtime', 'data'] },
  { id: 'cell-c', name: 'Cell C', country: 'ZA', commodities: ['airtime', 'data'] },
  { id: 'telkom', name: 'Telkom Mobile', country: 'ZA', commodities: ['airtime', 'data'] },
  { id: 'liquid', name: 'Liquid Intelligent Technologies', country: 'ZA', commodities: ['data'] },
]
export const MW_MNOS = [
  { id: 'airtel-mw', name: 'Airtel Malawi', country: 'MW', commodities: ['airtime', 'data'] },
  { id: 'tnm', name: 'TNM (Telekom Networks Malawi)', country: 'MW', commodities: ['airtime', 'data'] },
  { id: 'g-mobile', name: 'G-Mobile', country: 'MW', commodities: ['airtime', 'data'] },
  { id: 'lacell', name: 'Lacell', country: 'MW', commodities: ['airtime', 'data'] },
  { id: 'access', name: 'Access Communications', country: 'MW', commodities: ['airtime', 'data'] },
]
export const SA_UTILITIES = [
  { id: 'eskom', name: 'Eskom Holdings SOC Ltd', country: 'ZA', commodity: 'electricity', type: 'national' },
  { id: 'joburg-city-power', name: 'City Power Johannesburg', country: 'ZA', commodity: 'electricity', type: 'municipal' },
  { id: 'ekurhuleni', name: 'City of Ekurhuleni', country: 'ZA', commodity: 'electricity', type: 'municipal' },
  { id: 'tshwane', name: 'City of Tshwane', country: 'ZA', commodity: 'electricity', type: 'municipal' },
  { id: 'cape-town', name: 'City of Cape Town', country: 'ZA', commodity: 'electricity', type: 'municipal' },
  { id: 'ethewini', name: 'eThekwini Electricity', country: 'ZA', commodity: 'electricity', type: 'municipal' },
  { id: 'buffalo-city', name: 'Buffalo City Metro', country: 'ZA', commodity: 'electricity', type: 'municipal' },
  { id: 'nelson-mandela-bay', name: 'Nelson Mandela Bay', country: 'ZA', commodity: 'electricity', type: 'municipal' },
  { id: 'mangaung', name: 'Mangaung Metro', country: 'ZA', commodity: 'electricity', type: 'municipal' },
]
export const MW_UTILITIES = [
  { id: 'escom', name: 'ESCOM (Electricity Supply Corporation of Malawi)', country: 'MW', commodity: 'electricity', type: 'national' },
  { id: 'egenco', name: 'EGENCO (Electricity Generation Company)', country: 'MW', commodity: 'electricity', type: 'generator' },
]
export const SA_ISPS = [
  { id: 'growireless', name: 'Growireless', country: 'ZA', commodity: 'isp_package' },
  { id: 'vodacom-fibre', name: 'Vodacom Fibre', country: 'ZA', commodity: 'isp_package' },
  { id: 'mtn-fibre', name: 'MTN Fibre', country: 'ZA', commodity: 'isp_package' },
  { id: 'telkom-openserve', name: 'Telkom Openserve', country: 'ZA', commodity: 'isp_package' },
  { id: 'seacom', name: 'SEACOM', country: 'ZA', commodity: 'isp_package' },
  { id: 'cool-ideas', name: 'Cool Ideas', country: 'ZA', commodity: 'isp_package' },
  { id: 'afrihost', name: 'Afrihost', country: 'ZA', commodity: 'isp_package' },
  { id: 'supersonic', name: 'Supersonic', country: 'ZA', commodity: 'isp_package' },
]
export const ALL_PROVIDERS = [
  ...SA_MNOS.map(m => ({ ...m, type: 'mno' })),
  ...MW_MNOS.map(m => ({ ...m, type: 'mno' })),
  ...SA_UTILITIES.map(u => ({ ...u, type: 'utility' })),
  ...MW_UTILITIES.map(u => ({ ...u, type: 'utility' })),
  ...SA_ISPS.map(i => ({ ...i, type: 'isp' })),
]

export const DEFAULT_VOUCHER_PRODUCTS: VoucherProduct[] = [
  { id: 'za-vodacom-airtime-5', category: 'airtime', name: 'Vodacom Airtime R5', description: 'R5 Vodacom airtime voucher', faceValueMinor: 500n, costMinor: 475n, currency: 'ZAR', country: 'ZA', provider: 'vodacom', providerName: 'Vodacom', denomination: 'R5', stockType: 'pin', deliveryType: 'pin_voucher', marginBps: 500, active: true },
  { id: 'za-vodacom-airtime-10', category: 'airtime', name: 'Vodacom Airtime R10', description: 'R10 Vodacom airtime voucher', faceValueMinor: 1000n, costMinor: 950n, currency: 'ZAR', country: 'ZA', provider: 'vodacom', providerName: 'Vodacom', denomination: 'R10', stockType: 'pin', deliveryType: 'pin_voucher', marginBps: 500, active: true },
  { id: 'za-vodacom-airtime-30', category: 'airtime', name: 'Vodacom Airtime R30', description: 'R30 Vodacom airtime voucher', faceValueMinor: 3000n, costMinor: 2850n, currency: 'ZAR', country: 'ZA', provider: 'vodacom', providerName: 'Vodacom', denomination: 'R30', stockType: 'pin', deliveryType: 'pin_voucher', marginBps: 500, active: true },
  { id: 'za-mtn-airtime-10', category: 'airtime', name: 'MTN Airtime R10', description: 'R10 MTN airtime voucher', faceValueMinor: 1000n, costMinor: 950n, currency: 'ZAR', country: 'ZA', provider: 'mtn-za', providerName: 'MTN SA', denomination: 'R10', stockType: 'pin', deliveryType: 'pin_voucher', marginBps: 500, active: true },
  { id: 'za-cellc-airtime-10', category: 'airtime', name: 'Cell C Airtime R10', description: 'R10 Cell C airtime voucher', faceValueMinor: 1000n, costMinor: 950n, currency: 'ZAR', country: 'ZA', provider: 'cell-c', providerName: 'Cell C', denomination: 'R10', stockType: 'pin', deliveryType: 'pin_voucher', marginBps: 500, active: true },
  { id: 'za-telkom-airtime-10', category: 'airtime', name: 'Telkom Airtime R10', description: 'R10 Telkom airtime voucher', faceValueMinor: 1000n, costMinor: 950n, currency: 'ZAR', country: 'ZA', provider: 'telkom', providerName: 'Telkom', denomination: 'R10', stockType: 'pin', deliveryType: 'pin_voucher', marginBps: 500, active: true },
  { id: 'za-vodacom-data-1gb', category: 'data', name: 'Vodacom 1GB Data', description: '1GB Vodacom data bundle (30 days)', faceValueMinor: 4900n, costMinor: 4655n, currency: 'ZAR', country: 'ZA', provider: 'vodacom', providerName: 'Vodacom', denomination: '1GB / 30 days', stockType: 'direct', deliveryType: 'direct_topup', marginBps: 500, active: true },
  { id: 'za-mtn-data-1gb', category: 'data', name: 'MTN 1GB Data', description: '1GB MTN data bundle (30 days)', faceValueMinor: 4900n, costMinor: 4655n, currency: 'ZAR', country: 'ZA', provider: 'mtn-za', providerName: 'MTN SA', denomination: '1GB / 30 days', stockType: 'direct', deliveryType: 'direct_topup', marginBps: 500, active: true },
  { id: 'za-cellc-data-2gb', category: 'data', name: 'Cell C 2GB Data', description: '2GB Cell C data bundle (30 days)', faceValueMinor: 6500n, costMinor: 6175n, currency: 'ZAR', country: 'ZA', provider: 'cell-c', providerName: 'Cell C', denomination: '2GB / 30 days', stockType: 'direct', deliveryType: 'direct_topup', marginBps: 500, active: true },
  { id: 'za-eskom-electricity-50', category: 'electricity', name: 'Eskom Prepaid R50', description: 'R50 Eskom prepaid electricity token', faceValueMinor: 5000n, costMinor: 4750n, currency: 'ZAR', country: 'ZA', provider: 'eskom', providerName: 'Eskom', denomination: 'R50', stockType: 'token', deliveryType: 'meter_token', marginBps: 500, active: true },
  { id: 'za-eskom-electricity-100', category: 'electricity', name: 'Eskom Prepaid R100', description: 'R100 Eskom prepaid electricity token', faceValueMinor: 10000n, costMinor: 9500n, currency: 'ZAR', country: 'ZA', provider: 'eskom', providerName: 'Eskom', denomination: 'R100', stockType: 'token', deliveryType: 'meter_token', marginBps: 500, active: true },
  { id: 'za-eskom-electricity-200', category: 'electricity', name: 'Eskom Prepaid R200', description: 'R200 Eskom prepaid electricity token', faceValueMinor: 20000n, costMinor: 19000n, currency: 'ZAR', country: 'ZA', provider: 'eskom', providerName: 'Eskom', denomination: 'R200', stockType: 'token', deliveryType: 'meter_token', marginBps: 500, active: true },
  { id: 'za-city-power-electricity-100', category: 'electricity', name: 'City Power Johannesburg R100', description: 'R100 Johannesburg City Power prepaid token', faceValueMinor: 10000n, costMinor: 9500n, currency: 'ZAR', country: 'ZA', provider: 'joburg-city-power', providerName: 'City Power JHB', denomination: 'R100', stockType: 'token', deliveryType: 'meter_token', marginBps: 500, active: true },
  { id: 'za-cape-town-electricity-100', category: 'electricity', name: 'City of Cape Town R100', description: 'R100 Cape Town prepaid electricity token', faceValueMinor: 10000n, costMinor: 9500n, currency: 'ZAR', country: 'ZA', provider: 'cape-town', providerName: 'City of Cape Town', denomination: 'R100', stockType: 'token', deliveryType: 'meter_token', marginBps: 500, active: true },
  { id: 'za-growireless-50gb', category: 'isp_package', name: 'Growireless 50GB Wireless', description: '50GB wireless broadband data (30 days)', faceValueMinor: 29900n, costMinor: 26910n, currency: 'ZAR', country: 'ZA', provider: 'growireless', providerName: 'Growireless', denomination: '50GB / 30 days', stockType: 'direct', deliveryType: 'qr_code', marginBps: 1000, active: true },
  { id: 'za-growireless-unlimited', category: 'isp_package', name: 'Growireless Unlimited Wireless', description: 'Uncapped wireless broadband (30 days)', faceValueMinor: 59900n, costMinor: 53910n, currency: 'ZAR', country: 'ZA', provider: 'growireless', providerName: 'Growireless', denomination: 'Uncapped / 30 days', stockType: 'direct', deliveryType: 'qr_code', marginBps: 1000, active: true },
  { id: 'za-vodacom-fibre-100', category: 'isp_package', name: 'Vodacom Fibre 100Mbps', description: '100Mbps fibre (30 days)', faceValueMinor: 69900n, costMinor: 62910n, currency: 'ZAR', country: 'ZA', provider: 'vodacom-fibre', providerName: 'Vodacom Fibre', denomination: '100Mbps / 30 days', stockType: 'direct', deliveryType: 'qr_code', marginBps: 1000, active: true },
  { id: 'za-afrihost-20gb', category: 'isp_package', name: 'Afrihost 20GB Mobile Data', description: '20GB mobile data (30 days)', faceValueMinor: 19900n, costMinor: 17910n, currency: 'ZAR', country: 'ZA', provider: 'afrihost', providerName: 'Afrihost', denomination: '20GB / 30 days', stockType: 'direct', deliveryType: 'qr_code', marginBps: 1000, active: true },
  { id: 'mw-airtel-airtime-1000', category: 'airtime', name: 'Airtel Malawi MK1,000 Airtime', description: 'MK1,000 Airtel airtime', faceValueMinor: 100000n, costMinor: 95000n, currency: 'MWK', country: 'MW', provider: 'airtel-mw', providerName: 'Airtel Malawi', denomination: 'MK1,000', stockType: 'pin', deliveryType: 'pin_voucher', marginBps: 500, active: true },
  { id: 'mw-airtel-airtime-5000', category: 'airtime', name: 'Airtel Malawi MK5,000 Airtime', description: 'MK5,000 Airtel airtime', faceValueMinor: 500000n, costMinor: 475000n, currency: 'MWK', country: 'MW', provider: 'airtel-mw', providerName: 'Airtel Malawi', denomination: 'MK5,000', stockType: 'pin', deliveryType: 'pin_voucher', marginBps: 500, active: true },
  { id: 'mw-tnm-airtime-1000', category: 'airtime', name: 'TNM MK1,000 Airtime', description: 'MK1,000 TNM airtime', faceValueMinor: 100000n, costMinor: 95000n, currency: 'MWK', country: 'MW', provider: 'tnm', providerName: 'TNM', denomination: 'MK1,000', stockType: 'pin', deliveryType: 'pin_voucher', marginBps: 500, active: true },
  { id: 'mw-airtel-data-1gb', category: 'data', name: 'Airtel Malawi 1GB Data', description: '1GB Airtel data (24 hours)', faceValueMinor: 100000n, costMinor: 95000n, currency: 'MWK', country: 'MW', provider: 'airtel-mw', providerName: 'Airtel Malawi', denomination: '1GB / 24h', stockType: 'direct', deliveryType: 'direct_topup', marginBps: 500, active: true },
  { id: 'mw-escom-electricity-5000', category: 'electricity', name: 'ESCOM Prepaid MK5,000', description: 'MK5,000 ESCOM prepaid electricity token', faceValueMinor: 500000n, costMinor: 475000n, currency: 'MWK', country: 'MW', provider: 'escom', providerName: 'ESCOM', denomination: 'MK5,000', stockType: 'token', deliveryType: 'meter_token', marginBps: 500, active: true },
  { id: 'mw-escom-electricity-10000', category: 'electricity', name: 'ESCOM Prepaid MK10,000', description: 'MK10,000 ESCOM prepaid electricity token', faceValueMinor: 1000000n, costMinor: 950000n, currency: 'MWK', country: 'MW', provider: 'escom', providerName: 'ESCOM', denomination: 'MK10,000', stockType: 'token', deliveryType: 'meter_token', marginBps: 500, active: true },
]

export const DEFAULT_DEVICE_PRODUCTS: DeviceFinanceProduct[] = [
  { id: 'df-samsung-a05', name: 'Samsung Galaxy A05', brand: 'Samsung', model: 'Galaxy A05', category: 'smartphone', retailPriceMinor: 299900n, depositMinor: 50000n, dailyPaymentMinor: 1500n, termDays: 180, currency: 'ZAR', country: 'ZA', specs: { storage: '64GB', ram: '4GB', screen: '6.7"', battery: '5000mAh', network: '4G LTE' }, active: true },
  { id: 'df-samsung-a15', name: 'Samsung Galaxy A15', brand: 'Samsung', model: 'Galaxy A15', category: 'smartphone', retailPriceMinor: 399900n, depositMinor: 70000n, dailyPaymentMinor: 2000n, termDays: 180, currency: 'ZAR', country: 'ZA', specs: { storage: '128GB', ram: '4GB', screen: '6.5"', battery: '5000mAh', network: '4G LTE' }, active: true },
  { id: 'df-itel-p55', name: 'itel P55', brand: 'itel', model: 'P55', category: 'smartphone', retailPriceMinor: 199900n, depositMinor: 30000n, dailyPaymentMinor: 1000n, termDays: 180, currency: 'ZAR', country: 'ZA', specs: { storage: '64GB', ram: '4GB', screen: '6.6"', battery: '5000mAh', network: '4G LTE' }, active: true },
  { id: 'df-nokia-c32', name: 'Nokia C32', brand: 'Nokia', model: 'C32', category: 'smartphone', retailPriceMinor: 249900n, depositMinor: 40000n, dailyPaymentMinor: 1200n, termDays: 180, currency: 'ZAR', country: 'ZA', specs: { storage: '64GB', ram: '4GB', screen: '6.5"', battery: '5000mAh', network: '4G LTE' }, active: true },
  { id: 'df-lenovo-tab-m9', name: 'Lenovo Tab M9', brand: 'Lenovo', model: 'Tab M9', category: 'tablet', retailPriceMinor: 349900n, depositMinor: 60000n, dailyPaymentMinor: 1700n, termDays: 180, currency: 'ZAR', country: 'ZA', specs: { storage: '64GB', ram: '4GB', screen: '9"', battery: '5100mAh', network: 'WiFi+LTE' }, active: true },
  { id: 'df-tecno-spark-10-mw', name: 'Tecno Spark 10', brand: 'Tecno', model: 'Spark 10', category: 'smartphone', retailPriceMinor: 1500000n, depositMinor: 200000n, dailyPaymentMinor: 8000n, termDays: 180, currency: 'MWK', country: 'MW', specs: { storage: '128GB', ram: '4GB', screen: '6.6"', battery: '5000mAh', network: '4G LTE' }, active: true },
]
