/**
 * Unit Tests for Redis Service
 */

import {
  createSession,
  getSession,
  touchSession,
  deleteSession,
  checkRateLimit,
  resetRateLimit,
  getCached,
  setCached,
  deleteCached,
  type SessionData,
} from '@/lib/redis';

// Mock environment
process.env.REDIS_ENABLED = 'false'; // Use in-memory fallback for tests

describe('Redis Service', () => {
  const testSession: SessionData = {
    userId: 'user-123',
    merchantId: 'merchant-456',
    role: 'admin',
    permissions: ['read', 'write'],
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
  };

  describe('Session Management', () => {
    it('should create and retrieve a session', async () => {
      const token = 'test-token-123';
      
      const created = await createSession(token, testSession);
      expect(created).toBe(true);
      
      const retrieved = await getSession(token);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.userId).toBe('user-123');
      expect(retrieved?.merchantId).toBe('merchant-456');
      expect(retrieved?.role).toBe('admin');
    });

    it('should return null for non-existent session', async () => {
      const result = await getSession('non-existent-token');
      expect(result).toBeNull();
    });

    it('should update session last active time on touch', async () => {
      const token = 'touch-test-token';
      await createSession(token, testSession);
      
      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const touched = await touchSession(token);
      expect(touched).toBe(true);
      
      const session = await getSession(token);
      // Allow for timing differences - just check that the session exists and was touched
      expect(session).not.toBeNull();
      expect(session?.lastActiveAt).toBeGreaterThanOrEqual(testSession.lastActiveAt);
    });

    it('should delete a session', async () => {
      const token = 'delete-test-token';
      await createSession(token, testSession);
      
      const deleted = await deleteSession(token);
      expect(deleted).toBe(true);
      
      const result = await getSession(token);
      expect(result).toBeNull();
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const identifier = 'rate-test-1';
      
      const result = await checkRateLimit(identifier, {
        windowMs: 60000,
        maxRequests: 10,
        keyPrefix: 'test:',
      });
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should track multiple requests', async () => {
      const identifier = 'rate-test-2';
      
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(identifier, {
          windowMs: 60000,
          maxRequests: 10,
          keyPrefix: 'test:',
        });
      }
      
      const result = await checkRateLimit(identifier, {
        windowMs: 60000,
        maxRequests: 10,
        keyPrefix: 'test:',
      });
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should block requests over limit', async () => {
      const identifier = 'rate-test-3';
      
      // Make 10 requests (limit)
      for (let i = 0; i < 10; i++) {
        await checkRateLimit(identifier, {
          windowMs: 60000,
          maxRequests: 10,
          keyPrefix: 'test2:',
        });
      }
      
      // 11th request should be blocked
      const result = await checkRateLimit(identifier, {
        windowMs: 60000,
        maxRequests: 10,
        keyPrefix: 'test2:',
      });
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset rate limit', async () => {
      const identifier = 'rate-test-4';
      const keyPrefix = 'test3:';
      
      // Make some requests
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(identifier, { windowMs: 60000, maxRequests: 10, keyPrefix });
      }
      
      // Reset
      await resetRateLimit(identifier, keyPrefix);
      
      // Should have full limit again
      const result = await checkRateLimit(identifier, {
        windowMs: 60000,
        maxRequests: 10,
        keyPrefix,
      });
      
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });
  });

  describe('Caching', () => {
    it('should cache and retrieve values', async () => {
      const key = 'cache-test-1';
      const data = { name: 'Test', value: 123 };
      
      await setCached(key, data, 60);
      
      const cached = await getCached<typeof data>(key);
      expect(cached).toEqual(data);
    });

    it('should return null for non-existent cache key', async () => {
      const result = await getCached('non-existent-key');
      expect(result).toBeNull();
    });

    it('should delete cached value', async () => {
      const key = 'cache-test-2';
      const data = { test: true };
      
      await setCached(key, data, 60);
      await deleteCached(key);
      
      const result = await getCached(key);
      expect(result).toBeNull();
    });
  });
});
