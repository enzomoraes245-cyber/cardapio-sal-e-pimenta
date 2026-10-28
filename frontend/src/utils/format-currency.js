const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Formata o preço recebido da API (string decimal, ex.: "12.50") em reais. */
export function formatPrice(value) {
  return BRL_FORMATTER.format(Number(value));
}
