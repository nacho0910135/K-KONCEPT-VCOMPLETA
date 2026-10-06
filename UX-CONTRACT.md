# Contrato de interacción

- Los cambios de diagnóstico y estado deben conservar el texto introducido si el servidor rechaza el guardado. Un cambio concurrente devuelve conflicto y solicita recargar.
- La eliminación de evidencia requiere confirmación. El servidor decide permisos: administrador, o autor dentro de una hora de la carga. La acción se registra y aparece en el historial del caso.
- Un reemplazo se solicita desde el caso. La serie y el producto nuevo se registran o editan desde Reemplazos cuando el reemplazo está aprobado y aún no se ha entregado.
- En móvil, la tabla de tickets asignados usa tarjetas con los mismos datos y acciones. «Más» abre todas las secciones de navegación.
- El inicio de sesión requiere contraseña y después un código elegido por el usuario: correo o Authenticator si está vinculado. Los tres alias operativos históricos (`admin@kollabkoncepts.com`, `tecnico@kollabkoncepts.com` y `cliente@kollabkoncepts.com`) omiten el segundo factor; el correo principal de esas cuentas y las demás cuentas conservan el flujo normal. Los códigos de correo vencen en diez minutos y cada desafío tiene cinco intentos.
- El registro crea la cuenta y dirige al inicio de sesión sin solicitar Authenticator. Las cuentas existentes pueden vincular o reemplazar la clave desde Perfil con su contraseña actual; la clave activa no se vuelve a mostrar.
- Una cuenta sin Authenticator puede vincularlo después de validar su contraseña durante el inicio de sesión. Se muestra un QR y una clave manual; el código correcto vincula la cuenta y completa el acceso.
- Perfil permite cambiar el correo. Al cambiarlo solicita la contraseña actual y rechaza direcciones ya usadas; otros datos del perfil no requieren repetir la contraseña.
