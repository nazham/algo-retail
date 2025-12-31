import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// 1. PRODUCTS (Master Data)
export const products = sqliteTable("products", {
  id: text("id").primaryKey(), // UUID
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  price: integer("price").notNull(), // Cents
  stock: real("current_stock").default(0),
  taxRate: real("tax_rate").default(0),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// 2. ORDERS (Transactions)
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  orderNumber: text("order_number").notNull(), // INV-001
  status: text("status").notNull().default("PENDING"), // PENDING, COMPLETED, VOID

  // Money (Stored as integers/cents)
  subtotal: integer("subtotal").notNull(),
  taxTotal: integer("tax_total").default(0),
  discountTotal: integer("discount_total").default(0),
  grandTotal: integer("grand_total").notNull(),

  // Metadata
  customerId: text("customer_id"), // Nullable for walk-ins
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  isSynced: integer("is_synced", { mode: "boolean" }).default(false),
});

// 3. ORDER ITEMS (Line Items)
export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),

  // Snapshots (Protect history!)
  productName: text("product_name").notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  subtotal: integer("subtotal").notNull(),
});

// 4. CUSTOMERS & LEDGER (Pothe System)
export const customers = sqliteTable("customers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone"),
  loyaltyPoints: integer("loyalty_points").default(0),
});

export const customerLedger = sqliteTable("customer_ledger", {
  id: text("id").primaryKey(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id),
  type: text("type").notNull(), // SALE (Debt) or PAYMENT (Repayment)
  amount: integer("amount").notNull(), // Value in cents
  referenceId: text("reference_id"), // Order ID
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
