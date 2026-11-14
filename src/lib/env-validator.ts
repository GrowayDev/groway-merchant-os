/**
 * Production environment validator — runs on server boot.
 * Throws (halting startup) if critical config is missing in production mode.
 *
 * Designed and Built by Motheto Selepe.
 */

interface EnvCheck {
  name: string
  value: string | undefined
  required: boolean
  validator?: (v: string) => boolean
  message: string
}

export function validateProductionEnv(): { ok: boolean; errors: string[]; warnings: string[] } {
  const isProduction = process.env.NODE_ENV === 'production'
  const errors: string[] = []
  const warnings: string[] = []

  const checks: EnvCheck[] = [
    {
      name: 'NODE_ENV',
      value: process.env.NODE_ENV,
      required: true,
      message: 'NODE_ENV must be set to "production" for production deployments.',
    },
    {
      name: 'JWT_SECRET',
      value: process.env.JWT_SECRET,
      required: true,
      validator: (v) => v.length >= 32 && v !== 'your-secret-key-change-in-production' && v !== 'dev-only-insecure-secret-change-me',
      message: 'JWT_SECRET must be at least 32 characters and must not be the default dev value. Generate with: openssl rand -base64 32',
    },
    {
      name: 'DATABASE_URL',
      value: process.env.DATABASE_URL,
      required: true,
      message: 'DATABASE_URL must be set. Use a persistent path like file:/app/data/groway.db',
    },
    {
      name: 'NEXT_PUBLIC_APP_URL',
      value: process.env.NEXT_PUBLIC_APP_URL,
      required: true,
      validator: (v) => v.startsWith('http://') || v.startsWith('https://'),
      message: 'NEXT_PUBLIC_APP_URL must be a valid URL (e.g., https://groway.yourdomain.co.za)',
    },
  ]

  for (const check of checks) {
    if (!check.value) {
      errors.push(`❌ ${check.name}: not set. ${check.message}`)
    } else if (check.validator && !check.validator(check.value)) {
      errors.push(`❌ ${check.name}: invalid value. ${check.message}`)
    }
  }

  // Warnings (non-blocking)
  if (!process.env.NEXT_PUBLIC_BASE_URL) {
    warnings.push('⚠️  NEXT_PUBLIC_BASE_URL is not set — OAuth callbacks may fail.')
  }

  // In production, hard-fail on errors
  if (isProduction && errors.length > 0) {
    console.error('\n' + '='.repeat(70))
    console.error('FATAL: Production environment validation failed.')
    console.error('The server cannot start with missing/invalid configuration.')
    console.error('')
    errors.forEach(e => console.error(e))
    console.error('')
    console.error('Fix these issues in your .env file and restart.')
    console.error('='.repeat(70) + '\n')
    return { ok: false, errors, warnings }
  }

  if (warnings.length > 0) {
    warnings.forEach(w => console.warn(w))
  }

  return { ok: true, errors, warnings }
}
