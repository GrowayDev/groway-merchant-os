/**
 * Redis Service for Session Management and Rate Limiting
 * Provides centralized caching and rate limiting for the Merchant OS
 */

import Redis from 'ioredis';

// Redis configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_ENABLED = process.env.REDIS_ENABLED === 'true';

// Singleton Redis client
let redisClient: Redis | null = null;

/**
 * Get or create Redis client instance
 */
export function getRedisClient(): Redis | null {
  if (!REDIS_ENABLED) {
    console.log('[Redis] Redis is disabled, using in-memory fallback');
    return null;
  }

  if (!redisClient) {
    try {
      redisClient = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
        connectTimeout: 5000,
        commandTimeout: 5000,
      });

      redisClient.on('connect', () => {
        console.log('[Redis] Connected to Redis server');
      });

      redisClient.on('error', (err) => {
        console.error('[Redis] Connection error:', err.message);
      });

      redisClient.on('close', () => {
        console.log('[Redis] Connection closed');
      });
    } catch (error) {
      console.error('[Redis] Failed to create client:', error);
      return null;
    }
  }

  return redisClient;
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// ============================================
// Session Management
// ============================================

export interface SessionData {
  userId: string;
  merchantId: string;
  branchId?: string;
  role: string;
  permissions: string[];
  deviceType?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: number;
  lastActiveAt: number;
}

const SESSION_PREFIX = 'session:';
const SESSION_TTL = 86400; // 24 hours in seconds

/**
 * Create a new session
 */
export async function createSession(
  token: string,
  data: SessionData
): Promise<boolean> {
  const redis = getRedisClient();
  
  if (redis) {
    try {
      await redis.setex(
        `${SESSION_PREFIX}${token}`,
        SESSION_TTL,
        JSON.stringify(data)
      );
      return true;
    } catch (error) {
      console.error('[Redis] Failed to create session:', error);
      return false;
    }
  }
  
  // Fallback to in-memory
  memoryStore.set(`${SESSION_PREFIX}${token}`, {
    data,
    expiresAt: Date.now() + SESSION_TTL * 1000,
  });
  return true;
}

/**
 * Get session data
 */
export async function getSession(token: string): Promise<SessionData | null> {
  const redis = getRedisClient();
  
  if (redis) {
    try {
      const data = await redis.get(`${SESSION_PREFIX}${token}`);
      if (data) {
        return JSON.parse(data) as SessionData;
      }
      return null;
    } catch (error) {
      console.error('[Redis] Failed to get session:', error);
      return null;
    }
  }
  
  // Fallback to in-memory
  const stored = memoryStore.get(`${SESSION_PREFIX}${token}`);
  if (stored && stored.expiresAt > Date.now()) {
    return stored.data;
  }
  memoryStore.delete(`${SESSION_PREFIX}${token}`);
  return null;
}

/**
 * Update session last active time
 */
export async function touchSession(token: string): Promise<boolean> {
  const redis = getRedisClient();
  
  if (redis) {
    try {
      const data = await redis.get(`${SESSION_PREFIX}${token}`);
      if (data) {
        const session = JSON.parse(data) as SessionData;
        session.lastActiveAt = Date.now();
        await redis.setex(
          `${SESSION_PREFIX}${token}`,
          SESSION_TTL,
          JSON.stringify(session)
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('[Redis] Failed to touch session:', error);
      return false;
    }
  }
  
  // Fallback to in-memory
  const stored = memoryStore.get(`${SESSION_PREFIX}${token}`);
  if (stored && stored.expiresAt > Date.now()) {
    stored.data.lastActiveAt = Date.now();
    stored.expiresAt = Date.now() + SESSION_TTL * 1000;
    return true;
  }
  return false;
}

/**
 * Delete session
 */
export async function deleteSession(token: string): Promise<boolean> {
  const redis = getRedisClient();
  
  if (redis) {
    try {
      await redis.del(`${SESSION_PREFIX}${token}`);
      return true;
    } catch (error) {
      console.error('[Redis] Failed to delete session:', error);
      return false;
    }
  }
  
  memoryStore.delete(`${SESSION_PREFIX}${token}`);
  return true;
}

// ============================================
// Rate Limiting
// ============================================

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix: string; // Key prefix for the rate limit
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  keyPrefix: 'ratelimit:',
};

/**
 * Check and increment rate limit
 * Returns remaining requests or -1 if limit exceeded
 */
export async function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const { windowMs, maxRequests, keyPrefix } = { ...DEFAULT_RATE_LIMIT, ...config };
  const key = `${keyPrefix}${identifier}`;
  const redis = getRedisClient();
  const now = Date.now();
  const resetAt = now + windowMs;
  
  if (redis) {
    try {
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.pexpire(key, windowMs);
      }
      
      const ttl = await redis.pttl(key);
      const actualResetAt = now + ttl;
      
      return {
        allowed: current <= maxRequests,
        remaining: Math.max(0, maxRequests - current),
        resetAt: actualResetAt,
      };
    } catch (error) {
      console.error('[Redis] Rate limit error:', error);
      // Allow on error
      return { allowed: true, remaining: maxRequests, resetAt };
    }
  }
  
  // Fallback to in-memory rate limiting
  const stored = rateLimitStore.get(key);
  
  if (!stored || stored.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }
  
  stored.count++;
  return {
    allowed: stored.count <= maxRequests,
    remaining: Math.max(0, maxRequests - stored.count),
    resetAt: stored.resetAt,
  };
}

/**
 * Reset rate limit for an identifier
 */
export async function resetRateLimit(
  identifier: string,
  keyPrefix: string = 'ratelimit:'
): Promise<void> {
  const redis = getRedisClient();
  const key = `${keyPrefix}${identifier}`;
  
  if (redis) {
    await redis.del(key);
  } else {
    rateLimitStore.delete(key);
  }
}

// ============================================
// Caching Utilities
// ============================================

/**
 * Get cached value
 */
export async function getCached<T>(key: string): Promise<T | null> {
  const redis = getRedisClient();
  
  if (redis) {
    try {
      const data = await redis.get(`cache:${key}`);
      if (data) {
        return JSON.parse(data) as T;
      }
    } catch (error) {
      console.error('[Redis] Cache get error:', error);
    }
    return null;
  }
  
  const cached = cacheStore.get(`cache:${key}`);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }
  cacheStore.delete(`cache:${key}`);
  return null;
}

/**
 * Set cached value
 */
export async function setCached<T>(
  key: string,
  data: T,
  ttlSeconds: number = 3600
): Promise<void> {
  const redis = getRedisClient();
  
  if (redis) {
    try {
      await redis.setex(`cache:${key}`, ttlSeconds, JSON.stringify(data));
    } catch (error) {
      console.error('[Redis] Cache set error:', error);
    }
    return;
  }
  
  cacheStore.set(`cache:${key}`, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Delete cached value
 */
export async function deleteCached(key: string): Promise<void> {
  const redis = getRedisClient();
  
  if (redis) {
    await redis.del(`cache:${key}`);
  } else {
    cacheStore.delete(`cache:${key}`);
  }
}

/**
 * Clear all cache
 */
export async function clearCache(): Promise<void> {
  const redis = getRedisClient();
  
  if (redis) {
    const keys = await redis.keys('cache:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } else {
    cacheStore.clear();
  }
}

// ============================================
// In-Memory Fallback Stores
// ============================================

interface StoredData<T> {
  data: T;
  expiresAt: number;
}

const memoryStore = new Map<string, StoredData<SessionData>>();
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const cacheStore = new Map<string, StoredData<unknown>>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  
  for (const [key, value] of memoryStore.entries()) {
    if (value.expiresAt < now) {
      memoryStore.delete(key);
    }
  }
  
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
  
  for (const [key, value] of cacheStore.entries()) {
    if (value.expiresAt < now) {
      cacheStore.delete(key);
    }
  }
}, 5 * 60 * 1000);
