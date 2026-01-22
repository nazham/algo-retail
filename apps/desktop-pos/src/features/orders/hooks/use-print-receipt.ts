import type { OrderDto, PrintReceiptDto } from '@algo/types';

/**
 * Hook for printing receipts
 * Abstracts the PrintReceiptDto construction from OrderDto
 */
export function usePrintReceipt() {
  /**
   * Converts OrderDto to PrintReceiptDto
   */
  const buildPrintData = (order: OrderDto): PrintReceiptDto => {
    return {
      order: {
        orderNumber: order.orderNumber,
        grandTotal: order.grandTotal,
        subtotal: order.subtotal,
        discountTotal: order.discountTotal,
        paymentMethod: order.paymentMethod,
      },
      items: order.items.map((item) => ({
        productName: item.productName,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.unitPrice * item.quantity,
      })),
      paymentDetails: {
        method: order.paymentMethod,
        tenderedAmount: order.grandTotal,
        changeDue: 0,
      },
    };
  };

  /**
   * Print receipt from OrderDto
   */
  const printFromOrder = async (order: OrderDto) => {
    const printData = buildPrintData(order);
    return await printReceipt(printData);
  };

  /**
   * Print receipt from PrintReceiptDto (for advanced use cases)
   */
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

  return { printFromOrder, printReceipt, buildPrintData };
}
