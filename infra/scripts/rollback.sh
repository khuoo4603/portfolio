#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 3 ]]; then
  echo "롤백 인자가 올바르지 않습니다." >&2
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
  echo "Rollback Image Tag 형식이 올바르지 않습니다." >&2
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
compose=(
  docker compose
  --project-name "portfolio-$environment"
  --env-file "$resolved_env"
  -f "$infra_dir/compose.yaml"
  -f "$infra_dir/compose.$environment.yaml"
)

# 직전 정상 SHA Application Image 재배포와 내부 Health 재검증
echo "Application Rollback 시작: environment=$environment tag=$image_tag"
IMAGE_TAG="$image_tag" "${compose[@]}" pull frontend backend monitor
IMAGE_TAG="$image_tag" "${compose[@]}" up -d --no-deps frontend backend monitor
IMAGE_TAG="$image_tag" bash "$script_dir/health-wait.sh" "$environment" "$resolved_env"
echo "Application Rollback 완료: environment=$environment tag=$image_tag"
