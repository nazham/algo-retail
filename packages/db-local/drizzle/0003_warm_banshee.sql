ALTER TABLE `order_items` ADD `cost_price` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `orders` ADD `retry_count` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `orders` ADD `sync_error` text;