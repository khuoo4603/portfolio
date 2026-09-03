#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "검증 인자가 올바르지 않습니다." >&2
  exit 1
fi

environment="$1"
env_file="$2"
case "$environment" in
  dev|prod) ;;
  *) echo "지원하지 않는 환경: $environment" >&2; exit 1 ;;
esac
if [[ ! -f "$env_file" ]]; then
  echo "배포 환경 파일을 찾을 수 없습니다." >&2
  exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
infra_dir="$(cd -- "$script_dir/.." && pwd)"
timeout_seconds="${HEALTH_TIMEOUT_SECONDS:-240}"
poll_seconds="${HEALTH_POLL_SECONDS:-5}"
if [[ ! "$timeout_seconds" =~ ^[1-9][0-9]*$ || ! "$poll_seconds" =~ ^[1-9][0-9]*$ ]]; then
  echo "Health Timeout과 Poll 간격은 양의 정수여야 합니다." >&2
  exit 1
fi

compose=(
  docker compose
  --project-name "portfolio-$environment"
  --env-file "$env_file"
  -f "$infra_dir/compose.yaml"
  -f "$infra_dir/compose.$environment.yaml"
)
services=(postgres backend frontend monitor)
deadline=$((SECONDS + timeout_seconds))

# Compose Service 정의와 네 Container Health 상태 정상화 대기
configured_services=""
if ! configured_services="$("${compose[@]}" config --services)"; then
  echo "Compose Service 구성을 확인할 수 없습니다." >&2
  exit 1
fi
for service in "${services[@]}"; do
  if ! grep -Fxq "$service" <<< "$configured_services"; then
    echo "Compose Service가 정의되지 않았습니다: service=$service" >&2
    exit 1
  fi
done

while (( SECONDS < deadline )); do
  healthy_count=0
  for service in "${services[@]}"; do
    container_id="$("${compose[@]}" ps --all --quiet "$service")"
    if [[ -z "$container_id" ]]; then
      echo "Container를 찾을 수 없습니다: service=$service" >&2
      exit 1
    fi

    state="$(docker inspect --format '{{.State.Status}}' "$container_id")"
    if [[ "$state" == "unhealthy" || "$state" == "exited" || "$state" == "dead" || "$state" == "removing" ]]; then
      echo "$service Container가 $state 상태입니다." >&2
      "${compose[@]}" ps --all >&2
      exit 1
    fi

    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$container_id")"
    if [[ "$health" == "unhealthy" ]]; then
      echo "$service Container Health가 unhealthy 상태입니다." >&2
      "${compose[@]}" ps --all >&2
      exit 1
    fi
    if [[ "$state" == "running" && "$health" == "healthy" ]]; then
      # PID 실행 여부와 분리된 Monitor Spring Context 초기화 완료 확인
      if [[ "$service" == "monitor" ]]; then
        monitor_tail="$(docker logs --tail 200 "$container_id" 2>&1)"
        if [[ "$monitor_tail" != *"Started PortfolioApplication"* ]]; then
          continue
        fi
      fi
      healthy_count=$((healthy_count + 1))
    fi
  done

  if [[ "$healthy_count" -eq "${#services[@]}" ]]; then
    echo "Container Health Check 완료: portfolio-$environment"
    exit 0
  fi
  sleep "$poll_seconds"
done

echo "Container Health Check Timeout: portfolio-$environment" >&2
"${compose[@]}" ps --all >&2
exit 1
