const { Router } = require('express');

const notificationConfigController = require('../controllers/notificationConfig.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  templateSchema,
  templateUpdateSchema,
  templateQuerySchema
} = require('../validators/notification.validator');

const router = Router();

router.use(verifyToken, authorizeRoles('ADMIN'));

router.post('/', validate(templateSchema), asyncHandler(notificationConfigController.createTemplate));
router.get('/', validate(templateQuerySchema, 'query'), asyncHandler(notificationConfigController.listTemplates));
router.put('/:id', validate(templateUpdateSchema), asyncHandler(notificationConfigController.updateTemplate));
router.patch('/:id/toggle', asyncHandler(notificationConfigController.toggleTemplate));

module.exports = router;
