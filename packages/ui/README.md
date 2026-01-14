# 🎨 @repo/ui

> **The Shared Design System for Algo-Retail.**
> A set of reusable, accessible, and theme-aware React components built with Radix UI and Tailwind CSS.

---

## 📦 What's Inside?

This package serves as the **Single Source of Truth** for UI consistency across the `desktop-pos` and `web-admin` apps.

- **Primitives**: Low-level accessible components (Buttons, Inputs, Dialogs) built on [Radix UI](https://www.radix-ui.com/).
- **Feedback**: Toast notifications via [Sonner](https://sonner.emilkowal.ski/).
- **Theming**: Dark/Light mode support via `next-themes`.
- **Utils**: Shared Tailwind helpers (`cn`).

---

## 🚀 How to Use

### 1. Installation

This package is already linked in the workspace. In your app's `package.json`:

```json
"dependencies": {
  "@repo/ui": "workspace:*"
}

```

### 2. Importing Components

Import directly from the package. Treeshaking is handled by the bundler.

```tsx
import { Button } from '@repo/ui/components/button';
import { Input } from '@repo/ui/components/input';
import { toast } from 'sonner';

export function LoginForm() {
  return (
    <div className="space-y-4">
      <Input placeholder="Email" />
      <Button onClick={() => toast.success('Logged in!')}>Sign In</Button>
    </div>
  );
}
```

---

## 🛠️ Development Workflow

## 🛠️ Adding New Shadcn Components

Since this is a shared library, adding components from shadcn/ui requires specific steps to ensure dependencies are installed in the right place.

### Option A: The CLI Method (Fastest)

Run the shadcn command **inside the UI package directory**:

```bash
# 1. Go to the UI package
cd packages/ui

# 2. Add the component (e.g., Select)
pnpm dlx shadcn@latest add select

```

### Option B: The Manual Method (Safest)

If the CLI fails or you want precise control:

1. **Copy Code:** Go to [ui.shadcn.com](https://ui.shadcn.com/), find the component, and copy the code.
2. **Create File:** Paste it into `packages/ui/src/components/ui/[component-name].tsx`.
3. **Install Deps:** Check the "Installation" tab on the docs for any required packages (e.g., `@radix-ui/react-select`) and install them **in this package**:

```bash
# Inside packages/ui
pnpm add @radix-ui/react-select

```

### Styling

All components use **Tailwind CSS**.

- **Global Styles:** Defined in `src/globals.css` (imported by apps).
- **Tailwind Config:** This package exports a preset config used by apps to ensure color consistency.

---

## 🔌 Configuration Integration

To ensure the apps inherit the correct fonts and colors, they must extend this package's Tailwind config.

**In `apps/desktop-pos/tailwind.config.ts`:**

```ts
import type { Config } from 'tailwindcss';
import sharedConfig from '@repo/ui/tailwind.config';

const config: Config = {
  content: [
    // Include shared UI components in content scan
    '../../packages/ui/src/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [sharedConfig],
};

export default config;
```

---

## 🧩 Key Dependencies

| Package                            | Purpose                              |
| ---------------------------------- | ------------------------------------ |
| **Radix UI**                       | Headless, accessible UI primitives.  |
| **Lucide React**                   | Icon set.                            |
| **Sonner**                         | Toast notifications.                 |
| **Class Variance Authority (CVA)** | Managing component variants.         |
| **Tailwind Merge**                 | Merging conflicting classes cleanly. |
