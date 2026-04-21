const { createStore } = require('zustand/vanilla');

const store = createStore((set, get) => ({
  items: Array.from({length: 100}, (_, i) => ({ price: 100, quantity: 2, taxRate: 10, discount: 5 })),
  getTotals: () => {
    const { items } = get();
    let subtotal = 0;
    let tax = 0;
    let discountTotal = 0;

    items.forEach((item) => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;
      tax += (lineTotal * item.taxRate) / 100;
      discountTotal += item.discount || 0;
    });

    return { subtotal, tax, discount: discountTotal, total: Math.max(0, subtotal + tax - discountTotal) };
  }
}));

console.time('No memoization');
for(let i=0; i<10000; i++) {
  store.getState().getTotals();
}
console.timeEnd('No memoization');

// Wait, Zustand isn't ideal to just `getTotals` on every render.
// But in PosPage, `const totals = getTotals();` is called on every render.
// However, the `PosPage` only renders when state changes (or searchQuery).
// A better optimization is the one I already found: `searchQuery.toLowerCase()` inside the loop in `filteredProducts = useMemo(...)`
// Let's check `PosPage.tsx` again.
