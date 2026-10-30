-- Bloqueio de acesso de administradores, redefinição de senha por e-mail e histórico de ações.

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('PLATFORM_ADMIN', 'RESTAURANT_ADMIN', 'SYSTEM');

-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "disabled_at" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "admin_user_id" UUID,
    "platform_admin_id" UUID,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actor_type" "AuditActorType" NOT NULL,
    "actor_id" UUID,
    "actor_name" VARCHAR(120),
    "restaurant_id" UUID,
    "action" VARCHAR(60) NOT NULL,
    "entity_type" VARCHAR(40),
    "entity_id" UUID,
    "reason" VARCHAR(300),
    "metadata" JSONB,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_admin_user_id_idx" ON "password_reset_tokens"("admin_user_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_platform_admin_id_idx" ON "password_reset_tokens"("platform_admin_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_expires_at_idx" ON "password_reset_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "audit_events_restaurant_id_occurred_at_idx" ON "audit_events"("restaurant_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "audit_events_occurred_at_idx" ON "audit_events"("occurred_at" DESC);

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_platform_admin_id_fkey" FOREIGN KEY ("platform_admin_id") REFERENCES "platform_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Restrições não representáveis no schema Prisma (adicionadas manualmente)

-- Cada pedido de redefinição pertence a exatamente um usuário: administrador OU operador.
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_single_owner_check" CHECK (("admin_user_id" IS NULL) <> ("platform_admin_id" IS NULL));
