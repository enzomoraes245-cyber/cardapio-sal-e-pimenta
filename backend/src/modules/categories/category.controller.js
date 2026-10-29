import * as categoryService from './category.service.js';

export async function list(req, res) {
  res.json({ data: await categoryService.listCategories(req.tenant.restaurantId) });
}

export async function create(req, res) {
  const category = await categoryService.createCategory(
    req.tenant.restaurantId,
    req.validated.body,
  );
  res.status(201).json({ data: category });
}

export async function rename(req, res) {
  const category = await categoryService.renameCategory(
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
