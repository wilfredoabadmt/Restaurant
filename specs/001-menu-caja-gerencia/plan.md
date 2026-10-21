# Plan — 001 · Menú por QR, caja y gerencia

## Stack y por qué

| Área | Elección | Por qué |
| --- | --- | --- |
| Framework | **Next.js 15 (App Router) + React 19 + TypeScript** | server components para páginas de datos + client components interactivos; una sola app sirve a móvil y escritorio |
| Gestor de paquetes | **npm 11** (Node 24) | ya instalado en la máquina |
| BD | **PostgreSQL 14** local | exigencia del cliente; esquema con enums nativos y campos `Decimal(10,2)` |
| ORM | **Prisma 6** | db push/seed ágil, transacciones para stock, tipos tipados, `Auditoria` con JSON |
| Sesiones | **JWT HS256 (jose) en cookie httpOnly + middleware** | cero dependencia de adaptadores; roles CAJERO/ADMIN resueltos en runtime de borda |
| Contraseñas | **bcryptjs** | estándar, sin binarios nativos |
| Validación | **zod 4** | esquemas exactos y mensajes en español para la UI |
| Estilos | **Tailwind CSS 4 (@tailwindcss/postcss)** + CSS custom props en `globals.css` | tema oscuro "brasa criolla" con tokens propios, chico y adaptable |
| QR | **qrcode** (data URL generada en el server) | el QR apunta a `http://<host>/menu` (host real de la petición) |
| Fotos | subida por `FormData` a `public/uploads` | sin nube para la demo; en prod se movería a S3/MinIO |
| Iconograf | emoji tiles (`emoji:🍔`) | funciona offline y con mucho carácter |

## Arquitectura de datos (resumen — contrato completo en data-model.md)

`Usuario` (roles ADMIN/CAJERO) · `Categoria` (tipo PLATOS/BEBIDAS/POSTRES) · `Producto` (stock, umbral, imagen, precio Decimal) · `Pedido` (estado, servicio, método de pago, momento de validez, total, motivo de anulación) · `PedidoItem` (snapshot del nombre/tipo/precio/cantidad) · `Auditoria` (acción, justificación, detalle JSON).

## Decisiones clave

1. **Reserva de stock en el envío** y reintegra en modificación/eliminación/anulación (incluida la automática por vencimiento): evita vender más de lo que hay.
2. **Snapshot de ítems** (nombre, tipo, precio) para que el historial y las comandas no rompan si luego mueven precios.
3. **`validoHasta`** seteado al crear (+40 min) y marcado de cobro/salida en el listado; la anulación por vencimiento corre de forma perezosa en cada lectura de rutas clave.
4. **Cookie `lp_pedido` (30 min)** para bloquear el menú; el seguimiento en `/pedido/:id` es público (sin datos sensibles), con polling.
5. **Roles**: middleware aplica reglas por prefijo (`/panel/*`, `/api/panel/*`, `/gerencia/*` solo ADMIN, `/api/gerencia/*` solo ADMIN); la librería `sesion.ts` vuelve a verificar que el usuario siga activo en cada llamada.
6. **La búsqueda de caja** matchea celular (contiene), alias (contiene) y nº exacto.

## Riesgos y mitigación

- **Condiciones de carrera de stock** → única transacción por operación crítica (`db.$transaction`).
- **Foto de producto en producción** → la carpeta es sustituible; sin servidor persistente se pasa a S3 en el mismo endpoint.
- **Reloj del cliente vs servidor** → todos los plazos (40/30 min) se calculan contra la hora del servidor; el móvil solo muestra cuenta atrás aproximada.

## Fases

1. **Fase A — Cliente QR**: menú + carrito + envío + datos + seguimiento + bloqueo. (US-1…US-6)
2. **Fase B — Caja**: listado vivo + cobro + comandas + edición justificada + pedido manual. (CP-1…CP-6)
3. **Fase C — Gerencia**: productos/categorías/cajeros/auditoría + dashboard + anulación + reportes. (AP-1…AP-7)
4. **Fase D — Demo**: semillas (16 productos con stock realista, 5 pedidos de ejemplo), QR en portada, pantallas para verificación visual.
