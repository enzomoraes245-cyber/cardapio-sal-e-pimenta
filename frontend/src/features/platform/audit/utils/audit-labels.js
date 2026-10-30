import { formatPrice } from '../../../../utils/format-currency.js';
import { formatDate, formatMonth } from '../../../../utils/format-date.js';

/** Texto de cada ação registrada no histórico (códigos estáveis vindos da API). */
export const AUDIT_ACTION_LABELS = {
  RESTAURANT_CREATED: 'Restaurante cadastrado',
  RESTAURANT_UPDATED: 'Dados cadastrais alterados',
  RESTAURANT_SUSPENDED: 'Restaurante suspenso',
  RESTAURANT_REACTIVATED: 'Restaurante reativado',
  FEATURES_UPDATED: 'Módulos alterados',
  ESTABLISHMENT_UPDATED: 'Dados do estabelecimento alterados pelo restaurante',
  ADMIN_CREATED: 'Responsável cadastrado',
  ADMIN_UPDATED: 'Responsável alterado',
  ADMIN_BLOCKED: 'Acesso bloqueado',
  ADMIN_UNBLOCKED: 'Acesso liberado',
  ADMIN_PASSWORD_RESET: 'Senha redefinida pela plataforma',
  PASSWORD_CHANGED: 'Senha alterada pelo próprio usuário',
  PASSWORD_RESET_BY_EMAIL: 'Senha redefinida pelo link de e-mail',
  SUBSCRIPTION_UPDATED: 'Assinatura alterada',
  INVOICES_GENERATED: 'Mensalidades geradas',
  INVOICE_CANCELED: 'Mensalidade cancelada',
  INVOICE_REOPENED: 'Mensalidade reaberta',
  PAYMENT_RECORDED: 'Pagamento registrado',
  PAYMENT_VOIDED: 'Pagamento estornado',
};

export const ACTOR_LABELS = {
  PLATFORM_ADMIN: 'operador da plataforma',
  RESTAURANT_ADMIN: 'responsável do restaurante',
  SYSTEM: 'sistema',
};

const TONES = {
  RESTAURANT_SUSPENDED: 'danger',
  ADMIN_BLOCKED: 'danger',
  INVOICE_CANCELED: 'danger',
  PAYMENT_VOIDED: 'danger',
  RESTAURANT_REACTIVATED: 'success',
  ADMIN_UNBLOCKED: 'success',
  PAYMENT_RECORDED: 'success',
  RESTAURANT_CREATED: 'accent',
};

export function auditTone(action) {
  return TONES[action] ?? 'neutral';
}

const FIELD_LABELS = {
  name: 'Nome',
  email: 'E-mail',
  contactPhone: 'Telefone de contato',
  contactEmail: 'E-mail de contato',
  customization: 'Personalização visual',
  qrcode: 'QR Code',
  realtime: 'Atualização automática',
  productModal: 'Modal de detalhes',
  monthlyAmount: 'Mensalidade',
  dueDay: 'Dia de vencimento',
  startedAt: 'Início da cobrança',
};

function formatValue(field, value) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'liberado' : 'bloqueado';
  if (field === 'monthlyAmount') return formatPrice(value);
  if (field === 'startedAt') return formatDate(value);
  return String(value);
}

/**
 * Linhas de detalhe de um evento: alterações (antes → depois), pessoa afetada, valores.
 * Só usa dados já registrados; campos desconhecidos são ignorados.
 */
export function describeAuditEvent({ action, metadata }) {
  if (!metadata) return [];
  const lines = [];
  if (metadata.changes) {
    for (const [field, { from, to }] of Object.entries(metadata.changes)) {
      const label = FIELD_LABELS[field] ?? field;
      lines.push(`${label}: ${formatValue(field, from)} → ${formatValue(field, to)}`);
    }
  }
  if (action.startsWith('ADMIN_') && metadata.email) {
    lines.push(`${metadata.name} (${metadata.email})`);
  }
  if (action === 'RESTAURANT_CREATED' && metadata.monthlyAmount) {
    lines.push(
      `Mensalidade de ${formatPrice(metadata.monthlyAmount)}, vencimento no dia ${metadata.dueDay}`,
    );
  }
  if (action === 'RESTAURANT_REACTIVATED' && metadata.suspensionReason) {
    lines.push(`Suspensão encerrada: "${metadata.suspensionReason}"`);
  }
  if (metadata.referenceMonth) {
    lines.push(`Competência ${formatMonth(metadata.referenceMonth)}`);
  }
  if (metadata.amount && action.startsWith('PAYMENT_')) {
    lines.push(
      `${formatPrice(metadata.amount)}${metadata.paidOn ? ` pago em ${formatDate(metadata.paidOn)}` : ''}`,
    );
  }
  if (action === 'INVOICES_GENERATED' && metadata.month) {
    lines.push(`Competência ${formatMonth(metadata.month)}: ${metadata.created} gerada(s)`);
  }
  return lines;
}
