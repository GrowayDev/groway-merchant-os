import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get merchant by ID with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const merchant = await db.merchant.findUnique({
      where: { id },
      include: {
        // Include all branches
        branches: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
            phone: true,
            email: true,
            managerName: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            province: true,
            postalCode: true,
            latitude: true,
            longitude: true,
            operatingHours: true,
            isDefault: true,
            isActive: true,
            lastTransactionAt: true,
            createdAt: true,
            _count: {
              select: {
                products: true,
                transactions: true
              }
            }
          },
          orderBy: { isDefault: 'desc' }
        },
        
        // Include all users
        users: {
          select: {
            id: true,
            role: true,
            permissions: true,
            branchId: true,
            isActive: true,
            lastAccessAt: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        
        // Include counts for related entities
        _count: {
          select: {
            branches: true,
            users: true,
            products: true,
            categories: true,
            transactions: true,
            customers: true,
            loyaltyAccounts: true
          }
        },
        
        // Include recent transactions
        transactions: {
          take: 10,
          select: {
            id: true,
            transactionNumber: true,
            total: true,
            status: true,
            paymentMethod: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        
        // Include product categories
        categories: {
          take: 20,
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: { products: true }
            }
          },
          orderBy: { name: 'asc' }
        }
      }
    })
    
    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      )
    }
    
    // Calculate additional stats
    const stats = {
      totalRevenue: await db.transaction.aggregate({
        where: {
          merchantId: id,
          status: 'completed'
        },
        _sum: { total: true }
      }),
      totalTransactions: await db.transaction.count({
        where: {
          merchantId: id,
          status: 'completed'
        }
      }),
      activeProducts: await db.product.count({
        where: {
          merchantId: id,
          active: true
        }
      }),
      lowStockProducts: await db.product.count({
        where: {
          merchantId: id,
          stockQuantity: { lte: 10 }
        }
      })
    }
    
    return NextResponse.json({
      merchant,
      stats: {
        totalRevenue: stats.totalRevenue._sum.total || 0,
        totalTransactions: stats.totalTransactions,
        activeProducts: stats.activeProducts,
        lowStockProducts: stats.lowStockProducts
      }
    })
  } catch (error) {
    console.error('Error fetching merchant:', error)
    return NextResponse.json(
      { error: 'Failed to fetch merchant' },
      { status: 500 }
    )
  }
}

// PUT - Update merchant details
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
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      )
    }
    
    // Separate updatable fields
    const {
      // Business details
      name,
      tradingName,
      registrationNumber,
      vatNumber,
      vertical,
      subVertical,
      logo,
      coverImage,
      description,
      
      // Contact details
      phone,
      email,
      website,
      
      // Address
      addressLine1,
      addressLine2,
      city,
      province,
      postalCode,
      country,
      
      // Settings
      currency,
      timezone,
      language,
      vatRate,
      vatRegistered,
      
      // Feature flags
      posEnabled,
      onlineStoreEnabled,
      bookingEnabled,
      deliveryEnabled,
      loyaltyEnabled,
      
      // Subscription
      plan,
      planStatus,
      subscriptionEndsAt,
      
      // Status
      status,
      onboardingComplete,
      onboardingStep,
      
      // KYC
      kycStatus
    } = body
    
    // Build update data object (only include defined fields)
    const updateData: Record<string, unknown> = {}
    
    // Business details
    if (name !== undefined) updateData.name = name
    if (tradingName !== undefined) updateData.tradingName = tradingName
    if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber
    if (vatNumber !== undefined) updateData.vatNumber = vatNumber
    if (vertical !== undefined) updateData.vertical = vertical
    if (subVertical !== undefined) updateData.subVertical = subVertical
    if (logo !== undefined) updateData.logo = logo
    if (coverImage !== undefined) updateData.coverImage = coverImage
    if (description !== undefined) updateData.description = description
    
    // Contact details
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (website !== undefined) updateData.website = website
    
    // Address
    if (addressLine1 !== undefined) updateData.addressLine1 = addressLine1
    if (addressLine2 !== undefined) updateData.addressLine2 = addressLine2
    if (city !== undefined) updateData.city = city
    if (province !== undefined) updateData.province = province
    if (postalCode !== undefined) updateData.postalCode = postalCode
    if (country !== undefined) updateData.country = country
    
    // Settings
    if (currency !== undefined) updateData.currency = currency
    if (timezone !== undefined) updateData.timezone = timezone
    if (language !== undefined) updateData.language = language
    if (vatRate !== undefined) updateData.vatRate = vatRate
    if (vatRegistered !== undefined) updateData.vatRegistered = vatRegistered
    
    // Feature flags
    if (posEnabled !== undefined) updateData.posEnabled = posEnabled
    if (onlineStoreEnabled !== undefined) updateData.onlineStoreEnabled = onlineStoreEnabled
    if (bookingEnabled !== undefined) updateData.bookingEnabled = bookingEnabled
    if (deliveryEnabled !== undefined) updateData.deliveryEnabled = deliveryEnabled
    if (loyaltyEnabled !== undefined) updateData.loyaltyEnabled = loyaltyEnabled
    
    // Subscription
    if (plan !== undefined) updateData.plan = plan
    if (planStatus !== undefined) updateData.planStatus = planStatus
    if (subscriptionEndsAt !== undefined) updateData.subscriptionEndsAt = subscriptionEndsAt ? new Date(subscriptionEndsAt) : null
    
    // Status
    if (status !== undefined) updateData.status = status
    if (onboardingComplete !== undefined) updateData.onboardingComplete = onboardingComplete
    if (onboardingStep !== undefined) updateData.onboardingStep = onboardingStep
    
    // KYC
    if (kycStatus !== undefined) {
      updateData.kycStatus = kycStatus
      if (kycStatus === 'verified') {
        updateData.kycVerifiedAt = new Date()
      } else if (kycStatus === 'submitted') {
        updateData.kycSubmittedAt = new Date()
      }
    }
    
    // Update the merchant
    const merchant = await db.merchant.update({
      where: { id },
      data: updateData,
      include: {
        branches: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true
          }
        },
        users: {
          select: {
            id: true,
            role: true,
            isActive: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })
    
    return NextResponse.json({ merchant })
  } catch (error) {
    console.error('Error updating merchant:', error)
    
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Merchant with this code or email already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update merchant' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete merchant (set status to 'closed')
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if merchant exists
    const existingMerchant = await db.merchant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            branches: true,
            users: true
          }
        }
      }
    })
    
    if (!existingMerchant) {
      return NextResponse.json(
        { error: 'Merchant not found' },
        { status: 404 }
      )
    }
    
    // Check if already closed
    if (existingMerchant.status === 'closed') {
      return NextResponse.json(
        { error: 'Merchant is already closed' },
        { status: 400 }
      )
    }
    
    // Soft delete - update status to closed and deactivate all related entities
    const result = await db.$transaction(async (tx) => {
      // Update merchant status
      const merchant = await tx.merchant.update({
        where: { id },
        data: {
          status: 'closed',
          planStatus: 'cancelled',
          onboardingComplete: false
        }
      })
      
      // Deactivate all branches
      await tx.branch.updateMany({
        where: { merchantId: id },
        data: { isActive: false }
      })
      
      // Deactivate all merchant users
      await tx.merchantUser.updateMany({
        where: { merchantId: id },
        data: { isActive: false }
      })
      
      return merchant
    })
    
    return NextResponse.json({
      success: true,
      message: 'Merchant has been closed successfully',
      merchant: result
    })
  } catch (error) {
    console.error('Error closing merchant:', error)
    return NextResponse.json(
      { error: 'Failed to close merchant' },
      { status: 500 }
    )
  }
}
