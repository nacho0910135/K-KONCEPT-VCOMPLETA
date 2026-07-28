UPDATE "NotificationTemplate"
SET
  "subject" = 'Ticket {{ticketCode}} resuelto',
  "bodyTemplate" = 'Hola {{userName}}, el ticket {{ticketCode}} quedo finalizado. Gracias por confirmar la atencion recibida.',
  "updatedAt" = NOW()
WHERE "event" = 'TICKET_CLOSED'
  AND "channel" = 'EMAIL'
  AND "active" = true
  AND (
    "subject" ILIKE '%cerrado%'
    OR "bodyTemplate" ILIKE '%cerrado%'
  );
