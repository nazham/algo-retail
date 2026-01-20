import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name: string;
  price: number; // in cents
  quantity: number;
  taxRate: number;
}

// New Interface for Held Orders
export interface HeldOrder {
  id: string;
  items: CartItem[];
  timestamp: number;
  total: number;
  note?: string;
}

interface CartState {
  items: CartItem[];
  heldOrders: HeldOrder[]; // <--- New State for storing held orders

  // Actions
  addToCart: (product: any) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;

  // New Hold/Retrieve Actions
  holdOrder: () => void;
  restoreOrder: (id: string) => void;
  discardHeldOrder: (id: string) => void;

  // Computed
  getTotals: () => { subtotal: number; tax: number; total: number };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  heldOrders: [], // Initialize empty list

  addToCart: (product) => {
    const { items } = get();
    const existingItem = items.find((i) => i.productId === product.id);

    if (existingItem) {
      set({
        items: items.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        ),
      });
    } else {
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
    });
  },

  clearCart: () => set({ items: [] }),

  // --- NEW LOGIC START ---
  holdOrder: () => {
    const { items, heldOrders, getTotals } = get();
    if (items.length === 0) return;

    const newHeldOrder: HeldOrder = {
      id: Date.now().toString(), // Simple ID based on time
      timestamp: Date.now(),
      items: [...items], // Copy current items
      total: getTotals().total,
    };

    set({
      heldOrders: [...heldOrders, newHeldOrder], // Add to held list
      items: [], // Clear current cart
    });
  },

  restoreOrder: (id) => {
    const { heldOrders, items } = get();

    // Optional: If current cart has items, you might want to hold them first?
    // For now, we assume we just overwrite or user clears first.

    const orderToRestore = heldOrders.find((o) => o.id === id);
    if (!orderToRestore) return;

    set({
      items: orderToRestore.items, // Restore items to cart
      heldOrders: heldOrders.filter((o) => o.id !== id), // Remove from held list
    });
  },

  discardHeldOrder: (id) => {
    set((state) => ({
      heldOrders: state.heldOrders.filter((o) => o.id !== id),
    }));
  },
  // --- NEW LOGIC END ---

  getTotals: () => {
    const { items } = get();
    let subtotal = 0;
    let tax = 0;

    items.forEach((item) => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;
      tax += (lineTotal * item.taxRate) / 100;
    });

    return {
      subtotal,
      tax,
      total: subtotal + tax,
    };
  },
}));
