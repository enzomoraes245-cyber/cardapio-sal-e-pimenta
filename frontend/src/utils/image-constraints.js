/** Regras de imagem alinhadas ao backend (docs/requirements): JPEG, PNG ou WebP até 5 MB. */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_HINT = 'JPEG, PNG ou WebP, até 5 MB.';

/** Retorna a mensagem de erro do arquivo, ou null se ele for aceito. */
export function validateImageFile(file) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return 'Envie uma imagem JPEG, PNG ou WebP.';
  if (file.size > MAX_IMAGE_BYTES) return 'A imagem deve ter no máximo 5 MB.';
  return null;
}
