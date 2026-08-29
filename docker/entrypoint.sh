#!/bin/sh
set -e

echo "[digishop-api] waiting for postgres at ${DB_HOST:-postgres}:${DB_PORT:-5432}..."
until node -e "
const net = require('net');
const s = net.connect({ host: process.env.DB_HOST || 'postgres', port: Number(process.env.DB_PORT || 5432) }, () => { s.end(); process.exit(0); });
s.on('error', () => process.exit(1));
" 2>/dev/null; do
  sleep 1
done
echo "[digishop-api] postgres is up"

node ace migration:run
node ace db:seed

echo "[digishop-api] starting server on ${HOST:-0.0.0.0}:${PORT:-3333}..."
exec node ace serve --hmr