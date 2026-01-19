import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDb, runMigrations } from '@algo/db-local';
import { ProductRepository } from './repositories/product.repo';
import { OrderRepository } from './repositories/order.repo';
import { registerProductHandlers } from './handlers/product.handler';
import { registerOrderHandlers } from './handlers/order.handler';
import dotenv from 'dotenv';
import { SyncRepository } from './repositories/sync.repo';
import { SyncService } from './services/sync.service';
import { UserRepository } from './repositories/user.repo';
import { registerUserHandlers } from './handlers/user.handler';
dotenv.config();

/**
 * ⚠️ ARCHITECTURE NOTE:
 * This app uses `better-sqlite3` v12.5.0, while the root workspace uses v12.6.0.
 *
 * DO NOT SYNC THEM.
 *
 * We use "Version Skewing" to force pnpm to keep the binaries in separate folders.
 * This allows the App to compile for Electron (ABI 140) while the CLI compiles
 * for System Node (ABI 127) without overwriting each other.
 */

// 1. Define where the DB lives
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'algo-local.sqlite');

console.log('Database location:', dbPath);

// 2. Initialize DB
const db = initDb(dbPath);

/**
 * DISABLE MIGRATIONS FOR RAPID MVP
 */

// Run Migrations
// const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
// const migrationsPath = isDev
//   ? path.join(__dirname, '../drizzle')
//   : path.join(process.resourcesPath, 'drizzle');

// try {
//   console.log('Running migrations from:', migrationsPath);
//   runMigrations(db, migrationsPath);
//   console.log('Migrations applied successfully!');
// } catch (err) {
//   console.error('Migration failed:', err);
// }

// 3. Initialize Repositories
const productRepo = new ProductRepository(db);
const orderRepo = new OrderRepository(db);
const syncRepo = new SyncRepository(db);
const userRepo = new UserRepository(db);

const syncService = new SyncService(syncRepo);

// 4. Define API Handlers
registerProductHandlers(productRepo);
registerOrderHandlers(orderRepo);
registerUserHandlers(userRepo);
ipcMain.handle('print-receipt', async (event, payload) => {
  // Payload expects { order, items, customerName?, cashierName?, paymentDetails? }
  console.log('🖨️ Printing Receipt for Order:', payload.order.orderNumber);
  // Using native Electron printing instead of electron-pos-printer
  const { NativePrinterService } = await import('./services/native-printer.service');
  return await NativePrinterService.printReceipt(
    payload.order,
    payload.items,
    payload.customerName,
    payload.cashierName,
    payload.paymentDetails,
  );
});

// 5. Start the Sync Loop (Every 60 Seconds)
setInterval(() => {
  syncService.sync();
}, 60 * 1000);

// 6. Run once immediately on startup (Optional, feels snappy)
setTimeout(() => syncService.sync(), 5000);

let win: BrowserWindow | null = null;

const createWindow = () => {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
};

// Single Instance Lock Implementation

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // If we fail to get the lock, it means another instance is running.
  // Quit immediately.
  console.log('Another instance detected. Quitting...');
  app.quit();
} else {
  // We have the lock! We are the "Main" instance.

  // 1. Listen for second instance attempts (and focus our window instead)
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  // 2. Launch the App (Only ONCE)
  app.whenReady().then(async () => {
    await productRepo.seedIfEmpty();
    await userRepo.seedIfEmpty();
    createWindow();
  });

  // 3. Handle Quit Lifecycle
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
