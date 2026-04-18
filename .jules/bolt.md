## 2024-05-18 - Memoizing the Product Grid

**Learning:** When dealing with large arrays of items (like products) that have inline click handlers calling actions from a global store, the entire grid will re-render if the store action changes, or if the parent re-renders.
**Action:** Extract list items to `React.memo` components, and wrap their inline click handlers with `useCallback` to maintain referential equality, reducing unnecessary re-renders.
