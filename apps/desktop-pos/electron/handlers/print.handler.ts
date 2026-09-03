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
    const shopConfig = providedShopConfig ?? getShopConfig();

    // Calculate totals from items for breakdown display rows
    const calculatedSubTotal = items.reduce(
      (sum, item) => sum + item.quantity * (item.unitPrice ?? 0),
      0,
    );
    const calculatedTotalDiscount = items.reduce(
      (sum, item) => sum + item.quantity * (item.discountAmount ?? 0),
      0,
    );
    // ⚠️ Trust order.grandTotal from the caller (backend-confirmed) as the single source of truth.
    // Do NOT re-derive the grand total here — any drift would cause the receipt to show a wrong total.

    const templateData: ReceiptTemplateData = {
      shop: shopConfig,
      receiptData: {
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        grandTotal: order.grandTotal,
        subtotal: calculatedSubTotal,
        taxTotal: order.taxTotal ?? 0,
        discount: calculatedTotalDiscount,
        paymentMethod: order.paymentMethod,
      },
      items: items,
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
      const shopConfig = payload?.shopConfig ?? getShopConfig();

      const testData: ReceiptTemplateData = {
        shop: shopConfig,
        receiptData: {
          orderNumber: 'TEST-001',
          createdAt: new Date().toISOString(),
          grandTotal: 10000,
          subtotal: 10000,
          taxTotal: 0,
          discount: 0,
          paymentMethod: 'Cash',
        },
        items: [
          {
            productName: 'Test Item',
            quantity: 1,
            subtotal: 10000,
            unitPrice: 10000,
            discountAmount: 0,
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
