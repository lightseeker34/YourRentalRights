#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <token>"
  exit 2
fi

TOKEN="$1"
API="https://backboard.railway.com/graphql/v2"

echo "== Bearer test (account/workspace token expected) =="
curl -sS "$API" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"query":"query { me { email name } }"}'
echo

echo "== Project token header test (project token expected) =="
curl -sS "$API" \
  -H "Project-Access-Token: $TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"query":"query { projectToken { projectId environmentId } }"}'
echo

echo "If Bearer succeeds, token is account/workspace scoped."
echo "If Project-Access-Token succeeds, token is project scoped."
