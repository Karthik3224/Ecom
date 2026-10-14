#!/usr/bin/env bash
set -euo pipefail
for port in 8761 8888 3310 8088 8089 8095 8091 3317 3315 3314 3311 8082; do
  response=$(curl --fail --silent --show-error --max-time 10 "http://127.0.0.1:$port/actuator/health")
  printf '%s' "$response" | python3 -c 'import json,sys; assert json.load(sys.stdin)["status"] == "UP"'
done
curl --fail --silent --show-error --max-time 10 http://127.0.0.1:3314/api/v1/payments/capabilities |
  python3 -c 'import json,sys; assert json.load(sys.stdin)["processingEnabled"] is False'
