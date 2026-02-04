import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  real,
  timestamp,
  boolean,
  uniqueIndex,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ========================================
// ENUMS
// ========================================
export const movementTypeEnum = pgEnum('movement_type', [
  'PURCHASE',
  'SALE',
  'RETURN',
  'ADJUSTMENT',
]);

export const adjustmentReasonEnum = pgEnum('adjustment_reason', [
  'DAMAGED',
  'EXPIRED',
  'THEFT',
  'COUNT_ERROR',
  'OTHER',
]);

// Reusable column definition
const tenantId = uuid('tenant_id').notNull();

// 0. SYSTEM SEQUENCES
export const skuSequence = pgTable('sku_sequence', {
  id: integer('id').primaryKey(), // Singleton Row (ID=1)
  currentValue: integer('current_value').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 1. CATEGORIES
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId,
  name: text('name').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 2. PRODUCTS
export const products = pgTable(
  'products',
  {
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

    // Stock (aggregated from batches)
    stock: real('current_stock').default(0),
    uom: text('uom').default('pc'),
    reorderPoint: real('reorder_point').default(0),
    safetyStock: real('safety_stock').default(0),
    location: text('location'),

    // ERP / Batch Info (MVP: treat different batches as different products)
    batchNo: text('batch_no'),
    expiryDate: text('expiry_date'), // ISO Date string
    mfgDate: text('mfg_date'),
    supplier: text('supplier'),
    brand: text('brand'),

    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
    categoryId: uuid('category_id').references(() => categories.id),
  },
  (table) => ({
    tenantSkuIdx: uniqueIndex('tenant_sku_idx').on(table.tenantId, table.sku),
  }),
);

// 3. ORDERS (For Analytics)
// Note: Product batches handled via parent_id field in products table for MVP
// Different batches = different products with unique SKUs
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId,
  orderNumber: text('order_number').notNull(),
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

// 5. CASHIER/USERS (POS users with PIN)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId,
  name: text('name').notNull(),
  pin: text('pin').notNull(),
  role: text('role').default('CASHIER'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. TENANTS (Multi-tenant support with config JSONB)
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: text('plan').default('FREE'),
  maxProducts: integer('max_products').default(1000),
  maxPosTerminals: integer('max_pos_terminals').default(1),
  isActive: boolean('is_active').default(true),
  config: text('config'), // JSONB stored as text
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ========================================
// � BETTER-AUTH TABLES
// (Separate from business tables above)
// ========================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  // Custom fields for multi-tenant
  role: text('role').default('admin'),
  pin: text('pin'),
  tenantId: text('tenantId'),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

// Relations (existing business logic)
export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

// Better-Auth relations
export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

// ========================================
// 7. INVENTORY MOVEMENTS (Immutable Ledger)
// ========================================
export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    type: movementTypeEnum('type').notNull(),
    quantity: real('quantity').notNull(), // Signed: +50 for in, -5 for out
    costPrice: integer('cost_price'), // Snapshot at time of movement (cents)
    reason: adjustmentReasonEnum('reason'), // Only for ADJUSTMENT type
    remarks: text('remarks'),
    referenceId: uuid('reference_id'), // Link to order_id or batch_id
    userId: text('user_id'), // Who made this change
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    productIdx: index('idx_movements_product').on(table.productId),
    tenantIdx: index('idx_movements_tenant').on(table.tenantId),
    createdAtIdx: index('idx_movements_created').on(table.createdAt),
  }),
);

// Inventory movement relations
export const inventoryMovementsRelations = relations(
  inventoryMovements,
  ({ one }) => ({
    product: one(products, {
      fields: [inventoryMovements.productId],
      references: [products.id],
    }),
  }),
);

// 8. AUDIT LOGS (Metadata Changes)
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    userId: text('user_id').notNull(), // Supports both Auth Users and POS Users
    entityType: text('entity_type').notNull(), // 'PRODUCT', 'CATEGORY', etc.
    entityId: uuid('entity_id').notNull(),
    action: text('action').notNull(), // 'CREATE', 'UPDATE', 'DELETE'
    payload: jsonb('payload'), // JSONB - storing the diff
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    tenantEntityIdx: index('idx_audit_tenant_entity').on(
      table.tenantId,
      table.entityType,
      table.entityId,
    ),
    createdAtIdx: index('idx_audit_created_at').on(table.createdAt),
  }),
);
