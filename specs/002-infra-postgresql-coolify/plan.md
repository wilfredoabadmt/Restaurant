# Plan — 002 · Infraestructura, Persistencia PostgreSQL, GitHub y Coolify

## Stack y Decisiones Técnicas

| Área | Elección | Justificación |
| --- | --- | --- |
| Contenedor Web | **Dockerfile multi-stage (Node 20 Alpine)** | Reduce el tamaño de la imagen aislando dependencias de build de las de runtime. Next.js `standalone` copia solo lo necesario. |
| Motor de BD | **PostgreSQL 16 en Coolify (o servicio standalone)** | Compatibilidad total con el esquema Prisma (enums, Decimal, json). |
| Almacenamiento DB | **Volumen persistente Docker** | Garantiza retención de pedidos, kardex y usuarios independientemente del ciclo de vida del contenedor. |
| Almacenamiento Fotos | **Volumen persistente en `/app/public/uploads`** | Mantiene las fotos cargadas por gerencia sin requerir proveedor cloud externo en esta fase. |
| Sincronización DB | **Script entrypoint con `prisma db push`** | Al iniciar el contenedor web, sincroniza el esquema Prisma con PostgreSQL antes de arrancar `node server.js`. |
| Control de Código | **GitHub (`wilfredoabadmt/Restaurant`)** | Repositorio remoto con ramas `main`, con exclusión estricta de credenciales en `.gitignore`. |
| Orquestación | **Coolify v4** | Plataforma PaaS self-hosted con proxy inverso Traefik, gestión de certificados SSL y despliegues automáticos vía Git webhook. |

---

## Arquitectura de Contenedores y Volúmenes

```
┌────────────────────────────────────────────────────────┐
│                   COOLIFY ENGINE                      │
│                                                        │
│  ┌──────────────────────┐    ┌──────────────────────┐  │
│  │   PostgreSQL 16      │    │  Next.js 15 Standalone│  │
│  │   (Servicio Coolify) │    │  (App Web La Paila)  │  │
│  └──────────┬───────────┘    └──────────┬───────────┘  │
│             │                           │              │
│       ┌─────┴─────┐               ┌─────┴─────┐        │
│       │  Volumen  │               │  Volumen  │        │
│       │  pgdata   │               │  uploads  │        │
│       └───────────┘               └───────────┘        │
└────────────────────────────────────────────────────────┘
```

---

## Mitigación de Riesgos

1. **Condición de carrera al arrancar (Web antes de Postgres listo)**:
   - *Mitigación*: En el entrypoint del contenedor se verifica la disponibilidad del puerto de PostgreSQL antes de ejecutar `prisma db push` y `node server.js`.
2. **Pérdida de imágenes en redeploys**:
   - *Mitigación*: Se declara en Coolify un volumen de almacenamiento persistente mapeado a `/app/public/uploads`.
3. **Exposición de credenciales de desarrollo**:
   - *Mitigación*: Se adiciona `.claude/` y archivos `.env` a `.gitignore` antes del primer `git add`.
4. **Fallo de comprobación de salud durante Rolling Update (`curl: not found` y tiempo de arranque)**:
   - *Riesgo*: `node:20-alpine` no incluye `curl` nativamente, lo que provoca fallo en el ejecutor de Coolify (`/bin/sh: curl: not found`), sumado a que el sondeo prematuro mientras se sincroniza PostgreSQL (`prisma db push`) y `AUTO_SEED` causa rechazo de conexión (`Connection refused`).
   - *Mitigación*: Se instaló `curl` en la etapa base Alpine, se declaró la directiva `HEALTHCHECK` en `Dockerfile` y se configuró en Coolify un periodo de gracia inicial (`start_period`) de 30s con 5 reintentos en `/api/menu`.
