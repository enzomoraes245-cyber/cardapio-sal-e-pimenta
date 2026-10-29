const VARIANTS = {
  primary: 'bg-slate-900 text-white hover:bg-slate-700 disabled:bg-slate-400',
  secondary:
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:text-slate-400',
  danger: 'bg-red-700 text-white hover:bg-red-600 disabled:bg-red-300',
  ghost: 'text-slate-700 hover:bg-slate-100 disabled:text-slate-400',
};

const SIZES = {
  md: 'px-4 py-2 text-sm',
  sm: 'px-2.5 py-1 text-sm',
};

/** Botão padrão da retaguarda. `type` padrão é "button" para evitar envios acidentais. */
export function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
