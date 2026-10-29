-- CreateEnum
CREATE TYPE "RestaurantStatus" AS ENUM ('ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "FeatureKey" AS ENUM ('CUSTOMIZATION', 'QRCODE', 'REALTIME', 'PRODUCT_MODAL');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('OPEN', 'PAID', 'CANCELED');

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "status" "RestaurantStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "suspended_at" TIMESTAMPTZ(3),
ADD COLUMN     "suspension_reason" VARCHAR(300);

-- CreateTable
CREATE TABLE "restaurant_features" (
    "restaurant_id" UUID NOT NULL,
    "feature" "FeatureKey" NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "restaurant_features_pkey" PRIMARY KEY ("restaurant_id","feature")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "restaurant_id" UUID NOT NULL,
    "monthly_amount" DECIMAL(10,2) NOT NULL,
    "due_day" INTEGER NOT NULL,
    "started_at" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("restaurant_id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "reference_month" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "due_date" DATE NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "paid_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_admins" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "platform_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_sessions" (
    "id" UUID NOT NULL,
    "platform_admin_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoices_status_due_date_idx" ON "invoices"("status", "due_date");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_restaurant_id_reference_month_key" ON "invoices"("restaurant_id", "reference_month");

-- CreateIndex
CREATE UNIQUE INDEX "platform_admins_email_key" ON "platform_admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "platform_sessions_token_hash_key" ON "platform_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "platform_sessions_platform_admin_id_idx" ON "platform_sessions"("platform_admin_id");

-- CreateIndex
CREATE INDEX "platform_sessions_expires_at_idx" ON "platform_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "restaurants_status_idx" ON "restaurants"("status");

-- AddForeignKey
ALTER TABLE "restaurant_features" ADD CONSTRAINT "restaurant_features_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "platform_sessions" ADD CONSTRAINT "platform_sessions_platform_admin_id_fkey" FOREIGN KEY ("platform_admin_id") REFERENCES "platform_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Restrições de integridade não representáveis no schema Prisma (adicionadas manualmente)
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_monthly_amount_non_negative_check" CHECK ("monthly_amount" >= 0);

ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_due_day_check" CHECK ("due_day" BETWEEN 1 AND 28);

ALTER TABLE "invoices" ADD CONSTRAINT "invoices_amount_non_negative_check" CHECK ("amount" >= 0);

-- O mês de referência é sempre o primeiro dia do mês.
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_reference_month_first_day_check" CHECK (EXTRACT(DAY FROM "reference_month") = 1);
