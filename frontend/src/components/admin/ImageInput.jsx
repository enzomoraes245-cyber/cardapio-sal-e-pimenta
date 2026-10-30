import { useEffect, useId, useRef, useState } from 'react';
import {
  ACCEPTED_IMAGE_TYPES,
  IMAGE_HINT,
  validateImageFile,
} from '../../utils/image-constraints.js';
import { Button } from './Button.jsx';
import { cx } from './cx.js';
import { AlertCircleIcon, ImageIcon, TrashIcon, UploadIcon } from './icons.jsx';

/** URL temporária para a prévia do arquivo escolhido, liberada quando o arquivo muda. */
function useObjectUrl(file) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url;
}

/**
 * Escolha de imagem com prévia. Mostra a imagem atual (`currentUrl`) até o usuário escolher outra.
 * `onChange` recebe o File escolhido (já validado) ou null. Com `onRemove`, oferece remover a
 * imagem atual.
 */
export function ImageInput({
  label,
  currentUrl,
  value,
  onChange,
  onRemove,
  removeLabel = 'Remover imagem',
  error,
  hint = IMAGE_HINT,
  emptyLabel = 'Sem imagem',
  previewClassName = 'size-32',
  disabled = false,
}) {
  const id = useId();
  const inputRef = useRef(null);
  const [localError, setLocalError] = useState(null);
  const previewUrl = useObjectUrl(value);

  function handleChange(event) {
    const file = event.target.files?.[0] ?? null;
    const fileError = file ? validateImageFile(file) : null;
    setLocalError(fileError);
    onChange(fileError ? null : file);
    if (fileError) event.target.value = '';
  }

  function clearSelection() {
    onChange(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const shownError = localError ?? error;
  const shownUrl = previewUrl ?? currentUrl;
  const describedBy = [`${id}-hint`, shownError && `${id}-error`].filter(Boolean).join(' ');

  return (
    <div className="space-y-2">
      <p id={`${id}-label`} className="text-sm font-medium text-admin-text">
        {label}
      </p>
      <div className="flex flex-wrap items-start gap-4">
        <div
          className={cx(
            'relative shrink-0 overflow-hidden rounded-admin-panel border border-admin-line bg-admin-subtle',
            previewClassName,
          )}
        >
          {shownUrl ? (
            <img src={shownUrl} alt="Prévia" className="size-full object-cover" />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-1.5 text-admin-faint">
              <ImageIcon size={24} />
              <span className="text-xs">{emptyLabel}</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={UploadIcon}
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              aria-describedby={describedBy}
            >
              {shownUrl ? 'Trocar imagem' : 'Escolher imagem'}
            </Button>
            {value && (
              <Button variant="ghost" size="sm" onClick={clearSelection} disabled={disabled}>
                Desfazer escolha
              </Button>
            )}
            {onRemove && currentUrl && !value && (
              <Button
                variant="danger-ghost"
                size="sm"
                icon={TrashIcon}
                onClick={onRemove}
                disabled={disabled}
              >
                {removeLabel}
              </Button>
            )}
          </div>
          <input
            ref={inputRef}
            id={id}
            type="file"
            tabIndex={-1}
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            onChange={handleChange}
            aria-labelledby={`${id}-label`}
            aria-describedby={describedBy}
            aria-invalid={shownError ? true : undefined}
            className="sr-only"
          />
          {value && <p className="truncate text-xs text-admin-muted">Escolhida: {value.name}</p>}
          <p id={`${id}-hint`} className="text-xs leading-relaxed text-admin-faint">
            {hint}
          </p>
          {shownError && (
            <p
              id={`${id}-error`}
              className="flex items-start gap-1.5 text-[13px] font-medium text-admin-danger"
            >
              <AlertCircleIcon size={16} className="mt-px shrink-0" />
              <span>{shownError}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
