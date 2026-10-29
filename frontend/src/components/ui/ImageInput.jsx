import { useEffect, useId, useState } from 'react';
import {
  ACCEPTED_IMAGE_TYPES,
  IMAGE_HINT,
  validateImageFile,
} from '../../utils/image-constraints.js';

/**
 * Seleção de imagem com prévia. Mostra a imagem atual (`currentUrl`) até o usuário escolher outra.
 * `onChange` recebe o File escolhido (já validado) ou null.
 */
export function ImageInput({ label, currentUrl, value, onChange, error, previewClassName = '' }) {
  const id = useId();
  const [localError, setLocalError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!value) return setPreviewUrl(null);
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  function handleChange(event) {
    const file = event.target.files?.[0] ?? null;
    const fileError = file ? validateImageFile(file) : null;
    setLocalError(fileError);
    onChange(fileError ? null : file);
    if (fileError) event.target.value = '';
  }

  const shownError = localError ?? error;
  const shownUrl = previewUrl ?? currentUrl;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-slate-800">
        {label}
      </label>
      {shownUrl && (
        <img
          src={shownUrl}
          alt="Prévia da imagem selecionada"
          className={`rounded-lg border border-slate-200 object-cover ${previewClassName}`}
        />
      )}
      <input
        id={id}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={handleChange}
        aria-invalid={shownError ? true : undefined}
        aria-describedby={`${id}-hint${shownError ? ` ${id}-error` : ''}`}
        className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
      />
      <p id={`${id}-hint`} className="text-xs text-slate-500">
        {IMAGE_HINT}
      </p>
      {shownError && (
        <p id={`${id}-error`} className="text-sm text-red-700">
          {shownError}
        </p>
      )}
    </div>
  );
}
