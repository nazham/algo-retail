Here is the comprehensive **Onboarding & Setup Guide** for the `algo-retail` repository.

Save this as `README.md` in the root of your project. It serves as the "Instruction Manual" for any new developer (or yourself in 6 months) to get the system running from zero.

---

# 🚀 Algo-Retail Engineering Guide

**Welcome to the team!**
Algo-Retail is a Hybrid POS System built for the Sri Lankan market. It consists of an **Offline-First Desktop App** (Electron) and a **Multi-Tenant Cloud Backend** (NestJS).

---

## 🛠️ 1. Prerequisites

Before cloning, ensure you have these installed:

- **Node.js:** v20.0.0 or higher (LTS recommended).
- **pnpm:** We use pnpm workspaces. (`npm install -g pnpm`)
- **PostgreSQL:** Either a local instance (v15+) or a cloud URL (Neon/Supabase).
- **Git:** For version control.
- **VS Code:** Recommended editor (Install the _Prettier_ and _ESLint_ extensions).

---

## 📥 2. Installation

1. **Clone the repository:**

```bash
git clone https://github.com/your-username/algo-retail.git
cd algo-retail

```

2. **Install Dependencies:**
   Run this from the root folder. It installs packages for the Desktop, Backend, and Shared Libraries.

```bash
pnpm install

```

3. **Build Shared Packages:**
   We have a shared `@algo/types` library. Build it first.

```bash
pnpm --filter @algo/types build

```

---

## 🔐 3. Environment Setup

You need to configure two applications: The **Cloud Backend** and the **Desktop POS**.

### **A. Backend API (`apps/backend-api`)**

Create a file `apps/backend-api/.env`:

```env
# Database Connection (Neon/Supabase/Local)
# Example: postgres://user:pass@localhost:5432/algo_retail
DATABASE_URL="your_postgres_connection_string_here"

# Security (Must match the Desktop App)
API_SECRET_KEY="algo_retail_secret_key_2026"

```

### **B. Desktop POS (`apps/desktop-pos`)**

Create a file `apps/desktop-pos/.env`:

```env
# Target Cloud URL
API_URL="http://localhost:3000"

# Security (Must match the Backend)
API_KEY="algo_retail_secret_key_2026"

# Identity (Hardcoded for MVP)
TENANT_ID="00000000-0000-0000-0000-000000000001"

```

---

## 🗄️ 4. Database Setup

### **Cloud Database (PostgreSQL)**

Initialize the backend database schema.

```bash
# Run from root
cd apps/backend-api
npx drizzle-kit migrate

```

_Success:_ You should see tables (`products`, `orders`, `users`) created in your Postgres DB.

### **Local Database (SQLite)**

- **No action needed.** The Desktop App automatically creates `algo-local.sqlite` on the first startup.
- **Resetting:** To wipe the local DB, just delete the `.sqlite` file. It will regenerate.

---

## 🚦 5. Running the Stack

We use **Turborepo** to run everything at once, or you can run apps individually.

### **Option A: Run Everything (Recommended)**

```bash
# From root
pnpm dev

```

- **Backend:** Starts on `http://localhost:3000`.
- **Desktop:** Launches the Electron window.

### **Option B: Run Individually**

- **Backend only:** `pnpm --filter backend-api start:dev`
- **Desktop only:** `pnpm --filter desktop-pos dev`

---

## 🌱 6. Seeding Data (First Run)

The apps start empty. You need to populate them.

### **Step 1: Seed the Desktop**

Just start the Desktop App.

- It automatically detects an empty DB and inserts default products (Munchee, Sunlight, etc.) and a default Admin User.

### **Step 2: Seed the Cloud**

The Cloud needs to know about these products to accept orders. Run this command **once** (while Backend is running):

```bash
curl -X POST http://localhost:3000/products/seed \
   -H "Content-Type: application/json" \
   -H "x-api-key: algo_retail_secret_key_2026" \
   -d '{
     "products": [
       { "id": "11111111-1111-1111-1111-111111111111", "name": "Munchee Super Cream Cracker", "sku": "MC-001", "price": 15000, "stock": 50 },
       { "id": "22222222-2222-2222-2222-222222222222", "name": "Anchor Full Cream 400g", "sku": "AN-400", "price": 125000, "stock": 20 },
       { "id": "33333333-3333-3333-3333-333333333333", "name": "Sunlight Soap", "sku": "SL-01", "price": 8500, "stock": 100 },
       { "id": "44444444-4444-4444-4444-444444444444", "name": "Keeris Samba (1kg)", "sku": "RICE-01", "price": 26000, "stock": 500 }
     ]
   }'

```

---

## 🔑 7. Access Credentials

### **Desktop POS Login**

- **PIN:** `1234`
- **Role:** Admin

### **API Access**

- **Header:** `x-api-key: algo_retail_secret_key_2026`

---

## 🏗️ 8. Architecture Overview

- **`apps/desktop-pos`**: Electron + React + SQLite (Better-SQLite3) + Drizzle ORM.
- _Key Pattern:_ **Offline First.** Saves to local DB first, background worker syncs to Cloud.

- **`apps/backend-api`**: NestJS + PostgreSQL + Drizzle ORM.
- _Key Pattern:_ **Multi-Tenant.** All tables have `tenant_id`.

- **`packages/types`**: Shared DTOs and Interfaces.
- _Key Pattern:_ **Single Source of Truth.** If you change an API shape here, both apps break (good!).

---

## ⚠️ Common Troubleshooting

**Issue: "Native module mismatch" or Electron crashes**

- **Fix:** Run `cd apps/desktop-pos && pnpm rebuild` to recompile SQLite for Electron.

**Issue: "Sync Failed: 401 Unauthorized"**

- **Fix:** Check that `API_KEY` in Desktop `.env` matches `API_SECRET_KEY` in Backend `.env`.

**Issue: "Product ID mismatch"**

- **Fix:** Delete `algo-local.sqlite` and restart. The app uses hardcoded UUIDs (`1111...`) to ensure sync compatibility.
