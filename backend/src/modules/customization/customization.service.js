import { buildPublicFileUrl } from '../../config/storage.js';
import { publishMenuUpdated } from '../../shared/events/menu-events.js';
import { NotFoundError } from '../../shared/errors/app-error.js';
import { buildRestaurantFileKey, deleteFile, saveFile } from '../../shared/utils/file-storage.js';
import { readImageFile } from '../../shared/utils/image-upload.js';
import * as customizationRepository from './customization.repository.js';

async function loadCustomization(restaurantId) {
  const restaurant = await customizationRepository.findByRestaurant(restaurantId);
  if (!restaurant) throw new NotFoundError('Restaurante não encontrado.');
  return restaurant;
}

function toCustomization({ slug, name, customization }) {
  return {
    slug,
    name,
    logoUrl: buildPublicFileUrl(customization?.logoKey),
    primaryColor: customization?.primaryColor ?? null,
    secondaryColor: customization?.secondaryColor ?? null,
  };
}

export async function getCustomization(restaurantId) {
  return toCustomization(await loadCustomization(restaurantId));
}

/** RF-039: cores aplicadas somente ao restaurante da sessão (RF-040). */
export async function updateCustomization(restaurantId, colors) {
  await customizationRepository.updateColors(restaurantId, colors);
  publishMenuUpdated(restaurantId);
  return getCustomization(restaurantId);
}

/** Aplica a nova chave do logotipo e só então apaga o arquivo anterior. */
async function swapLogo(restaurantId, logoKey) {
  let swapped;
  try {
    swapped = await customizationRepository.swapLogoKey(restaurantId, logoKey);
  } catch (error) {
    await deleteFile(logoKey);
    throw error;
  }
  await deleteFile(swapped.previousKey);
  publishMenuUpdated(restaurantId);
  return getCustomization(restaurantId);
}

/** RF-038: envia ou substitui o logotipo. */
export async function replaceLogo(restaurantId, file) {
  const image = readImageFile(file, {
    field: 'logo',
    required: true,
    missingMessage: 'Envie o arquivo do logotipo.',
  });
  const key = buildRestaurantFileKey(restaurantId, 'logo', image.extension);
  await saveFile(key, image.buffer);
  return swapLogo(restaurantId, key);
}

/** Remove o logotipo; o cardápio volta a mostrar só o nome do restaurante. */
export function removeLogo(restaurantId) {
  return swapLogo(restaurantId, null);
}
