const path = require('path');
const { randomUUID } = require('crypto');
const { Readable } = require('stream');

const { cloudinary } = require('../config/cloudinary');

const ALLOWED_FOLDERS = new Set(['evidence', 'certificates', 'avatars']);

const sanitizeFolder = (folder) => {
  if (!ALLOWED_FOLDERS.has(folder)) {
    throw new Error('Carpeta Cloudinary no permitida');
  }

  return folder;
};

const uploadStream = (buffer, folder, resourceType = 'auto', originalName = '') => {
  const safeFolder = sanitizeFolder(folder);
  const extension = path.extname(originalName || '').toLowerCase();
  const safeName = `${randomUUID()}${extension}`;
  const publicId = path.basename(safeName, extension);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: safeFolder,
        public_id: publicId,
        resource_type: resourceType,
        overwrite: false,
        use_filename: false,
        unique_filename: false
      },
      (error, result) => {
        if (error) return reject(error);

        return resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          fileName: safeName,
          resourceType: result.resource_type
        });
      }
    );

    Readable.from(buffer).pipe(stream);
  });
};

const deleteFromCloudinary = (publicId, resourceType = 'auto') => (
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
);

module.exports = { uploadStream, deleteFromCloudinary };
