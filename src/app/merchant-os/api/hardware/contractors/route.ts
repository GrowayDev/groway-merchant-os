import { NextRequest, NextResponse } from 'next/server'

// Types
interface Contractor {
  id: string
  companyName: string
  contactPerson: string
  phone: string
  email: string
  businessType: 'sole_proprietor' | 'cc' | 'pty_ltd'
  registrationNumber: string
  vatNumber?: string
  creditLimit: number
  creditUsed: number
  paymentTerms: 'cod' | 'net7' | 'net15' | 'net30' | 'net60'
  discountLevel: number
  status: 'active' | 'suspended' | 'closed'
  totalPurchases: number
  address: {
    street: string
    city: string
    province: string
    postalCode: string
  }
  createdAt: string
  lastPurchase?: string
}

// Sample data
let contractors: Contractor[] = [
  {
    id: 'con1',
    companyName: 'BuildRight Construction',
    contactPerson: 'John Mokoena',
    phone: '+27 82 123 4567',
    email: 'john@buildright.co.za',
    businessType: 'pty_ltd',
    registrationNumber: '2023/123456/07',
    vatNumber: '4567890123',
    creditLimit: 150000,
    creditUsed: 45000,
    paymentTerms: 'net30',
    discountLevel: 12,
    status: 'active',
    totalPurchases: 2450000,
    address: {
      street: '123 Construction Ave',
      city: 'Johannesburg',
      province: 'Gauteng',
      postalCode: '2001'
    },
    createdAt: '2023-06-15',
    lastPurchase: '2026-02-18'
  },
  {
    id: 'con2',
    companyName: 'Mthembu Plumbing Services',
    contactPerson: 'Sipho Mthembu',
    phone: '+27 83 234 5678',
    email: 'sipho@mthembuplumbing.co.za',
    businessType: 'cc',
    registrationNumber: 'CK 2022/456789/23',
    creditLimit: 50000,
    creditUsed: 32000,
    paymentTerms: 'net15',
    discountLevel: 8,
    status: 'active',
    totalPurchases: 890000,
    address: {
      street: '45 Pipe Street',
      city: 'Durban',
      province: 'KwaZulu-Natal',
      postalCode: '4001'
    },
    createdAt: '2023-09-20',
    lastPurchase: '2026-02-17'
  },
  {
    id: 'con3',
    companyName: 'Van Der Berg Electrical',
    contactPerson: 'Pieter van der Berg',
    phone: '+27 84 345 6789',
    email: 'pieter@vdbelectrical.co.za',
    businessType: 'sole_proprietor',
    registrationNumber: '2021/789012/07',
    creditLimit: 30000,
    creditUsed: 28500,
    paymentTerms: 'net7',
    discountLevel: 5,
    status: 'active',
    totalPurchases: 456000,
    address: {
      street: '78 Spark Road',
      city: 'Pretoria',
      province: 'Gauteng',
      postalCode: '0001'
    },
    createdAt: '2024-01-10',
    lastPurchase: '2026-02-15'
  },
  {
    id: 'con4',
    companyName: 'Nkosi Building Supplies',
    contactPerson: 'Nomsa Nkosi',
    phone: '+27 72 456 7890',
    email: 'nomsa@nkosibuilding.co.za',
    businessType: 'pty_ltd',
    registrationNumber: '2022/234567/07',
    vatNumber: '7890123456',
    creditLimit: 200000,
    creditUsed: 180000,
    paymentTerms: 'net60',
    discountLevel: 15,
    status: 'active',
    totalPurchases: 5670000,
    address: {
      street: '12 Builder Boulevard',
      city: 'Cape Town',
      province: 'Western Cape',
      postalCode: '8001'
    },
    createdAt: '2022-11-05',
    lastPurchase: '2026-02-19'
  },
  {
    id: 'con5',
    companyName: 'QuickFix Maintenance',
    contactPerson: 'David Pretorius',
    phone: '+27 76 567 8901',
    email: 'david@quickfix.co.za',
    businessType: 'cc',
    registrationNumber: 'CK 2023/890123/23',
    creditLimit: 25000,
    creditUsed: 25000,
    paymentTerms: 'cod',
    discountLevel: 3,
    status: 'suspended',
    totalPurchases: 123000,
    address: {
      street: '34 Fixit Lane',
      city: 'Bloemfontein',
      province: 'Free State',
      postalCode: '9301'
    },
    createdAt: '2024-06-22',
    lastPurchase: '2025-12-10'
  }
]

// GET - List all contractors
export async function GET() {
  return NextResponse.json({
    success: true,
    data: contractors,
    stats: {
      total: contractors.length,
      active: contractors.filter(c => c.status === 'active').length,
      suspended: contractors.filter(c => c.status === 'suspended').length,
      totalCreditOutstanding: contractors.reduce((sum, c) => sum + c.creditUsed, 0)
    }
  })
}

// POST - Create new contractor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const newContractor: Contractor = {
      id: `con${Date.now()}`,
      companyName: body.companyName,
      contactPerson: body.contactPerson,
      phone: body.phone,
      email: body.email,
      businessType: body.businessType || 'sole_proprietor',
      registrationNumber: body.registrationNumber,
      vatNumber: body.vatNumber,
      creditLimit: body.creditLimit || 0,
      creditUsed: 0,
      paymentTerms: body.paymentTerms || 'cod',
      discountLevel: body.discountLevel || 0,
      status: 'active',
      totalPurchases: 0,
      address: body.address || {
        street: '',
        city: '',
        province: '',
        postalCode: ''
      },
      createdAt: new Date().toISOString().split('T')[0]
    }
    
    contractors.push(newContractor)
    
    return NextResponse.json({
      success: true,
      data: newContractor,
      message: 'Contractor created successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create contractor' },
      { status: 400 }
    )
  }
}
