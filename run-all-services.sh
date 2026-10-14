#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/ecom-backend"

: "${MYSQL_PASSWORD:=root}"
: "${JWT_SECRET:?Set JWT_SECRET to a random secret of at least 32 characters}"
: "${ORDER_SYNC_KEY:?Set ORDER_SYNC_KEY}"
: "${PAYMENT_SYNC_KEY:?Set PAYMENT_SYNC_KEY}"
: "${FULFILLMENT_SYNC_KEY:?Set FULFILLMENT_SYNC_KEY}"
: "${INVENTORY_SYNC_KEY:=client-demo-inventory-sync-key-2026-strong}"

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

mkdir -p "$ROOT/.local/logs"
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
