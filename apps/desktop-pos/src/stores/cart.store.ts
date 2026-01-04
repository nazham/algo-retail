import { create } from "zustand";

// Define Types (Move these to @algo/types later for strict sharing)
export interface CartItem {
  productId: string;
  name: string;
  price: number; // in cents
  quantity: number;
  taxRate: number; // e.g. 0 or 18.0
}

interface CartState {
  items: CartItem[];
  // Actions
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  // Computed (Getters)
  getTotals: () => { subtotal: number; tax: number; total: number };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addToCart: (product) => {
    const { items } = get();
    // Check if item already exists
    const existingItem = items.find((i) => i.productId === product.id);

    if (existingItem) {
      // If exists, just increment quantity
      set({
        items: items.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      // If new, add to array
      set({
        items: [
          ...items,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            taxRate: product.taxRate || 0,
          },
        ],
      });
    }
  },

  removeFromCart: (productId) => {
    set({ items: get().items.filter((i) => i.productId !== productId) });
  },

  updateQuantity: (productId, delta) => {
    const { items } = get();
    set({
      items: items.map((item) => {
        if (item.productId === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }),
      // Optional: Remove if qty drops to 0? For now, let's keep it min 1.
    });
  },

  clearCart: () => set({ items: [] }),

  getTotals: () => {
    const { items } = get();
    let subtotal = 0;
    let tax = 0;

    items.forEach((item) => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;
      // Tax Logic: (Price * Qty * Rate) / 100
      // Note: In real world, handle inclusive/exclusive tax carefully here.
      // We assume EXCLUSIVE tax for this calculation example.
      tax += (lineTotal * item.taxRate) / 100;
    });

    return {
      subtotal,
      tax,
      total: subtotal + tax,
    };
  },
}));
