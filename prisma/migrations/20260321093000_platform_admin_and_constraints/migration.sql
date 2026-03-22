DO $$
BEGIN
  ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'PLATFORM_ADMIN';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Inventory"
DROP CONSTRAINT IF EXISTS "Inventory_quantity_available_non_negative";

ALTER TABLE "Inventory"
ADD CONSTRAINT "Inventory_quantity_available_non_negative"
CHECK ("quantityAvailable" >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS "TableSession_active_table_unique"
ON "TableSession" ("tableId")
WHERE "status" = 'ACTIVE';
