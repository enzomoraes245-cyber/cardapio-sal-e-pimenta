import * as availabilityService from './availability.service.js';

export async function updateStatus(req, res) {
  const product = await availabilityService.updateProductStatus(
    req.tenant.restaurantId,
    req.validated.params.id,
    req.validated.body,
  );
  res.json({ data: product });
}
