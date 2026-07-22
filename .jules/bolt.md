## 2024-05-24 - [Unnecessary O(N) operations in React renders]

**Learning:** Found that filtering large product lists in React `useMemo` applies string transformations (`toLowerCase`) even when the search query is empty. This adds significant O(N) overhead during the initial render and tab switching.
**Action:** Always short-circuit filters or pull expensive operations out of the `.filter()` loop, especially for potentially large datasets like product catalogs.
