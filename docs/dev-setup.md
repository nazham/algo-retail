# 🚀 Desktop POS - Developer Setup Guide

This project uses a **Self-Healing Architecture** for the local SQLite database.
Follow this guide exactly to avoid ABI (Application Binary Interface) mismatch errors between Node.js and Electron.

## ✅ Quick Start (The Happy Path)

### 1. Install Dependencies

```bash
pnpm install
```

_Note: This automatically triggers `electron-builder install-app-deps` to compile native binaries for Electron._

### 2. Start the Application

```bash
pnpm dev

```

**That’s it.** \* When the app launches, it **automatically**:

- Creates the `algo-local.sqlite` database.
- Runs pending migrations (creating tables).
- Seeds initial data.

---

## ⚠️ Important: The "Golden Rule"

> **DO NOT** run `pnpm db:push` or `drizzle-kit push` manually for the Desktop App.

### Why?

The desktop app uses `better-sqlite3`.

- **The Terminal** runs Node.js (ABI 127).
- **The App** runs Electron (ABI 140).

If you run migration commands in the terminal, you will crash the app with an `ERR_DLOPEN_FAILED` error because the binary cannot serve two masters.

**The Solution:**
We have moved migration logic **inside** the Electron app (`main.ts`). It runs on startup using the correct binary version.

---

## 🛠 Troubleshooting

### "I see `SqliteError: no such table`"

This means the auto-migration didn't run.

1. **Hard Reset:** Delete your local DB file.

- **Windows:** `%APPDATA%\Roaming\@algo\desktop-pos\algo-local.sqlite`
- **Mac:** `~/Library/Application Support/@algo/desktop-pos/algo-local.sqlite`

1. **Restart:** Run `pnpm dev` again. Watch the logs for "Migrations applied successfully!".

### "I see `was compiled against a different Node.js version`"

You likely ran a manual database command or installed a package without rebuilding.

1. **Fix it:**

```bash
# Rebuild native modules for Electron
pnpm exec electron-builder install-app-deps

```

1. **Restart:** `pnpm dev`

---

## 🏗 Making Schema Changes

If you modify the Drizzle schema:

1. **Generate Migration Files:**

```bash
pnpm db:generate

```

1. **Restart the App:**
   The app will detect the new SQL files in the `drizzle/` folder and apply them on startup.
