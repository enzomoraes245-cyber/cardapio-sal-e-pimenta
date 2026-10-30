-- Contato do estabelecimento, categorias ativas/ocultas e idempotência dos cadastros.

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "contact_email" VARCHAR(254),
ADD COLUMN     "contact_phone" VARCHAR(20);

-- CreateTable
CREATE TABLE "idempotency_keys" (
    "scope" VARCHAR(60) NOT NULL,
    "owner_id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "resource_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("scope","owner_id","key")
);

-- CreateIndex
CREATE INDEX "idempotency_keys_created_at_idx" ON "idempotency_keys"("created_at");

-- Restrições não representáveis no schema Prisma (adicionadas manualmente)

-- E-mail de contato sempre em minúsculas (a aplicação normaliza antes de gravar).
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_contact_email_lowercase_check" CHECK ("contact_email" IS NULL OR "contact_email" = lower("contact_email"));
