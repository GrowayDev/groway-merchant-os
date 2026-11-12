/**
 * OAuth Configuration for Google and Apple Sign In
 * 
 * To enable OAuth:
 * 1. Google: Create OAuth 2.0 credentials at https://console.cloud.google.com
 * 2. Apple: Configure Sign in with Apple at https://developer.apple.com
 * 
 * Add these environment variables:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - APPLE_CLIENT_ID (Services ID)
 * - APPLE_TEAM_ID
 * - APPLE_KEY_ID (for private key)
 * - APPLE_PRIVATE_KEY (the .p8 key content)
 */

export const oauthConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    scopes: ['openid', 'email', 'profile'],
    // Callback URL: {BASE_URL}/api/auth/oauth/google/callback
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID || '', // Services ID (e.g., com.groway.web)
    teamId: process.env.APPLE_TEAM_ID || '',
    keyId: process.env.APPLE_KEY_ID || '',
    privateKey: process.env.APPLE_PRIVATE_KEY || '',
    authorizeUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    // Callback URL: {BASE_URL}/api/auth/oauth/apple/callback
  },
}

// Generate a random state for CSRF protection
export function generateOAuthState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

// Store state temporarily (in production, use Redis or similar)
const stateStore = new Map<string, { provider: string; redirectUrl: string; timestamp: number }>()

export function storeOAuthState(state: string, data: { provider: string; redirectUrl: string }) {
  stateStore.set(state, { ...data, timestamp: Date.now() })
  // Clean up old states (older than 10 minutes)
  const now = Date.now()
  for (const [key, value] of stateStore.entries()) {
    if (now - value.timestamp > 10 * 60 * 1000) {
      stateStore.delete(key)
    }
  }
}

export function getOAuthState(state: string): { provider: string; redirectUrl: string } | null {
  const data = stateStore.get(state)
  if (!data) return null
  // Delete after use (one-time use)
  stateStore.delete(state)
  return { provider: data.provider, redirectUrl: data.redirectUrl }
}

// Check if OAuth is configured
export function isGoogleOAuthConfigured(): boolean {
  return !!(oauthConfig.google.clientId && oauthConfig.google.clientSecret)
}

export function isAppleOAuthConfigured(): boolean {
  return !!(oauthConfig.apple.clientId && oauthConfig.apple.teamId && oauthConfig.apple.privateKey)
}

// Get base URL for callbacks
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  // Fallback for development
  return 'http://localhost:3000'
}
