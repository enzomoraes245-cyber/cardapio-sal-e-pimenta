import { cx } from './cx.js';

/**
 * Tabela responsiva com uma única marcação: em telas médias ou maiores é uma tabela; abaixo
 * disso cada linha vira um bloco, com o nome da coluna antes do valor (data-label).
 *
 * Colunas: { key, header, cell(row), align?: 'right', primary?: boolean, className? }.
 * A coluna `primary` ocupa a linha inteira no celular (ex.: nome do restaurante).
 */
export function DataTable({ caption, columns, rows, getRowKey, className, rowClassName }) {
  return (
    <div
      className={cx(
        'overflow-hidden rounded-admin-panel border border-admin-line bg-admin-surface',
        className,
      )}
    >
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead className="max-md:sr-only">
          <tr className="border-b border-admin-line bg-admin-subtle">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cx(
                  'px-4 py-2.5 text-left text-xs font-semibold tracking-wide whitespace-nowrap text-admin-muted',
                  column.align === 'right' && 'text-right',
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-admin-line">
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className={cx(
                'align-middle transition-colors hover:bg-admin-subtle/70 max-md:block max-md:px-4 max-md:py-3',
                typeof rowClassName === 'function' ? rowClassName(row) : rowClassName,
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  data-label={column.header}
                  className={cx(
                    'px-4 py-3 text-admin-text max-md:flex max-md:min-h-8 max-md:items-center max-md:justify-between max-md:gap-4 max-md:px-0 max-md:py-1',
                    column.primary
                      ? 'max-md:block max-md:pb-2'
                      : 'max-md:before:shrink-0 max-md:before:text-xs max-md:before:font-medium max-md:before:text-admin-faint max-md:before:content-[attr(data-label)]',
                    column.align === 'right' && 'tabular-nums md:text-right md:whitespace-nowrap',
                    column.className,
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
