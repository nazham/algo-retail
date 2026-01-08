---

# ✅ One-Time Clean Fix

## Starting Point: **Node v24 installed, no nvm, no choco, nothing cleared**

> **Assumptions**
>
> * Node.js **v24 is installed system-wide**
> * **No nvm**, **no Chocolatey**
> * `.pnpm-store` and `node_modules` contain cached native binaries
> * Electron app fails with ABI / `.node` errors

Follow **every step in order**.
Skipping steps will reintroduce the problem.

---

## 0️⃣ Uninstall system Node.js v24 (MANDATORY)

Electron 39 **cannot work reliably** with Node 24 present.

1. Open **Apps & Features** (or Control Panel → Programs)
2. Uninstall **Node.js**
3. **Reboot Windows**

Verify Node is gone:

```powershell
node -v
```

✅ Expected: command not found / not recognized

---

## 1️⃣ Install nvm-windows (manual install, no choco)

1. Download **nvm-windows installer**
   [https://github.com/coreybutler/nvm-windows/releases](https://github.com/coreybutler/nvm-windows/releases)
2. Run the installer
3. Accept defaults
4. **Reboot Windows**

Verify:

```powershell
nvm version
```

---

## 2️⃣ Install and activate Node 22 (Electron 39 compatible)

```powershell
nvm install 22
nvm use 22
node -v
```

✅ Must show:

```
v22.x.x
```

> ⚠️ Do **not** install Node 24 alongside this setup

---

## 3️⃣ Kill all Node / Electron processes

Run **PowerShell as Administrator**:

```powershell
taskkill /F /IM node.exe
taskkill /F /IM electron.exe
```

---

## 4️⃣ Clear pnpm store (CRITICAL STEP)

pnpm **will reuse native binaries** unless the store is removed.

```powershell
pnpm store prune
pnpm store path
```

Example output:

```
C:\Users\<user>\AppData\Local\pnpm\store
```

Delete it manually:

```powershell
Remove-Item "<pnpm-store-path>" -Recurse -Force
```

❗ Skipping this step will cause the crash to return.

---

## 5️⃣ Delete `node_modules` (CMD only)

Open **Command Prompt as Administrator** (not PowerShell):

```cmd
cd D:\algo-retail
rmdir /s /q node_modules
```

If it fails:

- Reboot Windows
- Run this command **before opening any terminals or apps**

---

## 6️⃣ Reinstall dependencies (clean)

```cmd
pnpm install
```

Confirm you see:

```
better-sqlite3: Running install script
```

This confirms native modules were built with **Node 22**.

---

## 7️⃣ Rebuild native modules for Electron

```cmd
cd apps\desktop-pos
pnpm exec electron-rebuild -f -w better-sqlite3 --runtime=electron --target=39.2.7
```

✅ Expected:

```
Rebuild Complete
```

---

## 8️⃣ Run the project

```cmd
cd ..\..
pnpm dev
```

---

## ✅ Verification Checklist

- `node -v` → **v22.x**
- `npx electron --version` → **v39.x**
- Recently updated file:

  ```
  node_modules/better-sqlite3/build/Release/better_sqlite3.node
  ```

---

## 🚨 Rules Going Forward (Pin this)

- ❌ Do not install Node versions newer than Electron’s Node
- ❌ Do not switch Node versions without clearing `.pnpm-store`
- ✅ Always use `electron-rebuild` for native modules

---
