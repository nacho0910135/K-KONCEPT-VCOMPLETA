const { Router } = require('express');

const notificationConfigController = require('../controllers/notificationConfig.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { asyncHandler } = require('../utils/asyncHandler');
const {
  frequencyRuleSchema,
  frequencyRuleUpdateSchema
} = require('../validators/notification.validator');

const router = Router();

router.use(verifyToken, authorizeRoles('ADMIN'));

router.post('/', validate(frequencyRuleSchema), asyncHandler(notificationConfigController.createFrequencyRule));
router.get('/', asyncHandler(notificationConfigController.listFrequencyRules));
router.put('/:id', validate(frequencyRuleUpdateSchema), asyncHandler(notificationConfigController.updateFrequencyRule));
router.patch('/:id/toggle', asyncHandler(notificationConfigController.toggleFrequencyRule));

module.exports = router;
