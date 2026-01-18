export function usePrintReceipt() {
  const printReceipt = async (
    order: any,
    items: any[],
    customerName?: string,
    cashierName?: string,
  ) => {
    try {
      const result = await window.api.invoke('print-receipt', {
        order,
        items,
        customerName,
        cashierName,
      });
      return result;
    } catch (error) {
      console.error('Print error:', error);
      return { success: false, error: String(error) };
    }
  };

  return { printReceipt };
}
