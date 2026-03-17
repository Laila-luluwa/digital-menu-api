-- Manual migration to align schema changes with existing data

-- 1) Enums
DO $$ BEGIN
  CREATE TYPE "OrderStatus" AS ENUM ('QUEUED','COOKING','READY','SERVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE','EXPIRED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) Table unique constraint per tenant
ALTER TABLE "Table" DROP CONSTRAINT IF EXISTS "Table_tableCode_key";
ALTER TABLE "Table" ADD CONSTRAINT "Table_restaurantId_tableCode_key" UNIQUE ("restaurantId", "tableCode");

-- 3) Convert Order.status to enum safely
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "status_new" "OrderStatus" NOT NULL DEFAULT 'QUEUED';
UPDATE "Order"
SET "status_new" = (CASE LOWER("status")
  WHEN 'queued' THEN 'QUEUED'
  WHEN 'cooking' THEN 'COOKING'
  WHEN 'ready' THEN 'READY'
  WHEN 'served' THEN 'SERVED'
  ELSE 'QUEUED'
END)::"OrderStatus";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "status";
ALTER TABLE "Order" RENAME COLUMN "status_new" TO "status";

-- 4) Ensure TableSession exists (it was not created in previous migrations)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TABLE IF NOT EXISTS "TableSession" (
    "id" SERIAL NOT NULL,
    "tableId" INTEGER NOT NULL,
    "token" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT "TableSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "TableSession_token_key" ON "TableSession"("token");
ALTER TABLE "TableSession" DROP CONSTRAINT IF EXISTS "TableSession_tableId_fkey";
ALTER TABLE "TableSession"
  ADD CONSTRAINT "TableSession_tableId_fkey"
  FOREIGN KEY ("tableId") REFERENCES "Table"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5) Convert TableSession.status to enum safely
ALTER TABLE "TableSession" ADD COLUMN IF NOT EXISTS "status_new" "SessionStatus" NOT NULL DEFAULT 'ACTIVE';
UPDATE "TableSession"
SET "status_new" = (CASE UPPER("status")
  WHEN 'ACTIVE' THEN 'ACTIVE'
  WHEN 'EXPIRED' THEN 'EXPIRED'
  ELSE 'ACTIVE'
END)::"SessionStatus";
ALTER TABLE "TableSession" DROP COLUMN IF EXISTS "status";
ALTER TABLE "TableSession" RENAME COLUMN "status_new" TO "status";

-- 6) Add priceSnapshot to OrderItem and backfill
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "priceSnapshot" DOUBLE PRECISION;
UPDATE "OrderItem" oi
SET "priceSnapshot" = mi."price"
FROM "MenuItem" mi
WHERE oi."menuItemId" = mi.id;
ALTER TABLE "OrderItem" ALTER COLUMN "priceSnapshot" SET NOT NULL;

-- 7) Add sessionId to Order and backfill
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "sessionId" INTEGER;

-- Ensure tables exist for orders (idempotent)
INSERT INTO "Table" ("tableCode", "restaurantId")
SELECT DISTINCT o."tableCode", o."restaurantId"
FROM "Order" o
LEFT JOIN "Table" t
  ON t."tableCode" = o."tableCode" AND t."restaurantId" = o."restaurantId"
WHERE t.id IS NULL;

-- Create sessions for existing orders and link them
WITH sessions AS (
  INSERT INTO "TableSession" ("tableId", "expiresAt", "status")
  SELECT t.id, NOW() + interval '2 hours', 'ACTIVE'
  FROM "Order" o
  JOIN "Table" t
    ON t."tableCode" = o."tableCode" AND t."restaurantId" = o."restaurantId"
  RETURNING id, "tableId"
)
UPDATE "Order" o
SET "sessionId" = s.id
FROM sessions s
JOIN "Table" t ON t.id = s."tableId"
WHERE o."tableCode" = t."tableCode" AND o."restaurantId" = t."restaurantId";

ALTER TABLE "Order" ALTER COLUMN "sessionId" SET NOT NULL;

-- 8) Foreign keys
ALTER TABLE "MenuItem" DROP CONSTRAINT IF EXISTS "MenuItem_restaurantId_fkey";
ALTER TABLE "MenuItem"
  ADD CONSTRAINT "MenuItem_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Table" DROP CONSTRAINT IF EXISTS "Table_restaurantId_fkey";
ALTER TABLE "Table"
  ADD CONSTRAINT "Table_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_restaurantId_fkey";
ALTER TABLE "User"
  ADD CONSTRAINT "User_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_restaurantId_fkey";
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_sessionId_fkey";
ALTER TABLE "Order"
  ADD CONSTRAINT "Order_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "TableSession"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_orderId_fkey";
ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem" DROP CONSTRAINT IF EXISTS "OrderItem_menuItemId_fkey";
ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_menuItemId_fkey"
  FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

