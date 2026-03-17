-- Add RestaurantUser
CREATE TABLE IF NOT EXISTS "RestaurantUser" (
    "id" SERIAL NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RestaurantUser_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RestaurantUser_restaurantId_userId_key" ON "RestaurantUser" ("restaurantId", "userId");

-- Add Tag
CREATE TABLE IF NOT EXISTS "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "restaurantId" INTEGER NOT NULL,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Tag_restaurantId_name_key" ON "Tag" ("restaurantId", "name");

-- Add MenuItemTag
CREATE TABLE IF NOT EXISTS "MenuItemTag" (
    "id" SERIAL NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    CONSTRAINT "MenuItemTag_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "MenuItemTag_menuItemId_tagId_key" ON "MenuItemTag" ("menuItemId", "tagId");

-- Add Inventory
CREATE TABLE IF NOT EXISTS "Inventory" (
    "id" SERIAL NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "quantityAvailable" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Inventory_menuItemId_key" ON "Inventory" ("menuItemId");

-- Backfill RestaurantUser from User
INSERT INTO "RestaurantUser" ("restaurantId", "userId", "role", "createdAt")
SELECT "restaurantId", id, role, NOW()
FROM "User"
ON CONFLICT ("restaurantId", "userId") DO NOTHING;

-- Backfill Inventory from MenuItem.quantity
INSERT INTO "Inventory" ("menuItemId", "quantityAvailable", "updatedAt")
SELECT id, quantity, NOW()
FROM "MenuItem"
ON CONFLICT ("menuItemId") DO NOTHING;

-- Foreign keys
ALTER TABLE "RestaurantUser" DROP CONSTRAINT IF EXISTS "RestaurantUser_restaurantId_fkey";
ALTER TABLE "RestaurantUser"
  ADD CONSTRAINT "RestaurantUser_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "RestaurantUser" DROP CONSTRAINT IF EXISTS "RestaurantUser_userId_fkey";
ALTER TABLE "RestaurantUser"
  ADD CONSTRAINT "RestaurantUser_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Tag" DROP CONSTRAINT IF EXISTS "Tag_restaurantId_fkey";
ALTER TABLE "Tag"
  ADD CONSTRAINT "Tag_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MenuItemTag" DROP CONSTRAINT IF EXISTS "MenuItemTag_menuItemId_fkey";
ALTER TABLE "MenuItemTag"
  ADD CONSTRAINT "MenuItemTag_menuItemId_fkey"
  FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MenuItemTag" DROP CONSTRAINT IF EXISTS "MenuItemTag_tagId_fkey";
ALTER TABLE "MenuItemTag"
  ADD CONSTRAINT "MenuItemTag_tagId_fkey"
  FOREIGN KEY ("tagId") REFERENCES "Tag"(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Inventory" DROP CONSTRAINT IF EXISTS "Inventory_menuItemId_fkey";
ALTER TABLE "Inventory"
  ADD CONSTRAINT "Inventory_menuItemId_fkey"
  FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"(id) ON DELETE CASCADE ON UPDATE CASCADE;
