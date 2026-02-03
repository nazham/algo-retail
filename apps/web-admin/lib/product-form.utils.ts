import { addDays, addMonths, addYears, format } from 'date-fns';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Expiry period options for the product form.
 * Used to calculate expiry date from manufacturing date.
 */
export const EXPIRY_PERIODS = [
  { label: '3 Days', value: '3days', days: 3 },
  { label: '1 Week', value: '1week', days: 7 },
  { label: '3 Months', value: '3months', months: 3 },
  { label: '6 Months', value: '6months', months: 6 },
  { label: '1 Year', value: '1year', years: 1 },
  { label: '2 Years', value: '2years', years: 2 },
  { label: 'Custom', value: 'custom' },
] as const;

export type ExpiryPeriodValue = (typeof EXPIRY_PERIODS)[number]['value'];

/**
 * Unit of Measure options for products.
 */
export const UOM_OPTIONS = [
  { label: 'Piece (pc)', value: 'pc' },
  { label: 'Kilogram (kg)', value: 'kg' },
  { label: 'Gram (g)', value: 'g' },
  { label: 'Liter (l)', value: 'l' },
  { label: 'Milliliter (ml)', value: 'ml' },
  { label: 'Box', value: 'box' },
] as const;

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Formats a Date or date string to YYYY-MM-DD format for HTML date inputs.
 * Returns empty string for falsy values.
 */
export function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return '';

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return format(dateObj, 'yyyy-MM-dd');
  } catch {
    return '';
  }
}

/**
 * Calculates expiry date based on manufacturing date and selected period.
 * Returns null if calculation not possible.
 */
export function calculateExpiryDate(
  mfgDate: string | Date,
  periodValue: ExpiryPeriodValue,
): Date | null {
  if (!mfgDate || periodValue === 'custom') return null;

  const mfgDateObj = mfgDate instanceof Date ? mfgDate : new Date(mfgDate);
  const periodConfig = EXPIRY_PERIODS.find((p) => p.value === periodValue);

  if (!periodConfig) return null;

  if ('days' in periodConfig && periodConfig.days) {
    return addDays(mfgDateObj, periodConfig.days);
  }
  if ('months' in periodConfig && periodConfig.months) {
    return addMonths(mfgDateObj, periodConfig.months);
  }
  if ('years' in periodConfig && periodConfig.years) {
    return addYears(mfgDateObj, periodConfig.years);
  }

  return null;
}

/**
 * Extracts error message from API error response.
 * Handles both single string and array of messages.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DEBUG] getApiErrorMessage input:', error);
  }

  if (error instanceof Error) {
    return error.message;
  }

  // Handle Axios/older error formats
  const err = error as { response?: { data?: { message?: string | string[] } } };
  const message = err?.response?.data?.message;

  if (Array.isArray(message)) return message.join(', ');
  if (typeof message === 'string') return message;

  // Final check for standard property names
  const objError = error as any;
  if (objError?.message) return objError.message;

  return fallback;
}
