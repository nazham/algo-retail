import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

// 1. CATEGORIES
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id'), // Optional locally, but good for alignment
  name: text('name').notNull(),
});

// 2. PRODUCTS (The Master Table)
export const products = sqliteTable('products', {
  id: text('id').primaryKey(), // UUID
  tenantId: text('tenant_id'), // Kept for type alignment with Cloud

  // Core Identity
  name: text('name').notNull(),
  sku: text('sku').unique(), // Barcode
  parentId: text('parent_id'), // Links "Rice 1kg" to "Rice 25kg"

  // Pricing (Cents)
  price: integer('price').notNull(), // MRP
  costPrice: integer('cost_price').default(0),
  wholesalePrice: integer('wholesale_price').default(0),
  taxRate: real('tax_rate').default(0),

  // Inventory
  stock: real('current_stock').default(0),
  uom: text('uom').default('pc'), // 'kg', 'box', 'l'
  reorderPoint: real('reorder_point').default(0),
  safetyStock: real('safety_stock').default(0),
  location: text('location'),

  // ERP / GSheet Data
  batchNo: text('batch_no'),
  expiryDate: text('expiry_date'), // YYYY-MM-DD
  mfgDate: text('mfg_date'),
  supplier: text('supplier'),
  brand: text('brand'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),

  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  categoryId: text('category_id').references(() => categories.id),
});

// 3. ORDERS
export const orders = sqliteTable(
  'orders',
  {
    id: text('id').primaryKey(),
    tenantId: text('tenant_id'), // Useful for "Offline Backup" verification
    orderNumber: text('order_number').notNull(),
    status: text('status').default('COMPLETED'),
    paymentMethod: text('payment_method').notNull().default('CASH'),

    // Totals (Cents)
    subtotal: integer('subtotal').notNull(),
    taxTotal: integer('tax_total').default(0),
    discountTotal: integer('discount_total').default(0),
    grandTotal: integer('grand_total').notNull(),

    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
    isSynced: integer('is_synced', { mode: 'boolean' }).default(false),
  },
  (table) => ({
    isSyncedIdx: index('idx_orders_is_synced').on(table.isSynced),
  }),
);

// 4. ORDER ITEMS
export const orderItems = sqliteTable(
  'order_items',
  {
    id: text('id').primaryKey(),
    orderId: text('order_id')
      .notNull()
      .references(() => orders.id),
    productId: text('product_id')
      .notNull()
      .references(() => products.id),

    // Snapshots
    productName: text('product_name').notNull(),
    quantity: real('quantity').notNull(),
    unitPrice: integer('unit_price').notNull(),
    subtotal: integer('subtotal').notNull(),
  },
  (table) => ({
    productIdIdx: index('idx_order_items_product_id').on(table.productId),
  }),
);

// 4. CUSTOMERS & LEDGER (Pothe System)
export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone'),
  loyaltyPoints: integer('loyalty_points').default(0),
});

export const customerLedger = sqliteTable('customer_ledger', {
  id: text('id').primaryKey(),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id),
  type: text('type').notNull(), // SALE (Debt) or PAYMENT (Repayment)
  amount: integer('amount').notNull(), // Value in cents
  referenceId: text('reference_id'), // Order ID
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  pin: text('pin').notNull(), // Simple PIN for MVP
  role: text('role').notNull().default('CASHIER'), // ADMIN, CASHIER
});

// Relations
export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many }) => ({
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
