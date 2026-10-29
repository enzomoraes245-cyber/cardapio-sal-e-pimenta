/** Seção com título, usada nas páginas de detalhe. */
export function Card({ title, description, children }) {
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </div>
      {children}
    </section>
  );
}
