import type { PrintReceiptDto, ShopConfig } from '@algo/types';

export interface ReceiptData {
  orderNumber: string;
  createdAt?: string;
  grandTotal: number;
  subtotal?: number;
  taxTotal?: number;
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
  unitPrice: number;
  discountAmount: number;
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

export interface PrintReceiptRequest extends PrintReceiptDto {
  shopConfig?: ShopConfig;
  printOptions?: {
    deviceName?: string;
  };
}
