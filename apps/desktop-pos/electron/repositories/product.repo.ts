import { DB, schema } from '@algo/db-local';
import { sql } from 'drizzle-orm';

export class ProductRepository {
  constructor(private db: DB) {}

  async getAll() {
    return this.db.query.products.findMany({
      where: (products, { eq }) => eq(products.isActive, true),
      with: {
        category: true,
      },
    });
  }

  async bulkUpsert(products: any[]): Promise<{ success: number; failed: number }> {
    if (products.length === 0) return { success: 0, failed: 0 };

    let success = 0;
    let failed = 0;

    // OPTIMIZED STRATEGY: Try Fast Batch Transaction First
    try {
      this.db.transaction((tx) => {
        for (const p of products) {
          tx.insert(schema.products)
            .values({
              id: p.id,
              name: p.name,
              sku: p.sku,
              price: p.price,
              stock: p.stock,
              costPrice: p.costPrice,
              wholesalePrice: p.wholesalePrice,
              taxRate: p.taxRate,
              uom: p.uom,
              reorderPoint: p.reorderPoint,
              location: p.location,
              batchNo: p.batchNo,
              expiryDate: p.expiryDate,
              // We only sync Catalog details. Inventory is managed via Order Deductions.
              categoryId: p.categoryId || p.category || null,
              isActive: p.isActive,
              updatedAt: new Date(p.updatedAt),
            })
            .onConflictDoUpdate({
              target: schema.products.id,
              set: {
                name: sql`excluded.name` as any,
                sku: sql`excluded.sku` as any,
                price: sql`excluded.price` as any,
                costPrice: sql`excluded.cost_price` as any,
                wholesalePrice: sql`excluded.wholesale_price` as any,
                taxRate: sql`excluded.tax_rate` as any,
                uom: sql`excluded.uom` as any,
                reorderPoint: sql`excluded.reorder_point` as any,
                location: sql`excluded.location` as any,
                batchNo: sql`excluded.batch_no` as any,
                expiryDate: sql`excluded.expiry_date` as any,
                // ✅ SMART STOCK SYNC:
                // Local Stock = Cloud Stock (Source of Truth) - Pending Local Sales (Reality)
                // This allows Web Admin stocktakes to propagate WITHOUT wiping out offline sales.
                stock: sql`excluded.current_stock - (
                  SELECT COALESCE(SUM(oi.quantity), 0)
                  FROM order_items oi
                  JOIN orders o ON o.id = oi.order_id
                  WHERE oi.product_id = products.id
                  AND o.is_synced = 0
                )` as any,
                categoryId: sql`excluded.category_id` as any,
                isActive: sql`excluded.is_active` as any,
                updatedAt: sql`excluded.updated_at` as any,
              },
            })
            .run();
        }
      }); // Execute transaction

      // If transaction succeeds, all are successful
      success = products.length;
    } catch (batchError) {
      console.warn('⚠️ Batch Sync Failed. Falling back to One-by-One...', batchError);

      // Fallback: One-by-One (Slow but Robust)
      for (const p of products) {
        try {
          this.db
            .insert(schema.products)
            .values({
              id: p.id,
              name: p.name,
              sku: p.sku,
              price: p.price,
              stock: p.stock,
              costPrice: p.costPrice,
              wholesalePrice: p.wholesalePrice,
              taxRate: p.taxRate,
              uom: p.uom,
              reorderPoint: p.reorderPoint,
              location: p.location,
              batchNo: p.batchNo,
              expiryDate: p.expiryDate,
              categoryId: p.categoryId || p.category || null,
              isActive: p.isActive,
              updatedAt: new Date(p.updatedAt),
            })
            .onConflictDoUpdate({
              target: schema.products.id,
              set: {
                name: sql`excluded.name` as any,
                sku: sql`excluded.sku` as any,
                price: sql`excluded.price` as any,
                costPrice: sql`excluded.cost_price` as any,
                wholesalePrice: sql`excluded.wholesale_price` as any,
                taxRate: sql`excluded.tax_rate` as any,
                uom: sql`excluded.uom` as any,
                reorderPoint: sql`excluded.reorder_point` as any,
                location: sql`excluded.location` as any,
                batchNo: sql`excluded.batch_no` as any,
                expiryDate: sql`excluded.expiry_date` as any,
                // ✅ SMART STOCK SYNC (Fallback):
                stock: sql`excluded.current_stock - (
                  SELECT COALESCE(SUM(oi.quantity), 0)
                  FROM order_items oi
                  JOIN orders o ON o.id = oi.order_id
                  WHERE oi.product_id = products.id
                  AND o.is_synced = 0
                )` as any,
                categoryId: sql`excluded.category_id` as any,
                isActive: sql`excluded.is_active` as any,
                updatedAt: sql`excluded.updated_at` as any,
              },
            })
            .run();
          success++;
        } catch (singleError) {
          console.error(`❌ Failed to sync product ${p.sku} (${p.id})`, singleError);
          failed++;
        }
      }
    }

    return { success, failed };
  }
}
