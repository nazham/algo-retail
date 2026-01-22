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

export interface ShopConfig {
  name: string;
  addressLine1: string;
  addressLine2: string;
  phone1: string;
  phone2: string;
  email: string;
}

export interface ReceiptTemplateData {
  shop: ShopConfig;
  receiptData: ReceiptData;
  items: ReceiptItem[];
  customerName: string;
  cashierName: string;
  paymentDetails?: PaymentDetails;
}
