// packages/db-local/scripts/import-gsheet.ts
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { products, categories } from '../src/schema';
import { eq } from 'drizzle-orm';

// 1. SETUP DB CONNECTION
const dbPath = process.env.DB_FILE || 'sqlite.db';
console.log(`🔌 Connecting to database at: ${dbPath}`);
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

// 2. HELPER: CURRENCY CONVERTER (Rs -> Cents)
const parseCurrency = (value: string | number): number => {
  if (!value) return 0;
  const clean = String(value).replace(/[^0-9.]/g, '');
  return Math.round(parseFloat(clean) * 100) || 0;
};

// 3. HELPER: DATE PARSER (DD/MM/YYYY -> YYYY-MM-DD)
const parseDate = (value: string): string | null => {
  if (!value) return null;
  // Handle formats like "1/10/2027" or "01/10/2027"
  const parts = value.split(/[/-]/);
  if (parts.length === 3) {
    // Assumption: DD/MM/YYYY (Sri Lanka Standard)
    // Pad with 0 to ensure YYYY-MM-DD format (e.g. 2027-01-10)
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return value;
};

// 4. MAIN IMPORT FUNCTION
const importData = async (filePath: string) => {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`📖 Reading CSV: ${filePath}`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // Parse CSV
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  console.log(`📊 Found ${records.length} items. Starting import...`);

  // Cache Categories
  const categoryMap = new Map<string, string>();
  const existingCats = sqlite.prepare('SELECT id, name FROM categories').all() as {
    id: string;
    name: string;
  }[];
  existingCats.forEach((c) => categoryMap.set(c.name.toLowerCase(), c.id));

  let successCount = 0;
  let skipCount = 0;

  for (const row of records as Record<string, string>[]) {
    try {
      // A. HANDLE CATEGORY
      const catName = row['Category']?.trim() || 'Uncategorized';
      let catId = categoryMap.get(catName.toLowerCase());

      if (!catId) {
        catId = crypto.randomUUID();
        db.insert(categories)
          .values({
            id: catId,
            name: catName,
          })
          .run();
        categoryMap.set(catName.toLowerCase(), catId);
        console.log(`   ✨ Created Category: ${catName}`);
      }

      // B. PREPARE PRODUCT DATA
      // Priority: Barcode -> Item ID -> Generated
      const sku = row['Barcode/SKU'] || row['Item ID'] || `GEN-${crypto.randomUUID().slice(0, 8)}`;

      const productData = {
        id: crypto.randomUUID(),
        name: row['Product Name'],
        sku: sku,

        // Pricing
        price: parseCurrency(row['MRP']),
        costPrice: parseCurrency(row['Cost Price']),
        wholesalePrice: parseCurrency(row['Wholesale Price']),
        taxRate: parseFloat(row['Tax rate'] || '0'), // Default 0 if missing

        // Inventory
        stock: parseFloat(row['Stock Quantity'] || '0'),
        uom: row['UOM'] || 'pc', // ✅ FIXED: Matches CSV 'UOM'
        reorderPoint: parseFloat(row['Reorder Point'] || '0'),
        safetyStock: parseFloat(row['Safety stock'] || '0'), // ✅ ADDED: Matches CSV 'Safety stock'
        location: row['Inventory Location'],

        // Meta
        batchNo: row['Batch NO'],
        supplier: row['Supplier'],
        brand: row['Brand'],
        expiryDate: parseDate(row['Expiry date']),
        mfgDate: parseDate(row['Manufacture Date']),

        categoryId: catId,
      };

      // C. INSERT
      try {
        db.insert(products).values(productData).run();
        successCount++;
      } catch (e: any) {
        if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          console.warn(`   ⚠️ SKU Conflict: ${sku} (${row['Product Name']}) - SKIPPED`);
          skipCount++;
        } else {
          throw e;
        }
      }
    } catch (err) {
      console.error(`   ❌ Error processing row: ${JSON.stringify(row)}`, err);
    }
  }

  console.log('------------------------------------------------');
  console.log(`✅ Import Complete!`);
  console.log(`📥 Added: ${successCount}`);
  console.log(`⏭️ Skipped: ${skipCount}`);
  console.log('------------------------------------------------');
};

// RUN IT
// Usage: pnpm exec tsx scripts/import-gsheet.ts ./data.csv
const csvFile = process.argv[2] || 'products.csv';
importData(csvFile);
