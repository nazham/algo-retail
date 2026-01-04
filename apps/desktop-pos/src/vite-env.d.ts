/// <reference types="vite/client" />

interface Window {
  api: {
    getProducts: () => Promise<any[]>;
    createOrder: (data: any) => Promise<{ orderId: string; orderNumber: string }>;
  };
}
