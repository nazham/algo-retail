import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Reusable column definition
const tenantId = uuid('tenant_id').notNull();

// 1. CATEGORIES
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId,
  name: text('name').notNull(),
});

// 2. PRODUCTS
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId,

  // Core
  name: text('name').notNull(),
  sku: text('sku'), // Not unique here (Multi-tenant)
  parentId: uuid('parent_id'), // Links "Rice 1kg" to "Rice 25kg"

  // Pricing
  price: integer('price').notNull(),
  costPrice: integer('cost_price').default(0),
  wholesalePrice: integer('wholesale_price').default(0),
  taxRate: real('tax_rate').default(0),

  // Stock
  stock: real('current_stock').default(0),
  uom: text('uom').default('pc'),
  reorderPoint: real('reorder_point').default(0),
  safetyStock: real('safety_stock').default(0),
  location: text('location'),

  // ERP
  batchNo: text('batch_no'),
  expiryDate: text('expiry_date'), // ISO Date string
  mfgDate: text('mfg_date'),
  supplier: text('supplier'),
  brand: text('brand'),

  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  categoryId: uuid('category_id').references(() => categories.id),
});

// 3. ORDERS (For Analytics)
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId,
  orderNumber: text('order_number').notNull(), // e.g., INV-123456
  subtotal: integer('subtotal').notNull(),
  taxTotal: integer('tax_total').notNull(),
  discountTotal: integer('discount_total').default(0),
  grandTotal: integer('grand_total').notNull(),
  paymentMethod: text('payment_method'),
  status: text('status').default('COMPLETED'),

  createdAt: timestamp('created_at').defaultNow(),
});

// 4. ORDER ITEMS
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId,
  orderId: uuid('order_id').references(() => orders.id),
  productId: uuid('product_id'),

  productName: text('product_name').notNull(),
  quantity: real('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  subtotal: integer('subtotal').notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId,
  name: text('name').notNull(),
  pin: text('pin').notNull(),
  role: text('role').default('CASHIER'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));
