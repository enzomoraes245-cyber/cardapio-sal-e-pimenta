import { useState } from 'react';
import { cx } from './cx.js';
import { inputClass } from './Field.jsx';
import { EyeIcon, EyeOffIcon } from './icons.jsx';

/** Campo de senha com botão para mostrar/ocultar; os atributos chegam ao <input>. */
export function PasswordInput({ className, ...props }) {
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOffIcon : EyeIcon;
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        className={cx(inputClass, 'pr-11', className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-admin-faint transition-colors hover:text-admin-text focus-visible:outline-2 focus-visible:outline-admin-accent"
      >
        <Icon size={18} />
      </button>
    </div>
  );
}
