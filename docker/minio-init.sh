#!/bin/sh
set -e

ENDPOINT="${MINIO_ENDPOINT:-http://minio:9000}"
USER="${MINIO_ROOT_USER:-vitsell}"
PASS="${MINIO_ROOT_PASSWORD:-vitsellsecret}"
BUCKET="${S3_BUCKET:-vitsell}"

echo "[minio-init] waiting for MinIO at ${ENDPOINT}..."

i=0
until mc alias set local "$ENDPOINT" "$USER" "$PASS" >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "[minio-init] MinIO not ready after 60s" >&2
    exit 1
  fi
  sleep 1
done

mc mb -p "local/${BUCKET}" || true
# Public read for storefront images (uploads still go through authenticated API)
mc anonymous set download "local/${BUCKET}" || true

echo "[minio-init] bucket ready: ${BUCKET}"
