# Checklist de Calidad — 002 Infraestructura y Despliegue

- [x] `.claude/` y archivos `.env` no están bajo seguimiento de Git.
- [x] La creación de pedidos descuenta stock de forma transaccional y atómica sin fugas.
- [x] La anulación automática de pedidos vencidos no sufre de doble reintegro en concurrencia.
- [x] El token de sesión expira en 12 horas reales.
- [x] Las comandas en el cobro separan correctamente cocina (platos) de barra (bebidas y postres).
- [x] `next.config.ts` genera compilación `standalone`.
- [x] La imagen de Docker compila limpiamente y ejecuta `prisma db push` antes de iniciar.
- [x] El repositorio remoto de GitHub contiene el código sin secretos expuestos (`wilfredoabadmt/Restaurant`).
- [x] El servicio en Coolify conecta exitosamente a PostgreSQL y almacena uploads de forma persistente (`https://la-paila.200.105.141.138.sslip.io`).
