# Checklist de Calidad — 002 Infraestructura y Despliegue

- [ ] `.claude/` y archivos `.env` no están bajo seguimiento de Git.
- [ ] La creación de pedidos descuenta stock de forma transaccional y atómica sin fugas.
- [ ] La anulación automática de pedidos vencidos no sufre de doble reintegro en concurrencia.
- [ ] El token de sesión expira en 12 horas reales.
- [ ] Las comandas en el cobro separan correctamente cocina (platos) de barra (bebidas y postres).
- [ ] `next.config.ts` genera compilación `standalone`.
- [ ] La imagen de Docker compila limpiamente y ejecuta `prisma db push` antes de iniciar.
- [ ] El repositorio remoto de GitHub contiene el código sin secretos expuestos.
- [ ] El servicio en Coolify conecta exitosamente a PostgreSQL y almacena uploads de forma persistente.
