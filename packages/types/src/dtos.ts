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

// Order Filtering & Pagination
export interface OrderFilters {
  page?: number;
  limit?: number;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  status?: string;
  searchTerm?: string; // For order number search
}

export interface PaginatedOrderResponse {
  data: OrderDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
