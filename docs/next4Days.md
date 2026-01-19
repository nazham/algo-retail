# Roadmap

## 🛑 The "Kill List" (What we are NOT building)

To survive, you must cut these features immediately. Do not let the Trainee touch them.

1. **Complex Auth:** No JWTs, no Roles. Single "Admin" PIN or just auto-login for now.
2. **Cloud Sync:** Local-first only. Cloud backup is a "Phase 2" feature.
3. **Integrated Payments:** No Stripe/Terminal integration. Just a "Record Card Payment" button.
4. **Stock Management:** No Purchase Orders, Suppliers, or Returns. Just simple `stock - quantity`.
5. **Analytics:** No fancy charts. Just a text-based "End of Day" summary.

---

### 🗓️ The 4-Day Battle Plan

#### **Day 1 (Wed): The Inventory "Backbone"**

**Goal:** We can create products and see them on the screen.

- **Lead (You):**
- **Schema:** Finalize `products`, `categories`, and `orders` tables in Drizzle.
- **Seed Script:** Write a script to insert 50 dummy supermarket items (Milk, Bread, etc.) so the UI isn't empty.
- **Fast Import:** Build a quick "Import from CSV" function (using `csv-parse`) because the client _will_ hand you an Excel sheet on Sunday.

- **Trainee (FE):**
- **Product Card:** Build the UI component for a product (Name, Price, Stock Badge).
- **Inventory Table:** A simple Shadcn Data Table to list all products.
- **Add Product Form:** A modal to create a new item manually (Name, Barcode, Price).

#### **Day 2 (Thu): The "Grid" (Point of Sale)**

**Goal:** We can scan items and calculate a total.

- **Lead (You):**
- **Cart State:** Build the Zustand/Context store for the Cart (`addItem`, `removeItem`, `calculateTotal`, `tax`).
- **Barcode Logic:** Implement a global event listener that catches keystrokes (most scanners act as keyboards) and finds the product.
- **Search Logic:** Fast local search (SQLite `LIKE` query) for when barcodes fail.

- **Trainee (FE):**
- **POS Layout:** Split screen. Left = Product Grid (Searchable). Right = Cart Sidebar (List of items, Total at bottom).
- **Cart Item UI:** Component showing `Product Name x Qty ... $Total` with a delete button.
- **Numpad UI:** On-screen number pad for touch-screen quantity adjustments.

#### **Day 3 (Fri): The "Transaction" (Money & Paper)**

**Goal:** We can take money and print a receipt.

- **Lead (You):**
- **Checkout Logic:** The `createOrder` transaction. (Insert Order -> Insert Items -> Decrement Stock).
- **Printer Integration:** Implement `electron-pos-printer` or `escpos` to send raw data to a thermal printer. **(Highest Risk Task)**.
- **Cash Drawer:** trigger the specific printer code to pop the drawer.

- **Trainee (FE):**
- **Payment Modal:** A big popup: "Total: $50.00". Buttons for "Cash", "Card". Input for "Cash Tendered" (Auto-calculate Change).
- **Receipt Preview:** A simple HTML view of what the receipt looks like.
- **Success Screen:** "Order Complete" -> big button "New Sale" (resets Cart).

#### **Day 4 (Sat): The "Stress Test" & Polish**

**Goal:** Break it before the customer does.

- **Lead (You):**
- **Installer Build:** Run `electron-builder` and test the `.exe` / `.dmg` on a clean machine.
- **End of Day Report:** A simple SQL query summing up sales for the current date.
- **Data Backup:** A button to copy the `sqlite.db` file to the Desktop (Safety net).

- **Trainee (FE):**
- **Polish:** Fix Z-index issues, make buttons bigger for touch, ensure "Loading" states exist.
- **Shortcut Keys:** Map `F1` to Pay, `Esc` to Cancel.

---

### 🏁 Immediate Action: The "Must-Have" Schema

Do not waste time designing this. Copy this into `packages/db-local/src/schema.ts` **RIGHT NOW** so your Trainee can start building the UI.

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

// 1. Categories (Simple grouping)
export const categories = sqliteTable('categories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
});

// 2. Products (The core data)
export const products = sqliteTable('products', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  barcode: text('barcode').notNull().unique(), // Indexed for scanning
  price: real('price').notNull(), // Store as float (e.g. 10.50)
  costPrice: real('cost_price').default(0), // For profit calc later
  stock: integer('stock').notNull().default(0),
  categoryId: text('category_id').references(() => categories.id),
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

// 3. Orders (The Transaction Header)
export const orders = sqliteTable('orders', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  totalAmount: real('total_amount').notNull(),
  paymentMethod: text('payment_method').notNull(), // 'CASH' | 'CARD'
  createdAt: text('created_at').default(sql`(CURRENT_TIMESTAMP)`),
});

// 4. Order Items (The Transaction Details)
export const orderItems = sqliteTable('order_items', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id')
    .notNull()
    .references(() => orders.id),
  productId: text('product_id').notNull(), // Keep ID even if product deleted later
  productName: text('product_name').notNull(), // Snapshot name at time of sale
  quantity: integer('quantity').notNull(),
  priceAtSale: real('price_at_sale').notNull(), // Snapshot price
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
}));
```

### 🧠 Strategic Advice for You (The Lead)

- **Give the Trainee the Easy Wins:** Let them build the "Add Product" form today. It boosts morale and clears your plate for the harder Logic.
- **Don't build "Settings" pages:** Hardcode the Tax Rate (e.g., 0% or 10%) and the Store Name in a constant file for now. Make it dynamic next week.
- **Scanner = Keyboard:** Remember, a barcode scanner is just a fast keyboard that ends with "Enter". You don't need a special driver. Just listen for `keypress`.
