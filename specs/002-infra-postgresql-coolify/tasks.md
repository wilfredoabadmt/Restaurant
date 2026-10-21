# Tareas — 002 · Infraestructura, Persistencia PostgreSQL, GitHub y Coolify

## Fase 1 — Saneamiento y Corrección de Observaciones de Código
- [x] T1 Blindar `.gitignore` para excluir `.claude/`, `.env*` y contenido dinámico de `public/uploads/*`.
- [x] T2 Corregir Invariante #1 en `src/app/api/pedidos/route.ts`: descontar stock dentro de `db.$transaction`.
- [x] T3 Proteger `anularVencidos()` en `src/lib/negocio.ts` con transacción y actualización atómica para evitar condición de carrera.
- [x] T4 Corregir tiempo de expiración JWT en `src/lib/sesion.ts` (12 horas = 43200s).
- [x] T5 Alinear separación de comandas en `src/app/api/pedidos/[id]/pagar/route.ts` (cocina = PLATOS, barra = BEBIDAS + POSTRES).
- [x] T6 Envolver auditoría en transacción en `PUT /api/pedidos/[id]`.

## Fase 2 — Preparación para Docker y Coolify
- [x] T7 Activar `output: "standalone"` en `next.config.ts`.
- [x] T8 Crear script de inicio `docker-entrypoint.sh` para validación de DB y `prisma db push`.
- [x] T9 Crear `Dockerfile` multi-stage optimizado para Next.js 15 Standalone + Prisma.
- [x] T10 Crear `.dockerignore` para excluir archivos innecesarios de la compilación.

## Fase 3 — Control de Versiones con GitHub
- [x] T11 Inicializar repositorio Git local (`git init`, rama `main`).
- [x] T12 Crear repositorio remoto en GitHub (`wilfredoabadmt/Restaurant`).
- [x] T13 Realizar commit inicial limpio y hacer push a `origin main`.

## Fase 4 — Aprovisionamiento y Despliegue en Coolify
- [x] T14 Crear o asignar proyecto en Coolify para **La Paila**.
- [x] T15 Aprovisionar servicio de PostgreSQL 16 con volumen persistente en Coolify (`la-paila-postgres`).
- [x] T16 Crear aplicación en Coolify enlazada al repositorio de GitHub con Dockerfile (`la-paila-web`).
- [x] T17 Configurar variables de entorno (`DATABASE_URL`, `AUTH_KEY`, `AUTO_SEED=true`).
- [x] T18 Configurar volumen persistente para `/app/public/uploads` en Coolify (`ituym40fzovvybopq2wdndnf-la-paila-uploads`).
- [x] T19 Ejecutar despliegue y verificar funcionamiento en vivo (`https://la-paila.200.105.141.138.sslip.io`).
