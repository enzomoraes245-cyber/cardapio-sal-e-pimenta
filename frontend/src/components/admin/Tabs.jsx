import { useRef } from 'react';
import { cx } from './cx.js';

/**
 * Abas acessíveis (padrão WAI-ARIA): setas, Home e End movem o foco e selecionam.
 * O estado fica com quem usa (ex.: parâmetro da URL), para permitir links diretos.
 */
export function Tabs({ label, idPrefix, tabs, value, onChange, className }) {
  const refs = useRef({});

  function select(index) {
    const tab = tabs[(index + tabs.length) % tabs.length];
    onChange(tab.id);
    refs.current[tab.id]?.focus();
  }

  function handleKeyDown(event, index) {
    const keys = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    select(keys[event.key]);
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cx(
        '-mx-1 flex gap-1 overflow-x-auto border-b border-admin-line px-1 [scrollbar-width:none]',
        className,
      )}
    >
      {tabs.map((tab, index) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(element) => {
              refs.current[tab.id] = element;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-aba-${tab.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-painel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cx(
              '-mb-px inline-flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-admin-accent',
              selected
                ? 'border-admin-accent text-admin-text'
                : 'border-transparent text-admin-muted hover:border-admin-line-strong hover:text-admin-text',
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span className="rounded-full bg-admin-neutral-soft px-1.5 text-xs text-admin-muted tabular-nums">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ idPrefix, tabId, className, children }) {
  return (
    <div
      role="tabpanel"
      id={`${idPrefix}-painel-${tabId}`}
      aria-labelledby={`${idPrefix}-aba-${tabId}`}
      tabIndex={0}
      className={cx('pt-6 focus-visible:outline-none', className)}
    >
      {children}
    </div>
  );
}
