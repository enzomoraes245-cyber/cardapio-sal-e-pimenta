import { buildPublicFileUrl } from '../../config/storage.js';
import { publishMenuUpdated } from '../../shared/events/menu-events.js';
import { NotFoundError, ValidationError } from '../../shared/errors/app-error.js';
import { buildRestaurantFileKey, deleteFile, saveFile } from '../../shared/utils/file-storage.js';
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

/** Grava a imagem e, se a operação no banco falhar, remove o arquivo recém-gravado. */
async function withStoredImage(restaurantId, image, operation) {
  const key = buildRestaurantFileKey(restaurantId, 'products', image.extension);
  await saveFile(key, image.buffer);
  try {
    return await operation(key);
  } catch (error) {
    await deleteFile(key);
    throw error;
  }
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

/** RF-009 / RN-004: nome, preço, categoria (do mesmo restaurante) e foto são obrigatórios. */
export async function createProduct(restaurantId, data, file) {
  const image = readImageFile(file, {
    field: IMAGE_FIELD,
    required: true,
    missingMessage: 'Envie a fotografia do produto.',
  });
  await assertCategoryBelongsToRestaurant(restaurantId, data.categoryId);

  const product = await withStoredImage(restaurantId, image, async (imageKey) =>
    productRepository.create(restaurantId, {
      ...data,
      imageKey,
      position: await productRepository.nextPosition(restaurantId, data.categoryId),
    }),
  );
  publishMenuUpdated(restaurantId);
  return toAdminProduct(product);
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

/** RF-012: substitui a foto; a anterior é apagada somente depois de salvar a nova. */
export async function replaceProductImage(restaurantId, id, file) {
  const current = await productRepository.findById(restaurantId, id);
  if (!current) throw new NotFoundError(PRODUCT_NOT_FOUND);
  const image = readImageFile(file, {
    field: IMAGE_FIELD,
    required: true,
    missingMessage: 'Envie a nova fotografia.',
  });

  const product = await withStoredImage(restaurantId, image, async (imageKey) => {
    const updated = await productRepository.update(restaurantId, id, { imageKey });
    if (!updated) throw new NotFoundError(PRODUCT_NOT_FOUND);
    return updated;
  });
  await deleteFile(current.imageKey);
  publishMenuUpdated(restaurantId);
  return toAdminProduct(product);
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
