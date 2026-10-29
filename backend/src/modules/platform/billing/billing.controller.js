import * as billingService from './billing.service.js';

export async function updateSubscription(req, res) {
  const { params, body } = req.validated;
  res.json({ data: await billingService.updateSubscription(params.id, body) });
}

export async function listInvoices(req, res) {
  res.json({ data: await billingService.listInvoices(req.validated.query) });
}

export async function generateInvoices(req, res) {
  res.json({ data: await billingService.generateMonthlyInvoices(req.validated.body.month) });
}

export async function updateInvoice(req, res) {
  const { params, body } = req.validated;
  res.json({ data: await billingService.updateInvoiceStatus(params.id, body) });
}
