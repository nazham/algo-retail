import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

// 1. Reusable column for multi-tenancy (The "Future Proofing")
const tenantId = uuid('tenant_id').notNull();

// 2. Products Table (Cloud Master Copy)
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId,
  name: text('name').notNull(),
  sku: text('sku'),
  description: text('description'),
  price: integer('price').notNull(), // Stored in cents (Rs. 100.00 = 10000)
  stock: integer('stock').notNull().default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Orders Table (For Reporting)
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId,
  orderNumber: text('order_number').notNull(), // e.g., INV-123456
  subtotal: integer('subtotal').notNull(),
  taxTotal: integer('tax_total').notNull(),
  discountTotal: integer('discount_total').default(0),
  grandTotal: integer('grand_total').notNull(),
  paymentMethod: text('payment_method').default('CASH'), // CASH, CARD
  status: text('status').default('COMPLETED'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Order Items (Detail)
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: tenantId,
  orderId: uuid('order_id').references(() => orders.id),
  productId: uuid('product_id').references(() => products.id),
  productName: text('product_name').notNull(), // Snapshot name at time of sale
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  subtotal: integer('subtotal').notNull(),
});
