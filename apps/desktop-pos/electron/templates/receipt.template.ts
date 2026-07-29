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
        line-height: 1.4;
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
        letter-spacing: -0.5px;
        margin-bottom: 1mm;
      }
      .bold-divider {
        border-top: 2px solid #000;
        margin: 2mm 0;
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
        margin: 2mm 0; 
      }
      .meta-info { 
        font-size: 11px; 
        margin-bottom: 2mm; 
      }
      .meta-row {
        display: table;
        width: 100%;
        margin-bottom: 0.5mm;
      }
      .meta-row span {
        display: table-cell;
      }
      .meta-row span:last-child {
        text-align: right;
      }
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin-bottom: 2mm; 
      }
      thead th { 
        font-size: 10px;
        font-weight: bold;
        text-align: left;
        padding-bottom: 1mm;
      }
      thead .th-right { text-align: right; }
      thead .th-center { text-align: center; }
      
      .item-name-row td { 
        padding: 1.5mm 0 0.5mm 0;
        font-size: 11px;
        font-weight: bold;
      }
      .item-details-row td {
        padding: 0 0 1.5mm 0;
        font-size: 10px;
      }
      .item-details-row .qty { text-align: center; }
      .item-details-row .disc { text-align: center; }
      .item-details-row .total { text-align: right; }

      .totals { 
        padding-top: 1mm; 
      }
      .total-row {
        display: table;
        width: 100%;
        margin-bottom: 1mm;
        font-size: 11px;
      }
      .total-row span:last-child {
        text-align: right;
      }
      .grand-total {
        display: table;
        width: 100%;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 3mm;
      }
      .grand-total span:last-child {
        text-align: right;
      }
      .payment-info { 
        font-size: 11px; 
        text-align: right; 
        margin-bottom: 3mm;
      }
      .footer { 
        text-align: center; 
        width: 100%;
      }
      .thank-you { 
        font-size: 14px; 
        font-weight: bold; 
        margin-bottom: 3mm;
        text-transform: uppercase;
      }
      .return-policy { 
        font-size: 8px; 
        line-height: 1.3; 
        text-transform: uppercase;
        color: #333; 
        margin-bottom: 2mm; 
      }
      .software-credit { 
        font-size: 9px; 
        color: #666; 
      }
    `;
}

/**
 * Generate HTML receipt content from a data object.
 */
export function generateReceipt(data: ReceiptTemplateData): string {
  const { shop, receiptData, items, customerName, cashierName, paymentDetails } = data;
  const fmt = formatCurrency;

  // Totals are now calculated in the service/controller layer and passed via receiptData
  const totalDiscount = receiptData.discount || 0;
  const subTotal = receiptData.subtotal || 0;
  const grandTotal = receiptData.grandTotal || 0;

  // Format address lines cleanly
  const addressLines = [shop.addressLine1, shop.addressLine2].map((a) => a?.trim()).filter(Boolean);

  // Format phone numbers dynamically without trailing slash
  const phoneNumbers = [shop.phone1, shop.phone2]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(' / ');

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
          <div class="store-name">${shop.name || 'Algo Retail'}</div>
          <div class="store-info">
            ${addressLines.length > 0 ? addressLines.join('<br>') + '<br>' : ''}
            ${phoneNumbers ? `Tel: ${phoneNumbers}` : ''}
            ${shop.email ? `<br>${shop.email}` : ''}
          </div>
        </div>

        <div class="bold-divider"></div>

        <!-- Order Metadata -->
        <div class="meta-info">
          <div class="meta-row">
            <span style="font-weight: bold;">#${receiptData.orderNumber}</span>
            <span>${new Date().toLocaleString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}</span>
          </div>
          <div class="meta-row">
             <span>Customer: ${customerName || 'Walk-in'}</span>
             <span>Cashier: ${cashierName || 'Admin'}</span>
          </div>
        </div>

        <div class="section-divider"></div>

        <!-- Items Table -->
        <table>
          <thead>
            <tr>
              <th width="15%" class="th-center">QTY</th>
              <th width="35%">MRP</th>
              <th width="20%" class="th-center">Price</th>
              <th width="30%" class="th-right">Amount</th>
            </tr>
            <tr>
              <td colspan="4" style="border-bottom: 1px dashed #666; padding-bottom: 1mm;"></td>
            </tr>
          </thead>
          <tbody>
            ${items
              .map((item) => {
                return `
              <tr class="item-name-row">
                <td colspan="4">${item.productName}</td>
              </tr>
              <tr class="item-details-row">
                <td class="qty">${item.quantity}</td>
                <td>${((item.unitPrice || 0) / 100).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</td>
                <td class="disc">${(
                  ((item.unitPrice || 0) - (item.discountAmount || 0)) /
                  100
                ).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</td>
                <td class="total">${(
                  (item.quantity * ((item.unitPrice || 0) - (item.discountAmount || 0))) /
                  100
                ).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}</td>
              </tr>
            `;
              })
              .join('')}
          </tbody>
        </table>

        <div class="bold-divider"></div>

        <!-- Totals -->
        <div class="totals">
          <table width="100%" style="font-size: 11px; margin-bottom: 1mm;">
            <tr>
              <td style="text-align: left; padding: 0.5mm 0;">Subtotal:</td>
              <td style="text-align: right; padding: 0.5mm 0;">${fmt(subTotal)}</td>
            </tr>
            <tr>
              <td style="text-align: left; padding: 0.5mm 0;">Discount:</td>
              <td style="text-align: right; padding: 0.5mm 0;">- ${fmt(totalDiscount)}</td>
            </tr>
          </table>
        </div>

        <div class="bold-divider"></div>

        <div class="grand-total">
          <table width="100%" style="font-size: 16px; font-weight: bold;">
            <tr>
              <td style="text-align: left;">TOTAL:</td>
              <td style="text-align: right;">${fmt(grandTotal)}</td>
            </tr>
          </table>
        </div>

        <div class="payment-info">
          Payment: ${paymentDetails?.method || receiptData.paymentMethod || 'CASH'}<br>
          Received: ${fmt(paymentDetails?.tenderedAmount || grandTotal)}<br>
          Change: ${fmt(paymentDetails?.changeDue || 0)}
        </div>

        <div class="section-divider" style="margin-top: 0;"></div>

        <!-- Footer -->
        <div class="footer">
          <div class="thank-you">Thank You For Your Purchase!</div>
          
          <div class="return-policy">
            RETURN POLICY: RETURNS ACCEPTED WITHIN 7 DAYS WITH ORIGINAL RECEIPT. PERISHABLE, FOOD, HYGIENE, CLEARANCE, AND OPENED ITEMS ARE NON-RETURNABLE. DEFECTIVE OR EXPIRED ITEMS MUST BE REPORTED WITHIN 24 HOURS. REFUNDS ISSUED TO ORIGINAL PAYMENT METHOD.
          </div>

          <div class="software-credit">© Software by ALGO-DIG 0779208210</div>
        </div>
      </body>
      </html>
    `;
}
