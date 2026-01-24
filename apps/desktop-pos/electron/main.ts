import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDb, runMigrations } from '@algo/db-local';
import { ProductRepository } from './repositories/product.repo';
import { CategoryRepository } from './repositories/category.repo';
import { OrderRepository } from './repositories/order.repo';
import { ReportRepository } from './repositories/report.repo';
import { registerProductHandlers } from './handlers/product.handler';
import { registerCategoryHandlers } from './handlers/category.handler';
import { registerOrderHandlers } from './handlers/order.handler';
import dotenv from 'dotenv';
import { SyncRepository } from './repositories/sync.repo';
import { SyncService } from './services/sync.service';
import { UserRepository } from './repositories/user.repo';
import { registerUserHandlers } from './handlers/user.handler';
import { registerPrintHandlers } from './handlers/print.handler';
import { ReportService } from './services/report.service';
import { registerReportHandlers } from './handlers/report.handler';

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

//ENV load - Determine the correct path based on environment
const envPath = app.isPackaged
  ? path.join(process.resourcesPath, '.env') // Production: resources/.env
  : path.join(__dirname, '../../.env'); // Dev: apps/desktop-pos/.env

// 2. Load the config
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(`⚠️ Failed to load .env from ${envPath}`, result.error);
} else {
  console.log(`✅ Loaded env from: ${envPath}`);
}

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
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const migrationsPath = isDev
  ? path.join(__dirname, '../drizzle')
  : path.join(process.resourcesPath, 'drizzle');

try {
  console.log('Running migrations from:', migrationsPath);
  runMigrations(db, migrationsPath);
  console.log('Migrations applied successfully!');
} catch (err) {
  console.error('Migration failed:', err);
}

// 3. Initialize Repositories
const productRepo = new ProductRepository(db);
const categoryRepo = new CategoryRepository(db);
const orderRepo = new OrderRepository(db);
const syncRepo = new SyncRepository(db);
const userRepo = new UserRepository(db);
const reportRepo = new ReportRepository(db);

const syncService = new SyncService(syncRepo);
const reportService = new ReportService(reportRepo);

// 4. Define API Handlers
registerProductHandlers(productRepo);
registerCategoryHandlers(categoryRepo);
registerOrderHandlers(orderRepo);
registerUserHandlers(userRepo);
registerPrintHandlers();
registerReportHandlers(reportService);

// 5. Start the Sync Loop (Every 60 Seconds)
setInterval(() => {
  syncService.sync();
}, 60 * 1000);

// 6. Run once immediately on startup (Optional, feels snappy)
setTimeout(() => syncService.sync(), 5000);

let win: BrowserWindow | null = null;
import { Menu } from 'electron';

Menu.setApplicationMenu(null);

const createWindow = () => {
  win = new BrowserWindow({
    width: 1024,
    height: 768,
    autoHideMenuBar: true, // important for Windows/Linux
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
    await categoryRepo.seedIfEmpty();
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
