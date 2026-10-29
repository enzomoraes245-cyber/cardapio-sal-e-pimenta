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

/** RF-037 / RF-039: nome e cores, aplicados somente ao restaurante da sessão (RF-040). */
export async function updateCustomization(restaurantId, data) {
  await customizationRepository.update(restaurantId, data);
  publishMenuUpdated(restaurantId);
  return getCustomization(restaurantId);
}

/** RF-038: envia ou substitui o logotipo; o arquivo anterior é removido depois de salvar. */
export async function replaceLogo(restaurantId, file) {
  const current = await loadCustomization(restaurantId);
  const image = readImageFile(file, {
    field: 'logo',
    required: true,
    missingMessage: 'Envie o arquivo do logotipo.',
  });

  const key = buildRestaurantFileKey(restaurantId, 'logo', image.extension);
  await saveFile(key, image.buffer);
  try {
    await customizationRepository.setLogoKey(restaurantId, key);
  } catch (error) {
    await deleteFile(key);
    throw error;
  }
  await deleteFile(current.customization?.logoKey);

  publishMenuUpdated(restaurantId);
  return getCustomization(restaurantId);
}
