import type { ReceiptTemplateData } from '../services/printer.types';
import { formatCurrency } from '../utils/common.utils';

/**
 * Generate receipt CSS
 */
function getReceiptCSS(): string {
  return `
      @page { 
        size: 78mm auto; 
        margin: 0; 
      }
      
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
      
      body {
        font-family: 'Consolas', 'Courier New', monospace;
        width: 68mm;
        margin: 0 auto;
        padding: 10px 0;
        box-sizing: border-box;
        font-size: 12px;
        line-height: 1.5;
      }
      .header {
        text-align: center;
        width: 100%;
        border-bottom: 1px solid #000;
        padding-bottom: 2.5mm;
        margin-bottom: 3mm;
      }
      .store-name {
        font-size: 18px;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-bottom: 1.5mm;
        word-break: break-word;
      }
      .store-info { 
        font-size: 10px; 
        line-height: 1.45; 
        color: #222;
      }
      .section-divider { 
        border-top: 1px dashed #666; 
        margin: 3mm 0; 
      }
      .meta-info { 
        font-size: 11px; 
        margin-bottom: 2mm; 
      }
      .meta-row {
        display: table;
        width: 100%;
        margin-bottom: 1mm;
      }
      .meta-row > div,
      .meta-row > span {
        display: table-cell;
      }
      .meta-row > div:last-child,
      .meta-row > span:last-child {
        text-align: right;
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 2mm 0; 
      }
      thead { 
        border-bottom: 1px solid #000; 
      }
      .item-row { 
        border-bottom: 1px dashed #eee; 
      }
      .item-name-row td { 
        padding: 1mm 0 0.5mm 0;
        font-size: 12px;
        font-weight: bold;
      }
      .item-details-row td {
        padding: 0 0 1mm 0;
        font-size: 10px;
        color: #555;
      }
      .item-details-row .qty { 
        text-align: left; 
      }
      .item-details-row .price { 
        text-align: center; 
      }
      .item-details-row .amt { 
        text-align: right; 
      }
      .totals { 
        margin-top: 2mm; 
        padding-top: 2mm; 
        border-top: 1px solid #000; 
      }
      .total-row {
        display: table;
        width: 100%;
        margin-bottom: 1mm;
        font-size: 11px;
      }
      .total-row > span {
        display: table-cell;
      }
      .total-row > span:last-child {
        text-align: right;
      }
      .grand-total {
        display: table;
        width: 100%;
        font-size: 14px;
        font-weight: bold;
        border-top: 2px double #000;
        padding-top: 2mm;
        margin-top: 2mm;
      }
      .grand-total > span {
        display: table-cell;
      }
      .grand-total > span:last-child {
        text-align: right;
      }
      .payment-info { 
        font-size: 11px; 
        text-align: right; 
        margin-top: 2mm; 
      }
      .footer { 
        text-align: center; 
        width: 100%;
        margin-top: 3mm; 
        padding-top: 2mm; 
        border-top: 1px dashed #666; 
      }
      .thank-you { 
        font-size: 13px; 
        font-weight: bold; 
        margin-bottom: 1.5mm; 
      }
      .return-policy { 
        font-size: 8px; 
        line-height: 1.4; 
        color: #333; 
        margin-bottom: 1.5mm; 
      }
      .software-credit { 
        font-size: 9px; 
        color: #666; 
        margin-top: 1mm; 
      }
    `;
}

/**
 * Generate HTML receipt content from a data object.
 */
export function generateReceipt(data: ReceiptTemplateData): string {
  const { shop, receiptData, items, customerName, cashierName, paymentDetails } = data;
  const fmt = formatCurrency;

  // Format address lines cleanly
  const addressLines = [shop.addressLine1, shop.addressLine2].map((a) => a?.trim()).filter(Boolean);

  // Format phone numbers dynamically without trailing slash
  const phoneNumbers = [shop.phone1, shop.phone2]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(' / ');

  // Calculate totals
  const subtotal = receiptData.subtotal || receiptData.grandTotal;
  const discount = receiptData.discount || 0;
  const total = receiptData.grandTotal;

  return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>${getReceiptCSS()}</style>
      </head>
      <body>
        <!-- Header -->
        <div class="header">
          <div class="store-name">${shop.name}</div>
          <div class="store-info">
            ${addressLines.length > 0 ? addressLines.join('<br>') + '<br>' : ''}
            ${phoneNumbers ? `Tel: ${phoneNumbers}` : ''}
            ${shop.email ? `<br>${shop.email}` : ''}
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
             <div>
                <span>Customer:</span>
                <span>${customerName}</span>
             </div>
             <div>
                <span>Cashier:</span>
                <span>${cashierName}</span>
             </div>
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
            <span>${fmt(subtotal)}</span>
          </div>
          ${
            discount > 0
              ? `
          <div class="total-row">
            <span>Discount:</span>
            <span>- ${fmt(discount)}</span>
          </div>
          `
              : ''
          }
          <div class="grand-total">
            <span>TOTAL:</span>
            <span>${fmt(total)}</span>
          </div>
          <div class="payment-info">
            Payment: ${paymentDetails?.method || receiptData.paymentMethod}
            ${
              paymentDetails?.tenderedAmount !== undefined
                ? `<br>Received: ${fmt(paymentDetails.tenderedAmount)}`
                : ''
            }
            ${
              paymentDetails?.changeDue !== undefined && paymentDetails.changeDue > 0
                ? `<br>Change: ${fmt(paymentDetails.changeDue)}`
                : ''
            }
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="thank-you">Thank You For Your Purchase!</div>
          
          <div class="return-policy">
            RETURN POLICY: Returns accepted within 7 days with original receipt. Perishable, food, hygiene, clearance, and opened items are non-returnable. Defective or expired items must be reported within 24 hours.
Refunds issued to original payment method.
          </div>

          <div class="software-credit">© Software by ALGO-DIG 0779208210</div>
        </div>
      </body>
      </html>
    `;
}
