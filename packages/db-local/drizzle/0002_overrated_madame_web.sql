CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text,
	`name` text NOT NULL
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_customer_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`reference_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_customer_ledger`("id", "customer_id", "type", "amount", "reference_id", "created_at") SELECT "id", "customer_id", "type", "amount", "reference_id", "created_at" FROM `customer_ledger`;--> statement-breakpoint
DROP TABLE `customer_ledger`;--> statement-breakpoint
ALTER TABLE `__new_customer_ledger` RENAME TO `customer_ledger`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text,
	`order_number` text NOT NULL,
	`status` text DEFAULT 'COMPLETED',
	`payment_method` text DEFAULT 'CASH' NOT NULL,
	`subtotal` integer NOT NULL,
	`tax_total` integer DEFAULT 0,
	`discount_total` integer DEFAULT 0,
	`grand_total` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`is_synced` integer DEFAULT false
);
--> statement-breakpoint
INSERT INTO `__new_orders`("id", "tenant_id", "order_number", "status", "payment_method", "subtotal", "tax_total", "discount_total", "grand_total", "created_at", "is_synced") SELECT "id", "tenant_id", "order_number", "status", "payment_method", "subtotal", "tax_total", "discount_total", "grand_total", "created_at", "is_synced" FROM `orders`;--> statement-breakpoint
DROP TABLE `orders`;--> statement-breakpoint
ALTER TABLE `__new_orders` RENAME TO `orders`;--> statement-breakpoint
CREATE TABLE `__new_products` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text,
	`name` text NOT NULL,
	`sku` text,
	`parent_id` text,
	`price` integer NOT NULL,
	`cost_price` integer DEFAULT 0,
	`wholesale_price` integer DEFAULT 0,
	`tax_rate` real DEFAULT 0,
	`current_stock` real DEFAULT 0,
	`uom` text DEFAULT 'pc',
	`reorder_point` real DEFAULT 0,
	`safety_stock` real DEFAULT 0,
	`location` text,
	`batch_no` text,
	`expiry_date` text,
	`mfg_date` text,
	`supplier` text,
	`brand` text,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`category_id` text,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_products`("id", "tenant_id", "name", "sku", "parent_id", "price", "cost_price", "wholesale_price", "tax_rate", "current_stock", "uom", "reorder_point", "safety_stock", "location", "batch_no", "expiry_date", "mfg_date", "supplier", "brand", "updated_at", "category_id") SELECT "id", "tenant_id", "name", "sku", "parent_id", "price", "cost_price", "wholesale_price", "tax_rate", "current_stock", "uom", "reorder_point", "safety_stock", "location", "batch_no", "expiry_date", "mfg_date", "supplier", "brand", "updated_at", "category_id" FROM `products`;--> statement-breakpoint
DROP TABLE `products`;--> statement-breakpoint
ALTER TABLE `__new_products` RENAME TO `products`;--> statement-breakpoint
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);