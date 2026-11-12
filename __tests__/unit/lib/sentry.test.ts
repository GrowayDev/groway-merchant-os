/**
 * Unit Tests for Sentry Error Monitoring
 */

import { APIError, handleAPIError } from '@/lib/sentry';

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  init: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
  setExtra: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  startTransaction: jest.fn(() => ({
    finish: jest.fn(),
  })),
}));

describe('Sentry Error Monitoring', () => {
  describe('APIError', () => {
    it('should create an API error with correct properties', () => {
      const error = new APIError('Test error', 400, 'TEST_ERROR', { field: 'value' });
      
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.details).toEqual({ field: 'value' });
    });

    it('should create a bad request error', () => {
      const error = APIError.badRequest('Invalid input', { field: 'email' });
      
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should create an unauthorized error', () => {
      const error = APIError.unauthorized();
      
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
      expect(error.message).toBe('Unauthorized');
    });

    it('should create a forbidden error', () => {
      const error = APIError.forbidden();
      
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('should create a not found error', () => {
      const error = APIError.notFound('User not found');
      
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('User not found');
    });

    it('should create a conflict error', () => {
      const error = APIError.conflict('Email already exists');
      
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });

    it('should create a rate limit error', () => {
      const error = APIError.tooManyRequests();
      
      expect(error.statusCode).toBe(429);
      expect(error.code).toBe('RATE_LIMITED');
    });

    it('should create an internal error', () => {
      const error = APIError.internal('Database connection failed');
      
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('handleAPIError', () => {
    it('should handle APIError correctly', () => {
      const error = new APIError('Not found', 404, 'NOT_FOUND');
      const result = handleAPIError(error);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Not found');
      expect(result.code).toBe('NOT_FOUND');
      expect(result.statusCode).toBe(404);
    });

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong');
      const result = handleAPIError(error);
      
      expect(result.success).toBe(false);
      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.statusCode).toBe(500);
    });

    it('should handle unknown errors', () => {
      const result = handleAPIError('string error');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('An unexpected error occurred');
      expect(result.statusCode).toBe(500);
    });

    it('should hide error details in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const error = new Error('Internal database error with sensitive info');
      const result = handleAPIError(error);
      
      expect(result.error).toBe('An unexpected error occurred');
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});
