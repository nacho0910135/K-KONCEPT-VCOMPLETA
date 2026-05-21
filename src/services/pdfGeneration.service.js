const { uploadStream } = require('./cloudinary.service');
const { generateReplacementCertificate } = require('../utils/pdfGenerator.util');

const pdfGenerationService = {
  async generateAndUploadReplacementCertificate(replacement) {
    const buffer = await generateReplacementCertificate(replacement);
    const uploaded = await uploadStream(
      buffer,
      'certificates',
      'raw',
      `replacement-certificate-${replacement.id}.pdf`
    );

    return {
      pdfUrl: uploaded.url,
      pdfPublicId: uploaded.publicId,
      pdfGeneratedAt: new Date()
    };
  }
};

module.exports = { pdfGenerationService };
