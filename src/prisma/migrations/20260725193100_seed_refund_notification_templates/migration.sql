INSERT INTO "NotificationTemplate" ("id", "event", "channel", "subject", "bodyTemplate", "active", "createdAt", "updatedAt")
VALUES
(
  'default-refund-registered-email',
  'REFUND_REGISTERED',
  'EMAIL',
  'Reembolso registrado para {{ticketCode}}',
  '<p>Hola {{userName}},</p><p>Te informamos que para el ticket <strong>{{ticketCode}}</strong> se aplicara un reembolso.</p><ul><li><strong>Ticket:</strong> {{ticketCode}} - {{ticketTitle}}</li><li><strong>Tecnico responsable:</strong> {{technicianName}}</li><li><strong>Articulo:</strong> {{productName}}</li><li><strong>Tipo de reembolso:</strong> {{resolutionAction}}</li><li><strong>Monto a reembolsar:</strong> {{refundAmount}}</li></ul><p><strong>Detalle:</strong> {{solution}}</p><p>Adjuntamos la constancia de reembolso cuando aplique por correo.</p>',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("event", "channel") DO NOTHING;

UPDATE "NotificationTemplate"
SET
  "subject" = 'Reemplazo aprobado para {{ticketCode}}',
  "bodyTemplate" = '<p>Hola {{userName}},</p><p>Te informamos que para el ticket <strong>{{ticketCode}}</strong> se tomo la decision de aplicar un reemplazo.</p><ul><li><strong>Ticket:</strong> {{ticketCode}} - {{ticketTitle}}</li><li><strong>Tecnico responsable:</strong> {{technicianName}}</li><li><strong>Articulo reportado:</strong> {{productName}}</li><li><strong>Articulo de reemplazo:</strong> {{replacementProduct}}</li><li><strong>Marca / modelo:</strong> {{replacementBrand}} {{replacementModel}}</li><li><strong>Serie:</strong> {{replacementSerialNumber}}</li></ul><p>{{replacementNotes}}</p><p>Te avisaremos cualquier avance hasta completar la entrega.</p>',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "event" = 'REPLACEMENT_APPROVED';

INSERT INTO "NotificationFrequencyRule" ("id", "event", "maxPerUserPerHour", "maxPerUserPerDay", "active", "createdAt", "updatedAt")
VALUES (
  'default-refund-registered-frequency',
  'REFUND_REGISTERED',
  20,
  100,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("event") DO NOTHING;

INSERT INTO "NotificationTemplate" ("id", "event", "channel", "subject", "bodyTemplate", "active", "createdAt", "updatedAt")
VALUES
(
  'default-refund-registered-in-app',
  'REFUND_REGISTERED',
  'IN_APP',
  'Reembolso registrado para {{ticketCode}}',
  'Hola {{userName}}, se aplicara {{resolutionAction}} al ticket {{ticketCode}} por {{refundAmount}}.',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("event", "channel") DO NOTHING;
