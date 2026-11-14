import { NextRequest, NextResponse } from 'next/server'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import { db } from '@/lib/db'
const DEMO_PRODUCTS = [
  { gtin: '6001234500012', productName: 'Jive Maas Bread 700g', manufacturer: 'Tiger Brands', category: 'Bakery', riskProfile: 'standard', custodyChain: JSON.stringify([{node:'Manufacturer',party:'Tiger Brands (Pretoria)',ts:'2024-11-02T08:14:00Z',signed:true},{node:'Distributor',party:'Massmart Cash & Carry',ts:'2024-11-04T11:22:00Z',signed:true},{node:'Wholesaler',party:'Crown Wholesalers Soweto',ts:'2024-11-06T09:05:00Z',signed:true},{node:'Retailer',party:'Mama Thandi Spaza',ts:'2024-11-07T06:48:00Z',signed:true}]) },
  { gtin: '6009876500049', productName: 'Lunch Bar 50g', manufacturer: 'Mondelez SA', category: 'Confectionery', riskProfile: 'standard', custodyChain: JSON.stringify([{node:'Manufacturer',party:'Mondelez SA (Port Elizabeth)',ts:'2024-11-01T07:00:00Z',signed:true},{node:'Distributor',party:'Shoprite Wholesale',ts:'2024-11-03T10:00:00Z',signed:true},{node:'Wholesaler',party:'Mamsy Wholesalers',ts:'2024-11-05T08:00:00Z',signed:true},{node:'Retailer',party:'Mama Thandi Spaza',ts:'2024-11-06T07:00:00Z',signed:true}]) },
  { gtin: '6001234500078', productName: 'Coke 440ml Can', manufacturer: 'Coca-Cola Peninsula Beverages', category: 'Beverages', riskProfile: 'standard', custodyChain: JSON.stringify([{node:'Manufacturer',party:'CCPB (Devon Valley)',ts:'2024-11-04T06:00:00Z',signed:true},{node:'Distributor',party:'AB InBev Distribution',ts:'2024-11-05T09:00:00Z',signed:true},{node:'Wholesaler',party:'Crown Wholesalers Soweto',ts:'2024-11-06T11:00:00Z',signed:true},{node:'Retailer',party:'Mama Thandi Spaza',ts:'2024-11-07T07:00:00Z',signed:true}]) },
  { gtin: '6005555500094', productName: 'Panado 500mg Tablets (24s)', manufacturer: 'Adcock Ingram', category: 'Pharmaceutical', riskProfile: 'high_risk', custodyChain: JSON.stringify([{node:'Manufacturer',party:'Adcock Ingram (Clayville)',ts:'2024-11-03T05:00:00Z',signed:true},{node:'Distributor',party:'UPD',ts:'2024-11-04T07:00:00Z',signed:true},{node:'Retailer',party:'CityMed Pharmacy',ts:'2024-11-06T08:00:00Z',signed:true}]) },
  { gtin: '6004444400080', productName: "Dark & Lovely Hair Relaxer Kit", manufacturer: "L'Oreal SA", category: 'Cosmetics', riskProfile: 'high_risk', custodyChain: JSON.stringify([{node:'Manufacturer',party:"L'Oreal SA (Midrand)",ts:'2024-11-01T08:00:00Z',signed:true},{node:'Distributor',party:'Clicks Distribution',ts:'2024-11-03T10:00:00Z',signed:true},{node:'Retailer',party:'Glamour Hair Studio',ts:'2024-11-06T15:00:00Z',signed:true}]) },
]
async function ensureSeeded() {
  try { const c = await db.sapeProduct.count(); if (c > 0) return
    for (const p of DEMO_PRODUCTS) await db.sapeProduct.create({ data: { gtin: p.gtin, productName: p.productName, manufacturer: p.manufacturer, category: p.category, riskProfile: p.riskProfile, status: 'active' } })
  } catch {}
}
export async function GET(request: NextRequest) {
  try { const m = await getMerchantIdWithDevFallback(request); if (!m) return NextResponse.json({ success: false, error: 'Auth required' }, { status: 401 })
    await ensureSeeded()
    const products = await db.sapeProduct.findMany({ orderBy: { registeredAt: 'desc' }, take: 50 }).catch(() => [])
    const enriched = products.map(p => { const d = DEMO_PRODUCTS.find(x => x.gtin === p.gtin); return { ...p, custodyChain: d ? JSON.parse(d.custodyChain) : [] } })
    return NextResponse.json({ success: true, products: enriched })
  } catch (e) { return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 }) }
}
