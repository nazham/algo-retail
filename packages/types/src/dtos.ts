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
  // Return types CAN remain interfaces because NestJS doesn't validate OUTGOING data by default.
  // But making it a class is fine too.
  orderId: string;
  orderNumber: string;
}
