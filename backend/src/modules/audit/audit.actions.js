/**
 * Ações registradas no histórico (tabela audit_events). O código é estável; o texto exibido
 * fica no frontend.
 */
export const AUDIT_ACTIONS = Object.freeze({
  // Acesso
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET_BY_EMAIL: 'PASSWORD_RESET_BY_EMAIL',
  ADMIN_CREATED: 'ADMIN_CREATED',
  ADMIN_UPDATED: 'ADMIN_UPDATED',
  ADMIN_BLOCKED: 'ADMIN_BLOCKED',
  ADMIN_UNBLOCKED: 'ADMIN_UNBLOCKED',
  ADMIN_PASSWORD_RESET: 'ADMIN_PASSWORD_RESET',
  // Restaurante
  RESTAURANT_CREATED: 'RESTAURANT_CREATED',
  RESTAURANT_UPDATED: 'RESTAURANT_UPDATED',
  RESTAURANT_SUSPENDED: 'RESTAURANT_SUSPENDED',
  RESTAURANT_REACTIVATED: 'RESTAURANT_REACTIVATED',
  FEATURES_UPDATED: 'FEATURES_UPDATED',
  ESTABLISHMENT_UPDATED: 'ESTABLISHMENT_UPDATED',
  // Financeiro
  SUBSCRIPTION_UPDATED: 'SUBSCRIPTION_UPDATED',
  INVOICES_GENERATED: 'INVOICES_GENERATED',
  INVOICE_CANCELED: 'INVOICE_CANCELED',
  INVOICE_REOPENED: 'INVOICE_REOPENED',
  PAYMENT_RECORDED: 'PAYMENT_RECORDED',
  PAYMENT_VOIDED: 'PAYMENT_VOIDED',
});

/** Autor da ação a partir da sessão do administrador do restaurante (req.auth). */
export function restaurantAdminActor(auth) {
  return { type: 'RESTAURANT_ADMIN', id: auth.adminUserId, name: auth.adminName };
}

/** Autor da ação a partir da sessão do operador do backoffice (req.platformAuth). */
export function platformAdminActor(platformAuth) {
  return { type: 'PLATFORM_ADMIN', id: platformAuth.platformAdminId, name: platformAuth.name };
}
