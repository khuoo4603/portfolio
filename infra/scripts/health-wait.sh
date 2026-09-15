#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "Health-check arguments must be: <environment> <component> <env-file>." >&2
  exit 1
fi

environment="$1"
component="$2"
env_file="$3"
case "$environment" in
  dev|prod) ;;
  *) echo "Unsupported health-check environment: $environment" >&2; exit 1 ;;
esac
case "$component" in
  frontend) services=(frontend) ;;
  backend) services=(backend monitor) ;;
  *) echo "Unsupported health-check component: $component" >&2; exit 1 ;;
esac
if [[ ! -f "$env_file" || -L "$env_file" ]]; then
  echo "Health-check environment file is unavailable." >&2
  exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
infra_dir="$(cd -- "$script_dir/.." && pwd)"
timeout_seconds="${HEALTH_TIMEOUT_SECONDS:-240}"
poll_seconds="${HEALTH_POLL_SECONDS:-5}"
if [[ ! "$timeout_seconds" =~ ^[1-9][0-9]*$ || ! "$poll_seconds" =~ ^[1-9][0-9]*$ ]]; then
  echo "Health-check timeout and poll interval must be positive integers." >&2
  exit 1
fi

compose=(
  docker compose
  --project-name "portfolio-$environment"
  --env-file "$env_file"
  -f "$infra_dir/compose.yaml"
  -f "$infra_dir/compose.$environment.yaml"
)
deadline=$((SECONDS + timeout_seconds))

configured_services=""
if ! configured_services="$("${compose[@]}" config --services)"; then
  echo "Compose service configuration is unavailable: environment=$environment" >&2
  exit 1
fi
for service in "${services[@]}"; do
  if ! grep -Fxq "$service" <<< "$configured_services"; then
    echo "Compose service is undefined: environment=$environment component=$component service=$service" >&2
    exit 1
  fi
done

while (( SECONDS < deadline )); do
  healthy_count=0
  for service in "${services[@]}"; do
    container_id="$("${compose[@]}" ps --all --quiet "$service")"
    if [[ -z "$container_id" ]]; then
      echo "Container is missing: environment=$environment component=$component service=$service" >&2
      exit 1
    fi

    state="$(docker inspect --format '{{.State.Status}}' "$container_id")"
    if [[ "$state" == "unhealthy" || "$state" == "exited" || "$state" == "dead" || "$state" == "removing" ]]; then
      echo "Container state is invalid: environment=$environment component=$component service=$service state=$state" >&2
      "${compose[@]}" ps --all >&2
      exit 1
    fi

    health="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$container_id")"
    if [[ "$health" == "missing" || "$health" == "unhealthy" ]]; then
      echo "Container health is invalid: environment=$environment component=$component service=$service health=$health" >&2
      "${compose[@]}" ps --all >&2
      exit 1
    fi
    if [[ "$state" == "running" && "$health" == "healthy" ]]; then
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
    echo "Container health check completed: environment=$environment component=$component"
    exit 0
  fi
  sleep "$poll_seconds"
done

echo "Container health check timed out: environment=$environment component=$component" >&2
"${compose[@]}" ps --all >&2
exit 1
