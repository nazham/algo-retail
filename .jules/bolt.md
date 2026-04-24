## 2026-04-24 - Expensive String Operations Inside React Rendering Loops
**Learning:** Calling `.toLowerCase()` inside a `.filter()` loop within a `useMemo` can cause significant performance overhead when filtering large arrays (like products in a POS), as the same outer string is lowercased redundantly for every element.
**Action:** Always cache derived invariant values (like normalized search queries) *outside* the loop, and use early returns to skip string operations altogether if a previous filter condition (like category matching) already fails.
