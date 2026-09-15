#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 4 ]]; then
  echo "Deployment arguments must be: <environment> <component> <image-tag> <env-file>." >&2
  exit 1
fi

environment="$1"
component="$2"
image_tag="$3"
env_file="$4"

case "$environment" in
  dev|prod) ;;
  *) echo "Unsupported deployment environment: $environment" >&2; exit 1 ;;
esac
case "$component" in
  frontend|backend) ;;
  *) echo "Unsupported deployment component: $component" >&2; exit 1 ;;
esac
if [[ ! "$image_tag" =~ ^sha-[0-9a-f]{40}$ ]]; then
  echo "Invalid deployment image tag for component=$component." >&2
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
  echo "Deployment environment file is unavailable." >&2
  exit 1
fi
if ! resolved_env="$(realpath -e -- "$env_file")"; then
  echo "Deployment environment file cannot be resolved." >&2
  exit 1
fi
if [[ ! -f "$resolved_env" || -L "$resolved_env" || ! -r "$resolved_env" ]]; then
  echo "Deployment environment file is not readable." >&2
  exit 1
fi
if [[ "$(stat -c '%a' -- "$resolved_env")" != "600" ]]; then
  echo "Deployment environment file permissions must be 600." >&2
  exit 1
fi
if [[ "$(stat -c '%u' -- "$resolved_env")" != "$(id -u)" ]]; then
  echo "Deployment environment file owner is invalid." >&2
  exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
infra_dir="$(cd -- "$script_dir/.." && pwd)"
state_root="$portfolio_root/state"
state_dir="$state_root/$environment"
state_backup_file=""
state_update_replaced=false

# 배포 상태 디렉터리 생성 및 경로 검증
ensure_state_directory() {
  if [[ -e "$state_root" && (! -d "$state_root" || -L "$state_root") ]]; then
    echo "Deployment state root is invalid: $state_root" >&2
    exit 1
  fi
  install -d -m 700 -- "$state_root"
  if [[ -e "$state_dir" && (! -d "$state_dir" || -L "$state_dir") ]]; then
    echo "Deployment state directory is invalid: $state_dir" >&2
    exit 1
  fi
  install -d -m 700 -- "$state_dir"
  state_dir="$(realpath -e -- "$state_dir")"
  if [[ "$state_dir" != "$portfolio_root/state/$environment" ]]; then
    echo "Deployment state directory is outside PORTFOLIO_ROOT." >&2
    exit 1
  fi
}

# 배포 상태 태그 읽기 및 유효성 검증
read_state_tag() {
  local state_file="$1"
  local state_name="$2"
  local value=""

  if [[ ! -e "$state_file" ]]; then
    printf '\n'
    return
  fi
  if [[ ! -f "$state_file" || -L "$state_file" || ! -r "$state_file" ]]; then
    echo "Deployment state file is invalid: $state_name" >&2
    exit 1
  fi
  if [[ "$(stat -c '%u' -- "$state_file")" != "$(id -u)" ]]; then
    echo "Deployment state file owner is invalid: $state_name" >&2
    exit 1
  fi
  value="$(tr -d '\r\n' < "$state_file")"
  if [[ -n "$value" && ! "$value" =~ ^sha-[0-9a-f]{40}$ ]]; then
    echo "Deployment state tag is invalid: $state_name" >&2
    exit 1
  fi
  printf '%s\n' "$value"
}

# 배포 상태 태그 원자적 기록
write_state_tag() {
  local state_file="$1"
  local state_name="$2"
  local state_tag="$3"
  local previous_state_tag="${4:-}"
  local temporary_file=""
  local recorded_tag=""

  if [[ -e "$state_file" && (! -f "$state_file" || -L "$state_file") ]]; then
    echo "Deployment state file is invalid: $state_name" >&2
    return 1
  fi
  temporary_file="$(mktemp "$state_dir/.${state_name}.XXXXXX")"
  chmod 600 -- "$temporary_file"
  printf '%s\n' "$state_tag" > "$temporary_file"
  if [[ -n "$previous_state_tag" ]]; then
    state_backup_file="$(mktemp "$state_dir/.${state_name}.previous.XXXXXX")"
    chmod 600 -- "$state_backup_file"
    printf '%s\n' "$previous_state_tag" > "$state_backup_file"
  fi
  mv -f -- "$temporary_file" "$state_file"
  state_update_replaced=true
  recorded_tag="$(read_state_tag "$state_file" "$state_name")"
  if [[ "$recorded_tag" != "$state_tag" ]]; then
    echo "Deployment state update failed: $state_name" >&2
    return 1
  fi
  if [[ -n "$state_backup_file" ]]; then
    rm -f -- "$state_backup_file"
    state_backup_file=""
  fi
  state_update_replaced=false
}

ensure_state_directory
legacy_state_file="$state_dir/current-version"
frontend_state_file="$state_dir/frontend-version"
backend_state_file="$state_dir/backend-version"
legacy_tag="$(read_state_tag "$legacy_state_file" "current-version")"
frontend_tag="$(read_state_tag "$frontend_state_file" "frontend-version")"
backend_tag="$(read_state_tag "$backend_state_file" "backend-version")"

if [[ -n "$legacy_tag" ]]; then
  if [[ ! -e "$frontend_state_file" ]]; then
    write_state_tag "$frontend_state_file" "frontend-version" "$legacy_tag"
    frontend_tag="$legacy_tag"
  fi
  if [[ ! -e "$backend_state_file" ]]; then
    write_state_tag "$backend_state_file" "backend-version" "$legacy_tag"
    backend_tag="$legacy_tag"
  fi
fi

if [[ "$component" == "frontend" && -z "$backend_tag" ]]; then
  echo "Frontend deployment requires a recorded backend-version: environment=$environment" >&2
  exit 1
fi

previous_tag=""
if [[ "$component" == "frontend" ]]; then
  previous_tag="$frontend_tag"
  frontend_compose_tag="$image_tag"
  backend_compose_tag="$backend_tag"
  services=(frontend)
  state_file="$frontend_state_file"
  state_name="frontend-version"
else
  previous_tag="$backend_tag"
  backend_compose_tag="$image_tag"
  frontend_compose_tag="${frontend_tag:-$image_tag}"
  services=(backend monitor)
  state_file="$backend_state_file"
  state_name="backend-version"
fi

compose=(
  docker compose
  --project-name "portfolio-$environment"
  --env-file "$resolved_env"
  -f "$infra_dir/compose.yaml"
  -f "$infra_dir/compose.$environment.yaml"
)

# 상태 기록 실패 후 이전 정상 상태 복구
restore_previous_state() {
  local restored_tag=""

  if [[ "$state_update_replaced" != true || -z "$state_backup_file" ]]; then
    return 0
  fi
  if [[ ! -f "$state_backup_file" || -L "$state_backup_file" ]]; then
    echo "Deployment state backup is invalid: $state_name" >&2
    return 1
  fi
  mv -f -- "$state_backup_file" "$state_file"
  state_backup_file=""
  state_update_replaced=false
  restored_tag="$(read_state_tag "$state_file" "$state_name")"
  if [[ "$restored_tag" != "$previous_tag" ]]; then
    echo "Deployment state restoration failed: $state_name" >&2
    return 1
  fi
}

# 배포 실패 시 대상 컴포넌트 자동 롤백
rollback_on_failure() {
  local exit_code=$?
  trap - ERR
  if [[ -z "$previous_tag" ]]; then
    echo "Initial deployment failed without a prior $state_name: environment=$environment component=$component" >&2
  else
    echo "Deployment failed; rolling back component=$component to its prior version." >&2
    if ! bash "$script_dir/rollback.sh" "$environment" "$component" "$previous_tag" "$resolved_env"; then
      echo "Automatic rollback failed: environment=$environment component=$component" >&2
    elif ! restore_previous_state; then
      echo "Deployment state restoration failed after rollback: environment=$environment component=$component" >&2
    elif [[ -n "$state_backup_file" ]]; then
      rm -f -- "$state_backup_file"
      state_backup_file=""
    fi
  fi
  exit "$exit_code"
}
trap rollback_on_failure ERR

echo "Deployment starting: environment=$environment component=$component tag=$image_tag"
FRONTEND_IMAGE_TAG="$frontend_compose_tag" BACKEND_IMAGE_TAG="$backend_compose_tag" "${compose[@]}" pull "${services[@]}"
FRONTEND_IMAGE_TAG="$frontend_compose_tag" BACKEND_IMAGE_TAG="$backend_compose_tag" "${compose[@]}" up -d --no-deps "${services[@]}"
FRONTEND_IMAGE_TAG="$frontend_compose_tag" BACKEND_IMAGE_TAG="$backend_compose_tag" bash "$script_dir/health-wait.sh" "$environment" "$component" "$resolved_env"
bash "$script_dir/smoke-test.sh" "$component"
write_state_tag "$state_file" "$state_name" "$image_tag" "$previous_tag"
echo "Deployment completed: environment=$environment component=$component tag=$image_tag"
