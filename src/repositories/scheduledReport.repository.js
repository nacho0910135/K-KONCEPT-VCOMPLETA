const { prisma } = require('../config/database');

const scheduledReportRepository = {
  create(data) {
    return prisma.scheduledReport.create({ data });
  },

  list({ where, orderBy, skip, take }) {
    return prisma.$transaction([
      prisma.scheduledReport.count({ where }),
      prisma.scheduledReport.findMany({ where, orderBy, skip, take })
    ]);
  },

  findById(id) {
    return prisma.scheduledReport.findUnique({ where: { id } });
  },

  update(id, data) {
    return prisma.scheduledReport.update({
      where: { id },
      data
    });
  },

  delete(id) {
    return prisma.scheduledReport.delete({
      where: { id }
    });
  },

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
  },

  markCompleted(reportId, { lastRunAt, nextRunAt }) {
    return prisma.scheduledReport.update({
      where: { id: reportId },
      data: {
        lastRunAt,
        nextRunAt
      }
    });
  }
};

module.exports = { scheduledReportRepository };
