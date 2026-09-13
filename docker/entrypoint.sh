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

# ---------------------------------------------------------------------------
# Auto-seed DISABLED — never run seed on docker start / rebuild.
# When you explicitly want demo data, run manually:
#   docker exec vitsell-api node ace db:seed
#   # or locally: node ace db:seed
# ---------------------------------------------------------------------------
# PRODUCT_COUNT="$(node --input-type=module -e "
# import pg from 'pg';
# const client = new pg.Client({
#   host: process.env.DB_HOST || 'postgres',
#   port: Number(process.env.DB_PORT || 5432),
#   user: process.env.DB_USER || 'vitsell',
#   password: process.env.DB_PASSWORD || 'vitsell',
#   database: process.env.DB_DATABASE || 'vitsell',
# });
# await client.connect();
# const { rows } = await client.query('select count(*)::int as total from products');
# console.log(rows[0].total);
# await client.end();
# " 2>/dev/null || echo "-1")"
#
# if [ "$PRODUCT_COUNT" = "0" ]; then
#   echo "[vitsell-api] empty catalog — running seeders"
#   set +e
#   node ace db:seed
#   SEED_STATUS=$?
#   set -e
#   if [ "$SEED_STATUS" -ne 0 ]; then
#     echo "[vitsell-api] seed skipped/failed (non-fatal, exit=$SEED_STATUS)"
#   fi
# elif [ "$PRODUCT_COUNT" = "-1" ]; then
#   echo "[vitsell-api] could not read product count — attempting seed (non-fatal on failure)"
#   set +e
#   node ace db:seed
#   set -e
# else
#   echo "[vitsell-api] catalog has ${PRODUCT_COUNT} products — skipping seed"
# fi

echo "[vitsell-api] seed auto-run disabled (manual only)"

echo "[vitsell-api] starting server on ${HOST:-0.0.0.0}:${PORT:-3333}..."

exec node ace serve --hmr
