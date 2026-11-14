/**
 * Consumer route auth for /api/consumer/v2/* endpoints.
 * Verifies the consumer JWT (jose, unified secret) from the Authorization
 * header, or trusts the proxy-injected x-user-id header set after proxy
 * verification. Returns the consumer userId or a 401 NextResponse.
 */
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { db } from '@/lib/db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-secret-key-change-in-production'
);

export interface ConsumerAuth {
  userId: string;
  phone?: string;
  kycLevel?: number;
}

export async function getConsumerAuth(request: NextRequest): Promise<ConsumerAuth | NextResponse> {
  // 1) Bearer JWT
  const header = request.headers.get('authorization');
  if (header?.startsWith('Bearer ')) {
    try {
      const token = header.slice(7);
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.userId) {
        return { userId: payload.userId as string, phone: payload.phone as string | undefined, kycLevel: payload.kycLevel as number | undefined };
      }
    } catch { /* fall through */ }
  }

  // 2) Proxy-injected headers (proxy already verified the token)
  const proxyUserId = request.headers.get('x-user-id');
  if (proxyUserId) return { userId: proxyUserId };

  return NextResponse.json(
    { success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' },
    { status: 401 }
  );
}

export function isAuthError(r: ConsumerAuth | NextResponse): r is NextResponse {
  return r instanceof NextResponse;
}

export async function getConsumerUser(userId: string) {
  return db.consumerUser.findUnique({
    where: { id: userId },
    include: { ConsumerWallet: true, ConsumerLoyalty: true, ConsumerSASSA: true, ConsumerCreditScore: true, ConsumerEWA: true, ConsumerBNPL: true },
  });
}

export function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export function serverError(message = 'Something went wrong') {
  return NextResponse.json({ success: false, error: message }, { status: 500 });
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}
