/**
 * Mensagem de estado (erro ou ausência de dados), com ação opcional.
 * @param {{ title: string, description?: string, tone?: 'neutral' | 'error', action?: { label: string, onClick: () => void } }} props
 */
export function StatusMessage({ title, description, tone = 'neutral', action }) {
  const isError = tone === 'error';

  return (
    <div role={isError ? 'alert' : 'status'} className="px-4 py-12 text-center">
      <p className={`text-lg font-semibold ${isError ? 'text-red-700' : 'text-stone-800'}`}>
        {title}
      </p>
      {description && <p className="mt-1 text-stone-600">{description}</p>}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
