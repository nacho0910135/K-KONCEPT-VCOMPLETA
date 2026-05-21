const { kpiService } = require('../services/kpi.service');
const { reportExportService } = require('../services/reportExport.service');
const { successResponse } = require('../utils/responseHelper');
const { Readable } = require('stream');

const getContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent') || null
});

const overview = async (req, res) => successResponse(res, {
  data: await kpiService.overview(req.query)
});

const ticketsByStatus = async (req, res) => successResponse(res, {
  data: await kpiService.ticketsByStatus(req.query)
});

const ticketsByPriority = async (req, res) => successResponse(res, {
  data: await kpiService.ticketsByPriority(req.query)
});

const ticketsByCategory = async (req, res) => successResponse(res, {
  data: await kpiService.ticketsByCategory(req.query)
});

const ticketsByTechnician = async (req, res) => successResponse(res, {
  data: await kpiService.ticketsByTechnician(req.query)
});

const slaCompliance = async (req, res) => successResponse(res, {
  data: await kpiService.slaCompliance(req.query)
});

const avgResolutionTime = async (req, res) => successResponse(res, {
  data: await kpiService.avgResolutionTime(req.query)
});

const ratingsDistribution = async (req, res) => successResponse(res, {
  data: await kpiService.ratingsDistribution(req.query)
});

const monthlyVolume = async (req, res) => successResponse(res, {
  data: await kpiService.monthlyVolume(req.query)
});

const exportReport = async (req, res) => {
  const report = await reportExportService.generate(req.body, req.user, getContext(req));

  res.setHeader('Content-Type', report.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${report.filename}"`);
  res.status(200);
  return Readable.from(report.buffer).pipe(res);
};

module.exports = {
  overview,
  ticketsByStatus,
  ticketsByPriority,
  ticketsByCategory,
  ticketsByTechnician,
  slaCompliance,
  avgResolutionTime,
  ratingsDistribution,
  monthlyVolume,
  exportReport
};
