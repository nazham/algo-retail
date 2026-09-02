// packages/types/src/dtos.ts
import { z } from 'zod';

export const ORDER_STATUSES = [
  'COMPLETED',
  'REFUNDED',
  'PARTIALLY_REFUNDED',
  'PENDING',
  'CANCELLED',
] as const;
export type OrderStatusType = (typeof ORDER_STATUSES)[number];

// Standard Enum for class-validator and frontend form usage
export enum OrderStatus {
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
}

// Payment Method Type
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD';

export class CreateOrderItemDto {
  productId!: string;
  productName!: string;
  quantity!: number; // Allows negative values for refund mirror orders (Immutable Ledger Pattern)
  price!: number;
  costPrice?: number;
}

export class CreateOrderDto {
  // 🟢 IDENTITY FIELDS (New)
  id!: string; // The UUID from SQLite (Primary Key)
  orderNumber!: string; // The Receipt Number (e.g., INV-2026-001)
  createdAt!: string; // When it actually happened (ISO String)

  // 🟢 FINANCIALS
  subtotal!: number; // Allows negative values for refund mirror orders (Immutable Ledger Pattern)
  taxTotal!: number; // Allows negative values for refund mirror orders (Immutable Ledger Pattern)
  discountTotal!: number; // Allows negative values for refund mirror orders (Immutable Ledger Pattern)
  grandTotal!: number; // Allows negative values for refund mirror orders (Immutable Ledger Pattern)
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
  productId: string;
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

export interface ProductDeleteCheckResponse {
  hasTransactions: boolean;
  transactionCount: number;
  orderCount: number;
  movementCount: number;
  batchCount: number;
}

export interface DeleteProductResponse {
  success: boolean;
  isSoftDeleted: boolean;
  message: string;
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

export const PartialRefundSchema = z.object({
  originalOrderId: z.string(),
  adminPin: z.string(),
  reason: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().min(1),
      }),
    )
    .min(1, 'Must select at least one item'),
});

export type PartialRefundDto = z.infer<typeof PartialRefundSchema>;
// ─── Report DTOs ─────────────────────────────────────────────

export interface SalesReportDto {
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    totalUnitsSold: number;
  };
  dailySeries: { date: string; revenue: number; orders: number }[];
  topProducts: {
    productName: string;
    totalRevenue: number;
    totalQuantity: number;
  }[];
  paymentBreakdown: { method: string; revenue: number; count: number }[];
}

export interface ProfitLossReportDto {
  kpis: {
    revenue: number;
    cogs: number;
    grossProfit: number;
    grossMarginPercent: number;
    taxCollected: number;
    discountsGiven: number;
  };
  dailySeries: {
    date: string;
    revenue: number;
    cogs: number;
    profit: number;
  }[];
}

export interface InventoryReportDto {
  kpis: {
    totalStockValue: number;
    totalRetailValue: number;
    activeSkus: number;
    inactiveSkus: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  categoryBreakdown: {
    categoryName: string;
    stockValue: number;
    itemCount: number;
  }[];
  lowStockItems: {
    id: string;
    name: string;
    sku: string | null;
    stock: number;
    reorderPoint: number;
    costPrice: number;
    price: number;
  }[];
  lowStockTotal: number;
  lowStockPage: number;
  lowStockLimit: number;
  lowStockTotalPages: number;
  movementSummary: {
    type: string;
    totalQuantity: number;
    totalValue: number;
    count: number;
  }[];
  movements: {
    id: string;
    type: string;
    quantity: number;
    costPrice: number;
    reason: string | null;
    remarks: string | null;
    createdAt: string;
    productName: string;
    productSku: string | null;
    userName: string | null;
  }[];
  movementsTotal: number;
  movementsPage: number;
  movementsLimit: number;
  movementsTotalPages: number;
}
