import { create } from 'zustand';

export interface CartItem {
  productId: string;
  name: string;
  price: number; // in cents
  quantity: number;
  taxRate: number;
  discount?: number; // amount in cents
  discountType?: 'MANUAL' | 'PROMOTION'; // Optional field to indicate how the discount was applied
}

export interface ProductInput {
  id: string;
  name: string;
  price: number;
  taxRate?: number;
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
  addToCart: (product: ProductInput) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  setDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;

  // New Hold/Retrieve Actions
  holdOrder: () => void;
  restoreOrder: (id: string) => void;
  discardHeldOrder: (id: string) => void;

  // Computed
  getTotals: () => { subtotal: number; tax: number; discount: number; total: number };
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  heldOrders: [], // Initialize empty list

  addToCart: (product: ProductInput) => {
    const { items } = get();
    const existingItem = items.find((i) => i.productId === product.id);

    if (existingItem) {
      set({
        items: items.map((i) =>
          i.productId === product.id ? { ...i, quantity: Math.min(i.quantity + 1, 100000) } : i,
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
          const newQty = Number((item.quantity + delta).toFixed(2));

          // Basic sanity check - UI should prevent negative values
          if (newQty <= 0) return item;

          // Per-unit discount remains valid as long as it's <= item.price
          const maxAllowed = item.price;
          const validDiscount = item.discount ? Math.min(item.discount, maxAllowed) : 0;
          return { ...item, quantity: newQty, discount: validDiscount };
        }
        return item;
      }),
    });
  },

  setQuantity: (productId: string, quantity: number) => {
    const { items } = get();
    const roundedQty = Number(quantity.toFixed(2));

    set({
      items: items.map((item) => {
        if (item.productId === productId) {
          // Per-unit discount remains valid as long as it's <= item.price
          const maxAllowed = item.price;
          const validDiscount = item.discount ? Math.min(item.discount, maxAllowed) : 0;
          return { ...item, quantity: roundedQty, discount: validDiscount };
        }
        return item;
      }),
    });
  },

  clearCart: () => set({ items: [] }),

  // ---LOGIC TO HOLD THE ORDERS AND TO MAINTAIN IT ---
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
    const { heldOrders } = get();

    // Optional: If current cart has items, you might want to hold them first.

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

  setDiscount: (productId: string, discount: number) => {
    const { items } = get();
    set({
      items: items.map((item) => {
        if (item.productId === productId) {
          // Discount is now per-unit, so it's capped at just the unit price
          const maxDiscount = item.price;
          const validDiscount = Math.max(0, Math.min(discount, maxDiscount));
          return { ...item, discount: validDiscount };
        }
        return item;
      }),
    });
  },

  getTotals: () => {
    const { items } = get();
    let subtotal = 0;
    let tax = 0;
    let discountTotal = 0;

    items.forEach((item) => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;
      // Note: In real world, handle inclusive/exclusive tax carefully here.
      // We assume EXCLUSIVE tax for this calculation example.
      // Tax Logic: (Price * Qty * Rate) / 100
      tax += (lineTotal * item.taxRate) / 100;
      // Discount Logic: (Discount Per Unit * Quantity)
      discountTotal += (item.discount || 0) * item.quantity;
    });

    return {
      subtotal,
      tax,
      discount: discountTotal,
      total: Math.max(0, subtotal + tax - discountTotal),
    };
  },
}));
