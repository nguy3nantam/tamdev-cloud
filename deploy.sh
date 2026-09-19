#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ "${1:-}" == "--pull" ]]; then
  echo ">> Pulling latest code..."
  git pull --ff-only --quiet || echo ">> (git pull failed — tiếp tục với code hiện tại)"
fi

echo ">> Building image..."
docker compose build --pull

echo ">> Restarting container..."
docker compose up -d

docker image prune -f >/dev/null 2>&1 || true

echo ">> ✔ tamdev.cloud deployed → https://tamdev.cloud"