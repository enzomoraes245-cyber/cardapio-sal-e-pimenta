/** Quantidade com a palavra no singular ou no plural: plural(1, 'produto') → "1 produto". */
export function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
