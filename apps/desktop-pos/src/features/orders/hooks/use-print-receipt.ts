import type { PrintReceiptDto } from '@algo/types';

export function usePrintReceipt() {
  const printReceipt = async (data: PrintReceiptDto) => {
    try {
      const result = await window.api.invoke('print-receipt', data);
      if (!result.success) {
        console.error('Printing failed:', result.error);
      }
      return result;
    } catch (error) {
      console.error('Print error:', error);
      return { success: false, error: String(error) };
    }
  };

  return { printReceipt };
}
