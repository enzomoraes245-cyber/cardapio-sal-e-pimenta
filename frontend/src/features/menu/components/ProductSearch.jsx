import { useId } from 'react';
import { SearchIcon } from './icons.jsx';

export function ProductSearch({ value, onChange }) {
  const inputId = useId();

  return (
    <label
      htmlFor={inputId}
      className="flex h-12 cursor-text items-center gap-2.5 rounded-[14px] bg-surface-muted px-4 text-ink-muted focus-within:ring-2 focus-within:ring-ink/15"
    >
      <SearchIcon />
      <span className="sr-only">Buscar no cardápio</span>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar prato ou bebida"
        autoComplete="off"
        // text-base (16px) evita o zoom automático do iOS ao focar o campo.
        className="min-w-0 flex-1 bg-transparent text-base text-ink placeholder:text-ink-muted focus:outline-none"
      />
    </label>
  );
}
