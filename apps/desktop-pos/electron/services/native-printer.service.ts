import { BrowserWindow } from 'electron';

interface ReceiptData {
  orderNumber: string;
  grandTotal: number;
  subtotal?: number;
  discount?: number;
  paymentMethod: string;
}

interface PaymentDetails {
  method: string;
  tenderedAmount?: number;
  changeDue?: number;
}

interface ReceiptItem {
  productName: string;
  quantity: number;
  subtotal: number;
}

interface ShopConfig {
  name: string;
  addressLine1: string;
  addressLine2: string;
  phone1: string;
  phone2: string;
  email: string;
}

export class NativePrinterService {
  /**
   * Get shop configuration from environment variables
   */
  private static getShopConfig(): ShopConfig {
    return {
      name: process.env.SHOP_NAME || 'YOUR SHOP NAME',
      addressLine1: process.env.SHOP_ADDRESS_LINE1 || 'Address Line 1',
      addressLine2: process.env.SHOP_ADDRESS_LINE2 || 'City, Postal Code',
      phone1: process.env.SHOP_PHONE1 || '077-1234567',
      phone2: process.env.SHOP_PHONE2 || '032-1234567',
      email: process.env.SHOP_EMAIL || 'info@yourshop.com',
    };
  }

  /**
   * Format currency (cents to rupees with comma separators)
   */
  private static formatCurrency(cents: number): string {
    const rupees = (cents / 100).toFixed(2);
    // Add comma separators for thousands
    return rupees.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /**
   * Generate receipt CSS
   */
  private static getReceiptCSS(): string {
    return `
      @page { size: 78mm auto; margin: 0; }
      body {
        font-family: 'Consolas', 'Courier New', monospace;
        width: 68mm;
        margin: 0 2mm 0 2mm;
        padding: 0;
        font-size: 12px;
        line-height: 1.5;
      }
      .header {
        text-align: center;
        border-bottom: 2px solid #000;
        padding-bottom: 3mm;
        margin-bottom: 3mm;
      }
      .store-name {
        font-size: 18px;
        font-weight: bold;
        letter-spacing: 0.5px;
        margin-bottom: 2mm;
      }
      .store-info { font-size: 10px; line-height: 1.4; }
      .section-divider { border-top: 1px dashed #666; margin: 3mm 0; }
      .meta-info { font-size: 11px; margin-bottom: 2mm; }
      .meta-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1mm;
      }
      table { width: 100%; border-collapse: collapse; margin: 2mm 0; }
      thead { border-bottom: 1px solid #000; }
      .item-row { border-bottom: 1px dashed #eee; }
      .item-name-row td { 
        padding: 1.5mm 0 0.5mm 0;
        font-size: 11px;
        font-weight: bold;
      }
      .item-details-row td {
        padding: 0 0 1.5mm 0;
        font-size: 10px;
        color: #555;
      }
      .item-details-row .qty { text-align: left; }
      .item-details-row .price { text-align: center; }
      .item-details-row .amt { text-align: right; }
      .totals { margin-top: 2mm; padding-top: 2mm; border-top: 1px solid #000; }
      .total-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1mm;
        font-size: 11px;
      }
      .grand-total {
        display: flex;
        justify-content: space-between;
        font-size: 14px;
        font-weight: bold;
        border-top: 2px double #000;
        padding-top: 2mm;
        margin-top: 2mm;
      }
      .payment-info { font-size: 11px; text-align: right; margin-top: 2mm; }
      .footer { text-align: center; margin-top: 3mm; padding-top: 2mm; border-top: 1px dashed #666; }
      .thank-you { font-size: 14px; font-weight: bold; margin-bottom: 2mm; }
      .return-policy { font-size: 9px; line-height: 1.4; color: #333; margin-bottom: 1.5mm; }
      .software-credit { font-size: 9px; color: #666; margin-top: 1mm; }
    `;
  }

  /**
   * Generate HTML receipt content
   */
  private static generateReceiptHTML(
    receiptData: ReceiptData,
    items: ReceiptItem[],
    customerName: string,
    cashierName: string,
    paymentDetails?: PaymentDetails,
  ): string {
    const shop = this.getShopConfig();
    const fmt = this.formatCurrency;

    // Calculate totals
    const subtotal = receiptData.subtotal || receiptData.grandTotal;
    const discount = receiptData.discount || 0;
    const total = receiptData.grandTotal;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>${this.getReceiptCSS()}</style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div class="store-name">${shop.name}</div>
          <div class="store-info">
            ${shop.addressLine1}<br>
            ${shop.addressLine2}<br>
            Tel: ${shop.phone1} / ${shop.phone2}<br>
            Email: ${shop.email}
          </div>
        </div>

        <!-- Order Metadata -->
        <div class="meta-info">
          <div class="meta-row">
            <span>#${receiptData.orderNumber}</span>
            <span>${new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</span>
          </div>
          <div class="meta-row">
            <span>${customerName}</span>
            <span>${cashierName}</span>
          </div>
        </div>

        <div class="section-divider"></div>

        <!-- Items Table -->
        <table>
          <tbody>
            ${items
              .map((item) => {
                const unitPrice = item.subtotal / item.quantity;
                return `
              <tr class="item-name-row">
                <td colspan="3">${item.productName}</td>
              </tr>
              <tr class="item-details-row">
                <td class="qty">${item.quantity} × ${fmt(unitPrice)}</td>
                <td class="price"></td>
                <td class="amt">${fmt(item.subtotal)}</td>
              </tr>
            `;
              })
              .join('')}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>Rs. ${fmt(subtotal)}</span>
          </div>
          ${
            discount > 0
              ? `
          <div class="total-row">
            <span>Discount:</span>
            <span>- Rs. ${fmt(discount)}</span>
          </div>
          `
              : ''
          }
          <div class="grand-total">
            <span>TOTAL:</span>
            <span>Rs. ${fmt(total)}</span>
          </div>
          <div class="payment-info">
            Payment: ${paymentDetails?.method || receiptData.paymentMethod}
            ${
              paymentDetails?.tenderedAmount !== undefined
                ? `<br>Received: Rs. ${fmt(paymentDetails.tenderedAmount)}`
                : ''
            }
            ${
              paymentDetails?.changeDue !== undefined && paymentDetails.changeDue > 0
                ? `<br>Change: Rs. ${fmt(paymentDetails.changeDue)}`
                : ''
            }
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="thank-you">Thank You For Your Purchase!</div>
          
          <div class="return-policy">
            RETURN POLICY: Items may be returned within 7 days with original receipt. Clearance items are final sale. For assistance, please contact us.
          </div>

          <div class="software-credit">Powered by AlgoRetail POS</div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Print receipt using Electron's native printing API
   */
  static async printReceipt(
    orderData: ReceiptData,
    items: ReceiptItem[],
    customerName?: string,
    cashierName?: string,
    paymentDetails?: PaymentDetails,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const customer = customerName || 'Walk-in Customer';
      const cashier = cashierName || 'Cashier';

      // Generate HTML content
      const htmlContent = this.generateReceiptHTML(
        orderData,
        items,
        customer,
        cashier,
        paymentDetails,
      );

      // Create a hidden print window
      const printWindow = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      // Load the HTML content
      await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      console.log('🖨️ HTML loaded, waiting for content to render...');

      // Wait for content to fully render
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log('🖨️ Attempting to print with native Electron API...');

      // Print with options
      return new Promise((resolve) => {
        printWindow.webContents.print(
          {
            silent: true,
            printBackground: true,
            deviceName: process.env.PRINTER_NAME || 'XP-80C',
            pageSize: { width: 78000, height: 200000 },
            margins: { marginType: 'none' },
          },
          (success, errorType) => {
            setTimeout(() => printWindow.close(), 1000);

            if (success) {
              console.log('✅ Receipt printed successfully');
              resolve({ success: true });
            } else {
              console.log('❌ Print failed or cancelled:', errorType);
              resolve({ success: false, error: errorType || 'Print failed' });
            }
          },
        );
      });
    } catch (error: any) {
      console.error('❌ Print failed:', error);
      return { success: false, error: error?.message || String(error) };
    }
  }
}
