import * as auditService from './audit.service.js';

export async function list(req, res) {
  res.json({ data: await auditService.listAuditEvents(req.validated.query) });
}
