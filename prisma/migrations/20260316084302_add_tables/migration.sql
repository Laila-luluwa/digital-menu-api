-- CreateTable
CREATE TABLE "Table" (
    "id" SERIAL NOT NULL,
    "tableCode" TEXT NOT NULL,
    "restaurantId" INTEGER NOT NULL,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Table_tableCode_key" ON "Table"("tableCode");
