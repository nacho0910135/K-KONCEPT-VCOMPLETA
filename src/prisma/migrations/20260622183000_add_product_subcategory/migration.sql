ALTER TABLE "Product" ALTER COLUMN "serialNumber" DROP NOT NULL;

ALTER TABLE "Product" ADD COLUMN "subcategoryId" TEXT;

CREATE INDEX "Product_subcategoryId_idx" ON "Product"("subcategoryId");

ALTER TABLE "Product"
ADD CONSTRAINT "Product_subcategoryId_fkey"
FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
