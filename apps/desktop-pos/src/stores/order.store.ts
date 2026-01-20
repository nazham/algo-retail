import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// --- Types ---
export type OrderStatus = 'Completed' | 'Pending' | 'Refunded';
export type PaymentMethod = 'Card' | 'Cash' | 'Qr';

export interface Order {
  id: string;
  date: string;
  customer: string;
  amount: number;
  payment: PaymentMethod;
  status: OrderStatus;
  items?: any[]; // To store what was bought
}

interface OrderStore {
  orders: Order[];
  addOrder: (order: Order) => void;
  setOrders: (orders: Order[]) => void;
}

// --- Store with Persistence (Saves to local storage) ---
export const useOrderStore = create<OrderStore>()(
  persist(
    (set) => ({
      orders: [],
      addOrder: (order) =>
        set((state) => ({
          orders: [order, ...state.orders], // Add new order to the top
        })),
      setOrders: (orders) => set({ orders }),
    }),
    {
      name: 'order-storage', // Key for local storage
    },
  ),
);
