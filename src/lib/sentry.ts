/**
 * Sentry Error Monitoring Configuration
 * Provides error tracking, performance monitoring, and release tracking
 * 
 * Note: This module is designed to work in both Node.js and Edge runtimes
 */

// Dynamic import for Sentry to handle edge/runtime differences
let Sentry: typeof import('@sentry/nextjs') | null = null;

// Initialize Sentry dynamically
async function getSentry() {
  if (!Sentry) {
    try {
      Sentry = await import('@sentry/nextjs');
    } catch {
      console.warn('[Sentry] Failed to load Sentry module');
      return null;
    }
  }
  return Sentry;
}

// Initialize Sentry
export async function initSentry() {
  const sentry = await getSentry();
  if (!sentry) return;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  
  if (!dsn) {
    console.log('[Sentry] DSN not configured, error monitoring disabled');
    return;
  }

  sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session replay (for debugging)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Filter out noisy errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'NetworkError',
      'Network request failed',
      'cancelled',
      'canceled',
      'Unauthorized',
      'Invalid token',
    ],
    
    // Filter transactions
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^moz-extension:\/\//i,
      /\/api\/health/i,
      /\/_next\/static/i,
    ],
    
    // Additional settings
    attachStacktrace: true,
    sendDefaultPii: false,
    
    // Before send hook to add context
    beforeSend(event) {
      if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEV_ENABLED) {
        return null;
      }
      
      if (event.request) {
        event.request.headers = undefined;
      }
      
      return event;
    },
  });

  console.log('[Sentry] Error monitoring initialized');
}

// ============================================
// Error Reporting Utilities
// ============================================

/**
 * Capture exception with context
 */
export async function captureException(
  error: Error | unknown,
  context?: {
    user?: { id: string; email?: string; role?: string };
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  }
) {
  const sentry = await getSentry();
  if (!sentry) return;

  if (context?.user) {
    sentry.setUser({
      id: context.user.id,
      email: context.user.email,
      username: context.user.role,
    });
  }

  if (context?.tags) {
    Object.entries(context.tags).forEach(([key, value]) => {
      sentry.setTag(key, value);
    });
  }

  if (context?.extra) {
    Object.entries(context.extra).forEach(([key, value]) => {
      sentry.setExtra(key, value);
    });
  }

  sentry.captureException(error, {
    level: context?.level || 'error',
  });
}

/**
 * Capture message
 */
export async function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
) {
  const sentry = await getSentry();
  if (!sentry) return;

  if (context?.tags) {
    Object.entries(context.tags).forEach(([key, value]) => {
      sentry.setTag(key, value);
    });
  }

  if (context?.extra) {
    Object.entries(context.extra).forEach(([key, value]) => {
      sentry.setExtra(key, value);
    });
  }

  sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export async function setUserContext(user: {
  id: string;
  email?: string;
  username?: string;
  role?: string;
  merchantId?: string;
}) {
  const sentry = await getSentry();
  if (!sentry) return;

  sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });

  if (user.merchantId) {
    sentry.setTag('merchant_id', user.merchantId);
  }

  if (user.role) {
    sentry.setTag('user_role', user.role);
  }
}

/**
 * Clear user context
 */
export async function clearUserContext() {
  const sentry = await getSentry();
  if (!sentry) return;
  
  sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export async function addBreadcrumb(
  message: string,
  category: string = 'custom',
  data?: Record<string, unknown>
) {
  const sentry = await getSentry();
  if (!sentry) return;

  sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
    timestamp: Date.now() / 1000,
  });
}

// ============================================
// API Error Handler
// ============================================

/**
 * API Error class with additional context
 */
export class APIError extends Error {
  public statusCode: number;
  public code: string;
  public details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: Record<string, unknown>) {
    return new APIError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new APIError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden') {
    return new APIError(message, 403, 'FORBIDDEN');
  }

  static notFound(message: string = 'Not found') {
    return new APIError(message, 404, 'NOT_FOUND');
  }

  static conflict(message: string, details?: Record<string, unknown>) {
    return new APIError(message, 409, 'CONFLICT', details);
  }

  static tooManyRequests(message: string = 'Too many requests') {
    return new APIError(message, 429, 'RATE_LIMITED');
  }

  static internal(message: string = 'Internal server error', details?: Record<string, unknown>) {
    return new APIError(message, 500, 'INTERNAL_ERROR', details);
  }
}

/**
 * Handle API errors consistently
 */
export async function handleAPIError(
  error: unknown,
  context?: { userId?: string; merchantId?: string; endpoint?: string }
): Promise<{ success: false; error: string; code: string; statusCode: number }> {
  // Log to Sentry
  await captureException(error, {
    tags: {
      endpoint: context?.endpoint || 'unknown',
    },
    extra: {
      userId: context?.userId,
      merchantId: context?.merchantId,
    },
  });

  if (error instanceof APIError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    };
  }

  return {
    success: false,
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  };
}

// Re-export for convenience (will be null if not initialized)
export { Sentry as SentryModule };
