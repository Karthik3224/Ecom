#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/ecom-backend"

: "${MYSQL_PASSWORD:=root}"
: "${ORDER_SYNC_KEY:=local-order-sync-key-change-me}"
: "${PAYMENT_SYNC_KEY:=local-payment-sync-key-change-me}"
: "${FULFILLMENT_SYNC_KEY:=local-fulfillment-sync-key-change-me}"
: "${INVENTORY_SYNC_KEY:=client-demo-inventory-sync-key-2026-strong}"

SECRET_FILE="$ROOT/.local/jwt.secret"
mkdir -p "$ROOT/.local/logs"
if [[ -z "${JWT_SECRET:-}" ]]; then
  if [[ -f "$SECRET_FILE" ]]; then
    JWT_SECRET="$(cat "$SECRET_FILE")"
  else
    JWT_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
    printf '%s' "$JWT_SECRET" > "$SECRET_FILE"
    chmod 600 "$SECRET_FILE"
  fi
fi

SERVICES=(
  "Ecom-eureka-server:8761"
  "Ecom-config-server:8888"
  "Ecom-Org-access:3310"
  "customer-profile-service:8088"
  "catalog-service:8089"
  "inventory-service:8095"
  "cart-service:8091"
  "order-service:3311"
  "payment-service:3314"
  "fulfillment-service:3315"
  "notification-service:3317"
  "Ecom-api-gateway:8082"
)

export MYSQL_PASSWORD JWT_SECRET ORDER_SYNC_KEY PAYMENT_SYNC_KEY FULFILLMENT_SYNC_KEY INVENTORY_SYNC_KEY

for entry in "${SERVICES[@]}"; do
  service="${entry%%:*}"
  port="${entry##*:}"
  module="$BACKEND/$service"
  if [[ ! -d "$module" ]]; then
    echo "Missing backend module: $module" >&2
    exit 1
  fi
  echo "Starting $service on port $port"
  (
    cd "$module"
    nohup mvn spring-boot:run -DskipTests >"$ROOT/.local/logs/$service.log" 2>&1 &
    echo $! >"$ROOT/.local/$service.pid"
  )
done

echo "Backend startup launched. Check logs under $ROOT/.local/logs."
echo "Frontend: cd ecom-frontend && npm ci && npm run dev -- --host 0.0.0.0"
