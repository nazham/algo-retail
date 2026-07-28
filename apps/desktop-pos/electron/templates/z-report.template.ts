export interface ZReportData {
  shopName: string;
  generatedAt: string;
  date: string;
  shiftStart: string | null;
  shiftEnd: string | null;
  totalOrders: number;
  grossSales: number;
  totalDiscounts: number;
  totalTax: number;
  netSales: number;
  paymentBreakdown: {
    method: string;
    amount: number;
    count: number;
  }[];
}

import { formatCurrency } from '../utils/common.utils';

export function zReportTemplate(data: ZReportData): string {
  const {
    shopName,
    generatedAt,
    date,
    shiftStart,
    shiftEnd,
    totalOrders,
    grossSales,
    totalDiscounts,
    totalTax,
    netSales,
    paymentBreakdown,
  } = data;

  const fmt = formatCurrency;

  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            @page { size: 78mm auto; margin: 0; }
            body {
                font-family: 'Consolas', 'Courier New', monospace;
                width: 68mm;
                margin: 0 auto;
                padding: 10px 0;
                font-size: 12px;
                line-height: 1.5;
            }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 3mm; margin-bottom: 3mm; }
            .store-name { font-size: 18px; font-weight: bold; }
            .title { text-align: center; font-size: 16px; font-weight: bold; margin: 3mm 0; }
            .meta-info { margin-bottom: 3mm; }
            .meta-row { display: flex; justify-content: space-between; margin-bottom: 1mm; font-size: 11px; }
            .section { border-top: 1px dashed #666; margin: 3mm 0; padding-top: 2mm; }
            .section-title { font-weight: bold; margin-bottom: 2mm; text-transform: uppercase; font-size: 13px; text-align: center;}
            .summary-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 2mm; padding: 0 2mm; }
            .summary-row.total { font-weight: bold; border-top: 1px solid #000; padding-top: 2mm; margin-top: 2mm; }
            .breakdown-table { width: 100%; border-collapse: collapse; }
            .breakdown-table th, .breakdown-table td { text-align: left; padding: 1mm 2mm; }
            .breakdown-table .amt { text-align: right; }
            .breakdown-table thead { border-bottom: 1px solid #000; }
            .footer { text-align: center; margin-top: 3mm; padding-top: 2mm; border-top: 1px dashed #666; font-size: 10px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="store-name">${shopName}</div>
        </div>

        <div class="title">Z-REPORT (END OF DAY)</div>

        <div class="meta-info">
            <div class="meta-row"><span>Report Date:</span> <span>${date}</span></div>
            <div class="meta-row"><span>Generated At:</span> <span>${generatedAt}</span></div>
            ${shiftStart && shiftEnd ? `<div class="meta-row"><span>Shift Hours:</span> <span>${shiftStart} - ${shiftEnd}</span></div>` : ''}
        </div>

        <div class="section">
            <div class="section-title">Sales Summary</div>
            <div class="summary-row">
                <span>Total Orders:</span>
                <span>${totalOrders}</span>
            </div>
            <div class="summary-row">
                <span>Gross Sales:</span>
                <span>${fmt(grossSales)}</span>
            </div>
            <div class="summary-row">
                <span>Discounts:</span>
                <span>-${fmt(totalDiscounts)}</span>
            </div>
            <div class="summary-row">
                <span>Tax:</span>
                <span>${fmt(totalTax)}</span>
            </div>
            <div class="summary-row total">
                <span>Net Sales:</span>
                <span>${fmt(netSales)}</span>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Payment Breakdown</div>
            <table class="breakdown-table">
                <thead>
                    <tr>
                        <th>Method</th>
                        <th class="amt">Count</th>
                        <th class="amt">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${paymentBreakdown
                      .map(
                        (p) => `
                        <tr>
                            <td>${p.method}</td>
                            <td class="amt">${p.count}</td>
                            <td class="amt">${fmt(p.amount)}</td>
                        </tr>
                    `,
                      )
                      .join('')}
                </tbody>
            </table>
        </div>

        <div class="footer">End of Report</div>
    </body>
    </html>
    `;
}
