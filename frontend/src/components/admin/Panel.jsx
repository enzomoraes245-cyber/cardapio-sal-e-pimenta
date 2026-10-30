import { useId } from 'react';
import { cx } from './cx.js';

/** Seção com título, descrição, ações e rodapé opcionais. `flush` tira o espaçamento interno (listas). */
export function Panel({
  title,
  description,
  actions,
  footer,
  className,
  bodyClassName,
  flush = false,
  headingLevel: Heading = 'h2',
  children,
}) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={title ? headingId : undefined}
      className={cx('rounded-admin-panel border border-admin-line bg-admin-surface', className)}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-admin-line px-5 py-4 sm:px-6">
          <div className="min-w-0 space-y-0.5">
            {title && (
              <Heading id={headingId} className="text-[15px] font-semibold text-admin-text">
                {title}
              </Heading>
            )}
            {description && (
              <p className="text-[13px] leading-relaxed text-admin-muted">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cx(!flush && 'px-5 py-5 sm:px-6', bodyClassName)}>{children}</div>
      {footer && (
        <footer className="flex flex-wrap items-center justify-end gap-2 rounded-b-admin-panel border-t border-admin-line bg-admin-subtle px-5 py-3 sm:px-6">
          {footer}
        </footer>
      )}
    </section>
  );
}
