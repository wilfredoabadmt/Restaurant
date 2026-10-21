#!/bin/sh
set -e

echo "==> Iniciando La Paila en producción..."

if [ -n "$DATABASE_URL" ]; then
  echo "==> Verificando conexión y sincronizando esquema con PostgreSQL (Prisma db push)..."
  MAX_RETRIES=15
  COUNT=0
  until npx prisma db push --skip-generate; do
    COUNT=$((COUNT + 1))
    if [ "$COUNT" -ge "$MAX_RETRIES" ]; then
      echo "==> ERROR: No se pudo conectar a la base de datos tras $MAX_RETRIES intentos."
      exit 1
    fi
    echo "==> Esperando a que PostgreSQL esté disponible (intento $COUNT/$MAX_RETRIES)..."
    sleep 3
  done
  echo "==> Esquema de PostgreSQL sincronizado correctamente."

  if [ "$AUTO_SEED" = "true" ]; then
    echo "==> AUTO_SEED habilitado. Ejecutando semilla inicial..."
    npx tsx prisma/seed.ts || echo "==> Semilla ya ejecutada o error no crítico."
  fi
else
  echo "==> ADVERTENCIA: DATABASE_URL no está definida."
fi

# Asegurar permisos del directorio de subidas
mkdir -p /app/public/uploads

echo "==> Arrancando servidor Next.js..."
exec node server.js
