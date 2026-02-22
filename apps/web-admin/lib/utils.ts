/**
 * Format currency (cents to rupees with comma separators)
 * Mimics desktop-pos behavior: divides by 100.
 */
export const formatCurrency = (amountInCents: number) => {
  return (
    'Rs. ' +
    ((amountInCents || 0) / 100).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};
