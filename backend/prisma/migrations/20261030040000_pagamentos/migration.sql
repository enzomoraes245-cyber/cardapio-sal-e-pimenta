-- Pagamentos de mensalidades com autor e estorno, cancelamento de faturas com motivo e
-- preservação do histórico financeiro (faturas e pagamentos não são apagados com o restaurante).

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'BOLETO', 'TRANSFER', 'CARD', 'CASH', 'OTHER');

-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_restaurant_id_fkey";

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "cancel_reason" VARCHAR(300),
ADD COLUMN     "canceled_at" TIMESTAMPTZ(3),
ADD COLUMN     "canceled_by_id" UUID,
ADD COLUMN     "canceled_by_name" VARCHAR(120);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "active_invoice_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "paid_on" DATE NOT NULL,
    "method" "PaymentMethod",
    "notes" VARCHAR(300),
    "recorded_by_id" UUID,
    "recorded_by_name" VARCHAR(120),
    "recorded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "voided_at" TIMESTAMPTZ(3),
    "voided_by_id" UUID,
    "voided_by_name" VARCHAR(120),
    "void_reason" VARCHAR(300),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payments_active_invoice_id_key" ON "payments"("active_invoice_id");

-- CreateIndex
CREATE INDEX "payments_invoice_id_idx" ON "payments"("invoice_id");

-- CreateIndex
CREATE INDEX "payments_restaurant_id_paid_on_idx" ON "payments"("restaurant_id", "paid_on");

-- CreateIndex
CREATE INDEX "payments_paid_on_idx" ON "payments"("paid_on");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_id_restaurant_id_key" ON "invoices"("id", "restaurant_id");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_restaurant_id_fkey" FOREIGN KEY ("invoice_id", "restaurant_id") REFERENCES "invoices"("id", "restaurant_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Dados existentes (adicionado manualmente)

-- Baixas anteriores ao controle de pagamentos: cada fatura paga recebe um pagamento com o valor da
-- fatura e a data da baixa no fuso do negócio (America/Sao_Paulo, o padrão de APP_TIMEZONE).
-- A forma de pagamento e o autor não eram registrados e ficam em branco.
INSERT INTO "payments" ("id", "invoice_id", "restaurant_id", "active_invoice_id", "amount", "paid_on", "notes", "recorded_at")
SELECT gen_random_uuid(), "id", "restaurant_id", "id", "amount",
       (COALESCE("paid_at", "updated_at") AT TIME ZONE 'America/Sao_Paulo')::date,
       'Baixa registrada antes do controle de pagamentos.',
       COALESCE("paid_at", "updated_at")
FROM "invoices"
WHERE "status" = 'PAID';

-- Cancelamentos anteriores: a data do cancelamento é a da última alteração da fatura (sem motivo
-- nem autor, que não eram registrados).
UPDATE "invoices" SET "canceled_at" = "updated_at" WHERE "status" = 'CANCELED';

-- Restrições de integridade não representáveis no schema Prisma (adicionadas manualmente)

ALTER TABLE "payments" ADD CONSTRAINT "payments_amount_non_negative_check" CHECK ("amount" >= 0);

-- Pagamento válido aponta para a própria fatura em active_invoice_id; estornado tem data e motivo
-- do estorno e deixa de ocupar a fatura.
ALTER TABLE "payments" ADD CONSTRAINT "payments_void_state_check" CHECK (
  ("voided_at" IS NULL AND "active_invoice_id" = "invoice_id" AND "void_reason" IS NULL)
  OR ("voided_at" IS NOT NULL AND "active_invoice_id" IS NULL AND "void_reason" IS NOT NULL)
);

-- Só a fatura cancelada tem data de cancelamento.
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_canceled_state_check" CHECK (("status" = 'CANCELED') = ("canceled_at" IS NOT NULL));
