/**
 * Currency Formatting Utilities for South African Rand (ZAR)
 * 
 * All merchant OS components should use these utilities instead of
 * hardcoded USD ($) symbols.
 */

/**
 * Format a number as South African Rand (ZAR)
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string (e.g., "R1 234,56")
 */
export function formatCurrency(
  amount: number,
  options?: {
    showCents?: boolean
    useThousandsSeparator?: boolean
  }
): string {
  const { showCents = true, useThousandsSeparator = true } = options || {}

  if (showCents) {
    // South African format: R1 234,56
    const formatted = amount.toLocaleString('en-ZA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: useThousandsSeparator
    })
    return `R${formatted}`
  } else {
    // No cents: R1 234
    const formatted = Math.round(amount).toLocaleString('en-ZA', {
      useGrouping: useThousandsSeparator
    })
    return `R${formatted}`
  }
}

/**
 * Format a number as currency with abbreviation for large amounts
 * @param amount - The amount to format
 * @returns Abbreviated currency string (e.g., "R1.2M", "R350K")
 */
export function formatCurrencyAbbreviated(amount: number): string {
  if (amount >= 1_000_000) {
    return `R${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `R${(amount / 1_000).toFixed(0)}K`
  }
  return formatCurrency(amount, { showCents: false })
}

/**
 * Parse a currency string back to a number
 * @param value - The currency string to parse
 * @returns The numeric value
 */
export function parseCurrency(value: string): number {
  // Remove R symbol, spaces, and commas, then parse
  const cleaned = value.replace(/[R\s,]/g, '')
  return parseFloat(cleaned) || 0
}

/**
 * Currency symbols and labels for South Africa
 */
export const CURRENCY = {
  symbol: 'R',
  code: 'ZAR',
  name: 'South African Rand',
  decimalSeparator: ',',
  thousandsSeparator: ' ',
  symbolPosition: 'prefix' as const
}

/**
 * Format amount for display in inputs
 * @param amount - The amount to format
 * @returns Formatted string without symbol (for input fields)
 */
export function formatAmountForInput(amount: number): string {
  return amount.toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

/**
 * Parse input value to number
 * @param value - The input string value
 * @returns The numeric value
 */
export function parseInputToNumber(value: string): number {
  // Handle South African number format (1 234,56)
  const cleaned = value.replace(/\s/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}
