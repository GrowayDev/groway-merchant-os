import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/merchants/[id] - Get merchant details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const merchant = await db.merchant.findUnique({
      where: { id },
      include: {
        branches: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            status: true,
            city: true,
            province: true,
            totalRevenue: true,
            totalTransactions: true,
            totalStaff: true,
            isDefault: true
          },
          orderBy: { isDefault: 'desc' }
        },
        products: {
          take: 10,
          select: {
            id: true,
            sku: true,
            name: true,
            status: true
          },
          orderBy: { createdAt: 'desc' }
        },
        users: {
          select: {
            id: true,
            role: true,
            status: true
          }
        },
        settings: true,
        creditFacility: {
          select: {
            id: true,
            tierName: true,
            status: true,
            approvedLimit: true,
            availableCredit: true,
            drawnAmount: true
          }
        },
        _count: {
          select: {
            branches: true,
            products: true,
            users: true
          }
        }
      }
    })

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    return NextResponse.json({ merchant })
  } catch (error) {
    console.error('Error fetching merchant:', error)
    return NextResponse.json({ error: 'Failed to fetch merchant' }, { status: 500 })
  }
}

// PUT /api/merchants/[id] - Update merchant
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check if merchant exists
    const existingMerchant = await db.merchant.findUnique({
      where: { id }
    })

    if (!existingMerchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Validate name if provided
    if (body.name !== undefined && !body.name.trim()) {
      return NextResponse.json({ error: 'Merchant name cannot be empty' }, { status: 400 })
    }

    // Check unique constraints for code if being updated
    if (body.code && body.code !== existingMerchant.code) {
      const codeExists = await db.merchant.findUnique({
        where: { code: body.code }
      })
      if (codeExists) {
        return NextResponse.json({ error: 'Merchant code already exists' }, { status: 400 })
      }
    }

    // Check unique constraints for registration number if being updated
    if (body.registrationNumber && body.registrationNumber !== existingMerchant.registrationNumber) {
      const regExists = await db.merchant.findUnique({
        where: { registrationNumber: body.registrationNumber }
      })
      if (regExists) {
        return NextResponse.json({ error: 'Registration number already exists' }, { status: 400 })
      }
    }

    // Check unique constraints for VAT number if being updated
    if (body.vatNumber && body.vatNumber !== existingMerchant.vatNumber) {
      const vatExists = await db.merchant.findUnique({
        where: { vatNumber: body.vatNumber }
      })
      if (vatExists) {
        return NextResponse.json({ error: 'VAT number already exists' }, { status: 400 })
      }
    }

    // Build update data object
    const updateData: Record<string, unknown> = {}
    
    // Basic info
    if (body.name !== undefined) updateData.name = body.name
    if (body.code !== undefined) updateData.code = body.code
    if (body.tradingName !== undefined) updateData.tradingName = body.tradingName
    if (body.registrationNumber !== undefined) updateData.registrationNumber = body.registrationNumber
    if (body.vatNumber !== undefined) updateData.vatNumber = body.vatNumber
    if (body.type !== undefined) updateData.type = body.type
    if (body.industry !== undefined) updateData.industry = body.industry
    if (body.subVertical !== undefined) updateData.subVertical = body.subVertical
    
    // Contact details
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.email !== undefined) updateData.email = body.email
    if (body.website !== undefined) updateData.website = body.website
    
    // Address
    if (body.addressLine1 !== undefined) updateData.addressLine1 = body.addressLine1
    if (body.addressLine2 !== undefined) updateData.addressLine2 = body.addressLine2
    if (body.city !== undefined) updateData.city = body.city
    if (body.province !== undefined) updateData.province = body.province
    if (body.postalCode !== undefined) updateData.postalCode = body.postalCode
    if (body.country !== undefined) updateData.country = body.country
    
    // Banking details
    if (body.bankName !== undefined) updateData.bankName = body.bankName
    if (body.bankAccountNumber !== undefined) updateData.bankAccountNumber = body.bankAccountNumber
    if (body.bankAccountType !== undefined) updateData.bankAccountType = body.bankAccountType
    if (body.bankBranchCode !== undefined) updateData.bankBranchCode = body.bankBranchCode
    
    // Status & subscription
    if (body.status !== undefined) updateData.status = body.status
    if (body.subscriptionPlan !== undefined) updateData.subscriptionPlan = body.subscriptionPlan
    if (body.subscriptionStatus !== undefined) updateData.subscriptionStatus = body.subscriptionStatus
    
    // Configuration
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.timezone !== undefined) updateData.timezone = body.timezone
    if (body.language !== undefined) updateData.language = body.language
    if (body.vatRate !== undefined) updateData.vatRate = body.vatRate
    if (body.vatEnabled !== undefined) updateData.vatEnabled = body.vatEnabled
    if (body.featuresEnabled !== undefined) updateData.featuresEnabled = JSON.stringify(body.featuresEnabled)
    
    // Limits
    if (body.maxBranches !== undefined) updateData.maxBranches = body.maxBranches
    if (body.maxUsers !== undefined) updateData.maxUsers = body.maxUsers
    if (body.maxProducts !== undefined) updateData.maxProducts = body.maxProducts
    if (body.maxTransactions !== undefined) updateData.maxTransactions = body.maxTransactions
    
    // Onboarding
    if (body.onboardingStatus !== undefined) updateData.onboardingStatus = body.onboardingStatus
    if (body.onboardingStep !== undefined) updateData.onboardingStep = body.onboardingStep
    if (body.onboardingCompletedAt !== undefined) updateData.onboardingCompletedAt = body.onboardingCompletedAt ? new Date(body.onboardingCompletedAt) : null
    
    // KYC
    if (body.kycStatus !== undefined) updateData.kycStatus = body.kycStatus
    if (body.kycSubmittedAt !== undefined) updateData.kycSubmittedAt = body.kycSubmittedAt ? new Date(body.kycSubmittedAt) : null
    if (body.kycVerifiedAt !== undefined) updateData.kycVerifiedAt = body.kycVerifiedAt ? new Date(body.kycVerifiedAt) : null
    if (body.ficaCompliant !== undefined) updateData.ficaCompliant = body.ficaCompliant
    
    // Stats
    if (body.totalRevenue !== undefined) updateData.totalRevenue = body.totalRevenue
    if (body.totalTransactions !== undefined) updateData.totalTransactions = body.totalTransactions
    if (body.totalCustomers !== undefined) updateData.totalCustomers = body.totalCustomers
    if (body.totalProducts !== undefined) updateData.totalProducts = body.totalProducts
    if (body.totalBranches !== undefined) updateData.totalBranches = body.totalBranches
    if (body.lastTransactionAt !== undefined) updateData.lastTransactionAt = body.lastTransactionAt ? new Date(body.lastTransactionAt) : null
    if (body.lastLoginAt !== undefined) updateData.lastLoginAt = body.lastLoginAt ? new Date(body.lastLoginAt) : null

    const merchant = await db.merchant.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            branches: true,
            products: true,
            users: true
          }
        }
      }
    })

    return NextResponse.json({ merchant })
  } catch (error) {
    console.error('Error updating merchant:', error)
    return NextResponse.json({ error: 'Failed to update merchant' }, { status: 500 })
  }
}

// DELETE /api/merchants/[id] - Soft delete merchant (update status to 'cancelled')
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if merchant exists
    const merchant = await db.merchant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            branches: true,
            products: true,
            users: true
          }
        }
      }
    })

    if (!merchant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    // Perform soft delete by updating status to 'cancelled'
    const updatedMerchant = await db.merchant.update({
      where: { id },
      data: {
        status: 'cancelled',
        subscriptionStatus: 'cancelled'
      }
    })

    return NextResponse.json({
      message: 'Merchant soft deleted successfully',
      merchant: updatedMerchant
    })
  } catch (error) {
    console.error('Error deleting merchant:', error)
    return NextResponse.json({ error: 'Failed to delete merchant' }, { status: 500 })
  }
}
