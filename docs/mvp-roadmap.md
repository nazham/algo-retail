# 🚀 Algo-Retail: Pilot & MVP Roadmap

**Current Focus:** Pilot Deployment (Mini-Supermarket)
**Target Date:** Sunday, Jan 19, 2026

## 🛑 Phase 1: Pilot Survival (The Next 48 Hours)

_Objective: A stable, offline-capable POS that can scan, print, and save sales._

### 1. Data & Inventory

- [ ] **GSheet Importer:** Script to seed `products` table from client's Excel file.
  - Fields: Name, Barcode, MRP, Cost, Tax, Stock.
- [ ] **Product Lookup:** Optimized SQLite query to find items by `SKU` (Scan) or `Name` (Search).

### 2. Hardware Integration

- [ ] **Thermal Printer:** Integration with `electron-pos-printer`.
  - [ ] Template: Header (Logo/Address), Body (Items), Footer (Totals/Thank You).
- [ ] **Barcode Scanner:** Global Listener (HID Mode).
  - [ ] Buffer logic to distinguish Scans vs. Manual Typing.

### 3. The Transaction Flow

- [ ] **Checkout Modal:**
  - [ ] Input: Cash Tendered / Card Ref No.
  - [ ] Logic: Calculate Balance.
  - [ ] Action: Commit Order -> Decrement Stock -> Print Receipt.
- [ ] **Cart Actions:** Void Item (Password Protected later, open for now).

### 4. Reporting (Local)

- [ ] **X-Report (Shift):** Current sales summary in memory.
- [ ] **Z-Report (End of Day):** Finalize day's sales (Total Cash/Card).

---

## 🛠️ Phase 2: Stabilization (Post-Pilot Week)

_Objective: Fix "Real World" bugs and improve UX based on cashier feedback._

- [ ] **Performance:** Optimize search if >2000 items causes lag.
- [ ] **Stock Corrections:** UI to manually adjust stock (+/-) with a reason code (Damaged/Expired).
- [ ] **Backup:** One-click "Export DB" to Desktop for safety.

---

## 🚀 Phase 3: MVP Scalability (Weeks 2-4)

_Objective: Remote management and Multi-branch ready._

### 1. Cloud Sync (Bi-Directional)

- [ ] **Upload:** Sync Orders & Stock decrements to Cloud (PostgreSQL).
- [ ] **Download:** Sync Price Changes & New Products from Cloud to Desktop.

### 2. Web Admin (Next.js)

- [ ] **Dashboard:** Live Sales Feed.
- [ ] **Inventory Manager:** Master Product List editing.

### 3. Advanced Features

- [ ] **Auth:** PIN System for Cashiers (Audit Logs).
- [ ] **Label Printing:** Generate Barcode Labels for loose items (e.g., Repacked Rice).
