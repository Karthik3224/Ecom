#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/ecom-backend"

: "${MYSQL_HOST:=localhost}"
: "${MYSQL_PORT:=3306}"
: "${MYSQL_USERNAME:=root}"
: "${MYSQL_PASSWORD:=}"
: "${CUSTOMER_MIGRATION_JDBC_URL:=jdbc:mysql://${MYSQL_HOST}:${MYSQL_PORT}/customer_profiles?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true}"
: "${CUSTOMER_MIGRATION_DB_USER:=$MYSQL_USERNAME}"
: "${CUSTOMER_MIGRATION_DB_PASSWORD:=$MYSQL_PASSWORD}"
: "${CUSTOMER_MIGRATION_SKIP:=true}"
: "${ORDER_SYNC_KEY:=local-order-sync-key-change-me}"
: "${PAYMENT_SYNC_KEY:=local-payment-sync-key-change-me}"
: "${FULFILLMENT_SYNC_KEY:=local-fulfillment-sync-key-change-me}"
: "${INVENTORY_SYNC_KEY:=client-demo-inventory-sync-key-2026-strong}"

SECRET_FILE="$ROOT/.local/jwt.secret"
mkdir -p "$ROOT/.local/logs"
if [[ -z "$MYSQL_PASSWORD" ]]; then
  read -r -s -p "MySQL password for $MYSQL_USERNAME: " MYSQL_PASSWORD
  echo
fi
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

export MYSQL_HOST MYSQL_PORT MYSQL_USERNAME MYSQL_PASSWORD CUSTOMER_MIGRATION_JDBC_URL CUSTOMER_MIGRATION_DB_USER CUSTOMER_MIGRATION_DB_PASSWORD CUSTOMER_MIGRATION_SKIP JWT_SECRET ORDER_SYNC_KEY PAYMENT_SYNC_KEY FULFILLMENT_SYNC_KEY INVENTORY_SYNC_KEY

if [[ -d "$BACKEND/http-sync" ]]; then
  echo "Installing shared http-sync library"
  (cd "$BACKEND/http-sync" && mvn install -DskipTests)
fi

start_service() {
  local entry="$1"
  local service="${entry%%:*}"
  local port="${entry##*:}"
  local module="$BACKEND/$service"
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
}

wait_for_port() {
  local port="$1"
  local name="$2"
  for _ in {1..60}; do
    if (echo >/dev/tcp/127.0.0.1/"$port") >/dev/null 2>&1; then
      echo "$name is ready on port $port"
      return 0
    fi
    sleep 2
  done
  echo "$name did not become ready on port $port" >&2
  tail -n 40 "$ROOT/.local/logs/${name}.log" >&2 || true
  exit 1
}

start_service "Ecom-eureka-server:8761"
wait_for_port 8761 "Ecom-eureka-server"
start_service "Ecom-config-server:8888"
wait_for_port 8888 "Ecom-config-server"

for entry in "${SERVICES[@]:2}"; do
  start_service "$entry"
done

echo "Backend startup launched. Check logs under $ROOT/.local/logs."
echo "Frontend: cd ecom-frontend && npm ci && npm run dev -- --host 0.0.0.0"
