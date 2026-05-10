// packages/types/src/dtos.ts

export const ORDER_STATUSES = ['COMPLETED', 'REFUNDED', 'PENDING', 'CANCELLED'] as const;
export type OrderStatusType = (typeof ORDER_STATUSES)[number];

// Standard Enum for class-validator and frontend form usage
export enum OrderStatus {
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
}

// Payment Method Type
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD';

export class CreateOrderItemDto {
  productId!: string;
  productName!: string;
  quantity!: number;
  price!: number;
  costPrice?: number;
  discountAmount?: number;
  discountType?: string;
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
  status?: string; // 🟢 From Desktop (e.g., COMPLETED, REFUNDED)
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
  discountAmount?: number; // This is the discount applied to this item, if any. It can be used to calculate the discountTotal for the order.
  discountType?: string; // This indicates how the discountAmount should be applied (e.g., 'PERCENTAGE' or 'FIXED'). This is optional and can be used for reference when calculating the order totals.
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentMethod: string;
  status: OrderStatusType;
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
    unitPrice: number;
    discountAmount: number;
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
  tenantId: string;
  name: string;
  sku: string | null;
  price: number;
  costPrice?: number;
  stock: number;
  uom?: string;
  location?: string | null;
  isActive: boolean;
  expiryDate?: string | null;
  mfgDate?: string | null;
  categoryId: string | null;
  category: CategoryDto | null;
  parentId?: string | null;
  // New inventory fields
  wholesalePrice?: number | null;
  reorderPoint?: number | null;
  safetyStock?: number | null;
  // Metadata fields
  supplier?: string | null;
  brand?: string | null;
  batchNo?: string | null;
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface ProductQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedProductResponse {
  items: ProductWithCategoryDto[];
  total: number;
  page: number;
  limit: number;
}

export interface UpdateProductRequest {
  name?: string;
  sku?: string;
  price?: number;
  costPrice?: number;
  stock?: number;
  isActive?: boolean;
  expiryDate?: string | null;
  categoryId?: string;
}

// Order Filtering & Pagination
export interface OrderFilters {
  page?: number;
  limit?: number;
  from?: string; // ISO date string
  to?: string; // ISO date string
  status?: OrderStatusType;
  search?: string; // For order number search
}

export interface PaginatedOrderResponse {
  data: OrderDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
