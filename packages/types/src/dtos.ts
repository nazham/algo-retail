// packages/types/src/dtos.ts

// Payment Method Type
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD';

export class CreateOrderItemDto {
  productId!: string;
  productName!: string;
  quantity!: number;
  price!: number;
}

export class CreateOrderDto {
  // 🟢 IDENTITY FIELDS (New)
  id!: string; // The UUID from SQLite (Primary Key)
  orderNumber!: string; // The Receipt Number (e.g., INV-2026-001)
  createdAt!: string; // When it actually happened (ISO String)

  // 🟢 FINANCIALS
  subtotal!: number;
  taxTotal!: number;
  discountTotal!: number;
  grandTotal!: number;
  paymentMethod!: PaymentMethod;
  items!: CreateOrderItemDto[]; // Array of the class above
}

export interface OrderResultDto {
  orderId: string;
  orderNumber: string;
}

export interface OrderItemDto {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: OrderItemDto[];
}

// Shop Configuration
export interface ShopConfig {
  name: string;
  addressLine1: string;
  addressLine2: string;
  phone1: string;
  phone2: string;
  email: string;
}

export interface PrintReceiptDto {
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
}

// Category DTOs
export interface CategoryDto {
  id: string;
  name: string;
}

export interface ProductWithCategoryDto {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  categoryId: string | null;
  category: CategoryDto | null;
}
