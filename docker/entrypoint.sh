#!/bin/sh

set -e

echo "[vitsell-api] waiting for postgres at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."

until node -e "
const net = require('net');

const s = net.connect(
  {
    host: process.env.DB_HOST || 'postgres',
    port: Number(process.env.DB_PORT || 5432)
  },
  () => {
    s.end();
    process.exit(0);
  }
);

s.on('error', () => process.exit(1));
" 2>/dev/null; do
  sleep 1
done

echo "[vitsell-api] postgres is up"

node ace migration:run

# Seed only when explicitly enabled (never on production by default)
if [ "${RUN_DB_SEED:-false}" = "true" ]; then
  echo "[digishop-api] RUN_DB_SEED=true - running db:seed"
  set +e
  node ace db:seed
  SEED_STATUS=$?
  set -e
  if [ "$SEED_STATUS" -ne 0 ]; then
    echo "[digishop-api] seed skipped/failed (non-fatal, exit=$SEED_STATUS)"
  fi
else
  echo "[digishop-api] skipping db:seed (set RUN_DB_SEED=true to enable)"
fi

echo "[vitsell-api] seed auto-run disabled (manual only)"

echo "[vitsell-api] starting server on ${HOST:-0.0.0.0}:${PORT:-3333}..."

exec node ace serve --hmr
