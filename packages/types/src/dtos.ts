// packages/types/src/dtos.ts

// Payment Method Type
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';

export class CreateOrderItemDto {
  productId!: string;
  productName!: string;
  quantity!: number;
  price!: number;
}

export class CreateOrderDto {
  subtotal!: number;
  taxTotal!: number;
  discountTotal!: number;
  grandTotal!: number;
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
  grandTotal: number;
  status: string;
  createdAt: string;
  items: OrderItemDto[];
}
