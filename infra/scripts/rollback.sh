#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 4 ]]; then
  echo "Rollback arguments must be: <environment> <component> <image-tag> <env-file>." >&2
  exit 1
fi

environment="$1"
component="$2"
image_tag="$3"
env_file="$4"

case "$environment" in
  dev|prod) ;;
  *) echo "Unsupported rollback environment: $environment" >&2; exit 1 ;;
esac
case "$component" in
  frontend|backend) ;;
  *) echo "Unsupported rollback component: $component" >&2; exit 1 ;;
esac
if [[ ! "$image_tag" =~ ^sha-[0-9a-f]{40}$ ]]; then
  echo "Invalid rollback image tag for component=$component." >&2
  exit 1
fi

portfolio_root="${PORTFOLIO_ROOT:-/opt/portfolio}"
if [[ "$portfolio_root" != /* || "$portfolio_root" == "/" || ! -d "$portfolio_root" || -L "$portfolio_root" ]]; then
  echo "PORTFOLIO_ROOT must be an existing non-root absolute directory." >&2
  exit 1
fi
if ! portfolio_root="$(realpath -e -- "$portfolio_root")"; then
  echo "PORTFOLIO_ROOT cannot be resolved." >&2
  exit 1
fi
if [[ ! -f "$env_file" || -L "$env_file" ]]; then
  echo "Rollback environment file is unavailable." >&2
  exit 1
fi
if ! resolved_env="$(realpath -e -- "$env_file")"; then
  echo "Rollback environment file cannot be resolved." >&2
  exit 1
fi
if [[ ! -f "$resolved_env" || -L "$resolved_env" || ! -r "$resolved_env" ]]; then
  echo "Rollback environment file is not readable." >&2
  exit 1
fi
if [[ "$(stat -c '%a' -- "$resolved_env")" != "600" ]]; then
  echo "Rollback environment file permissions must be 600." >&2
  exit 1
fi
if [[ "$(stat -c '%u' -- "$resolved_env")" != "$(id -u)" ]]; then
  echo "Rollback environment file owner is invalid." >&2
  exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
infra_dir="$(cd -- "$script_dir/.." && pwd)"
persistent_root="/opt/portfolio/persistent"
persistent_storage_dir="$persistent_root/storage/$environment"
state_dir="$portfolio_root/state/$environment"

# Backend 영속 파일 NAS Mount 및 환경별 Storage 경로 검증
ensure_persistent_storage() {
  if [[ ! -d "$persistent_storage_dir" || -L "$persistent_storage_dir" ]]; then
    echo "Persistent storage directory is invalid: $persistent_storage_dir" >&2
    exit 1
  fi
  if ! findmnt -rn -T "$persistent_storage_dir" -t nfs,nfs4 >/dev/null; then
    echo "Persistent NAS mount is unavailable: $persistent_root" >&2
    exit 1
  fi
}

if [[ "$component" == "backend" ]]; then
  ensure_persistent_storage
fi

# 롤백 상태 태그 읽기 및 유효성 검증
read_state_tag() {
  local state_file="$1"
  local state_name="$2"
  local value=""

  if [[ ! -e "$state_file" ]]; then
    printf '\n'
    return
  fi
  if [[ ! -f "$state_file" || -L "$state_file" || ! -r "$state_file" ]]; then
    echo "Rollback state file is invalid: $state_name" >&2
    exit 1
  fi
  if [[ "$(stat -c '%u' -- "$state_file")" != "$(id -u)" ]]; then
    echo "Rollback state file owner is invalid: $state_name" >&2
    exit 1
  fi
  value="$(tr -d '\r\n' < "$state_file")"
  if [[ -n "$value" && ! "$value" =~ ^sha-[0-9a-f]{40}$ ]]; then
    echo "Rollback state tag is invalid: $state_name" >&2
    exit 1
  fi
  printf '%s\n' "$value"
}

if [[ -e "$state_dir" && (! -d "$state_dir" || -L "$state_dir") ]]; then
  echo "Rollback state directory is invalid: $state_dir" >&2
  exit 1
fi
if [[ ! -d "$state_dir" ]]; then
  echo "Rollback state directory is unavailable: $state_dir" >&2
  exit 1
fi
state_dir="$(realpath -e -- "$state_dir")"
if [[ "$state_dir" != "$portfolio_root/state/$environment" ]]; then
  echo "Rollback state directory is outside PORTFOLIO_ROOT." >&2
  exit 1
fi

legacy_tag="$(read_state_tag "$state_dir/current-version" "current-version")"
frontend_tag="$(read_state_tag "$state_dir/frontend-version" "frontend-version")"
backend_tag="$(read_state_tag "$state_dir/backend-version" "backend-version")"

if [[ "$component" == "frontend" ]]; then
  backend_compose_tag="${backend_tag:-$legacy_tag}"
  if [[ -z "$backend_compose_tag" ]]; then
    echo "Frontend rollback requires a recorded backend-version: environment=$environment" >&2
    exit 1
  fi
  frontend_compose_tag="$image_tag"
  services=(frontend)
else
  frontend_compose_tag="${frontend_tag:-$legacy_tag}"
  backend_compose_tag="$image_tag"
  if [[ -z "$frontend_compose_tag" ]]; then
    frontend_compose_tag="$image_tag"
  fi
  services=(backend monitor)
fi

compose=(
  docker compose
  --project-name "portfolio-$environment"
  --env-file "$resolved_env"
  -f "$infra_dir/compose.yaml"
  -f "$infra_dir/compose.$environment.yaml"
)

echo "Rollback starting: environment=$environment component=$component tag=$image_tag"
FRONTEND_IMAGE_TAG="$frontend_compose_tag" BACKEND_IMAGE_TAG="$backend_compose_tag" "${compose[@]}" pull "${services[@]}"
FRONTEND_IMAGE_TAG="$frontend_compose_tag" BACKEND_IMAGE_TAG="$backend_compose_tag" "${compose[@]}" up -d --no-deps "${services[@]}"
FRONTEND_IMAGE_TAG="$frontend_compose_tag" BACKEND_IMAGE_TAG="$backend_compose_tag" bash "$script_dir/health-wait.sh" "$environment" "$component" "$resolved_env"
echo "Rollback completed: environment=$environment component=$component tag=$image_tag"
