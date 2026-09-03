#!/usr/bin/env bash
set -euo pipefail

frontend_base_url="${SMOKE_FRONTEND_BASE_URL:-}"
api_base_url="${SMOKE_API_BASE_URL:-}"

validate_url() {
  local name="$1"
  local value="$2"
  if [[ -z "$value" || "$value" == *$'\n'* || "$value" == *$'\r'* || ! "$value" =~ ^https://[^[:space:]/?#:]+(:[0-9]{1,5})?/?$ ]]; then
    echo "$name이 올바르지 않습니다." >&2
    exit 1
  fi
}

validate_url "SMOKE_FRONTEND_BASE_URL" "$frontend_base_url"
validate_url "SMOKE_API_BASE_URL" "$api_base_url"

if ! command -v curl >/dev/null 2>&1; then
  echo "Smoke Test에 curl이 필요합니다." >&2
  exit 1
fi

frontend_base_url="${frontend_base_url%/}"
api_base_url="${api_base_url%/}"
response_file="$(mktemp)"
trap 'rm -f -- "$response_file"' EXIT

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
      echo "Smoke 성공: target=$target_type url=$url status=$status"
      return 0
    fi

    if (( curl_exit != 0 )) || [[ "$status" =~ ^5[0-9][0-9]$ ]]; then
      if (( attempt < 3 )); then
        sleep 2
        attempt=$((attempt + 1))
        continue
      fi
    fi

    echo "Smoke 실패: target=$target_type url=$url status=${status:-000}" >&2
    return 1
  done
}

# Frontend Reverse Proxy와 Direct API 외부 경로 상태 확인
for path in / /login /api/v1/public/portfolio; do
  request_with_retry "frontend" "$frontend_base_url$path"
done

request_with_retry "api" "$api_base_url/api/v1/public/portfolio"
