# Modelo de datos — 001

Fuente única: `prisma/schema.prisma`. PostgreSQL 14.

## Enum

```prisma
Rol       { ADMIN, CAJERO }
Tipo      { PLATOS, BEBIDAS, POSTRES }     // heredado de la categoría del producto
EstadoPedido { REGISTRADO, LISTO, PAGADO, ANULADO }
TipoServicio { EN_LOCAL, PARA_LLEVAR }
MetodoPago   { EFECTIVO, QR }
```

## Usuario

| campo | tipo | detalles |
| --- | --- | --- |
| id | serial | PK |
| usuario | string unique | alias para entrar (`admin`, `cajero1`) |
| nombre / apellidos | string | para el kardex "quién hizo qué" |
| password | string | hash bcrypt |
| rol | Rol | ADMIN entra a /gerencia, CAJERO a /panel |
| activo | bool | desactiva sin perder historial |
| creadoEn | DateTime | alta (para el reporte de gerencia) |

## Categoria

| campo | tipo | detalles |
| --- | --- | --- |
| nombre | string unique | "Platos", "Bebidas", "Postres". Alta de gerencia |
| tipo | Tipo | divide las comandas: cocina (platos) vs barra (bebidas + postres juntas) |
| orden | int | orden del menú |
| activa | bool | encendido/apagado (los agujeros conservan el historial) |

## Producto

| campo | tipo | detalles |
| --- | --- | --- |
| categoriaId | FK Categoria | |
| nombre | unique | |
| descripcion | string | tiro corto para el móvil de la mesa |
| precio | Decimal(10,2) | Bs |
| imagen | string | `emoji:🍔` o `/uploads/p-...` |
| stock / stockMin | int | reservas y umbral de alerta (gerencia repon) |
| disponible | bool | baja lógica |
| creadoEn | DateTime | fecha de ingreso (reporte) |

## Pedido

| campo | tipo | detalles |
| --- | --- | --- |
| codigo | string? unique | código alfanumérico del cliente (p. ej. `XR3B8`), 5 símbolos sin ambigüedades; los pedidos antiguos usan fallback `P-00nn` |
| alias / celular | string | datos del cliente ("Pendiente" hasta que registre) |
| mensaje | string? | nota al cajero |
| estado | EstadoPedido | REGISTRADO → LISTO → PAGADO ⇒ o ANULADO |
| servicio | TipoServicio | local / llevar |
| metodoPago / montoRecibido / vuelto | Decimal | efectivo calcula el vuelto, QR no |
| total | Decimal(10,2) | derivado de los ítems |
| validoHasta | DateTime | creadoEn + 40 min → anula automáticamente |
| anuladoEn / motivoAnulacion | | motivo del sistema o de gerencia |
| pagadoEn | DateTime? | para los reportes del día |
| creadoPorId | FK Usuario? | nulo = vino del QR; con valor = pedido manual de caja |
| items | PedidoItem[] | snapshot |

## PedidoItem

Snapshot al momento del pedido para que el pasado no cambie:

| campo | tipo |
| --- | --- |
| productoId (FK?) | hash de药房 producto para reposición de stock |
| nombre, tipo, precio | congelado |
| cantidad | int |

## Auditoria (kardex)

| campo | tipo | detalles |
| --- | --- | --- |
| usuarioId/nombre | | quién |
| pedidoId (FK SetNull) | | sobre qué |
| accion | string | CREADO · MODIFICADO · ELIMINADO · PAGADO · ANULADO · VENCIDO · REPOSICION · PRODUCTO · CATEGORIA · CAJERO |
| justificacion | string? | obligatoria en modificar/eliminar/anular |
| detalle | Json? | antes/después, snapshot de items, nota |
| creadoEn | DateTime | |

## Índices

- `Pedido(estado)`, `Pedido(celular)`, `Pedido(creadoEn)` — listado, búsqueda y reportes del día.
- `PedidoItem(pedidoId)` — detalle y comandas.

## Invariantes

1. Nada entra a `Pedido` sin transacción que valide y descuente stock.
2. `MODIFICADO`, `ELIMINADO`, `ANULADO` con justificación ≥ 5 caracteres, siempre con su entrada de auditoría.
3. `ESTADO PAGADO` no es modificable ni eliminable por caja; anula solo gerencia.
4. El stock reserva al crear y se reintegra por las cuatro vías: modificación (diferencia), eliminación, anulación de gerencia y **vencimiento automático**.
