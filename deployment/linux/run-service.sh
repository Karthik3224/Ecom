#!/usr/bin/env bash
set -euo pipefail
service=${1:?service required}
case "$service" in
 Ecom-eureka-server|Ecom-config-server|Ecom-Org-access|customer-profile-service|catalog-service|inventory-service|cart-service|notification-service|fulfillment-service|payment-service|order-service|Ecom-api-gateway) ;;
 *) echo 'Unapproved service' >&2; exit 1;;
esac
release=$(cd -- "$(dirname -- "$0")/.." && pwd -P)
: "${SERVER_PORT:?explicit service port required}"
export SERVER_ADDRESS=127.0.0.1
export SPRING_FLYWAY_ENABLED=false SPRING_JPA_HIBERNATE_DDL_AUTO=validate
export SPRING_CLOUD_CONFIG_ENABLED=false
case "$service" in
 Ecom-eureka-server|Ecom-config-server|Ecom-api-gateway) ;;
 *) : "${MYSQL_HOST:?}" "${MYSQL_PORT:?}" "${MYSQL_USERNAME:?}" "${MYSQL_PASSWORD:?}" ;;
esac
case "$service" in
 Ecom-Org-access|customer-profile-service|order-service|payment-service|fulfillment-service) : "${JWT_SECRET:?}";;
esac
case "$service" in
 order-service|payment-service|fulfillment-service|notification-service) : "${ORDER_SYNC_KEY:?}" "${PAYMENT_SYNC_KEY:?}" "${FULFILLMENT_SYNC_KEY:?}";;
esac
cd "$release"
sha256sum --check --status SHA256SUMS
exec java -Xms64m -Xmx256m -jar "backend/$service.jar" --server.address=127.0.0.1 --server.port="$SERVER_PORT" --spring.flyway.enabled=false --spring.jpa.hibernate.ddl-auto=validate
