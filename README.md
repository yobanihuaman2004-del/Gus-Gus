# Supabase

Se conserva el proyecto Supabase existente. No se agrega migración automática porque ya existen tablas y funciones activas y no se dispone del esquema completo ni de sus políticas RLS.

RPC observadas en el SQL exportado:
- `create_deal(p_seller_dni text, p_amount numeric, p_desc text)`
- `deal_action(p_deal bigint, p_action text)`
- `demo_topup()`
- `send_message(p_deal bigint, p_body text)`

El saldo y la custodia del prototipo son demostrativos, no pagos reales.
