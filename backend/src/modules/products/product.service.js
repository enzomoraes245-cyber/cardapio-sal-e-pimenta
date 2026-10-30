import { buildPublicFileUrl } from '../../config/storage.js';
import { publishMenuUpdated } from '../../shared/events/menu-events.js';
import { NotFoundError, ValidationError } from '../../shared/errors/app-error.js';
import { buildRestaurantFileKey, deleteFile, saveFile } from '../../shared/utils/file-storage.js';
import { createOnce } from '../../shared/utils/idempotency.js';
import { readImageFile } from '../../shared/utils/image-upload.js';
import { assertCompleteOrder } from '../../shared/utils/ordering.js';
import * as categoryRepository from '../categories/category.repository.js';
import * as productRepository from './product.repository.js';

const PRODUCT_NOT_FOUND = 'Produto não encontrado.';
const IMAGE_FIELD = 'image';

/** Formato devolvido à retaguarda. */
export function toAdminProduct({ imageKey, price, ...product }) {
  return { ...product, price: price.toFixed(2), imageUrl: buildPublicFileUrl(imageKey) };
}

async function assertCategoryBelongsToRestaurant(restaurantId, categoryId) {
  const category = await categoryRepository.findById(restaurantId, categoryId);
  if (!category) {
    throw new ValidationError([
      {
        source: 'body',
        path: 'categoryId',
        message: 'Selecione uma categoria do seu restaurante.',
      },
    ]);
  }
}

/** Grava a imagem recebida e devolve a chave (ou null quando não houver imagem). */
async function storeImage(restaurantId, image) {
  if (!image) return null;
  const key = buildRestaurantFileKey(restaurantId, 'products', image.extension);
  await saveFile(key, image.buffer);
  return key;
}

export async function listProducts(restaurantId) {
  const products = await productRepository.listByRestaurant(restaurantId);
  return products.map(toAdminProduct);
}

export async function getProduct(restaurantId, id) {
  const product = await productRepository.findById(restaurantId, id);
  if (!product) throw new NotFoundError(PRODUCT_NOT_FOUND);
  return toAdminProduct(product);
}

/**
 * RF-009 / RN-003: nome, preço e categoria (do mesmo restaurante) são obrigatórios. A foto é
 * opcional (DEC-007): sem foto, o produto fica salvo mas só aparece no cardápio depois de
 * receber uma. Com Idempotency-Key, o reenvio devolve o mesmo produto e descarta a foto repetida.
 */
export async function createProduct(restaurantId, data, file, { idempotencyKey } = {}) {
  const image = readImageFile(file, { field: IMAGE_FIELD, required: false });
  await assertCategoryBelongsToRestaurant(restaurantId, data.categoryId);

  const imageKey = await storeImage(restaurantId, image);
  try {
    const { result, replayed } = await createOnce(
      { key: idempotencyKey, scope: 'admin.product.create', ownerId: restaurantId },
      {
        create: async (tx) =>
          productRepository.create(
            restaurantId,
            {
              ...data,
              imageKey,
              position: await productRepository.nextPosition(restaurantId, data.categoryId, tx),
            },
            tx,
          ),
        load: (id) => getProduct(restaurantId, id),
      },
    );
    if (replayed) await deleteFile(imageKey);
    else publishMenuUpdated(restaurantId);
    return { product: result, replayed };
  } catch (error) {
    await deleteFile(imageKey);
    throw error;
  }
}

/** RF-010 / RF-011 / CA-010. Ao trocar de categoria, o produto vai para o fim da nova categoria. */
export async function updateProduct(restaurantId, id, data) {
  const current = await productRepository.findById(restaurantId, id);
  if (!current) throw new NotFoundError(PRODUCT_NOT_FOUND);

  const changes = { ...data };
  if (data.categoryId && data.categoryId !== current.category.id) {
    await assertCategoryBelongsToRestaurant(restaurantId, data.categoryId);
    changes.position = await productRepository.nextPosition(restaurantId, data.categoryId);
  }

  const product = await productRepository.update(restaurantId, id, changes);
  if (!product) throw new NotFoundError(PRODUCT_NOT_FOUND);
  publishMenuUpdated(restaurantId);
  return toAdminProduct(product);
}

/**
 * Aplica a nova chave da foto (ou null para remover) com a linha bloqueada. A foto anterior só é
 * apagada depois da troca confirmada no banco; se o produto não existir, a nova é descartada.
 */
async function swapImage(restaurantId, id, imageKey) {
  let swapped;
  try {
    swapped = await productRepository.swapImageKey(restaurantId, id, imageKey);
  } catch (error) {
    await deleteFile(imageKey);
    throw error;
  }
  if (!swapped) {
    await deleteFile(imageKey);
    throw new NotFoundError(PRODUCT_NOT_FOUND);
  }
  await deleteFile(swapped.previousKey);
  publishMenuUpdated(restaurantId);
  return getProduct(restaurantId, id);
}

/** RF-012: envia ou substitui a foto. */
export async function replaceProductImage(restaurantId, id, file) {
  const image = readImageFile(file, {
    field: IMAGE_FIELD,
    required: true,
    missingMessage: 'Envie a nova fotografia.',
  });
  return swapImage(restaurantId, id, await storeImage(restaurantId, image));
}

/** Remove a foto (DEC-007): o produto continua cadastrado e sai do cardápio até ter outra. */
export function removeProductImage(restaurantId, id) {
  return swapImage(restaurantId, id, null);
}

/** RF-017 / RF-018: recebe todos os produtos da categoria na nova ordem. */
export async function reorderProducts(restaurantId, categoryId, orderedIds) {
  const category = await categoryRepository.findById(restaurantId, categoryId);
  if (!category) throw new NotFoundError('Categoria não encontrada.');

  assertCompleteOrder(
    await productRepository.listIdsInCategory(restaurantId, categoryId),
    orderedIds,
  );
  await productRepository.updatePositions(restaurantId, categoryId, orderedIds);
  publishMenuUpdated(restaurantId);

  const products = await productRepository.listByCategory(restaurantId, categoryId);
  return products.map(toAdminProduct);
}
