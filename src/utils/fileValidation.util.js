const { BadRequestError } = require('./errors');

const MB = 1024 * 1024;

const ALLOWED_MIME_TYPES = {
  'image/jpeg': { fileType: 'IMAGE', maxSize: 5 * MB, extensions: ['.jpg', '.jpeg'] },
  'image/png': { fileType: 'IMAGE', maxSize: 5 * MB, extensions: ['.png'] },
  'image/webp': { fileType: 'IMAGE', maxSize: 5 * MB, extensions: ['.webp'] },
  'video/mp4': { fileType: 'VIDEO', maxSize: 50 * MB, extensions: ['.mp4'] },
  'video/quicktime': { fileType: 'VIDEO', maxSize: 50 * MB, extensions: ['.mov'] },
  'application/pdf': { fileType: 'PDF', maxSize: 10 * MB, extensions: ['.pdf'] }
};

const startsWith = (buffer, signature) => signature.every((byte, index) => buffer[index] === byte);

const hasFtypBox = (buffer) => (
  buffer.length >= 12
  && buffer[4] === 0x66
  && buffer[5] === 0x74
  && buffer[6] === 0x79
  && buffer[7] === 0x70
);

const validateMagicNumber = (buffer, mimeType) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return false;

  switch (mimeType) {
    case 'image/jpeg':
      return startsWith(buffer, [0xff, 0xd8, 0xff]);
    case 'image/png':
      return startsWith(buffer, [0x89, 0x50, 0x4e, 0x47]);
    case 'image/webp':
      return startsWith(buffer, [0x52, 0x49, 0x46, 0x46])
        && buffer.slice(8, 12).toString('ascii') === 'WEBP';
    case 'video/mp4':
      return hasFtypBox(buffer);
    case 'video/quicktime': {
      if (!hasFtypBox(buffer)) return false;
      const majorBrand = buffer.slice(8, 12).toString('ascii').trim();
      return ['qt', 'moov', 'mp42', 'mp41', 'isom'].includes(majorBrand);
    }
    case 'application/pdf':
      return startsWith(buffer, [0x25, 0x50, 0x44, 0x46]);
    default:
      return false;
  }
};

const validateFileMetadata = (file) => {
  const rule = ALLOWED_MIME_TYPES[file.mimetype];

  if (!rule) {
    throw new BadRequestError(`Tipo de archivo no permitido: ${file.mimetype}`);
  }

  if (file.size > rule.maxSize) {
    throw new BadRequestError(`El archivo ${file.originalname} excede el limite permitido para ${file.mimetype}`);
  }

  return {
    fileType: rule.fileType,
    maxSize: rule.maxSize
  };
};

const validateUploadedFile = (file) => {
  const metadata = validateFileMetadata(file);

  if (!validateMagicNumber(file.buffer, file.mimetype)) {
    throw new BadRequestError(`La firma real del archivo no coincide con el MIME declarado: ${file.originalname}`);
  }

  return metadata;
};

const getFileTypeFromMime = (mimeType) => ALLOWED_MIME_TYPES[mimeType]?.fileType;

module.exports = {
  ALLOWED_MIME_TYPES,
  validateMagicNumber,
  validateFileMetadata,
  validateUploadedFile,
  getFileTypeFromMime
};
