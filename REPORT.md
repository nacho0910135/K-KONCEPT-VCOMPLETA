# Auditoria tecnica integral - Kollab Koncepts

Fecha: 2026-05-21  
Alcance: backend Express/Prisma, frontend React/Vite, seguridad de concurrencia, multimedia, RBAC, auditoria, rendimiento y readiness empresarial.

## Resumen ejecutivo

La plataforma tiene una base correcta para adopcion empresarial: Prisma usa parametrizacion en queries raw, Helmet/CORS/rate limiting estan activos, refresh tokens se almacenan hasheados, AuditLog y TicketStatusHistory no exponen endpoints de UPDATE/DELETE, y la mayor parte de los endpoints usan `verifyToken`, `authorizeRoles`, Zod y `asyncHandler`.

Durante la auditoria se corrigieron riesgos relevantes en validacion multimedia, contencion transaccional, ciclo de vida de tickets, logs sensibles, validacion de parametros y rendimiento frontend. El sistema queda en mejor posicion para produccion, aunque se recomienda completar pruebas automatizadas, observabilidad, cifrado real de configuraciones sensibles y controles de CI/CD antes de Go-Live.

## Vulnerabilidades encontradas y corregidas

| Severidad | CVSS estimado | Area | Hallazgo | Estado |
| --- | ---: | --- | --- | --- |
| Alta | 8.1 | Upload multimedia | El middleware confiaba inicialmente en `file.mimetype` del cliente antes de validar magic numbers. | Corregido: se acepta en memoria y se valida por firma real + extension sanitizada. |
| Alta | 7.8 | Ciclo de vida tickets | `changeStatus` contenia una auditoria de asignacion con variable `technician` fuera de scope, con riesgo de 500 tras cambio de estado. | Corregido: auditoria movida al flujo real de asignacion. |
| Media-Alta | 7.1 | Concurrencia | La transaccion `SELECT ... FOR UPDATE` tenia timeout/isolation correctos, pero no retry ante `P2034`, deadlock o timeout de lock. | Corregido: `withTransactionRetry` con backoff exponencial y jitter. |
| Media | 6.8 | Estado tickets | `confirmSolution`, `rejectSolution` y auto-cierre SYSTEM no llamaban explicitamente a `ALLOWED_TRANSITIONS`. | Corregido: validacion central aplicada a caminos alternos. |
| Media | 6.5 | Logs | Logger HTTP podia capturar headers/body sensibles segun configuracion futura. | Corregido: redaccion de tokens/passwords y serializer HTTP minimo. |
| Media | 6.3 | JWT/env | `JWT_SECRET` aceptaba secretos cortos. | Corregido: minimo 32 chars y 48 chars en produccion. |
| Media | 5.9 | Validacion | Varias rutas de ticket no validaban `params.id` como UUID antes de llegar al servicio. | Corregido en rutas de tickets. |
| Baja-Media | 5.0 | XSS almacenado | Campos texto libre no eliminaban caracteres de control al persistir. React renderiza texto plano, pero el backend no normalizaba entradas. | Mitigado: sanitizacion de texto plano para tickets y comentarios. |

## Refactors y optimizaciones aplicadas

### Concurrencia Prisma

- Confirmado: `$queryRaw` y `$executeRaw` usan tagged templates de Prisma:
  - `SELECT * FROM "TicketCounters" WHERE "year" = ${year} FOR UPDATE`
  - `UPDATE "TicketCounters" SET "count" = ${newCount} ... WHERE "year" = ${year}`
- No hay concatenacion de strings en esas consultas.
- Se mantiene `timeout: 10000` e `isolationLevel: Serializable`.
- Se agrego `src/utils/prismaTransaction.util.js` con retry para errores transitorios de serializacion, deadlocks, lock timeout y transacciones cerradas.
- Comportamiento bajo alta carga: las solicitudes concurrentes se serializan por fila `TicketCounters`; si una transaccion pierde por contencion, reintenta hasta 4 veces con backoff y jitter.

### Validaciones multimedia

- Se cubren magic numbers para JPEG, PNG, WEBP, MP4, MOV y PDF.
- Se dejo de confiar en `content-type` enviado por el cliente.
- Se valida:
  - firma real del archivo;
  - extension sanitizada;
  - concordancia extension/firma;
  - limites por tipo: imagen 5MB, video 50MB, PDF 10MB.
- Cloudinary usa `randomUUID()` como `public_id`, `overwrite: false`, `unique_filename: false` y borrado por `publicId` persistido.
- El `mimeType` guardado ahora proviene de la deteccion validada, no del cliente.

### Ciclo de vida de tickets

- `TECHNICIAN` no puede transicionar a `CLOSED`; solo puede llegar a `RESOLVED`.
- `CLIENT` solo puede cerrar desde `RESOLVED` mediante `confirmSolution` con rating obligatorio 1-5.
- `SYSTEM` solo puede cerrar `RESOLVED -> CLOSED` en el job de limpieza tras 5 dias.
- `ALLOWED_TRANSITIONS` se aplica en:
  - endpoint de cambio de estado;
  - confirmacion de solucion;
  - rechazo/reapertura;
  - asignacion que mueve `OPEN -> PENDING`;
  - cierre automatico SYSTEM.
- `TicketStatusHistory` sigue append-only a nivel API: no hay rutas UPDATE ni DELETE.

### Backend general

- Error response estandarizado mantiene `{ success: false, message, errors }` y Zod ahora mapea `field`.
- Refresh token sigue hasheado en BD; el lookup ya no selecciona password del usuario.
- CORS sigue con whitelist desde `.env`; se bloquea wildcard en produccion.
- Rate limiting activo global y en `/auth`.
- AuditLog sigue append-only a nivel rutas; no se detectaron endpoints de UPDATE/DELETE.
- `NOTIFICATION_BLOCKED_BY_FREQUENCY` ya se registra cuando una regla bloquea envio.

### Frontend

- Se aplico `React.lazy` + `Suspense` en rutas grandes.
- Metrica build:
  - Antes: bundle principal JS ~968.8 kB minificado.
  - Despues: bundle principal JS ~334.7 kB minificado, con chunks por pagina.
- React renderiza texto plano por defecto; no se detecto `dangerouslySetInnerHTML`.
- Componentes clave cuentan con loading/empty states via `DataTable`, `Spinner`, `useAdminResource` y estados locales.

## Riesgos residuales

- Falta suite automatizada de seguridad/regresion; la verificacion fue build + inspeccion estatica.
- Las credenciales de canales de notificacion hoy se aceptan como referencias seguras (`env:`, `secret:`, `vault:`, `sm:`), no como cifrado KMS real en BD.
- Audit logs son append-only por API, pero la inmutabilidad fuerte requiere politicas DB: permisos sin UPDATE/DELETE o triggers.
- Reportes/exportaciones pesadas deben evolucionar a streaming real para datasets grandes.
- Cache KPI no esta implementado aun; recomendable Redis si se despliega en multiples instancias.
- No hay politicas CSP personalizadas documentadas; Helmet default ayuda, pero produccion deberia definir CSP explicita.

## Recomendaciones futuras

### Testing

- Jest + Supertest para auth, tickets, RBAC, reportes, auditoria y uploads.
- Test de carrera: N=50 creaciones simultaneas y verificacion de codigos unicos/secuenciales.
- Tests unitarios para `warrantyStatus`, `slaResolver`, `cronCalculator`, `templateRenderer`, `diffCalculator`, `fileValidation.util` y `ticketTransitions.util`.
- E2E Playwright/Cypress: login, crear ticket, asignar, resolver, calificar/cerrar, upload evidencia y exportar reporte sin datos.

### Observabilidad

- Sentry para errores frontend/backend.
- Datadog/OpenTelemetry para trazas por request, queries lentas y jobs cron.
- Alertas para `NOTIFICATION_CHANNEL_FAILED`, auth failures anormales, lock retries agotados y SLA breaches.

### CI/CD

- GitHub Actions con:
  - install reproducible (`npm ci`);
  - lint;
  - tests unitarios/integracion;
  - `npm run build:web`;
  - Prisma validate/generate;
  - escaneo SAST/dependencias.

### Deployment

- Docker multi-stage y runtime non-root.
- HTTPS obligatorio via ingress/PaaS.
- PostgreSQL con backups PITR, retencion y restore drills.
- Migraciones Prisma controladas en pipeline.
- Secret manager para JWT, SMTP, Cloudinary y proveedores SMS/Push.

## Checklist Go-Live

- [x] Helmet activo y `x-powered-by` deshabilitado.
- [x] CORS con whitelist desde `.env`.
- [x] Rate limiting global y auth.
- [x] JWT secret fuerte requerido por env.
- [x] Refresh tokens hasheados y rotados.
- [x] Upload en memoria con magic numbers y extension sanitizada.
- [x] Limites por tipo de archivo.
- [x] Cloudinary con UUIDv4 y borrado por `publicId`.
- [x] Prisma raw queries parametrizadas.
- [x] Contador de tickets con `FOR UPDATE`, Serializable, timeout y retry.
- [x] Matriz de estados aplicada en mutaciones principales y alternativas.
- [x] Cliente cierra solo con rating 1-5.
- [x] Tecnico no cierra directamente.
- [x] SYSTEM cierra tras 5 dias en `RESOLVED`.
- [x] AuditLog y TicketStatusHistory sin endpoints mutables.
- [x] Logs sensibles redactados.
- [x] Respuestas success/error homogeneas.
- [x] Frontend con code splitting de rutas.
- [ ] Implementar tests automatizados minimos.
- [ ] Definir CSP estricta.
- [ ] Cifrar configuraciones sensibles con KMS/secret manager.
- [ ] Aplicar permisos DB append-only para auditoria/historial.
- [ ] Agregar Redis/NodeCache para KPIs frecuentes.
- [ ] Agregar streaming para exportaciones grandes.
- [ ] Configurar Sentry/Datadog/OpenTelemetry.
- [ ] Crear pipeline CI/CD con gates de seguridad.
- [ ] Ejecutar prueba de restore de backup PostgreSQL.
- [ ] Validar HTTPS, HSTS y rotacion operacional de secretos.
