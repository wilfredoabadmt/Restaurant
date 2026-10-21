# Tareas — 002 · Infraestructura, Persistencia PostgreSQL, GitHub y Coolify

## Fase 1 — Saneamiento y Corrección de Observaciones de Código
- [ ] T1 Blindar `.gitignore` para excluir `.claude/`, `.env*` y contenido dinámico de `public/uploads/*`.
- [ ] T2 Corregir Invariante #1 en `src/app/api/pedidos/route.ts`: descontar stock dentro de `db.$transaction`.
- [ ] T3 Proteger `anularVencidos()` en `src/lib/negocio.ts` con transacción y actualización atómica para evitar condición de carrera.
- [ ] T4 Corregir tiempo de expiración JWT en `src/lib/sesion.ts` (12 horas = 43200s).
- [ ] T5 Alinear separación de comandas en `src/app/api/pedidos/[id]/pagar/route.ts` (cocina = PLATOS, barra = BEBIDAS + POSTRES).
- [ ] T6 Envolver auditoría en transacción en `PUT /api/pedidos/[id]`.

## Fase 2 — Preparación para Docker y Coolify
- [ ] T7 Activar `output: "standalone"` en `next.config.ts`.
- [ ] T8 Crear script de inicio `docker-entrypoint.sh` para validación de DB y `prisma db push`.
- [ ] T9 Crear `Dockerfile` multi-stage optimizado para Next.js 15 Standalone + Prisma.
- [ ] T10 Crear `.dockerignore` para excluir archivos innecesarios de la compilación.

## Fase 3 — Control de Versiones con GitHub
- [ ] T11 Inicializar repositorio Git local (`git init`, rama `main`).
- [ ] T12 Crear repositorio remoto en GitHub (`wilfredoabadmt/Restaurant`).
- [ ] T13 Realizar commit inicial limpio y hacer push a `origin main`.

## Fase 4 — Aprovisionamiento y Despliegue en Coolify
- [ ] T14 Crear o asignar proyecto en Coolify para **La Paila**.
- [ ] T15 Aprovisionar servicio de PostgreSQL 16 con volumen persistente en Coolify.
- [ ] T16 Crear aplicación en Coolify enlazada al repositorio de GitHub con Dockerfile.
- [ ] T17 Configurar variables de entorno (`DATABASE_URL`, `AUTH_KEY`, `PORT=3000`).
- [ ] T18 Configurar volumen persistente para `/app/public/uploads` en Coolify.
- [ ] T19 Ejecutar despliegue y verificar funcionamiento en vivo.
