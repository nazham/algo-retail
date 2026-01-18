import { PosPrinter } from 'electron-pos-printer';
import { BrowserWindow } from 'electron';
import path from 'path';

export class PrinterService {
  // ⚙️ CONFIGURATION (Hardcoded for Pilot)
  private static options = {
    preview: true, // Auto-print (No dialog)
    width: '80px', // Standard 80mm Thermal Paper
    margin: '0 0 0 0', // Zero margins
    copies: 1,
    printerName: 'Xprinter_XP_365B', // ⚠️ CRITICAL: You must change this to your USB Printer Name
    timeOutPerLine: 1000,
    silent: true,
  };

  static async printReceipt(orderData: any, items: any[]) {
    // 1. Format Currency Helper
    const fmt = (cents: number) => (cents / 100).toFixed(2);

    // 2. Build the Receipt Content
    const data = [
      // HEADER
      {
        type: 'text',
        value: 'MINI SUPERMARKET',
        style: { fontWeight: '700', textAlign: 'center', fontSize: '24px' },
      },
      {
        type: 'text',
        value: '123, Puttalam Road, Chilaw',
        style: { textAlign: 'center', fontSize: '12px', marginBottom: '5px' },
      },
      {
        type: 'text',
        value: 'Tel: 077-1234567',
        style: { textAlign: 'center', fontSize: '12px', marginBottom: '10px' },
      },

      // METADATA
      {
        type: 'text',
        value: `Inv No: ${orderData.orderNumber}`,
        style: { fontSize: '12px' },
      },
      {
        type: 'text',
        value: `Date: ${new Date().toLocaleString()}`,
        style: { fontSize: '12px', marginBottom: '5px' },
      },
      { type: 'separator' }, // Dotted Line

      // ITEMS TABLE
      {
        type: 'table',
        style: { border: 'none' },
        tableHeader: ['Item', 'Qty', 'Amt'],
        tableBody: items.map((item) => [
          item.productName.substring(0, 15), // Truncate long names
          item.quantity.toString(),
          fmt(item.subtotal),
        ]),
        tableHeaderStyle: { fontSize: '12px', fontWeight: 'bold' },
        tableBodyStyle: { fontSize: '12px' },
      },
      { type: 'separator' },

      // TOTALS
      {
        type: 'text',
        value: `TOTAL:  Rs. ${fmt(orderData.grandTotal)}`,
        style: { fontWeight: '700', textAlign: 'right', fontSize: '18px', marginTop: '5px' },
      },
      {
        type: 'text',
        value: `Paid via: ${orderData.paymentMethod}`,
        style: { textAlign: 'right', fontSize: '12px' },
      },

      // FOOTER
      {
        type: 'text',
        value: 'Thank You!',
        style: { textAlign: 'center', fontSize: '14px', marginTop: '10px' },
      },
      {
        type: 'text',
        value: 'Software by AlgoRetail',
        style: { textAlign: 'center', fontSize: '10px', color: '#666' },
      },
    ];

    try {
      // @ts-ignore
      await PosPrinter.print(data, this.options);
      console.log('✅ Receipt Sent to Printer');
      return { success: true };
    } catch (error) {
      console.error('❌ Print Failed:', error);
      // Don't crash the app if printer fails, just log it
      return { success: false, error };
    }
  }
}
