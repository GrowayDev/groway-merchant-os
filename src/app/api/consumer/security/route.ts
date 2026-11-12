import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const DEMO_USER_ID = 'demo-consumer-user-001';

/**
 * GET /api/consumer/security
 * Get user security settings and risk profile
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const userId = searchParams.get('userId') || DEMO_USER_ID;

    // Get user's risk profile
    const riskProfile = await db.riskProfile.findUnique({
      where: {
        entityType_entityId: {
          entityType: 'consumer',
          entityId: userId
        }
      }
    });

    // Get active sessions
    const sessions = await db.consumerSession.findMany({
      where: { userId, status: 'active' },
      orderBy: { lastActiveAt: 'desc' },
      take: 10
    });

    // Get registered devices
    const devices = await db.deviceFingerprint.findMany({
      where: {
        associatedUsers: { contains: userId }
      },
      orderBy: { lastSeenAt: 'desc' },
      take: 10
    });

    // Get recent security alerts
    const alerts = await db.fraudAlert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get security settings (stored in user record)
    const user = await db.consumerUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        kycLevel: true,
        kycStatus: true,
        accountStatus: true,
        pinHash: true,
        biometricKeyId: true,
        failedPinAttempts: true,
        lockedUntil: true,
        notificationPrefs: true,
      }
    });

    // Get wallet limits
    const wallet = await db.consumerWallet.findUnique({
      where: { userId },
      select: {
        dailySpendLimit: true,
        monthlySpendLimit: true,
        dailySpentCents: true,
        monthlySpentCents: true,
      }
    });

    // Get cards
    const cards = await db.consumerCard.findMany({
      where: { userId },
      select: {
        id: true,
        cardType: true,
        cardCategory: true,
        lastFourDigits: true,
        status: true,
        spendingLimitDaily: true,
        spendingLimitMonthly: true,
        onlineEnabled: true,
        contactlessEnabled: true,
        atmEnabled: true,
        internationalEnabled: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          ...user,
          hasPin: !!user?.pinHash,
          hasBiometric: !!user?.biometricKeyId,
          isLocked: user?.lockedUntil && new Date(user.lockedUntil) > new Date(),
        },
        riskProfile: riskProfile ? {
          score: riskProfile.riskScore,
          level: riskProfile.riskLevel,
          status: riskProfile.status,
          lastAssessment: riskProfile.lastAssessmentAt,
          factors: riskProfile.riskFactors ? JSON.parse(riskProfile.riskFactors) : [],
        } : {
          score: 0,
          level: 'low',
          status: 'active',
          lastAssessment: null,
          factors: []
        },
        walletLimits: wallet ? {
          dailyLimit: Number(wallet.dailySpendLimit || 0) / 100,
          dailySpent: Number(wallet.dailySpentCents) / 100,
          monthlyLimit: Number(wallet.monthlySpendLimit || 0) / 100,
          monthlySpent: Number(wallet.monthlySpentCents) / 100,
          dailyRemaining: Number((wallet.dailySpendLimit || 0) - wallet.dailySpentCents) / 100,
          monthlyRemaining: Number((wallet.monthlySpendLimit || 0) - wallet.monthlySpentCents) / 100,
        } : null,
        sessions: sessions.map(s => ({
          id: s.id,
          deviceName: s.deviceName,
          deviceType: s.deviceType,
          ipAddress: s.ipAddress,
          lastActive: s.lastActiveAt,
          status: s.status,
        })),
        devices: devices.map(d => ({
          id: d.id,
          fingerprint: d.fingerprint,
          deviceType: d.deviceType,
          os: d.os,
          lastSeen: d.lastSeenAt,
          riskScore: d.riskScore,
          flagged: d.flagged,
        })),
        cards: cards.map(c => ({
          id: c.id,
          type: c.cardType,
          category: c.cardCategory,
          lastFour: c.lastFourDigits,
          status: c.status,
          limits: {
            daily: Number(c.spendingLimitDaily || 0) / 100,
            monthly: Number(c.spendingLimitMonthly || 0) / 100,
          },
          features: {
            online: c.onlineEnabled,
            contactless: c.contactlessEnabled,
            atm: c.atmEnabled,
            international: c.internationalEnabled,
          }
        })),
        recentAlerts: alerts.map(a => ({
          id: a.id,
          type: a.type,
          severity: a.severity,
          description: a.description,
          status: a.status,
          createdAt: a.createdAt,
        })),
      }
    });
  } catch (error) {
    console.error('Error fetching security settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch security settings' }, { status: 500 });
  }
}

/**
 * POST /api/consumer/security
 * Update security settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userId, ...data } = body;
    const targetUserId = userId || DEMO_USER_ID;

    switch (action) {
      case 'update_limits': {
        const { dailyLimit, monthlyLimit } = data;
        
        await db.consumerWallet.update({
          where: { userId: targetUserId },
          data: {
            dailySpendLimit: dailyLimit ? BigInt(Math.round(dailyLimit * 100)) : null,
            monthlySpendLimit: monthlyLimit ? BigInt(Math.round(monthlyLimit * 100)) : null,
            updatedAt: new Date(),
          }
        });

        return NextResponse.json({ success: true, message: 'Limits updated successfully' });
      }

      case 'toggle_card_feature': {
        const { cardId, feature, enabled } = data;
        
        const validFeatures = ['onlineEnabled', 'contactlessEnabled', 'atmEnabled', 'internationalEnabled'];
        if (!validFeatures.includes(feature)) {
          return NextResponse.json({ success: false, error: 'Invalid feature' }, { status: 400 });
        }

        await db.consumerCard.update({
          where: { id: cardId },
          data: { [feature]: enabled, updatedAt: new Date() }
        });

        return NextResponse.json({ success: true, message: 'Card feature updated' });
      }

      case 'revoke_session': {
        const { sessionId } = data;
        
        await db.consumerSession.update({
          where: { id: sessionId },
          data: {
            status: 'revoked',
            revokedAt: new Date(),
            revokeReason: 'User revoked',
            updatedAt: new Date()
          }
        });

        return NextResponse.json({ success: true, message: 'Session revoked' });
      }

      case 'revoke_all_sessions': {
        await db.consumerSession.updateMany({
          where: { userId: targetUserId, status: 'active' },
          data: {
            status: 'revoked',
            revokedAt: new Date(),
            revokeReason: 'User revoked all sessions'
          }
        });

        return NextResponse.json({ success: true, message: 'All sessions revoked' });
      }

      case 'lock_account': {
        const { reason, durationMinutes } = data;
        const lockedUntil = durationMinutes 
          ? new Date(Date.now() + durationMinutes * 60 * 1000)
          : null;

        await db.consumerUser.update({
          where: { id: targetUserId },
          data: {
            accountStatus: 'locked',
            freezeReason: reason || 'User initiated lock',
            frozenAt: new Date(),
            lockedUntil,
            updatedAt: new Date()
          }
        });

        // Also update risk profile
        await db.riskProfile.updateMany({
          where: { entityType: 'consumer', entityId: targetUserId },
          data: { status: 'blocked', blockedAt: new Date(), blockedReason: reason }
        });

        return NextResponse.json({ success: true, message: 'Account locked' });
      }

      case 'unlock_account': {
        await db.consumerUser.update({
          where: { id: targetUserId },
          data: {
            accountStatus: 'active',
            freezeReason: null,
            frozenAt: null,
            lockedUntil: null,
            failedPinAttempts: 0,
            updatedAt: new Date()
          }
        });

        await db.riskProfile.updateMany({
          where: { entityType: 'consumer', entityId: targetUserId },
          data: { status: 'active', blockedAt: null, blockedReason: null }
        });

        return NextResponse.json({ success: true, message: 'Account unlocked' });
      }

      case 'report_suspicious_activity': {
        const { description, transactionId } = data;
        
        // Create a fraud alert
        await db.fraudAlert.create({
          data: {
            id: `fa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: 'behavior',
            severity: 'high',
            description: `User reported: ${description}`,
            userId: targetUserId,
            transactionId,
            source: 'manual',
            sourceApp: 'consumer_wallet',
          }
        });

        return NextResponse.json({ success: true, message: 'Suspicious activity reported' });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating security settings:', error);
    return NextResponse.json({ success: false, error: 'Failed to update security settings' }, { status: 500 });
  }
}
