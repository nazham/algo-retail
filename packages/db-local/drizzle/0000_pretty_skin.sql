CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `customer_ledger` (
	`id` text PRIMARY KEY NOT NULL,
	`customer_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`reference_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`loyalty_points` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`quantity` real NOT NULL,
	`unit_price` integer NOT NULL,
	`subtotal` integer NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
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
CREATE TABLE `products` (
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
CREATE UNIQUE INDEX `products_sku_unique` ON `products` (`sku`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`pin` text NOT NULL,
	`role` text DEFAULT 'CASHIER' NOT NULL
);
