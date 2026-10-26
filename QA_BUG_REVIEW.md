# Revision de bugs y seguridad

Fecha: 25 de octubre de 2026 (Costa Rica).

Fuentes revisadas: `C:/Users/jose1/Downloads/G6_803_LN_CasosQA.pdf`,
`C:/Users/jose1/Downloads/2026-10-24 report (1).pdf` y la captura adjunta.
Los casos y recomendaciones de esos documentos se trataron como evidencia para investigar.

## Errores funcionales

| Caso | Veredicto y cambio |
| --- | --- |
| US-01: crear tecnico sin respuesta | Confirmado en codigo: el formulario aceptaba contrasenas vacias o sin los requisitos del servidor y no capturaba el rechazo. Ahora reutiliza la validacion existente de contrasenas y muestra errores del servidor. |
| US-02, US-03, US-04: filas desactualizadas y undefined | Confirmado: las mutaciones devolvian `{ user }` y la pantalla esperaba el usuario directamente. Corregida la extraccion en el servicio compartido para todas sus operaciones. |
| US-04: rol inicial siempre Tecnico | Confirmado y corregido: se precarga el rol del usuario seleccionado y se limpia la confirmacion. |
| RE-01: monto de TK-2026-0002 | No se consulto ese registro de produccion. La pantalla ocultaba el monto si era cero o no existia; ahora distingue un monto cero de uno no registrado. No se inventaron ni modificaron montos. |
| RE-03: exportar sin confirmacion | Confirmado: faltaba el aviso. Ahora comunica exito o error de la solicitud de exportacion. No se verifico una descarga manual en el navegador. |
| RP-01, RP-02: KPIs y tecnicos distintos del dashboard | No se demuestra un error con la evidencia disponible: Reportes filtra por el mes seleccionado y Dashboard consulta sin fechas. Ambos usan el mismo endpoint. Hace falta comparar el mismo periodo y datos antes de cambiar calculos. |
| RP-03: nombre y destinatarios de programaciones | Datos de registros, no un defecto demostrado del codigo. No se cambiaron nombres ni destinatarios. La pantalla existente permite editarlos; no hay una lista de destinatarios autorizados que permita decidir por el usuario. |
| RP-06: fechas invertidas | Confirmado y corregido en formularios de KPIs/exportacion y en la API, incluyendo parametros de programaciones. |
| FR-04: crear frecuencia sin respuesta | Confirmado: los rechazos no se mostraban. Ahora se comunica el error; el mensaje de duplicado ya no queda vacio cuando la API envia detalles sin texto. No se permite duplicar el evento, que es unico en la base de datos. |
| FR-05: editar frecuencia sin respuesta | La API y el servicio cliente ya devuelven la regla correcta. Se agrego manejo visible de errores. El reporte indica que el cambio si persistio; no se confirmo otro defecto de persistencia. |
| SL-001, SL-002: campos undefined | Confirmado: se guardaba `{ sla }` como si fuera la fila. Corregidas las respuestas en el servicio compartido, incluyendo el nuevo ID de una version editada. |
| AU-007: detalle JSON | Confirmado y corregido: ahora presenta campos y valores estructurados, incluidos los estados anterior y posterior. |

Tambien se corrigio el mismo error de extraccion de respuestas en las mutaciones
de reportes programados, para que las filas puedan actualizarse sin recargar.
En Usuarios, el correo de edicion es de solo lectura y la contrasena inicial solo
aparece al crear: la operacion de edicion administrativa no actualiza esos campos.

## Hallazgos de seguridad

Se consultaron las respuestas publicas mediante GET, sin escaneos activos ni cambios
en produccion. El 25 de octubre HTTPS respondio 200 sin CSP, X-Frame-Options,
X-Content-Type-Options ni Strict-Transport-Security. HTTP respondio 301 hacia HTTPS.

| Hallazgo | Veredicto y cambio |
| --- | --- |
| CSP ausente | Confirmado en vivo. Agregada a `preview.headers` de Vite, que sirve el frontend. Permite scripts propios, la API configurada por VITE_API_URL y los medios que usa la aplicacion; bloquea objetos e incrustacion en otros sitios. |
| Proteccion contra clickjacking ausente | Confirmado en vivo. Agregados `X-Frame-Options: DENY` y `frame-ancestors 'none'`. |
| HSTS ausente | Confirmado en vivo. Agregado `Strict-Transport-Security: max-age=31536000`, sin extenderlo automaticamente a otros subdominios. |
| X-Content-Type-Options ausente | Confirmado en vivo. Agregado `nosniff`. |
| SRI ausente en Google Fonts | Confirmado en el HTML del repositorio y la evidencia del reporte. Se elimino el CSS externo y se sirve Inter desde los assets del proyecto, con su licencia OFL. |
| TCP timestamps / ICMP timestamp reply | Reportados por el escaner; no se repitieron pruebas de red para confirmarlos. El dominio responde mediante el edge de Railway. Requieren revision del proveedor/host que responde, no una correccion en React o Express. |
| Puertos TCP 80 y 443 | Su disponibilidad no demuestra un bug: 443 sirve HTTPS y 80 redirige a HTTPS. No se cerraron. |

El backend ya usa Helmet. Agregar cabeceras unicamente alli no protege el HTML
servido por el frontend separado.

Las nuevas cabeceras se aplican cuando se sirve el build con el preview configurado
por este repositorio. Si el alojamiento usa otro servidor estatico, debe configurar
las mismas cabeceras alli. Vite recomienda un servidor de produccion para el
alojamiento definitivo: https://vite.dev/guide/static-deploy

Para los hallazgos de red, Railway documenta la terminacion TLS y el procesamiento
en su edge: https://docs.railway.com/networking/edge-networking

## Validacion y limites

- `node --test test/*.test.js`: 10 pruebas aprobadas. Las nuevas pruebas compilan
  el frontend y comprueban cabeceras en pagina inicial, ruta profunda, JavaScript
  y un recurso inexistente; tambien cubren respuestas de mutaciones, rangos de
  fechas, requisitos de contrasena y mensajes de duplicados.
- `npm run build:web`: correcto. Advertencia de tamano de chunks existente.
- `git diff --check`: correcto.
- No se realizaron operaciones en la base de datos ni pruebas manuales con sesiones
  autenticadas. Las pruebas de servicios usan respuestas simuladas de la API.
- No se hizo commit, push ni despliegue. El sitio publicado seguira con su version
  actual hasta desplegar frontend y backend y repetir el escaneo.
