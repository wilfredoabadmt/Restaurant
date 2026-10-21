# Especificación — 002 · Infraestructura, Persistencia PostgreSQL, GitHub y Coolify

## 1 · Intento y alcance

Establecer la infraestructura de producción para la aplicación de restaurante **La Paila**, garantizando:
1. **Persistencia íntegra de datos relacionales** en PostgreSQL gestionado.
2. **Persistencia de medios subidos** (fotos de platos de gerencia) en volúmenes Docker no volátiles.
3. **Control de versiones seguro** en GitHub (`wilfredoabadmt/Restaurant`) sin fuga de credenciales.
4. **Despliegue continuo y orquestado en Coolify** (self-hosted) mediante contenedor Docker optimizado (Next.js 15 Standalone).

---

## 2 · Historias de Infraestructura y Operaciones

### Persistencia y Base de Datos

**INF-1 (P1) Persistencia relacional en PostgreSQL**
- **Dado** que la aplicación se ejecuta en contenedor dentro de Coolify,
- **Cuando** se registran pedidos, productos, usuarios o logs de auditoría,
- **Entonces** toda la información reside en un servicio PostgreSQL con almacenamiento en volumen montado (`pgdata`), sobreviviendo a reinicios, actualizaciones o redeploys del contenedor.

**INF-2 (P1) Inicialización y evolución de esquema (Prisma)**
- **Dado** un despliegue nuevo o actualización en Coolify,
- **Cuando** el contenedor de la aplicación arranca,
- **Entonces** se valida la conectividad con PostgreSQL y se aplica el esquema (`prisma db push` / `prisma migrate deploy`) automáticamente antes de levantar el servidor HTTP.

**INF-3 (P1) Persistencia de fotos de gerencia**
- **Dado** que gerencia sube fotos a `/public/uploads` vía `/api/gerencia/subir`,
- **Cuando** se reinicia o actualiza el contenedor de la aplicación,
- **Entonces** las fotos no se pierden, gracias a un volumen persistente montado en `/app/public/uploads`.

### Seguridad y Control de Versiones

**INF-4 (P1) Repositorio Git limpio y seguro**
- **Dado** el código fuente del proyecto,
- **Cuando** se inicializa Git y se sincroniza con GitHub (`wilfredoabadmt/Restaurant`),
- **Entonces** `.gitignore` excluye terminantemente archivos de configuración con tokens o claves (`.claude/`, `.env`, `.env*.local`, credenciales MCP) y directorios generados (`node_modules/`, `.next/`).

### Despliegue en Coolify

**INF-5 (P1) Contenedor Standalone de producción**
- **Dado** Next.js 15 + React 19 + Prisma,
- **Cuando** Coolify construye la imagen Docker,
- **Entonces** se compila mediante un Dockerfile multi-stage (`output: "standalone"`), generando una imagen ligera (< 250 MB), ejecutada con usuario no-root (`nextjs`) y motor Alpine.

**INF-6 (P1) Variables de entorno en producción**
- **Dado** el despliegue en Coolify,
- **Cuando** la aplicación se inicia,
- **Entonces** consume `DATABASE_URL` (conexión interna a Postgres), `AUTH_KEY` (secreto criptográfico de 32+ caracteres) y `NODE_ENV=production`.

---

## 3 · Reglas Medibles

| Regla | Valor |
| --- | --- |
| Imagen base | `node:20-alpine` (multi-stage) |
| Modo Next.js | `standalone` |
| Expiración JWT | 12 horas exactas (`43200s`) |
| Volumen de BD | Volumen persistente de PostgreSQL (`la_paila_pgdata`) |
| Volumen de fotos | Volumen persistente montado en `/app/public/uploads` |
| Puerto de escucha | `3000` |
| Fuga de secretos | 0 tokens o credenciales en control de versiones |

---

## 4 · Fuera de alcance

- Migración a S3/Cloudflare R2 para almacenamiento de objetos (se reserva para escalado multi-instancia en fase posterior; en esta fase se garantiza con volumen local persistente de Coolify).
- Dominio personalizado con SSL (se entrega sobre el FQDN asignado por Coolify / Traefik y se puede delegar después al dominio comercial del cliente).
