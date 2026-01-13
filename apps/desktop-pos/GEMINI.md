# 🤖 Gemini Code Assist Context & Guidelines

**Project:** Algo-Retail (POS Monorepo)
**Architecture:** Electron (Desktop) + React (UI) + Drizzle (DB)
**Style:** Feature-Sliced, Monorepo, Strict 3-Tier Architecture.

---

## 🏗️ Project Structure & Boundaries

This is a **Turbo Monorepo**. Understand where files belong before generating code.

- **`apps/desktop-pos/`**: The Electron POS Application.
  - `src/features/<feature>/`: Business logic (Hooks, Stores, Components).
  - `src/pages/`: Route entry points only.
  - `electron/`: Backend logic (Handlers, Repositories).
- **`packages/ui/`**: The Shared Design System (Shadcn UI).
  - **Rule:** NEVER create generic UI components in the app. ALWAYS import from here.
  - `import { Button } from '@repo/ui/components/ui/button'`
- **`packages/db-local/`**: SQLite Database Schema & Migrations.
  - **Rule:** Database schema definitions live here, not in the app.

---

## 📐 Coding Standards (Strict Mode)

### 1. The 3-Tier Architecture (Backend)

Do not write logic in IPC handlers. Use the **Repository Pattern**.

- **✅ Repository:** `electron/repositories/order.repo.ts` (Raw DB queries).
- **✅ Handler:** `electron/handlers/order.handler.ts` (IPC Registration).
- **❌ Bad:** Writing `db.select()...` directly inside `ipcMain.handle`.

### 2. The Universal Bridge (Frontend)

We use a **Universal IPC Bridge**. Do not modify `preload.ts` for new features.

- **✅ Usage:** `window.api.invoke('channel:action', data)`
- **❌ Bad:** Trying to add `window.api.getOrders()` to `preload.ts`.

### 3. Data Fetching (Hooks)

UI components must **never** call `window.api` directly.

- **✅ Pattern:** Component -> Custom Hook -> Window API.
- **Example:**

  ```typescript
  // hooks/use-orders.ts
  export function useOrders() {
    const [data, setData] = useState([]);
    useEffect(() => {
      window.api.invoke('orders:get-all').then(setData);
    }, []);
    return { data };
  }
  ```

### 4. Styling & Theming (Shadcn + Tailwind v4)

We use **Semantic Variables** for Dark Mode support.

- **✅ Do:** `bg-background`, `text-foreground`, `border-border`, `bg-primary`.
- **❌ Don't:** `bg-white`, `text-black`, `border-gray-200`, `bg-blue-600`.
- **❌ Don't:** Use arbitrary values like `h-[500px]`. Use Tailwind spacing.

---

## 📝 Code Generation Templates

When asked to "Create a feature", follow this exact file structure:

### 1. Repository (`electron/repositories/x.repo.ts`)

```typescript
import { DB, schema } from '@algo/db-local';
import { eq } from 'drizzle-orm';

export class FeatureRepository {
  constructor(private db: DB) {}
  async findAll() {
    return this.db.query.featureTable.findMany();
  }
}
```

### 2. Handler (`electron/handlers/x.handler.ts`)

```typescript
import { ipcMain } from 'electron';
import { FeatureRepository } from '../repositories/x.repo';

export const registerFeatureHandlers = (repo: FeatureRepository) => {
  ipcMain.handle('feature:get-all', () => repo.findAll());
};
```

### 3. Hook (`src/features/x/hooks/use-x.ts`)

```typescript
import { useState, useEffect } from 'react';

export function useFeature() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.api
      .invoke('feature:get-all')
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  return { data, isLoading };
}
```

---

## 🚫 "Junior" Mistakes to Avoid

1. **No `alert()**`: Use `toast.success()`or`toast.error()`from`sonner`.
2. **No `any**`: Define types in `@algo/types` or colocated files.
3. **No Zombie Code**: If a store belongs to a feature, put it in `features/<name>/stores/`, not `src/stores/`.
4. **No Inline Styles**: Use Tailwind classes only.

---
