import { cx } from './cx.js';

/** Marca do produto (mesmo desenho do favicon): talheres sobre o quadrado terracota. */
export function BrandMark({ size = 32, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      className={cx('shrink-0', className)}
    >
      <rect width="32" height="32" rx="7" fill="#9a3412" />
      <path
        d="M10 8v7a3 3 0 0 0 2 2.8V24h2v-6.2A3 3 0 0 0 16 15V8h-1.5v6h-1V8h-1v6h-1V8zm11 0c-1.7 0-3 2.2-3 5v4h2v7h2V8z"
        fill="#fff"
      />
    </svg>
  );
}

/**
 * Marca com o nome do produto e o ambiente ("Restaurante" ou "Plataforma").
 * `tone="light"` é usado sobre a barra lateral escura.
 */
export function Wordmark({ environment, tone = 'dark', className }) {
  const light = tone === 'light';
  return (
    <span className={cx('flex items-center gap-3', className)}>
      <BrandMark size={34} />
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className={cx(
            'font-admin-display text-[17px] font-semibold tracking-[-0.01em]',
            light ? 'text-white' : 'text-admin-text',
          )}
        >
          Cardápio Digital
        </span>
        {environment && (
          <span
            className={cx(
              'text-[11px] font-semibold tracking-[0.14em] uppercase',
              light ? 'text-admin-sidebar-muted' : 'text-admin-faint',
            )}
          >
            {environment}
          </span>
        )}
      </span>
    </span>
  );
}
