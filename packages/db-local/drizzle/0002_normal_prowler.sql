CREATE INDEX `idx_order_items_product_id` ON `order_items` (`product_id`);--> statement-breakpoint
CREATE INDEX `idx_orders_is_synced` ON `orders` (`is_synced`);