import { ipcMain } from 'electron';
import { NativePrinterService } from '../services/native-printer.service';
import { generateReceipt } from '../templates/receipt.template';
import type { ReceiptTemplateData, PrintReceiptRequest } from '../services/printer.types';
import type { ShopConfig } from '@algo/types';
import { getShopConfig } from '../config';

export const registerPrintHandlers = () => {
  // Print receipt handler
  ipcMain.handle('print-receipt', async (_, data: PrintReceiptRequest) => {
    const {
      order,
      items,
      customerName,
      cashierName,
      paymentDetails,
      shopConfig: providedShopConfig,
      printOptions,
    } = data;

    // Use provided shop config or fall back to defaults
    const shopConfig = providedShopConfig || getShopConfig();

    // Calculate totals based on items to ensure consistency
    const calculatedSubTotal = items.reduce(
      (sum, item) => sum + item.quantity * (item.unitPrice || 0),
      0,
    );
    const calculatedTotalDiscount = items.reduce(
      (sum, item) => sum + item.quantity * (item.discountAmount || 0),
      0,
    );
    const calculatedGrandTotal = calculatedSubTotal - calculatedTotalDiscount;

    const templateData: ReceiptTemplateData = {
      shop: shopConfig,
      receiptData: {
        orderNumber: order.orderNumber,
        grandTotal: calculatedGrandTotal,
        subtotal: calculatedSubTotal,
        discount: calculatedTotalDiscount,
        paymentMethod: order.paymentMethod,
      },
      items: items as any,
      customerName: customerName || 'Walk-in',
      cashierName: cashierName || 'Admin',
      paymentDetails: paymentDetails,
    };

    return await NativePrinterService.print(generateReceipt, templateData, printOptions);
  });

  // Printer discovery handlers
  ipcMain.handle('printer:get-printers', async () => {
    return await NativePrinterService.getPrinters();
  });

  ipcMain.handle('printer:validate', async (_, printerName: string) => {
    return await NativePrinterService.validatePrinter(printerName);
  });

  ipcMain.handle('printer:get-default', async () => {
    return await NativePrinterService.getDefaultPrinter();
  });

  // Test print handler
  ipcMain.handle(
    'printer:test-print',
    async (_, payload?: { printerName?: string; shopConfig?: ShopConfig }) => {
      const printerName = payload?.printerName;
      const shopConfig = payload?.shopConfig || getShopConfig();

      const testData: ReceiptTemplateData = {
        shop: shopConfig,
        receiptData: {
          orderNumber: 'TEST-001',
          grandTotal: 100.0,
          subtotal: 100.0,
          discount: 0,
          paymentMethod: 'Cash',
        },
        items: [
          {
            productName: 'Test Item',
            quantity: 1,
            subtotal: 100.0,
          },
        ],
        customerName: 'Test Customer',
        cashierName: 'System',
        paymentDetails: undefined,
      };

      const options = printerName ? { deviceName: printerName } : undefined;
      return await NativePrinterService.print(generateReceipt, testData, options);
    },
  );
};
