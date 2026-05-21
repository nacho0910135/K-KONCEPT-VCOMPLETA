# Auditoria UX, persistencia y estabilidad - Kollab Koncepts

Fecha: 2026-05-21  
Alcance: frontend React, API Express, Prisma/PostgreSQL, flujo de autenticacion y modulo de categorias/subcategorias.

## Diagnostico ejecutivo

La aplicacion mezcla dos modelos de datos: modulos conectados a PostgreSQL y modulos que todavia trabajan con `adminMockData`, `clientMockData`, `technicianMockData` y `useAdminResource`. Esa mezcla es la causa principal de cambios que parecen guardarse pero luego se pierden.

Tambien existia una falla visual de base: la escala `neutral` tenia grises muy planos y las tarjetas usaban un fondo gris similar al fondo de pagina. Eso reducia el contraste y hacia que botones, campos y paneles se vieran apagados.

En esta intervencion se cerro el modulo critico de categorias/subcategorias con persistencia real y se mejoro la base visual global.

## Cambios aplicados

- Categorias y subcategorias ahora leen y escriben contra PostgreSQL mediante API real.
- El administrador puede crear, editar, activar/desactivar y eliminar categorias/subcategorias.
- Las acciones destructivas tienen confirmacion.
- Los guardados muestran feedback visual consistente con toasts de exito/error.
- Las mutaciones recargan datos desde backend despues de guardar para evitar estados locales falsos.
- Se agrego seed real de categorias iniciales y subcategorias.
- El cliente carga categorias reales al crear ticket.
- Se corrigio la escala neutral y las tarjetas para mejorar contraste y legibilidad.
- Se corrigio la renovacion de sesion para usar refresh token almacenado y rotado.

## Pruebas realizadas

- `npm run seed`: OK.
- `npm run build:web`: OK.
- PostgreSQL: conectado a `kollab_koncepts_reports`.
- API categorias como administrador:
  - listar: OK
  - crear categoria: OK
  - crear subcategoria: OK
  - editar categoria: OK
  - desactivar/activar: OK
  - eliminar subcategoria: OK
  - eliminar categoria: OK
- API categorias como cliente: puede listar categorias activas para crear tickets.
- API refresh token: rota y devuelve nuevos tokens correctamente.

## Hallazgos pendientes

Estos modulos todavia tienen riesgo de no persistir porque usan mocks o simulaciones:

- Admin: dashboard, tickets, usuarios, SLA, reportes, auditoria, plantillas, canales y frecuencia.
- Cliente: dashboard, mis tickets, detalle, garantias, notificaciones y parte de la validacion de garantia.
- Tecnico: dashboard, tickets asignados, detalle, reemplazos y notificaciones.

Mientras esos modulos sigan usando mocks, cualquier cambio visual puede parecer exitoso pero no quedar guardado en PostgreSQL.

## Recomendacion de siguiente fase

1. Conectar tickets admin/cliente/tecnico a los endpoints reales existentes.
2. Conectar usuarios admin a `/api/users`.
3. Conectar notificaciones, plantillas, canales y frecuencia a sus endpoints reales.
4. Conectar SLA y reportes a API real.
5. Reemplazar `useAdminResource` por hooks de datos reales con loading/error/empty states.
6. Agregar pruebas E2E de flujos criticos: login, crear ticket, editar categorias, asignar tecnico, resolver y cerrar.

