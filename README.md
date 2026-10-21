# La Paila · app de restaurante (menú por QR + caja + gerencia)

Aplicación web **responsiva** (móvil → escritorio) para una picantería criolla, hecha con
**Next.js 15 + React 19 + TypeScript + Tailwind 4 + Prisma + PostgreSQL**, moneda **Bs**.
Desarrollada con **Spec-Driven Development** (estructura tipo GitHub Spec-Kit: spec → plan → modelado → tasks → checklist → código).

## Estructura Doc

| Carpeta | Contenido |
| --- | --- |
| `specs/001-menu-caja-gerencia/` | `spec.md` (historias y reglas), `plan.md` (stack y decisiones), `data-model.md`, `tasks.md`, `checklists/requirements.md` |
| `.specify/` | constitución y plantillas Spec-Kit |
| `capturas/` | pantallas generadas del sistema corriendo |
| `prisma/` | esquema y semilla repetible (platos criollos, cajeros y pedidos de ejemplo) |
| `scripts/capturas.mjs` | utilidad CDP para regenerar las capturas |

## Pantallas de ejemplo (en `capturas/`)

1. `1-portada-qr.png` — portada con el QR del local (apunta al `/menu` del host real).
2. `2-menu-movil.png` — **cliente, móvil**: pestañas Todo/Platos/Bebidas/Postres, stepper +/−, totales Bs.
3. `4-seguimiento.png` — **cliente**: nº de pedido, validez (26 min), aviso y **total a cancelar**.
4. `5-panel-caja.png` — **caja**: listado en vivo, buscador por celular/alias, chips de estado, cuenta atrás para auto-anular.
5. `6-nuevo-pedido.png` — pedido manual para gente sin la app.
6. `9-comandas.png` — tras cobrar: dos comandas (Cocina / Barra) imprimibles.
7. `7-dashboard.png` — **gerencia**: métricas del día, serie semanal, stock por agotarse con reposición al toque, más vendidos, ingresos al menú y cajeros.
8. `8-productos.png` — CRUD de productos con foto y stock.
9. `3+/4-*-login.png` — entradas de caja y gerencia.

## Cómo correr

```bash
npm install          # instala y hace prisma generate
npm run setup        # prisma db push + semilla (repetible)
npm run dev          # http://localhost:3000  (LAN: la IP que imprime Next)
```

Requiere `.env` con `DATABASE_URL` (PostgreSQL) y `AUTH_KEY` (32+ caracteres).

### Credenciales demo

- Gerencia: `admin / admin123`
- Cajas: `cajero1 / cajero123` · `cajero2 / cajero123` (puedes crear más desde gerencia)

## Flujo

**Cliente (QR → `/menu`):** elige platos/bebidas/postres en el carrito (stepper +/−, stock en vivo),
envía a caja → registra **alias, celular** (valida 8 dígitos empezando 6/7) **y mensaje** →
pantalla de seguimiento con nº, validez (**40 min** → anula automática), total a pagar y aviso
"ya está tu pedido, acércate a caja". El menú queda bloqueado **30 min** (cookie).

**Cajero (`/panel`):** pedidos en vivo (polling), búsqueda por celular/alias/nº, modifica o elimina
**con justificación obligatoria** (queda en auditoría junto con el ajuste de stock),
cobra en **efectivo (monto + vuelto)** o **QR**, define **en el local / para llevar**,
y obtiene **dos comandas** (cocina y barra) imprimibles. Reportes: cobrado del día, efectivo/QR,
local/llevar, serie 7 días, más vendidos y anulados.

**Gerencia (`/gerencia`):** dashboard (cobrado hoy, en curso, anulados), gráfico semanal,
products **por agotarse** con reposición +6/+12, CRUD de productos (con **subida de foto**) y
categorías, alta de **cajeros** (nombres, apellidos, usuario, contraseña) y desactivación,
**anulación** de pedidos pagados con motivo, reportes de más vendidos y fecha de ingreso al menú,
y **kardex de auditoría** (24 h / 7 días / 30 días).

## Notas de infra

- `docker-compose.yml` provee un PostgreSQL listo (`resto:resto2026@localhost:5432/restaurante`) si no hay servidor local.
- La anulación automática por vencimiento es "perezosa" (se evalúa en cada lectura): simple y suficiente para el volumen de una picantería.
- Fotos subidas a `public/uploads` (en producción se movería a S3).
