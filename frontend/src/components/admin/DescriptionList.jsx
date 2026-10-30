import { cx } from './cx.js';

/** Pares rótulo/valor para leitura (dados cadastrais, assinatura, situação). */
export function DescriptionList({ items, columns = 2, className }) {
  return (
    <dl className={cx('grid gap-x-8 gap-y-5', columns === 2 && 'sm:grid-cols-2', className)}>
      {items.map(({ label, value, wide }) => (
        <div key={label} className={cx('min-w-0', wide && 'sm:col-span-2')}>
          <dt className="text-xs font-medium text-admin-faint">{label}</dt>
          <dd className="mt-1 text-sm break-words text-admin-text">
            {value ?? <span className="text-admin-faint">Não informado</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
