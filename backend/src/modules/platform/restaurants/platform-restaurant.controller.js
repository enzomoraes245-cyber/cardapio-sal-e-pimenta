import { readIdempotencyKey } from '../../../shared/utils/idempotency.js';
import { platformAdminActor } from '../../audit/audit.actions.js';
import * as restaurantService from './platform-restaurant.service.js';

const actorOf = (req) => platformAdminActor(req.platformAuth);

export async function list(req, res) {
  res.json({ data: await restaurantService.listRestaurants() });
}

export async function get(req, res) {
  res.json({ data: await restaurantService.getRestaurant(req.validated.params.id) });
}

/** 201 ao criar; 200 quando a mesma Idempotency-Key repete um cadastro já feito. */
export async function create(req, res) {
  const { restaurant, replayed } = await restaurantService.createRestaurant(req.validated.body, {
    actor: actorOf(req),
    idempotencyKey: readIdempotencyKey(req),
  });
  res.status(replayed ? 200 : 201).json({ data: restaurant });
}

export async function update(req, res) {
  const { params, body } = req.validated;
  res.json({ data: await restaurantService.updateRestaurant(params.id, body, actorOf(req)) });
}

export async function suspend(req, res) {
  const { params, body } = req.validated;
  res.json({ data: await restaurantService.suspendRestaurant(params.id, body, actorOf(req)) });
}

export async function reactivate(req, res) {
  const { params, body } = req.validated;
  res.json({ data: await restaurantService.reactivateRestaurant(params.id, body, actorOf(req)) });
}

export async function updateFeatures(req, res) {
  const { params, body } = req.validated;
  res.json({ data: await restaurantService.updateFeatures(params.id, body, actorOf(req)) });
}

export async function createAdmin(req, res) {
  const { params, body } = req.validated;
  res
    .status(201)
    .json({ data: await restaurantService.createAdmin(params.id, body, actorOf(req)) });
}

export async function updateAdmin(req, res) {
  const { params, body } = req.validated;
  res.json({
    data: await restaurantService.updateAdmin(params.id, params.adminId, body, actorOf(req)),
  });
}

export async function blockAdmin(req, res) {
  const { params, body } = req.validated;
  res.json({
    data: await restaurantService.setAdminAccess(
      params.id,
      params.adminId,
      { blocked: true, reason: body.reason },
      actorOf(req),
    ),
  });
}

export async function unblockAdmin(req, res) {
  const { params, body } = req.validated;
  res.json({
    data: await restaurantService.setAdminAccess(
      params.id,
      params.adminId,
      { blocked: false, reason: body.reason },
      actorOf(req),
    ),
  });
}

export async function resetAdminPassword(req, res) {
  const { params, body } = req.validated;
  await restaurantService.resetAdminPassword(params.id, params.adminId, body, actorOf(req));
  res.status(204).end();
}
