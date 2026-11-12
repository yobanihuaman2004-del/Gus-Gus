# Gus Gus · entrega 1.2.0

Interfaz web de Gus Gus con identidad vino, beige, crema y marrón, detalles champagne y estilo futurista suave, siguiendo el boceto aprobado.

## Incluye
- Acceso y registro con Supabase Auth.
- Inicio con saldo de demostración y módulos GUSS / NORT II.
- Crear trato con validación de DNI, categoría guardada dentro de la descripción, monto y detalle.
- Mis tratos, filtro de búsqueda sobre los tratos propios y chat por trato.
- Perfil y foto de avatar.
- GUSS y NORT II tienen mascotas vectoriales integradas; GUSS ofrece orientación guiada local y NORT II métricas de actividad. No es todavía un modelo generativo conectado.
- NORT II: indicadores calculados a partir de los tratos que la cuenta puede consultar.
- Vista administrativa inicial de solo lectura, mostrada a los correos declarados en `public/config.js`. No bloquea cuentas ni altera saldos.
- Preparación del proyecto sin secretos ni credenciales de Izipay.

## Ejecutar
Requiere Node.js 20+. En la raíz: `npm install`, `npm start`. Abrir `http://localhost:3000`. Validar sintaxis con `npm run check`.

## Subir a GitHub
Sube el CONTENIDO de esta carpeta a la raíz del repositorio `Gus-Gus`, conservando la estructura `public/`, `supabase/`, `docs/` y `scripts/`.

## Conexiones y límites importantes
- Supabase está configurado con la clave publishable del navegador. Nunca coloques `service_role` en `public/`.
- Se conserva el esquema/RPC existente: `profiles`, `deals`, `messages`, `avatars`, `create_deal`, `deal_action`, `demo_topup()` y `send_message`.
- La recarga de prueba usa la RPC existente sin parámetros y solo agrega S/ 100.00. El pago sigue siendo DEMOSTRATIVO. No se mueve dinero real. Izipay está deliberadamente desconectado: requiere credenciales de integración, endpoint de servidor y webhook verificado antes de activar cobros.
- La categoría del formulario es visual porque la tabla/RPC recuperada no confirma una columna para categoría.
- GUSS no llama a una IA generativa en esta entrega; es un asistente guiado local. Una IA generativa necesita un proveedor y una clave privada en servidor. No se inventó una credencial.
- NORT II ofrece estadísticas personales con los datos disponibles; no puede supervisar a todos los usuarios sin vistas/funciones autorizadas de administración.
- La vista admin es informativa y de solo lectura. La autorización definitiva debe implementarse con roles y políticas RLS del lado de Supabase, no confiar en la lista del frontend.
- No se agregaron migraciones destructivas ni se alteraron tablas existentes porque no se recuperó el esquema completo ni todas las políticas RLS.

## Antes de producción
Revisar RLS y permisos; probar alta, autenticación, creación y ciclo de tratos; completar roles administrativos seguros; integrar IA generativa con secreto en servidor si se requiere; y conectar Izipay con credenciales y webhooks validados.
