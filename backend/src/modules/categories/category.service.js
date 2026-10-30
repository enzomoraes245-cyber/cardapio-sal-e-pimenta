import { publishMenuUpdated } from '../../shared/events/menu-events.js';
import { NotFoundError } from '../../shared/errors/app-error.js';
import { createOnce } from '../../shared/utils/idempotency.js';
import { assertCompleteOrder } from '../../shared/utils/ordering.js';
import * as categoryRepository from './category.repository.js';

const NOT_FOUND_MESSAGE = 'Categoria não encontrada.';

export function listCategories(restaurantId) {
  return categoryRepository.listByRestaurant(restaurantId);
}

/**
 * RF-005: a categoria pertence sempre ao restaurante da sessão e entra no fim da lista.
 * Com Idempotency-Key, reenviar o formulário devolve a mesma categoria (`replayed`).
 */
export async function createCategory(restaurantId, data, { idempotencyKey } = {}) {
  const { result, replayed } = await createOnce(
    { key: idempotencyKey, scope: 'admin.category.create', ownerId: restaurantId },
    {
      create: (tx) => categoryRepository.create(restaurantId, data, tx),
      load: (id) => categoryRepository.findById(restaurantId, id),
    },
  );
  if (!replayed) publishMenuUpdated(restaurantId);
  return { category: result, replayed };
}

/** RF-006 / CA-005. Categoria de outro restaurante responde como inexistente (CA-003). */
export async function renameCategory(restaurantId, id, { name }) {
  const category = await categoryRepository.update(restaurantId, id, { name });
  if (!category) throw new NotFoundError(NOT_FOUND_MESSAGE);
  publishMenuUpdated(restaurantId);
  return category;
}

/**
 * Exibe ou oculta a categoria no cardápio. Ocultar não apaga nem altera os produtos: eles
 * voltam a aparecer quando a categoria é reativada.
 */
export async function setCategoryStatus(restaurantId, id, { isActive }) {
  const category = await categoryRepository.update(restaurantId, id, { isActive });
  if (!category) throw new NotFoundError(NOT_FOUND_MESSAGE);
  publishMenuUpdated(restaurantId);
  return category;
}

/** RF-007 / CA-006: recebe a lista completa de categorias na nova ordem. */
export async function reorderCategories(restaurantId, orderedIds) {
  assertCompleteOrder(await categoryRepository.listIds(restaurantId), orderedIds);
  await categoryRepository.updatePositions(restaurantId, orderedIds);
  publishMenuUpdated(restaurantId);
  return categoryRepository.listByRestaurant(restaurantId);
}
