import * as customizationService from './customization.service.js';

export async function get(req, res) {
  res.json({ data: await customizationService.getCustomization(req.tenant.restaurantId) });
}

export async function update(req, res) {
  const customization = await customizationService.updateCustomization(
    req.tenant.restaurantId,
    req.validated.body,
  );
  res.json({ data: customization });
}

export async function replaceLogo(req, res) {
  res.json({ data: await customizationService.replaceLogo(req.tenant.restaurantId, req.file) });
}

export async function removeLogo(req, res) {
  res.json({ data: await customizationService.removeLogo(req.tenant.restaurantId) });
}
