import type { ShopConfig } from '@algo/types';

export interface ReceiptData {
  orderNumber: string;
  grandTotal: number;
  subtotal?: number;
  discount?: number;
  paymentMethod: string;
}

export interface PaymentDetails {
  method: string;
  tenderedAmount?: number;
  changeDue?: number;
}

export interface ReceiptItem {
  productName: string;
  quantity: number;
  subtotal: number;
}

export interface ReceiptTemplateData {
  shop: ShopConfig;
  receiptData: ReceiptData;
  items: ReceiptItem[];
  customerName: string;
  cashierName: string;
  paymentDetails?: PaymentDetails;
}

export interface PrintReceiptRequest {
  order: {
    orderNumber: string;
    grandTotal: number;
    subtotal: number;
    discountTotal: number;
    paymentMethod: string;
  };
  items: {
    productName: string;
    quantity: number;
    subtotal: number;
  }[];
  paymentDetails: {
    method: string;
    tenderedAmount: number;
    changeDue: number;
  };
  customerName?: string;
  cashierName?: string;
  shopConfig?: ShopConfig;
  printOptions?: {
    deviceName?: string;
  };
}
