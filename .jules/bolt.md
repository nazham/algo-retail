## 2025-04-19 - Fast product search filter

**Learning:** Checking for string inclusion `a.includes(b)` gets slow very quickly with huge lists. We can improve array filtering speed drastically in `PosPage.tsx`'s product search by breaking early instead of evaluating all conditions (`matchesCategory && matchesSearch`), and calling `.toLowerCase()` on the query once before the loop instead of on every element inside the loop.
**Action:** Use early returns in array filters and pre-compute invariants (like lowercased query strings) outside the loop when evaluating hundreds/thousands of elements.
