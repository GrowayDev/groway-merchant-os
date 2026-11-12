import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET - Get merchant dashboard stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }
    
    // Get devices
    const devices = await db.GopayDevice.findMany({
      where: { merchantId }
    })
    
    // Get transactions (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const transactions = await db.GopayTransaction.findMany({
      where: { 
        device: { merchantId }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })
    
    // Get lending facilities
    const facilities = await db.GopayLendingFacility.findMany({
      where: { merchantId }
    })
    
    // Get settlements
    const settlements = await db.GopaySettlement.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    // Calculate stats
    const activeDevices = devices.filter(d => d.status === 'active').length
    const totalTransactions = transactions.length
    const totalRevenue = transactions
      .filter(t => t.type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0)
    const totalRefunds = transactions
      .filter(t => t.type === 'refund')
      .reduce((sum, t) => sum + t.amount, 0)
    const pendingSettlement = transactions
      .filter(t => t.settlementStatus === 'pending')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalCreditLimit = facilities.reduce((sum, f) => sum + f.approvedLimit, 0)
    const totalCreditUsed = facilities.reduce((sum, f) => sum + f.usedAmount, 0)
    const totalCreditAvailable = facilities.reduce((sum, f) => sum + f.availableAmount, 0)
    
    // Payment method breakdown
    const paymentMethods = {
      card: transactions.filter(t => t.paymentMethod === 'card').length,
      nfc: transactions.filter(t => t.paymentMethod === 'nfc').length,
      qr: transactions.filter(t => t.paymentMethod === 'qr').length,
      mobile_money: transactions.filter(t => t.paymentMethod === 'mobile_money').length,
      eft: transactions.filter(t => t.paymentMethod === 'eft').length
    }
    
    return NextResponse.json({
      summary: {
        totalRevenue,
        totalRefunds,
        pendingSettlement,
        totalTransactions,
        activeDevices,
        totalDevices: devices.length
      },
      lending: {
        totalCreditLimit,
        totalCreditUsed,
        totalCreditAvailable
      },
      paymentMethods,
      recentTransactions: transactions.slice(0, 10),
      devices: devices.slice(0, 5),
      settlements: settlements.slice(0, 5)
    })
  } catch (error) {
    console.error('Error fetching dashboard:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}
