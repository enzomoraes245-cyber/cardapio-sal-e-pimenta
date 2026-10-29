-- MOD-03 / MOD-04: descrição curta e detalhada, situação ativo/inativo.

-- DropIndex
DROP INDEX "products_category_id_restaurant_id_idx";

-- DropIndex
DROP INDEX "products_restaurant_id_is_available_idx";

-- A descrição existente passa a ser a descrição curta (renomeada para preservar os dados).
ALTER TABLE "products" RENAME COLUMN "description" TO "short_description";
ALTER TABLE "products"
  ALTER COLUMN "short_description" TYPE VARCHAR(300) USING LEFT("short_description", 300);

-- AlterTable
ALTER TABLE "products"
ADD COLUMN     "detailed_description" VARCHAR(2000),
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "products_category_id_restaurant_id_position_idx" ON "products"("category_id", "restaurant_id", "position");

-- CreateIndex
CREATE INDEX "products_restaurant_id_is_active_is_available_idx" ON "products"("restaurant_id", "is_active", "is_available");
