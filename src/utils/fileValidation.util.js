const { BadRequestError } = require('./errors');

const MB = 1024 * 1024;

const FILE_RULES = {
  JPEG: { fileType: 'IMAGE', mimeType: 'image/jpeg', maxSize: 5 * MB, extensions: ['.jpg', '.jpeg'] },
  PNG: { fileType: 'IMAGE', mimeType: 'image/png', maxSize: 5 * MB, extensions: ['.png'] },
  WEBP: { fileType: 'IMAGE', mimeType: 'image/webp', maxSize: 5 * MB, extensions: ['.webp'] },
  MP4: { fileType: 'VIDEO', mimeType: 'video/mp4', maxSize: 50 * MB, extensions: ['.mp4'] },
  MOV: { fileType: 'VIDEO', mimeType: 'video/quicktime', maxSize: 50 * MB, extensions: ['.mov'] },
  PDF: { fileType: 'PDF', mimeType: 'application/pdf', maxSize: 10 * MB, extensions: ['.pdf'] }
};

const ALLOWED_MIME_TYPES = Object.fromEntries(
  Object.values(FILE_RULES).map((rule) => [rule.mimeType, rule])
);

const ALLOWED_EXTENSIONS = Object.values(FILE_RULES).flatMap((rule) => rule.extensions);

const startsWith = (buffer, signature) => signature.every((byte, index) => buffer[index] === byte);

const hasFtypBox = (buffer) => (
  buffer.length >= 12
  && buffer[4] === 0x66
  && buffer[5] === 0x74
  && buffer[6] === 0x79
  && buffer[7] === 0x70
);

const sanitizeOriginalName = (fileName = 'archivo') => (
  fileName
    .normalize('NFKD')
    .replace(/[^\w.\- ]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 120) || 'archivo'
);

const getExtension = (fileName = '') => {
  const sanitized = sanitizeOriginalName(fileName);
  const dotIndex = sanitized.lastIndexOf('.');
  return dotIndex >= 0 ? sanitized.slice(dotIndex).toLowerCase() : '';
};

const detectFileSignature = (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) return null;

  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'JPEG';
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47])) return 'PNG';
  if (startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && buffer.slice(8, 12).toString('ascii') === 'WEBP') return 'WEBP';
  if (startsWith(buffer, [0x25, 0x50, 0x44, 0x46])) return 'PDF';

  if (hasFtypBox(buffer)) {
    const majorBrand = buffer.slice(8, 12).toString('ascii').trim();
    if (majorBrand === 'qt') return 'MOV';
    if (['mp41', 'mp42', 'isom', 'iso2', 'avc1', 'M4V'].includes(majorBrand)) return 'MP4';
  }

  return null;
};

const validateMagicNumber = (buffer, expectedType) => detectFileSignature(buffer) === expectedType;

const validateUploadedFile = (file) => {
  const extension = getExtension(file.originalname);
  const detectedType = detectFileSignature(file.buffer);
  const rule = detectedType ? FILE_RULES[detectedType] : null;

  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    throw new BadRequestError(`Extension de archivo no permitida: ${file.originalname}`);
  }

  if (!rule) {
    throw new BadRequestError(`No se pudo validar la firma real del archivo: ${file.originalname}`);
  }

  if (!rule.extensions.includes(extension)) {
    throw new BadRequestError(`La extension no coincide con la firma real del archivo: ${file.originalname}`);
  }

  if (file.size > rule.maxSize) {
    throw new BadRequestError(`El archivo ${file.originalname} excede el limite permitido (${Math.round(rule.maxSize / MB)}MB)`);
  }

  return {
    fileType: rule.fileType,
    maxSize: rule.maxSize,
    mimeType: rule.mimeType,
    extension,
    sanitizedName: sanitizeOriginalName(file.originalname)
  };
};

const validateFileMetadata = validateUploadedFile;

const getFileTypeFromMime = (mimeType) => ALLOWED_MIME_TYPES[mimeType]?.fileType;

module.exports = {
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS,
  FILE_RULES,
  detectFileSignature,
  validateMagicNumber,
  validateFileMetadata,
  validateUploadedFile,
  sanitizeOriginalName,
  getFileTypeFromMime
};
