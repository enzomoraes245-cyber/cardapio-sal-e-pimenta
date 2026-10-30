import * as establishmentService from './establishment.service.js';

export async function get(req, res) {
  res.json({ data: await establishmentService.getEstablishment(req.tenant.restaurantId) });
}

export async function update(req, res) {
  res.json({
    data: await establishmentService.updateEstablishment(req.auth, req.validated.body),
  });
}
