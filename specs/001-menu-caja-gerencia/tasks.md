# Tareas — 001 · Menú por QR, caja y gerencia

Marcas: [P] paralelizable · grupo Fase A/B/C/D · cada bloque enlaza sus historias (spec.md).

## Fase A — Cliente por QR [US-1…US-6]

- [x] A1 Esquema Prisma + enums + índices (`prisma/schema.prisma`) [P]
- [x] A2 Semilla: 3 categorías, 16 productos criollos, 3 usuarios, 5 pedidos de ejemplo (`prisma/seed.ts`) [P]
- [x] A3 Librerías: `lib/db`, `lib/sesion` (JWT+cookies), `lib/negocio` (anularVencidos, snapshot), `lib/formato` (Bs es-BO, "hace X min")
- [x] A4 Middleware de rutas protegidas (`src/middleware.ts`)
- [x] A5 API de menú público `/api/menu` [US-1]
- [x] A6 API crear pedido `/api/pedidos` POST — reserva stock + `validoHasta` 40 min [US-2]
- [x] A7 API estado/datos/modificar/eliminar `/api/pedidos/[id]` — GET público, PATCH datos cliente (alias/celular/mensaje), PUT caja justificado, DELETE caja justificado [US-3, CP-4, CP-5]
- [x] A8 Página portada con QR generado del host real (`/`) [US-1]
- [x] A9 Página y cliente de menú: pestañas, tarjetas, carrito paso +/−, total Bs, enviar, datos, cookie 30 min (`/menu`) [US-1, US-2, US-3, US-4]
- [x] A10 Página de seguimiento con estilo del comprobante (banda verde, check, código grande, expira en mm:ss) y aviso LISTO/PAGADO [US-5]
- [x] A11 Anulación por vencimiento ejecutada en las lecturas de listado/pedidos/reportes [US-6]
- [x] A12 Al quedar PAGADO o ANULADO el menú se libera (cookie soltada en el seguimiento y `/menu` ya no redirige) [US-4]
- [x] A13 Código alfanumérico por pedido (`Pedido.codigo`, p. ej. JPCG9): se genera en envío y en pedido manual, se muestra al cliente, en caja (listado + búsqueda) y en las comandas; redirecciones cortas `/cajero` y `/admin` [US-2, CP-1, CP-3, AP-6]
- [x] A14 Tarjeta de pedido en caja con el diseño aprobado: `#CÓDIGO` ámbar + hora bajo el código, alias y celular, contadores "n productos / n unidades", total Bs grande, píldora de estado ("En caja"/"Listo"/"Pagado"/"Anulado"), cuenta atrás ⏱ mm:ss por segundos y botones ✎ Modificar · 🗑 Eliminar · Cobrar Bs X [US-2]

## Fase B — Caja [CP-1…CP-7]

- [x] B1 Login de caja (`/panel/entrar`) + sesión GET/POST/DELETE
- [x] B2 API panel `/api/panel/pedidos` GET+búsqueda y POST pedido manual [CP-1, CP-6]
- [x] B3 API pagar `/api/pedidos/[id]/pagar` — efectivo/QR, local/llevar, vuelto, comanda data [CP-2]
- [x] B4 Panel: listado vivo (polling 6 s), chips de estado, "hace X min", cuenta atrás, mensajes [CP-1]
- [x] B5 Modal de cobro con verificación de cliente, montos rápidos y vuelto calculado [CP-2]
- [x] B6 Modal modificar (ítems + servicio + verificación) **justificación obligatoria** [CP-4]
- [x] B7 Modal eliminar con justificación + snapshot en auditoría [CP-5]
- [x] B8 Página de comandas `/panel/ticket/[id]` — cocina y barra, monospace, CSS @media print [CP-3]
- [x] B9 Builder manual `/panel/nuevo` (alias/celular opcionales, servicio, picker con steppers) [CP-6]
- [x] B10 API y vistа de reportes `/api/panel/reportar`+`ReporteVista` (cobrado, efectivo/QR, serie 7d, top, anulados) [CP-7]

## Fase C — Gerencia [AP-1…AP-7]

- [x] C1 Login separado `/gerencia/entrar` (solo ADMIN; cajero con sesión va a /panel)
- [x] C2 API resumen `/api/gerencia/resumen` (métricos hoy, serie, top por tipo, stock bajo, ingresos, cajeros, último log) [AP-1]
- [x] C3 Dashboard: tarjetas, gráfico de barras semanal, stock por agotarse con +6/+12 (PATCH reposición) [AP-1]
- [x] C4 API CRUD productos + subida de foto `/api/gerencia/subir` (≤3 MB) [AP-2]
- [x] C5 Página productos: lista con foto, stock y fecha de ingreso; alta/edición con foto, reposición, baja [AP-2, AP-6]
- [x] C6 API + página categorías: alta/tipo/orden, apagar vs borrar con productos [AP-3]
- [x] C7 API + página cajeros: alta (usuario/nombres/apellidos/clave), desactivar, cambiar clave [AP-4]
- [x] C8 API anular `/api/pedidos/[id]/anular` (solo ADMIN, motivo) + página de pedido con búsqueda [AP-5]
- [x] C9 API auditoría + página kardex (24h/7d/30d) [AP-7]
- [x] C10 Formato moneda Bs con es-BO y stock en Decimal en todas las vistas [regla]

## Fase D — Demo y verificación

- [x] D1 tsx `tsc --noEmit` sin errores
- [x] D2 Flujo de humo: carrito → envío → datos → panel → modificación → cobro → comandas → anulación de gerencia (manual con `curl`/navegador)
- [x] D3 Capturas de pantallas de ejemplo (portada QR, menú móvil, seguimiento, panel de caja, cobro, gerencia)
- [ ] D4 (pendiente del dueño) integración a impresora térmica real
