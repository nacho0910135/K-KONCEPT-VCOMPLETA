const { evidenceRepository } = require('../repositories/evidence.repository');
const { ticketRepository } = require('../repositories/ticket.repository');
const { auditService } = require('./audit.service');
const { deleteFromCloudinary, uploadStream } = require('./cloudinary.service');
const { ForbiddenError, NotFoundError } = require('../utils/errors');

const ONE_HOUR_MS = 60 * 60 * 1000;

const resourceTypeForEvidence = (evidence) => {
  if (evidence.fileUrl?.includes('/video/upload/')) return 'video';
  if (evidence.fileUrl?.includes('/raw/upload/')) return 'raw';
  if (evidence.fileUrl?.includes('/image/upload/')) return 'image';
  if (evidence.fileType === 'VIDEO') return 'video';
  if (evidence.fileType === 'PDF' || evidence.fileType === 'DOCUMENT') return 'raw';
  return 'image';
};

const canAccessTicket = (ticket, user) => (
  user.role === 'ADMIN'
  || ticket.clientId === user.id
  || ticket.assignedTechnicianId === user.id
);

const auditDenied = async ({ user, ticketId, evidenceId, context, reason }) => {
  await auditService.recordFailure({
    userId: user?.id || null,
    action: 'EVIDENCE_ACCESS_DENIED',
    entity: 'TicketEvidence',
    entityId: evidenceId || null,
    ipAddress: context?.ipAddress,
    userAgent: context?.userAgent,
    details: {
      ticketId,
      evidenceId,
      reason
    }
  });
};

const assertTicketEvidenceAccess = async (ticket, user, context, evidenceId = null) => {
  if (canAccessTicket(ticket, user)) return;

  await auditDenied({
    user,
    ticketId: ticket.id,
    evidenceId,
    context,
    reason: 'RBAC_DENIED'
  });

  throw new ForbiddenError('No tiene acceso a las evidencias de este ticket');
};

const evidenceService = {
  async upload(ticketId, files, user, context) {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket no encontrado');

    await assertTicketEvidenceAccess(ticket, user, context);

    const uploaded = [];

    for (const file of files) {
      const cloudinaryResult = await uploadStream(file.buffer, 'evidence', 'auto', file.sanitizedOriginalName);

      uploaded.push({
        ticketId,
        uploadedById: user.id,
        fileUrl: cloudinaryResult.url,
        publicId: cloudinaryResult.publicId,
        fileType: file.validatedFileType,
        fileName: cloudinaryResult.fileName,
        fileSize: cloudinaryResult.bytes || file.size,
        mimeType: file.validatedMimeType
      });
    }

    const evidence = await evidenceRepository.createMany(uploaded);

    await auditService.record({
      userId: user.id,
      action: 'EVIDENCE_UPLOADED',
      entity: 'Ticket',
      entityId: ticketId,
      details: {
        count: evidence.length
      }
    });

    return evidence;
  },

  async list(ticketId, user, context) {
    const ticket = await ticketRepository.findById(ticketId);
    if (!ticket) throw new NotFoundError('Ticket no encontrado');

    await assertTicketEvidenceAccess(ticket, user, context);

    return evidenceRepository.findByTicketId(ticketId);
  },

  async getForDownload(id, user, context) {
    const evidence = await evidenceRepository.findById(id);
    if (!evidence) throw new NotFoundError('Evidencia no encontrada');

    await assertTicketEvidenceAccess(evidence.ticket, user, context, id);

    return evidence;
  },

  async delete(id, user, context) {
    const evidence = await evidenceRepository.findById(id);
    if (!evidence) throw new NotFoundError('Evidencia no encontrada');

    await assertTicketEvidenceAccess(evidence.ticket, user, context, id);

    const uploadedLessThanOneHourAgo = Date.now() - evidence.createdAt.getTime() <= ONE_HOUR_MS;
    const canDelete = user.role === 'ADMIN' || (evidence.uploadedById === user.id && uploadedLessThanOneHourAgo);

    if (!canDelete) {
      await auditDenied({
        user,
        ticketId: evidence.ticketId,
        evidenceId: evidence.id,
        context,
        reason: 'DELETE_WINDOW_EXPIRED_OR_NOT_OWNER'
      });

      throw new ForbiddenError('No tiene permisos para borrar esta evidencia');
    }

    const deleted = await evidenceRepository.deleteById(id);
    await deleteFromCloudinary(evidence.publicId, resourceTypeForEvidence(evidence));

    await auditService.record({
      userId: user.id,
      action: 'EVIDENCE_DELETED',
      entity: 'TicketEvidence',
      entityId: evidence.id,
      details: {
        ticketId: evidence.ticketId,
        publicId: evidence.publicId
      }
    });

    return deleted;
  }
};

module.exports = { evidenceService };
