ALTER TABLE "order_items" ADD COLUMN "discount_amount" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "discount_type" text DEFAULT 'MANUAL';