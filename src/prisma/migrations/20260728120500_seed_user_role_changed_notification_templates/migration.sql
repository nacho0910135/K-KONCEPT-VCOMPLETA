INSERT INTO "NotificationTemplate" ("id", "event", "channel", "subject", "bodyTemplate", "active", "createdAt", "updatedAt")
VALUES
(
  'default-user-role-changed-email',
  'USER_ROLE_CHANGED',
  'EMAIL',
  'Tu rol en Kollab Koncepts ahora es {{newRole}}',
  '<p>Hola {{userName}},</p><p>{{roleChangeMessage}}</p><p>El administrador <strong>{{actorName}}</strong> actualizo tu acceso en la plataforma.</p><ul><li><strong>Rol anterior:</strong> {{previousRole}}</li><li><strong>Rol nuevo:</strong> {{newRole}}</li></ul><p>Ya puedes iniciar sesion y usar las opciones disponibles para tu nuevo rol.</p>',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("event", "channel") DO NOTHING;

INSERT INTO "NotificationTemplate" ("id", "event", "channel", "subject", "bodyTemplate", "active", "createdAt", "updatedAt")
VALUES
(
  'default-user-role-changed-in-app',
  'USER_ROLE_CHANGED',
  'IN_APP',
  'Rol actualizado',
  '{{roleChangeMessage}} Nuevo rol: {{newRole}}.',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("event", "channel") DO NOTHING;
