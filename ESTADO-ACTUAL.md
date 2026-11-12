# Estado de la entrega 1.1.0

## Incorporado en esta entrega
- Renovación visual alineada al boceto: vino, beige, crema, marrón y champagne; tarjetas suaves y detalles futuristas.
- Navegación de cinco opciones: Inicio, Buscar, Crear, Mis tratos y Perfil.
- Módulos de interfaz GUSS y NORT II.
- GUSS responde preguntas frecuentes y advierte sobre señales comunes de fraude mediante reglas locales.
- NORT II resume los tratos visibles del usuario.
- Panel administrativo inicial de lectura, restringido visualmente por lista de correos.
- Conservadas autenticación, perfil, avatar, tratos, chat y RPC existentes.

## No afirmar como terminado
- No hay cobros reales, custodia real ni liquidaciones. Izipay no está conectado.
- GUSS no es todavía IA generativa conectada a un proveedor externo.
- NORT II no tiene acceso global a la plataforma.
- Panel admin no administra usuarios ni pagos y requiere autorización segura/RLS.
- Comisión configurable aún no está implementada; el RPC recuperado mantiene el cálculo existente.
- Buscar filtra los tratos visibles del propio usuario; no existe catálogo global verificado en el esquema recuperado.

## Nota de seguridad
No se modificó el esquema Supabase porque faltan el esquema completo y las políticas RLS. No exponer claves privadas en el frontend.
