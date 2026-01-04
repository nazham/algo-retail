// packages/types/src/dtos.ts
export interface CreateOrderDto {
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
}

export interface OrderResultDto {
  orderId: string;
  orderNumber: string;
}
