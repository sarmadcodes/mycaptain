#!/usr/bin/env bash
# Pull the latest code, build both apps and restart them without downtime.
# Run on the VPS from the repository root: bash deploy/update.sh
set -euo pipefail
cd "$(dirname "$0")/.."

git pull --ff-only

echo "Backend: install, test types, build"
(cd backend && npm ci && npm run typecheck && npm run build)

echo "Partner website: install and build"
(cd partners && npm ci && npm run build)

if pm2 describe mycaptain-api >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.config.cjs --update-env
else
  pm2 start deploy/ecosystem.config.cjs
  pm2 save
fi

sleep 3
curl -fsS http://127.0.0.1:4000/health >/dev/null && echo "API healthy"
curl -fsS -o /dev/null http://127.0.0.1:3010/ && echo "Partner website healthy"
