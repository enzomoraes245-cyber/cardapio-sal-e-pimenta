import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { cx } from './cx.js';
import { AlertCircleIcon, CircleCheckIcon, InfoIcon, XIcon } from './icons.jsx';

const ToastContext = createContext(null);
const TOAST_DURATION_MS = 4500;

const TONES = {
  success: { icon: CircleCheckIcon, iconClass: 'text-emerald-300' },
  danger: { icon: AlertCircleIcon, iconClass: 'text-red-300' },
  info: { icon: InfoIcon, iconClass: 'text-admin-sidebar-muted' },
};

/**
 * Avisos breves de confirmação ("Produto salvo."). A região é anunciada por leitores de tela
 * (aria-live). Erros que exigem ação ficam junto do formulário, não aqui.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (tone, message) => {
      nextId.current += 1;
      const id = nextId.current;
      setToasts((list) => [...list.slice(-2), { id, tone, message }]);
      setTimeout(() => dismiss(id), TOAST_DURATION_MS);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (message) => show('success', message),
      error: (message) => show('danger', message),
      info: (message) => show('info', message),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 font-admin sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        {toasts.map((toast) => {
          const { icon: Icon, iconClass } = TONES[toast.tone];
          return (
            <div
              key={toast.id}
              className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-admin-panel bg-admin-sidebar px-4 py-3 text-sm text-white shadow-admin-float"
            >
              <Icon size={18} className={cx('mt-px shrink-0', iconClass)} />
              <p className="flex-1 leading-relaxed">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Fechar aviso"
                className="-m-1 rounded-md p-1 text-admin-sidebar-muted hover:text-white focus-visible:outline-2 focus-visible:outline-white"
              >
                <XIcon size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast deve ser usado dentro de ToastProvider.');
  return context;
}
