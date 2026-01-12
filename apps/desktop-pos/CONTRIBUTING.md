# 🛠️ Algo Retail Developer Handbook

Welcome to the team! This project uses a **Feature-First Monorepo Architecture**.
We value **Clean Code**, **Type Safety**, and **Scalability**.

---

## 🏗️ Architecture Overview

We strictly follow a **3-Tier Architecture**. Do not bypass these layers.

### 1. 🎨 Tier 1: The Design System (`packages/ui`)

- **What it is:** The "Lego Blocks" of our app. Dumb UI components only.
- **Rules:**
  - 🚫 **NEVER** create a generic component (like a Button or Card) inside the app.
  - ✅ **ALWAYS** import from `@repo/ui`.
  - ✅ **Styling:** Use semantic colors (`bg-primary`, `text-foreground`). Avoid hardcoded hex/colors.
  - **Example:**

    ```tsx
    import { Button } from '@repo/ui/components/ui/button';
    // ✅ Correct
    <Button variant="destructive">Delete</Button>
    // ❌ Incorrect
    <button className="bg-red-500 text-white p-2 rounded">Delete</button>
    ```

### 2. 🔌 Tier 2: The Data Layer (Hooks & API)

- **What it is:** The bridge between React and Electron/Backend.
- **Rules:**
  - 🚫 **NEVER** call `window.api.invoke()` directly inside a UI component.
  - ✅ **ALWAYS** create a custom hook in `features/<feature>/hooks/`.
  - **Why?** It decouples the View from the Logic. If we switch backends later, the UI won't care.
  - **Example:**

    ```tsx
    // ✅ Correct
    const { orders, isLoading } = useOrders();
    // ❌ Incorrect
    useEffect(() => { window.api.invoke('get-orders')... }, [])
    ```

### 3. 📦 Tier 3: Feature Slices (`src/features/*`)

- **What it is:** The business logic.
- **Structure:**

  ```text
  src/features/orders/
  ├── components/    # Components specific ONLY to Orders (OrderList.tsx)
  ├── hooks/         # Data fetching logic (useOrders.ts)
  ├── stores/        # Global state (order.store.ts)
  └── types/         # Feature-specific types
  ```

- **Rule:** Features should be **isolated**. "Orders" should not import components from "Inventory". Use `shared/` for common stuff.

---

## 🚀 How to Build a New Feature (Step-by-Step)

Scenario: You need to build a **"Customer List"** page.

### Step 1: The Backend (Electron)

1. Create `electron/repositories/customer.repo.ts`.
2. Define `findAll()` using Drizzle ORM (use relations!).
3. Register the handler in `electron/handlers/customer.handler.ts`:

```typescript
ipcMain.handle('customers:get-all', () => repo.findAll());
```

1. **Restart the App** (Backend changes require a restart).

### Step 2: The Data Hook (Frontend)

Create `src/features/customers/hooks/use-customers.ts`:

```typescript
export function useCustomers() {
  const [data, setData] = useState([]);
  // Call the API via the Universal Bridge
  useEffect(() => {
    window.api.invoke('customers:get-all').then(setData);
  }, []);
  return { data };
}
```

### Step 3: The UI (Frontend)

Create `src/features/customers/components/CustomerList.tsx`:

```tsx
import { useCustomers } from '../hooks/use-customers';
import { Button } from '@repo/ui/components/ui/button'; // 👈 Shared UI

export function CustomerList() {
  const { data } = useCustomers();
  return (
    <div>
      {data.map((c) => (
        <span key={c.id}>{c.name}</span>
      ))}
      <Button>View Details</Button>
    </div>
  );
}
```

---

## 🎨 Styling & Theming Guidelines

We support **Dark Mode** out of the box. To make this work, you must use **Semantic Variables**.

| Instead of...     | Use this...                  | Why?                                   |
| ----------------- | ---------------------------- | -------------------------------------- |
| `bg-white`        | `bg-card` or `bg-background` | Turns black in Dark Mode.              |
| `text-black`      | `text-foreground`            | Turns white in Dark Mode.              |
| `text-gray-500`   | `text-muted-foreground`      | Readable in both modes.                |
| `bg-blue-600`     | `bg-primary`                 | Matches the Brand Theme automatically. |
| `border-gray-200` | `border-border`              | Subtle in light, visible in dark.      |

**❌ Bad:**

```tsx
<div className="bg-white border border-gray-200 text-black"></div>
```

**✅ Good:**

```tsx
<div className="bg-card border border-border text-card-foreground"></div>
```

---

## ⚠️ Common Gotchas (Read this!)

1. **"My IPC call isn't working!"**

- Did you restart the terminal? Electron Main process changes do not hot-reload.
- Did you register the handler in `main.ts`?

1. **"I get a White Screen of Death!"**

- Check the Console.
- We have an `ErrorBoundary`. If it crashed hard, click "Reload App".

1. **"Colors look weird."**

- Did you use `bg-white`? Change it to `bg-background`.

1. **"Where do I put this type definition?"**

- If shared between Backend/Frontend: `@algo/types` package.
- If specific to one component: Inside the component file.

---

## 🤝 Git Workflow

1. **Branch:** `feature/customer-list`
2. **Commit:** Conventional Commits (`feat: add customer list`, `fix: login bug`)
3. **PR:** Assign to Tech Lead.

Happy Coding! 🚀

---
