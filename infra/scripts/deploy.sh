#!/usr/bin/env bash
set -Eeuo pipefail

if [[ $# -ne 3 ]]; then
  echo "배포 인자가 올바르지 않습니다." >&2
  exit 1
fi

environment="$1"
image_tag="$2"
env_file="$3"
case "$environment" in
  dev|prod) ;;
  *) echo "지원하지 않는 환경: $environment" >&2; exit 1 ;;
esac
if [[ ! "$image_tag" =~ ^sha-[0-9a-f]{40}$ ]]; then
  echo "배포 Image Tag 형식이 올바르지 않습니다." >&2
  exit 1
fi

portfolio_root="${PORTFOLIO_ROOT:-/opt/portfolio}"
if [[ "$portfolio_root" != /* || "$portfolio_root" == "/" ]]; then
  echo "PORTFOLIO_ROOT는 /가 아닌 절대 경로여야 합니다." >&2
  exit 1
fi
if [[ ! -f "$env_file" || -L "$env_file" ]]; then
  echo "배포 환경 파일을 찾을 수 없습니다." >&2
  exit 1
fi

if ! resolved_env="$(realpath -e -- "$env_file")"; then
  echo "배포 환경 파일 경로를 확인할 수 없습니다." >&2
  exit 1
fi
if [[ ! -f "$resolved_env" || -L "$resolved_env" || ! -r "$resolved_env" ]]; then
  echo "배포 환경 파일을 읽을 수 없습니다." >&2
  exit 1
fi
if [[ "$(stat -c '%a' -- "$resolved_env")" != "600" ]]; then
  echo "배포 환경 파일 권한은 600이어야 합니다." >&2
  exit 1
fi
if [[ "$(stat -c '%u' -- "$resolved_env")" != "$(id -u)" ]]; then
  echo "배포 환경 파일 소유자가 올바르지 않습니다." >&2
  exit 1
fi

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
infra_dir="$(cd -- "$script_dir/.." && pwd)"
state_dir="$portfolio_root/state/$environment"
state_file="$state_dir/current-version"
previous_tag=""

if [[ ! -d "$state_dir" || ! -f "$state_file" || -L "$state_file" || ! -w "$state_file" ]]; then
  echo "current-version 상태 파일을 사용할 수 없습니다." >&2
  exit 1
fi

previous_tag="$(tr -d '\r\n' < "$state_file")"
if [[ -n "$previous_tag" && ! "$previous_tag" =~ ^sha-[0-9a-f]{40}$ ]]; then
  echo "current-version 형식이 올바르지 않습니다." >&2
  exit 1
fi

compose=(
  docker compose
  --project-name "portfolio-$environment"
  --env-file "$resolved_env"
  -f "$infra_dir/compose.yaml"
  -f "$infra_dir/compose.$environment.yaml"
)

rollback_on_failure() {
  exit_code=$?
  trap - ERR
  if [[ -z "$previous_tag" ]]; then
    echo "최초 배포 실패: 직전 정상 Version이 없어 Rollback을 생략합니다." >&2
  else
    echo "신규 배포 실패: 직전 정상 Version으로 Rollback을 시작합니다." >&2
    if ! bash "$script_dir/rollback.sh" "$environment" "$previous_tag" "$resolved_env"; then
      echo "자동 Rollback도 실패했습니다." >&2
    fi
  fi
  exit "$exit_code"
}
trap rollback_on_failure ERR

# Application Image 배포와 Health·Smoke 성공 뒤 Version 상태 갱신
echo "Application 배포 시작: environment=$environment tag=$image_tag"
IMAGE_TAG="$image_tag" "${compose[@]}" pull frontend backend monitor
IMAGE_TAG="$image_tag" "${compose[@]}" up -d --no-deps frontend backend monitor
IMAGE_TAG="$image_tag" bash "$script_dir/health-wait.sh" "$environment" "$resolved_env"
bash "$script_dir/smoke-test.sh"

printf '%s\n' "$image_tag" > "$state_file"
recorded_tag="$(tr -d '\r\n' < "$state_file")"
if [[ "$recorded_tag" != "$image_tag" ]]; then
  echo "current-version 기록에 실패했습니다." >&2
  false
fi
echo "Application 배포 완료: environment=$environment tag=$image_tag"
