/**
 * Format an amount in cents as a localized decimal string without currency symbols.
 * Example: 10000 -> "100.00", 125050 -> "1,250.50"
 *
 * Useful for tables, line items, and print receipt columns where the currency symbol
 * is omitted to save horizontal space and align numbers cleanly.
 *
 * @param amountInCents - The monetary amount in smallest unit (cents/paisa).
 * @returns Formatted numeric string with 2 decimal places and thousands separators.
 */
export const formatAmount = (amountInCents: number): string => {
  return (amountInCents / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Format an amount in cents with the local currency prefix ('Rs. ').
 * Example: 10000 -> "Rs. 100.00", 125050 -> "Rs. 1,250.50"
 *
 * Used for totals, summary rows, dialogs, and user-facing money values.
 *
 * @param amountInCents - The monetary amount in smallest unit (cents/paisa).
 * @returns Formatted currency string with 'Rs. ' prefix and 2 decimal places.
 */
export const formatCurrency = (amountInCents: number): string => {
  return 'Rs. ' + formatAmount(amountInCents);
};
