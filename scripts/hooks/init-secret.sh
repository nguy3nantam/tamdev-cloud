#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [[ -f .secret ]]; then
  echo ">> hooks/.secret đã tồn tại — giữ nguyên."
else
  node -e "require('node:crypto').randomBytes(32, (e,b)=>{ if(e) throw e; process.stdout.write(b.toString('hex')) })" > .secret
  echo ">> Đã tạo hooks/.secret (32 bytes ngẫu nhiên)."
  echo ">> Dùng chính chuỗi này làm Webhook secret trong GitHub."
fi
