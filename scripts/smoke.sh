#!/usr/bin/env bash
# Smoke test: checks that a deployed instance answers correctly.
# Usage: ./scripts/smoke.sh https://hello-pipeline-staging.fly.dev
set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"

echo "Smoke testing ${BASE_URL}"

curl --fail --silent --show-error --max-time 10 "${BASE_URL}/healthz" | grep -q '"status":"ok"'
echo "  ok  /healthz"

curl --fail --silent --show-error --max-time 10 "${BASE_URL}/api/hello?name=pipeline" | grep -q 'Hello, pipeline!'
echo "  ok  /api/hello"

curl --fail --silent --show-error --max-time 10 "${BASE_URL}/" | grep -q '<div id="root">'
echo "  ok  /"

echo "Smoke test passed"
