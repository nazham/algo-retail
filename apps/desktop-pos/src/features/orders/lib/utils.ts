export const formatCurrency = (amount: number) => `Rs. ${(amount / 100).toFixed(2)}`;

export const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
