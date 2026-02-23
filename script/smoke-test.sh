#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-https://yourrentalrights-production.up.railway.app}"
TS="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

pass() { echo "✅ $1"; }
fail() { echo "❌ $1"; exit 1; }

check_status() {
  local path="$1"
  local expected="$2"
  local body_match="${3:-}"

  local tmp
  tmp=$(mktemp)
  local code
  code=$(curl -sS -o "$tmp" -w "%{http_code}" "$BASE_URL$path")

  if [[ "$code" != "$expected" ]]; then
    echo "Response body:" >&2
    cat "$tmp" >&2
    rm -f "$tmp"
    fail "$path expected HTTP $expected, got $code"
  fi

  if [[ -n "$body_match" ]] && ! grep -q "$body_match" "$tmp"; then
    echo "Response body:" >&2
    cat "$tmp" >&2
    rm -f "$tmp"
    fail "$path missing expected content: $body_match"
  fi

  rm -f "$tmp"
  pass "$path -> HTTP $expected"
}

echo "Running YourRentalRights smoke checks"
echo "Base URL: $BASE_URL"
echo "Timestamp: $TS"

# Anonymous checks
check_status "/" "200" "YourRentalRights.com"
check_status "/api/content/qa-smoke-test-key" "200" '"fallback":true'
check_status "/api/user" "401"

echo "🎉 Smoke checks passed"
