#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Smoke-test arguments must be: <component>." >&2
  exit 1
fi

component="$1"
case "$component" in
  frontend|backend) ;;
  *) echo "Unsupported smoke-test component: $component" >&2; exit 1 ;;
esac

# Smoke 대상 URL 형식 검증
validate_url() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" || "$value" == *$'\n'* || "$value" == *$'\r'* || ! "$value" =~ ^https://[^[:space:]/?#:]+(:[0-9]{1,5})?/?$ ]]; then
    echo "$name is invalid for component=$component." >&2
    exit 1
  fi
}

if ! command -v curl >/dev/null 2>&1; then
  echo "Smoke test requires curl." >&2
  exit 1
fi

if [[ "$component" == "frontend" ]]; then
  base_url="${SMOKE_FRONTEND_BASE_URL:-}"
  validate_url "SMOKE_FRONTEND_BASE_URL" "$base_url"
else
  base_url="${SMOKE_API_BASE_URL:-}"
  validate_url "SMOKE_API_BASE_URL" "$base_url"
fi
base_url="${base_url%/}"
response_file="$(mktemp)"
trap 'rm -f -- "$response_file"' EXIT

# HTTP 응답 재시도 검증
request_with_retry() {
  local target_type="$1"
  local url="$2"
  local attempt=1
  local status=""
  local curl_exit=0

  while (( attempt <= 3 )); do
    : > "$response_file"
    if status="$(curl \
      --silent \
      --show-error \
      --connect-timeout 5 \
      --max-time 20 \
      --output "$response_file" \
      --write-out '%{http_code}' \
      "$url")"; then
      curl_exit=0
    else
      curl_exit=$?
    fi

    if (( curl_exit == 0 )) && [[ "$status" =~ ^2[0-9][0-9]$ ]] && [[ -s "$response_file" ]]; then
      echo "Smoke test succeeded: component=$component target=$target_type url=$url status=$status"
      return 0
    fi
    if (( curl_exit != 0 )) || [[ "$status" =~ ^5[0-9][0-9]$ ]]; then
      if (( attempt < 3 )); then
        sleep 2
        attempt=$((attempt + 1))
        continue
      fi
    fi
    echo "Smoke test failed: component=$component target=$target_type url=$url status=${status:-000}" >&2
    return 1
  done
}

if [[ "$component" == "frontend" ]]; then
  for path in / /login /api/v1/public/portfolio; do
    request_with_retry "frontend" "$base_url$path"
  done
else
  request_with_retry "api" "$base_url/api/v1/public/portfolio"
fi
