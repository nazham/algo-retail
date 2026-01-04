import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDb, runMigrations } from '@algo/db-local';
import { ProductRepository } from './repositories/product.repo';

// 1. Define where the DB lives
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'algo-local.sqlite');

console.log('Database location:', dbPath);

// 2. Initialize DB
const db = initDb(dbPath);

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

// 4. Define API Handlers
ipcMain.handle('products:get-all', async () => {
  return await productRepo.getAll();
});

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
