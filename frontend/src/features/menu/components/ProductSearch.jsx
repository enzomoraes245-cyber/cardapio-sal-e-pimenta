import { useId } from 'react';

export function ProductSearch({ value, onChange }) {
  const inputId = useId();

  return (
    <div>
      <label htmlFor={inputId} className="sr-only">
        Buscar no cardápio
      </label>
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar no cardápio"
        autoComplete="off"
        // text-base (16px) evita o zoom automático do iOS ao focar o campo.
        className="w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-base focus:border-brand focus:ring-2 focus:ring-brand/30 focus:outline-none"
      />
    </div>
  );
}
