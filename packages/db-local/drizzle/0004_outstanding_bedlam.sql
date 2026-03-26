ALTER TABLE `order_items` ADD `discount_amount` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `order_items` ADD `discount_type` text DEFAULT 'MANUAL';