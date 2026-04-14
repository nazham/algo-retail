## 2024-05-18 - Missing memoization on product buttons in POS Grid
**Learning:** In `PosPage.tsx`, every time the cart updates, the entire component re-renders. Since the product grid maps over `filteredProducts` and creates inline `<Button>` elements, hundreds of buttons may re-render on every keystroke in quantity or every add-to-cart action.
**Action:** Extract the product button into a `React.memo` component, so it only re-renders when its props change.
