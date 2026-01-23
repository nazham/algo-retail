/**
 * Format currency (cents to rupees with comma separators)
 */
export function formatCurrency(cents: number): string {
  const rupees = (cents / 100).toFixed(2);
  // Add comma separators for thousands
  return rupees.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
