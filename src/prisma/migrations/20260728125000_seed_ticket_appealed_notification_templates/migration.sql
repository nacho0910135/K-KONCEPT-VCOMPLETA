INSERT INTO "NotificationTemplate" ("id", "event", "channel", "subject", "bodyTemplate", "active", "createdAt", "updatedAt")
VALUES
(
  'default-ticket-appealed-email',
  'TICKET_APPEALED',
  'EMAIL',
  'Apelacion abierta para {{ticketCode}}',
  '<p>Hola {{userName}},</p><p>Has abierto una apelacion sobre el ticket <strong>{{ticketCode}}</strong>: <strong>{{ticketTitle}}</strong>.</p><p><strong>Motivo enviado:</strong> {{appealReason}}</p><p>Pronto recibiras una respuesta. Gracias por la preferencia.</p><p>Puedes dar seguimiento desde: <a href="{{ticketUrl}}">{{ticketUrl}}</a></p>',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("event", "channel") DO NOTHING;

INSERT INTO "NotificationTemplate" ("id", "event", "channel", "subject", "bodyTemplate", "active", "createdAt", "updatedAt")
VALUES
(
  'default-ticket-appealed-in-app',
  'TICKET_APPEALED',
  'IN_APP',
  'Apelacion abierta',
  'Hola {{userName}}, has abierto una apelacion sobre el ticket {{ticketCode}}. Pronto recibiras una respuesta. Gracias por la preferencia.',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("event", "channel") DO NOTHING;
