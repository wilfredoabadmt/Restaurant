# Constitución técnica — La Paila (app de restaurante)

Proyecto: menú digital por QR + caja + gerencia para picantería criolla.

## Principios

I. **Spec primero**: toda funcionalidad empieza como historia aceptable en `specs/<rama>/spec.md`; el código responde a un requisito medible o no se escribe.

II. **Moneda y formato**: precios y reportes en **Bs** (formato es-BO, dos decimales). No se usan otras divisas en la UI.

III. **Una sola fuente de verdad de negocio**: las reglas de stock y tiempos residen en el servidor (`src/lib/negocio.ts` · rutas API). El cliente (móvil) solo refleja estado; jamás decide si un pedido es válido.

IV. **Trazabilidad total**: crear, modificar, eliminar, cobrar y anular genera un registro en `Auditoria`. Toda modificación o eliminación de pedidos por el cajero exige **justificación** (mín. 5 caracteres).

V. **Tiempos de negocio**: pedido del cliente vale **40 min** (`validoHasta`); tras enviarlo, el menú del cliente queda bloqueado **30 min** (cookie `lp_pedido`), pero si el pedido queda **PAGADO o ANULADO** el menú se libera al instante. El vencido se **anula automáticamente** (stock de regreso).

VI. **Roles**: `CAJERO` opera en `/panel`; `ADMIN` en `/gerencia`. El acceso es por cookie firmada (JWT HS256, httpOnly) y el middleware protege rutas y API.

VII. **Responsive real**: cada pantalla se diseña primero para móvil (una columna, tochable), escala a tablet y escritorio (grillas, columnas).

VIII. **Fotos con gracia**: si un producto no tiene foto subida, usa tile de emoji; la subida de fotos es de gerencia (≤ 3 MB) vía `/api/gerencia/subir`.

## Deuda aceptada

- La anulación automática por vencimiento es "perezosa" (se evalúa en cada lectura relevante), no un cron en segundo plano: correcto para el volumen de una picantería, barato de mantener.
- La API de pagos imprime comandas en la misma pantalla (imprimibles con CSS `@media print`); integración con impresora térmica real quedaría como fase posterior (vía NPrinting-Web o copia directa del HTML).
