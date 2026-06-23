const { Router } = require('express');

const appointmentRoutes = require('./appointment.routes');
const auditLogRoutes = require('./auditLog.routes');
const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const evidenceRoutes = require('./evidence.routes');
const healthRoutes = require('./health.routes');
const notificationRoutes = require('./notification.routes');
const notificationChannelRoutes = require('./notificationChannel.routes');
const notificationFrequencyRuleRoutes = require('./notificationFrequencyRule.routes');
const notificationTemplateRoutes = require('./notificationTemplate.routes');
const productRoutes = require('./product.routes');
const replacementRoutes = require('./replacement.routes');
const refundRoutes = require('./refund.routes');
const reportRoutes = require('./report.routes');
const scheduledReportRoutes = require('./scheduledReport.routes');
const slaRoutes = require('./sla.routes');
const subcategoryRoutes = require('./subcategory.routes');
const ticketRoutes = require('./ticket.routes');
const userRoutes = require('./user.routes');
const warrantyRoutes = require('./warranty.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/categories', categoryRoutes);
router.use('/health', healthRoutes);
router.use('/notifications', notificationRoutes);
router.use('/notification-channels', notificationChannelRoutes);
router.use('/notification-frequency-rules', notificationFrequencyRuleRoutes);
router.use('/notification-templates', notificationTemplateRoutes);
router.use('/products', productRoutes);
router.use('/reports', reportRoutes);
router.use('/scheduled-reports', scheduledReportRoutes);
router.use('/slas', slaRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/tickets', ticketRoutes);
router.use('/users', userRoutes);
router.use('/warranties', warrantyRoutes);
router.use('/', appointmentRoutes);
router.use('/', evidenceRoutes);
router.use('/', replacementRoutes);
router.use('/', refundRoutes);

module.exports = router;
