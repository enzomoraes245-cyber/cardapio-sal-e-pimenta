import { Link } from 'react-router';
import { cx } from './cx.js';
import { ChevronLeftIcon } from './icons.jsx';

/** Id do título de cada página: o shell move o foco para ele a cada navegação. */
export const PAGE_TITLE_ID = 'titulo-da-pagina';

/** Cabeçalho de página: voltar, título, descrição, metadados e ações principais. */
export function PageHeader({ title, description, eyebrow, back, meta, actions, className }) {
  return (
    <header className={cx('space-y-4', className)}>
      {back && (
        <Link
          to={back.to}
          className="-ml-1 inline-flex items-center gap-1 rounded-md px-1 text-[13px] font-medium text-admin-muted hover:text-admin-text focus-visible:outline-2 focus-visible:outline-admin-accent"
        >
          <ChevronLeftIcon size={16} />
          {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="min-w-0 space-y-1.5">
          {eyebrow && (
            <p className="text-xs font-semibold tracking-[0.14em] text-admin-accent uppercase">
              {eyebrow}
            </p>
          )}
          <h1
            id={PAGE_TITLE_ID}
            tabIndex={-1}
            className="font-admin-display text-[28px] leading-[1.15] font-semibold tracking-[-0.015em] text-admin-text outline-none sm:text-[32px]"
          >
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-sm leading-relaxed text-admin-muted">{description}</p>
          )}
          {meta && <div className="flex flex-wrap items-center gap-2 pt-1">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
