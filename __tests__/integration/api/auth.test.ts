/**
 * Integration Tests for Authentication API
 */

import { NextRequest } from 'next/server';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import * as dbModule from '@/lib/db';

// Mock the database
jest.mock('@/lib/db', () => ({
  db: {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    merchantSession: {
      create: jest.fn(),
      delete: jest.fn(),
    },
    merchant: {
      findFirst: jest.fn(),
    },
    branch: {
      findFirst: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should return 400 for missing credentials', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 401 for invalid credentials', async () => {
      const { db } = dbModule as { db: { user: { findFirst: jest.Mock } } };
      db.user.findFirst.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      });

      const response = await loginHandler(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });
});
