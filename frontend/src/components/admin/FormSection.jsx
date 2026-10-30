import { useId } from 'react';

/**
 * Grupo de campos de um formulário longo: título e explicação à esquerda (telas largas) e os
 * campos à direita. Os grupos são separados por um filete.
 */
export function FormSection({ title, description, children }) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="grid gap-x-10 gap-y-4 border-b border-admin-line py-8 first:pt-0 last:border-b-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]"
    >
      <div className="space-y-1">
        <h2 id={headingId} className="text-[15px] font-semibold text-admin-text">
          {title}
        </h2>
        {description && (
          <p className="text-[13px] leading-relaxed text-admin-muted">{description}</p>
        )}
      </div>
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  );
}
