const { prisma } = require('../config/database');

const scheduledReportRepository = {
  findDueReports(now) {
    return prisma.scheduledReport.findMany({
      where: {
        active: true,
        nextRunAt: {
          lte: now
        }
      },
      orderBy: {
        nextRunAt: 'asc'
      }
    });
  },

  markRunning(reportId) {
    return prisma.scheduledReport.update({
      where: { id: reportId },
      data: {
        lastRunAt: new Date()
      }
    });
  }
};

module.exports = { scheduledReportRepository };
