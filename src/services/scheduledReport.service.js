const { scheduledReportRepository } = require('../repositories/scheduledReport.repository');

const scheduledReportService = {
  async executeDueReports() {
    const now = new Date();
    const reports = await scheduledReportRepository.findDueReports(now);

    for (const report of reports) {
      await scheduledReportRepository.markRunning(report.id);
    }

    return {
      checkedAt: now,
      queued: reports.length,
      message: 'Ejecucion detallada pendiente para Prompt 12'
    };
  }
};

module.exports = { scheduledReportService };
