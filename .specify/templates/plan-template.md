# Plantilla de plan — La Paila

## Stack elegido y por qué
Tecnología | área | interés real (rendimiento, DX, costo).

## CModelo de datos (contrato)
Tablas y enums con campos mínimos; los detalles en `data-model.md`.

## Integraciones
PostgreSQL, Prisma, JWT + cookies, subida de fotos a `public/uploads`.

## Riesgos
- Subida de archivos en producción: Documento (S3 en producción); dev: disco local.
- Concurrencia de stock: transacciones Prisma ($transaction).

## Fases de implementación
 cada fase mapea a histarias P1→P3 de la spec.
