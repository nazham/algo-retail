CREATE TYPE "public"."order_status" AS ENUM('COMPLETED', 'REFUNDED', 'PENDING', 'CANCELLED');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'COMPLETED'::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING (
  CASE 
    WHEN "status" = 'SYNCED' THEN 'COMPLETED'::"public"."order_status"
    ELSE "status"::"public"."order_status"
  END
);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "synced_at" timestamp;