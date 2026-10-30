import { readIdempotencyKey } from '../../../shared/utils/idempotency.js';
import { platformAdminActor } from '../../audit/audit.actions.js';
import * as billingService from './billing.service.js';

const actorOf = (req) => platformAdminActor(req.platformAuth);

export async function updateSubscription(req, res) {
  const { params, body } = req.validated;
  res.json({ data: await billingService.updateSubscription(params.id, body, actorOf(req)) });
}

export async function listInvoices(req, res) {
  res.json({ data: await billingService.listInvoices(req.validated.query) });
}

export async function generateInvoices(req, res) {
  const { month } = req.validated.body;
  res.json({ data: await billingService.generateMonthlyInvoices(month, actorOf(req)) });
}

/** 201 no registro novo; 200 quando a mesma Idempotency-Key repete um registro já feito. */
export async function recordPayment(req, res) {
  const { params, body } = req.validated;
  const { invoice, replayed } = await billingService.recordPayment(params.id, body, {
    actor: actorOf(req),
    idempotencyKey: readIdempotencyKey(req),
  });
  res.status(replayed ? 200 : 201).json({ data: invoice });
}

export async function voidPayment(req, res) {
  const { params, body } = req.validated;
  res.json({ data: await billingService.voidPayment(params.id, body, actorOf(req)) });
}

export async function cancelInvoice(req, res) {
  const { params, body } = req.validated;
  res.json({ data: await billingService.cancelInvoice(params.id, body, actorOf(req)) });
}

export async function reopenInvoice(req, res) {
  const { params, body } = req.validated;
  res.json({ data: await billingService.reopenInvoice(params.id, body, actorOf(req)) });
}

export async function listPayments(req, res) {
  res.json({ data: await billingService.listPayments(req.validated.query) });
}

export async function getOverview(req, res) {
  res.json({ data: await billingService.getOverview(req.validated.query) });
}
