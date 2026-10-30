import { readIdempotencyKey } from '../../shared/utils/idempotency.js';
import * as categoryService from './category.service.js';

export async function list(req, res) {
  res.json({ data: await categoryService.listCategories(req.tenant.restaurantId) });
}

/** 201 ao criar; 200 quando a mesma Idempotency-Key repete um cadastro já feito. */
export async function create(req, res) {
  const { category, replayed } = await categoryService.createCategory(
    req.tenant.restaurantId,
    req.validated.body,
    { idempotencyKey: readIdempotencyKey(req) },
  );
  res.status(replayed ? 200 : 201).json({ data: category });
}

export async function rename(req, res) {
  const category = await categoryService.renameCategory(
    req.tenant.restaurantId,
    req.validated.params.id,
    req.validated.body,
  );
  res.json({ data: category });
}

export async function updateStatus(req, res) {
  const category = await categoryService.setCategoryStatus(
    req.tenant.restaurantId,
    req.validated.params.id,
    req.validated.body,
  );
  res.json({ data: category });
}

export async function reorder(req, res) {
  const categories = await categoryService.reorderCategories(
    req.tenant.restaurantId,
    req.validated.body.ids,
  );
  res.json({ data: categories });
}
