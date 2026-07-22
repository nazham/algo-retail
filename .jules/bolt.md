
## 2024-05-18 - Hoist Expensive String Operations Out of Filters
**Learning:** Found multiple instances where `.toLowerCase()` on the search query was called inside a `.filter()` loop. In components with potentially large datasets (like `PosPage` filtering all products on every keystroke, and generic `Combobox` components), this creates O(N) redundant string operations that block the main thread.
**Action:** When filtering a large list against a static query string, always hoist `query.toLowerCase()` outside the loop and use `useMemo` to prevent re-evaluation on un-related renders. Also, return early if the query is empty or category doesn't match to skip expensive string match checks.
