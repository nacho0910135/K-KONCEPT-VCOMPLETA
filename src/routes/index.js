const { Router } = require('express');

const appointmentRoutes = require('./appointment.routes');
const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const evidenceRoutes = require('./evidence.routes');
const healthRoutes = require('./health.routes');
const productRoutes = require('./product.routes');
const replacementRoutes = require('./replacement.routes');
const subcategoryRoutes = require('./subcategory.routes');
const ticketRoutes = require('./ticket.routes');
const userRoutes = require('./user.routes');
const warrantyRoutes = require('./warranty.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/', appointmentRoutes);
router.use('/categories', categoryRoutes);
router.use('/', evidenceRoutes);
router.use('/health', healthRoutes);
router.use('/products', productRoutes);
router.use('/', replacementRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/tickets', ticketRoutes);
router.use('/users', userRoutes);
router.use('/warranties', warrantyRoutes);

module.exports = router;
