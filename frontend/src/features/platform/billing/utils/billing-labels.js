/** Formas de pagamento aceitas no registro manual (mesmos códigos da API). */
export const PAYMENT_METHOD_LABELS = {
  PIX: 'Pix',
  BOLETO: 'Boleto',
  TRANSFER: 'Transferência',
  CARD: 'Cartão',
  CASH: 'Dinheiro',
  OTHER: 'Outra',
};

/** Forma de pagamento para exibição; baixas antigas não registravam a forma. */
export function paymentMethodLabel(method) {
  return PAYMENT_METHOD_LABELS[method] ?? 'Forma não registrada';
}

/** Situação de uma mensalidade (calculada pela API). */
export const INVOICE_SITUATIONS = {
  upcoming: { label: 'A vencer', tone: 'warning' },
  overdue: { label: 'Vencida', tone: 'danger' },
  paid: { label: 'Paga', tone: 'success' },
  canceled: { label: 'Cancelada', tone: 'neutral' },
};

/** Filtros de situação: valor na URL (?situacao=) → valor da API, com o critério exibido. */
export const SITUATION_FILTERS = [
  {
    value: 'em-aberto',
    label: 'Em aberto',
    situation: 'open',
    description: 'Ainda não pagas nem canceladas, por vencimento (as mais antigas primeiro).',
  },
  {
    value: 'vencidas',
    label: 'Vencidas',
    situation: 'overdue',
    description: 'Em aberto com vencimento anterior a hoje.',
  },
  {
    value: 'a-vencer',
    label: 'A vencer',
    situation: 'upcoming',
    description: 'Em aberto com vencimento hoje ou depois.',
  },
  {
    value: 'pagas',
    label: 'Pagas',
    situation: 'paid',
    description: 'Com pagamento registrado. Pagamentos estornados não contam.',
  },
  {
    value: 'canceladas',
    label: 'Canceladas',
    situation: 'canceled',
    description: 'Canceladas com motivo; podem ser reabertas.',
  },
  {
    value: 'todas',
    label: 'Todas',
    situation: undefined,
    description: 'Todas as mensalidades, da competência mais recente para a mais antiga.',
  },
];
