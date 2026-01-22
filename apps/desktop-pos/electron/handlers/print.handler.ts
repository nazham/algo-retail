import { ipcMain } from 'electron';
import { PrintReceiptDto } from '@algo/types';
import { NativePrinterService } from '../services/native-printer.service';
import { generateReceipt } from '../templates/receipt.template';
import type { ReceiptTemplateData } from '../services/printer.types';
import { getShopConfig } from '../config';

export const registerPrintHandlers = () => {
  ipcMain.handle('print-receipt', async (_, data: PrintReceiptDto) => {
    const { order, items, customerName, cashierName, paymentDetails } = data;

    const shopConfig = getShopConfig();

    const templateData: ReceiptTemplateData = {
      shop: shopConfig,
      receiptData: {
        orderNumber: order.orderNumber,
        grandTotal: order.grandTotal,
        subtotal: order.subtotal,
        discount: order.discountTotal,
        paymentMethod: order.paymentMethod,
      },
      items: items,
      customerName: customerName || 'Walk-in',
      cashierName: cashierName || 'Admin',
      paymentDetails: paymentDetails,
    };

    return await NativePrinterService.print(generateReceipt, templateData);
  });
};
