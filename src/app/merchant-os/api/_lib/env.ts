/**
 * Environment Variable Validation
 * Validates required environment variables on startup
 */

/**
 * Environment variable configuration
 */
interface EnvConfig {
  name: string
  required: boolean
  description: string
  defaultValue?: string
  validator?: (value: string) => boolean
  errorMessage?: string
}

/**
 * Required environment variables for the Merchant OS application
 */
const ENV_CONFIG: EnvConfig[] = [
  {
    name: 'JWT_SECRET',
    required: true,
    description: 'Secret key for JWT token signing and verification',
    validator: (value) => value.length >= 32,
    errorMessage: 'JWT_SECRET must be at least 32 characters long for security'
  },
  {
    name: 'DATABASE_URL',
    required: true,
    description: 'Database connection URL'
  }
]

/**
 * Validated environment variables type
 */
export interface ValidatedEnv {
  JWT_SECRET: string
  DATABASE_URL: string
  [key: string]: string | undefined
}

/**
 * Validation result
 */
interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  env: Partial<ValidatedEnv>
}

/**
 * Validates a single environment variable
 */
function validateEnvVar(config: EnvConfig): { value?: string; error?: string; warning?: string } {
  const value = process.env[config.name]
  
  // Check if required variable is missing
  if (config.required && !value) {
    return {
      error: `Missing required environment variable: ${config.name} - ${config.description}`
    }
  }
  
  // If not required and not set, use default if available
  if (!value && config.defaultValue) {
    return {
      value: config.defaultValue,
      warning: `Using default value for ${config.name}. ${config.description}`
    }
  }
  
  // If value exists, run custom validator
  if (value && config.validator && !config.validator(value)) {
    return {
      error: config.errorMessage || `Invalid value for ${config.name}`
    }
  }
  
  return { value }
}

/**
 * Validate all environment variables
 * @returns Validation result with errors, warnings, and validated env object
 */
export function validateEnv(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const env: Partial<ValidatedEnv> = {}
  
  for (const config of ENV_CONFIG) {
    const result = validateEnvVar(config)
    
    if (result.error) {
      errors.push(result.error)
    }
    
    if (result.warning) {
      warnings.push(result.warning)
    }
    
    if (result.value) {
      env[config.name as keyof ValidatedEnv] = result.value
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    env
  }
}

/**
 * Get a validated environment variable
 * Throws an error if the variable is required and not set
 * @param name - Environment variable name
 * @param required - Whether the variable is required
 * @returns The environment variable value
 */
export function getEnv(name: keyof ValidatedEnv, required: boolean = true): string {
  const value = process.env[name]
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  
  return value ?? ''
}

/**
 * Get JWT secret with validation
 * @returns JWT secret string
 * @throws Error if JWT_SECRET is not set
 */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  
  if (secret.length < 32) {
    console.warn('Warning: JWT_SECRET should be at least 32 characters long for better security')
  }
  
  return secret
}

/**
 * Get database URL with validation
 * @returns Database URL string
 * @throws Error if DATABASE_URL is not set
 */
export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL
  
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required')
  }
  
  return url
}

// Run validation on module load in non-test environments
const isTestEnv = process.env.NODE_ENV === 'test'
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'

if (!isTestEnv && !isBuildTime) {
  const result = validateEnv()
  
  if (result.warnings.length > 0) {
    console.warn('Environment warnings:')
    result.warnings.forEach(w => console.warn(`  - ${w}`))
  }
  
  if (result.errors.length > 0) {
    console.error('Environment validation failed:')
    result.errors.forEach(e => console.error(`  - ${e}`))
    
    // In development, allow the app to start but log errors
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed. See errors above.')
    }
  }
}

/**
 * Export validated environment object for convenience
 */
export const env = {
  get JWT_SECRET() {
    return getJwtSecret()
  },
  get DATABASE_URL() {
    return getDatabaseUrl()
  },
  get NODE_ENV() {
    return process.env.NODE_ENV || 'development'
  }
} as const
