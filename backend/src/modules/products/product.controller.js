import { readIdempotencyKey } from '../../shared/utils/idempotency.js';
import * as productService from './product.service.js';

export async function list(req, res) {
  res.json({ data: await productService.listProducts(req.tenant.restaurantId) });
}

export async function get(req, res) {
  res.json({
    data: await productService.getProduct(req.tenant.restaurantId, req.validated.params.id),
  });
}

/** 201 ao criar; 200 quando a mesma Idempotency-Key repete um cadastro já feito. */
export async function create(req, res) {
  const { product, replayed } = await productService.createProduct(
    req.tenant.restaurantId,
    req.validated.body,
    req.file,
    { idempotencyKey: readIdempotencyKey(req) },
  );
  res.status(replayed ? 200 : 201).json({ data: product });
}

export async function update(req, res) {
  const product = await productService.updateProduct(
    req.tenant.restaurantId,
    req.validated.params.id,
    req.validated.body,
  );
  res.json({ data: product });
}

export async function replaceImage(req, res) {
  const product = await productService.replaceProductImage(
    req.tenant.restaurantId,
    req.validated.params.id,
    req.file,
  );
  res.json({ data: product });
}

export async function removeImage(req, res) {
  const product = await productService.removeProductImage(
    req.tenant.restaurantId,
    req.validated.params.id,
  );
  res.json({ data: product });
}

export async function reorder(req, res) {
  const products = await productService.reorderProducts(
    req.tenant.restaurantId,
    req.validated.params.categoryId,
    req.validated.body.ids,
  );
  res.json({ data: products });
}
