#!/bin/sh

set -e

echo "[digishop-api] waiting for postgres at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."

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

echo "[digishop-api] postgres is up"

node ace migration:run

# Seed only on empty catalog. Restarting the container used to re-run seeders
# and restore deleted seller listings / products.
PRODUCT_COUNT="$(node --input-type=module -e "
import pg from 'pg';
const client = new pg.Client({
  host: process.env.DB_HOST || 'postgres',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'digishop',
  password: process.env.DB_PASSWORD || 'digishop',
  database: process.env.DB_DATABASE || 'digishop',
});
await client.connect();
const { rows } = await client.query('select count(*)::int as total from products');
console.log(rows[0].total);
await client.end();
" 2>/dev/null || echo "-1")"

if [ "$PRODUCT_COUNT" = "0" ]; then
  echo "[digishop-api] empty catalog — running seeders"
  set +e
  node ace db:seed
  SEED_STATUS=$?
  set -e
  if [ "$SEED_STATUS" -ne 0 ]; then
    echo "[digishop-api] seed skipped/failed (non-fatal, exit=$SEED_STATUS)"
  fi
elif [ "$PRODUCT_COUNT" = "-1" ]; then
  echo "[digishop-api] could not read product count — attempting seed (non-fatal on failure)"
  set +e
  node ace db:seed
  set -e
else
  echo "[digishop-api] catalog has ${PRODUCT_COUNT} products — skipping seed"
fi

echo "[digishop-api] starting server on ${HOST:-0.0.0.0}:${PORT:-3333}..."

exec node ace serve --hmr
