const multer = require('multer');

const { auditService } = require('../services/audit.service');
const { BadRequestError } = require('../utils/errors');
const { ALLOWED_MIME_TYPES, validateUploadedFile } = require('../utils/fileValidation.util');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 10
  },
  fileFilter(req, file, callback) {
    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      return callback(new BadRequestError(`Tipo de archivo no permitido: ${file.mimetype}`));
    }

    return callback(null, true);
  }
});

const uploadEvidenceFiles = upload.array('files', 10);

const validateEvidenceFiles = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      throw new BadRequestError('Debe adjuntar al menos un archivo');
    }

    req.files.forEach((file) => {
      file.validatedFileType = validateUploadedFile(file).fileType;
    });

    return next();
  } catch (error) {
    await auditService.recordFailure({
      userId: req.user?.id || null,
      action: 'EVIDENCE_ACCESS_DENIED',
      entity: 'TicketEvidence',
      entityId: null,
      ipAddress: req.ip,
      userAgent: req.get('user-agent') || null,
      details: {
        ticketId: req.params.ticketId,
        reason: error.message
      }
    });

    return next(error);
  }
};

module.exports = { upload, uploadEvidenceFiles, validateEvidenceFiles };
