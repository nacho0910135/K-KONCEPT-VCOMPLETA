const { auditService } = require('../services/audit.service');
const { successResponse } = require('../utils/responseHelper');

const getContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent') || null
});

const list = async (req, res) => {
  const result = await auditService.list(req.query);
  return successResponse(res, { data: result.items, pagination: result.pagination });
};

const getById = async (req, res) => successResponse(res, {
  data: { auditLog: await auditService.getById(req.params.id) }
});

const exportLogs = async (req, res) => {
  const result = await auditService.export(req.query, req.user, getContext(req));
  const stamp = result.exportedAt.toISOString().replace(/[:.]/g, '-');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${stamp}.csv"`);
  return res.status(200).send(result.csv);
};

module.exports = { list, getById, exportLogs };
