# 🚀 Algo-Retail: Project Status & Roadmap

**Version:** 0.4.0 (Alpha - Offline Core Complete)
**Date:** January 04, 2026

## 1. Executive Summary

Algo-Retail is a **Hybrid POS System** designed for the Sri Lankan retail market. It features an **Offline-First Desktop App** (Electron) that functions independently using a local embedded database (SQLite) and synchronizes with a **Cloud Backend** (NestJS + PostgreSQL) when internet is available.

---

## 2. Architecture Overview

### **The Monorepo (Turborepo)**

- **`apps/desktop-pos`**: The Electron client. Contains the UI (React) and the Local "Backend" (Main Process).
- **`apps/backend-api`**: The Cloud Server (NestJS). Handles multi-tenancy, data aggregation, and syncing.
- **`packages/db-local`**: Shared library for local SQLite configuration & Drizzle Schema.
- **`packages/types`**: Shared TypeScript DTOs and Interfaces (The "Contract" between Frontend, Desktop, and Cloud).

### **Data Flow (Current)**

React UI $\xrightarrow{\text{Zustand}}$ Cart State $\xrightarrow{\text{IPC Bridge}}$ Electron Handler $\xrightarrow{\text{Repository}}$ SQLite (Local)

---

## 3. Completed Milestones (✅ DONE)

### **Phase 1: Foundation & Tooling**

- ✅ **Monorepo Setup:** Configured Turborepo, pnpm workspaces, and base directory structure.
- ✅ **Code Quality:** Configured Prettier, Husky (Git Hooks), and Lint-Staged for automatic formatting.
- ✅ **UI Engine:** Installed Tailwind CSS v4 in the Desktop App.

### **Phase 2: The Offline Engine (Electron + SQLite)**

- ✅ **Native Module Handling:** Solved `better-sqlite3` rebuilding issues for Electron.
- ✅ **Database Layer:** Implemented Drizzle ORM with automatic migrations on app startup.
- ✅ **Seeding:** Created a `seedIfEmpty` logic to populate dummy products for testing.
- ✅ **Security:** Implemented "Context Isolation" with a strict `preload.ts` bridge (No Node integration in Renderer).
- ✅ **Process Management:** Implemented "Single Instance Lock" to prevent multiple app windows (preventing DB corruption).

### **Phase 3: The Point of Sale (UI & Logic)**

- ✅ **Routing:** Set up `react-router-dom` with a Sidebar Layout (POS / Settings).
- ✅ **State Management:** Built a **Zustand Cart Store** to handle line items, quantities, and totals.
- ✅ **Product Grid:** Connected UI to `ProductRepository` with instant search/filtering.
- ✅ **Checkout Transaction:**
- Created `OrderRepository` with **Atomic Transactions** (Insert Order + Insert Items + Decrement Stock).
- Mapped "Charge" button to the Database Write operation.

### **Phase 4: Architectural Refactor**

- ✅ **Clean Architecture:** Refactored `main.ts` using the **Controller/Handler Pattern**.
- ✅ **Shared Contracts:** Moved DTOs (e.g., `CreateOrderDto`) to `@algo/types` to share between Repo, Handler, and UI.
- ✅ **Type Safety:** Automated `window.api` typing so the Frontend knows exactly what the Backend offers.

---

## 4. The Roadmap (🚧 PENDING)

We are currently transitioning from **Phase 4** to **Phase 5**.

### **Phase 5: The Cloud Backend (Next Step)**

_Target: Establish the "Mother Ship" that the POS will eventually talk to._

- [ ] **PostgreSQL Setup:** Spin up a Neon/Supabase/Local Postgres instance.
- [ ] **Backend Drizzle:** Configure Drizzle ORM in `apps/backend-api` (mirroring the desktop schema).
- [ ] **Multi-Tenancy:** Add `tenantId` to the cloud schema (Cloud needs to know _which_ shop sent the data; Desktop doesn't care).
- [ ] **API Endpoints:** Create basic NestJS Controllers for `POST /orders/sync`.

### **Phase 6: The Sync Engine (Critical)**

_Target: Make the Offline data appear in the Cloud._

- [ ] **Sync Agent:** Build a background worker in Electron that runs every 60s.
- [ ] **Upload Logic:** "Find all orders where `isSynced = false` Send to Cloud Mark `true`."
- [ ] **Retry Mechanism:** Handle internet failures gracefully (Exponential Backoff).

### **Phase 7: Authentication & Security**

_Target: Stop random people from using the app._

- [ ] **Login UI:** Create a Login Screen in Electron.
- [ ] **Secure Storage:** Use `keytar` (or Electron SafeStorage) to save the JWT Token locally.
- [ ] **Cloud Auth:** Protect NestJS endpoints with Guards.

### **Phase 8: Hardware & Polish**

- [ ] **Receipt Printing:** Integrate ESC/POS library to print to thermal printers.
- [ ] **Barcode Scanning:** Listen for HID keyboard events (scanners usually act as keyboards).
- [ ] **Dashboard:** Build the `web-admin` (Next.js) to view the synced data.

---

## 5. Technical Debt & Watchlist ⚠️

- **Database Schema Drift:** We now have two databases (SQLite & Postgres). We must strictly manage schema changes to ensure they remain compatible.
- **Electron Build Size:** We are pulling in many dependencies. We should monitor the final `.exe` size.
- **Performance:** The product search filter is client-side. If a store has 10,000 items, we will need to move search logic to the SQLite query layer.

---
