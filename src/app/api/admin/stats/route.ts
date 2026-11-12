import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/admin/stats - Get platform statistics
export async function GET(request: NextRequest) {
  try {
    // Get counts for various entities
    const [
      totalMerchants,
      activeMerchants,
      pendingMerchants,
      suspendedMerchants,
      newFraudAlerts,
      investigatingAlerts,
      openTickets,
      urgentTickets,
      pendingCompliance,
      criticalCompliance,
      pendingPopia,
      newAmlAlerts,
    ] = await Promise.all([
      db.adminMerchant.count(),
      db.adminMerchant.count({ where: { status: 'active' } }),
      db.adminMerchant.count({ where: { status: 'pending' } }),
      db.adminMerchant.count({ where: { status: 'suspended' } }),
      db.fraudAlert.count({ where: { status: 'new' } }),
      db.fraudAlert.count({ where: { status: 'investigating' } }),
      db.supportTicket.count({ where: { status: { in: ['open', 'in_progress'] } } }),
      db.supportTicket.count({ where: { priority: 'urgent', status: { in: ['open', 'in_progress'] } } }),
      db.complianceItem.count({ where: { status: 'pending' } }),
      db.complianceItem.count({ where: { priority: 'critical', status: { in: ['pending', 'in_review'] } } }),
      db.popiaRequest.count({ where: { status: 'pending' } }),
      db.amlAlert.count({ where: { status: 'new' } }),
    ]);

    // Get hourly transaction data (simulated - in production this would come from actual transaction data)
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      transactions: Math.floor(Math.random() * 500) + 100,
      volume: Math.floor(Math.random() * 100000) + 50000,
    }));

    // Get merchant growth data (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    // Get actual merchant counts per day
    const merchantGrowth = await Promise.all(
      last7Days.map(async (day, index) => {
        const count = await db.adminMerchant.count({
          where: {
            joinedDate: {
              gte: new Date(day),
              lt: new Date(new Date(day).getTime() + 24 * 60 * 60 * 1000),
            },
          },
        });
        return {
          date: day,
          newMerchants: count,
          cumulative: index * 2 + count, // Simplified cumulative
        };
      })
    );

    // Get top verticals
    const verticalCounts = await db.adminMerchant.groupBy({
      by: ['vertical'],
      _count: true,
      where: {
        vertical: { not: null },
      },
    });

    const topVerticals = verticalCounts
      .map((v) => ({
        vertical: v.vertical || 'Unknown',
        count: v._count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // System health status
    const systemServices = [
      { name: 'API Gateway', status: 'operational', uptime: 99.99 },
      { name: 'Database', status: 'operational', uptime: 99.95 },
      { name: 'Payment Processing', status: 'operational', uptime: 99.99 },
      { name: 'Authentication', status: 'operational', uptime: 99.98 },
      { name: 'Notification Service', status: 'degraded', uptime: 98.5 },
      { name: 'Analytics Engine', status: 'operational', uptime: 99.9 },
    ];

    return NextResponse.json({
      overview: {
        totalMerchants,
        activeMerchants,
        pendingMerchants,
        suspendedMerchants,
        newFraudAlerts,
        investigatingAlerts,
        openTickets,
        urgentTickets,
        pendingCompliance,
        criticalCompliance,
        pendingPopia,
        newAmlAlerts,
      },
      hourlyData,
      merchantGrowth,
      topVerticals,
      systemServices,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching platform stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform stats' },
      { status: 500 }
    );
  }
}
