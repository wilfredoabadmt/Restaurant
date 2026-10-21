# Especificación — 001 · Menú por QR, caja y gerencia

## 1 · Intento y alcance

Picantería criolla que quiere recibir pedidos de la mesa sin anotarlos a mano.
Tres mundos en una sola app web responsiva (iPhone → computadora de escritorio):

1. **Cliente en mesa**: entra por QR (`/menu`), arma su pedido (platos, bebidas, postres), lo envía a caja, registra alias + celular + mensaje y queda con un comprobante con nº, tiempo de validez y total, avisándole cuando esté listo para pagar.
2. **Cajero** (`/panel`): recibe pedidos en vivo, busca por celular o alias, corrige o elimina con justificación, cobra (efectivo/QR · local/llevar · calcula vuelto) y saca dos comandas (cocina / barra). Además reportes del día.
3. **Gerencia** (`/gerencia`): menú (categorías, productos, fotos), stock bajo con reposición en un toque, alta/desactivación de cajeros, anulación de pedidos pagados, dashboard de ventas, más vendidos y kardex de auditoría.

## 2 · Historias de usuario

### Cliente

**US-1 (P1) Ver y elegir del menú con carrito**
- Dado que escaneo el QR, Cuando entré a `/menu`, Entonces veo las categorías (Platos/Bebidas/Postres) en pestañas y "Todo".
- Al agregar, el botón se convierte en un paso +/− con cantidad; el total vive en la barra inferior; el stock se respeta (no puedo pasar de lo disponible y los agotados se ven apagados).

**US-2 (P1) Enviar pedido a caja**
- Dado un carrito con unidades, Cuando toco "Enviar pedido a caja", Entonces el backend **reserva** el stock, genera un nº de pedido y devuelve `validoHasta` = 40 min.

**US-3 (P1) Registrar alias, celular y mensaje**
- Dado un pedido ya enviado, la app me pide alias, celular (8 dígitos boliviano que arranque 6/7) y mensaje opcional. Si pasa, `PATCH /api/pedidos/:id` guarda los datos y fija la cookie `lp_pedido` por 30 min.

**US-4 (P2) Bloqueo de 30 minutos**
- Dado que ya envié, Cuando vuelvo a `/menu` dentro de los 30 min, Entonces me redirige a `/pedido/:id` (seguimiento). Al cumplirse, la cookie expira y puedo pedir de nuevo.
- **Modificación:** cuando el pedido queda **PAGADO** (o ANULADO), el bloqueo se retira de inmediato: la cookie se libera y `/menu` deja de redirigir, aunque no hayan pasado los 30 min.

**US-5 (P1) Comprobante y aviso de "listo"**
- `/pedido/:id` llega con una banda superior verde (insignia de verificación): "¡Tu pedido ya está en caja! Acércate a la caja y menciona tu alias para realizar el pago."
- Debajo: etiqueta "TU NÚMERO DE PEDIDO" con un **código alfanumérico corto** (p. ej. `XR3B8`, generado al crear el pedido, 5 caracteres sin ambiguos), "Alias:" + píldora "**⏱ Expira en #40:00** con cuenta atrás por segundos".
- Mantiene: hora de envío, celular, detalle de ítens, **total a cancelar** en Bs y servicio.
- Cuando caja marca "verificado", el banner cambia a "¡Tu pago está llano! — menciona tu alias y paga". Polling cada 4 s (los segundos de la cuenta atrás son locales, el estado se recalcula contra el servidor).

**US-6 (P2) Anulación automática a los 40 min**
- Dado que expiró la validez y nadie lo cobró, el pedido queda ANULADO, motivo "Automático…", el stock vuelve, y la pantalla del cliente lo explica.

### Cajero

**CP-1 (P1) Ver pedidos en vivo + búsqueda**
- Lista ordenada desc con chip de estado, "hace X min", restante para auto-anular, total, detalle de ítens y mensaje del cliente. Búsqueda por alias, celular o nº.

**CP-2 (P1) Cobrar**
- Modal de cobro con ítems umboneados (cocina vs barra), casilla "el cliente es conforme", método (efectivo/QR), servicio (local/llevar) y, en efectivo, monto recibido + botones rápidos (exacto, 50, 100, 200) y el **vuelto** calculado en vivo. El cobro exige efectivo ≥ total.

**CP-3 (P1) Dos comandas imprimibles**
- Tras cobrar se abre `/panel/ticket/:id` con DOS comandas: cocina (platos) y barra (bebidas + postres en una sola), fuente a monospace, borde punteado y línea de firma. Botón imprimir (window.print) ya con CSS de impresión.

**CP-4 (P2) Modificar con justificación**
- Caja puede cambiar cantidades, sumar ítems, cambiar servicio y marcar "verificado"; cambios exigen justificación (≥ 5 caracteres) que pasa a `Auditoria`, con ajuste de stock por diferencia en transacción.

**CP-5 (P2) Eliminar con justificación**
- Igual al anterior pero elimina el pedido (y repon todo el stock), guardando snapshot en auditoría. Un pedido PAGADO no se elimina (deja gerencia).

**CP-6 (P2) Crear pedido manual**
- `/panel/nuevo` para gente sin app: construye el pedido, alias/celular opcionales, servicio y queda LISTO esperando cobro.

**CP-7 (P3) Reportes de caja**
- Cobrado hoy, nº de pedidos, ticket promedio, anulados, efectivo vs QR, local vs llevar; serie de 7 días; más vendidos de hoy; lista de cobrados con hora.

### Gerencia

**AP-1 (P1) Dashboard**
- Métricas de hoy + serie semanal + más vendidos por tipo + stock por agotarse (≤ stockMin+2) con botones +6/+12 y kardex reciente.

**AP-2 (P1) Productos y fotos**
- CRUD con precio Bs, stock, umbral de alerta, disponible, categoría y foto (confirm subida a `/api/gerencia/subir`). Cada reposición (> stock previo) queda en auditoría como REPOSICION.

**AP-3 (P1) Categorías**
- CRUD; al tener productos se **apaga** (no borra) para conservar el historial; el menú respeta el orden y estado.

**AP-4 (P1) Cajeros**
- Alta por usuario+contraseña (nombres, apellidos, usuario de acceso, clave), desactivación y nueva clave; la cuenta gerencia no se puede apagar.

**AP-5 (P2) Anular pedidos pagados o en curso**
- Modal exige motivo; si estaba pagado, la venta sale del día (queda anulado pero sus líneas van a auditoría) y si no estaba pagado, se reintegra el stock.

**AP-6 (P2) Reportes de menú**
- Más vendidos de platos/bebidas/postres (7 días), **fecha de ingreso** de cada producto (kardex de altas) y estado del stock, en el productor y dashboard.

**AP-7 (P3) Auditoría**
- Log consultable 1/7/30 días con acción, usuario, nº pedido, justificación y detalle.

## 3 · Reglas de negocio medibles

| Regla | Valor |
| --- | --- |
| Moneda | Bs, 2 decimales, formato es-BO |
| Validez de pedido cliente | **40 min** desde el envío → anula automáticamente |
| Bloqueo del menú tras enviar | **30 min** (cookie `lp_pedido`) |
| Numeral de celular | ^[67]\d{7}$ (8 dígitos) |
| Justificación mínima | 5 caracteres (modificar y eliminar) |
| Foto de producto | ≤ 3 MB (png/jpg/webp/gif) |
| Contraseña de cajero | ≥ 6 caracteres |
| Alerta de stock bajo | stock ≤ stockMin (+2 en la vista) |
| Cobro efectivo | monto recibido ≥ total, cambió redondeado a 2 decimales |

## 4 · Fuera de alcance

- Integración con impresora térmica nativa (se entregan comandas HTML imprimibles).
- Mesas codificadas por número (el QR abre el menú genérico de la casa).
- Pago en línea: solo regista el cobro en caja.
- Multirol dentro del cliente (un móvil, un uso).
