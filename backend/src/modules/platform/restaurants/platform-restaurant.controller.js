import * as restaurantService from './platform-restaurant.service.js';

export async function list(req, res) {
  res.json({ data: await restaurantService.listRestaurants() });
}

export async function get(req, res) {
  res.json({ data: await restaurantService.getRestaurant(req.validated.params.id) });
}

export async function create(req, res) {
  res.status(201).json({ data: await restaurantService.createRestaurant(req.validated.body) });
}

export async function update(req, res) {
  const { params, body } = req.validated;
  res.json({ data: await restaurantService.updateRestaurant(params.id, body) });
}

export async function suspend(req, res) {
  const { params, body } = req.validated;
  res.json({ data: await restaurantService.suspendRestaurant(params.id, body) });
}

export async function reactivate(req, res) {
  res.json({ data: await restaurantService.reactivateRestaurant(req.validated.params.id) });
}

export async function updateFeatures(req, res) {
  const { params, body } = req.validated;
  res.json({ data: await restaurantService.updateFeatures(params.id, body) });
}

export async function createAdmin(req, res) {
  const { params, body } = req.validated;
  res.status(201).json({ data: await restaurantService.createAdmin(params.id, body) });
}

export async function resetAdminPassword(req, res) {
  const { params, body } = req.validated;
  await restaurantService.resetAdminPassword(params.id, params.adminId, body);
  res.status(204).end();
}
