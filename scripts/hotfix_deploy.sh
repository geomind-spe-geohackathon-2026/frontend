#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

exec 9>/tmp/geomind-deploy.lock
echo "waiting for the deploy lock..."
flock 9

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "commit your changes first"; exit 1
fi
git fetch -q origin
if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
  echo "HEAD is not origin/main: pull or push main first"; exit 1
fi
test -f .env

sg docker -c "docker build -q -t geomind-frontend:candidate ."
sg docker -c "docker tag geomind-frontend:latest geomind-frontend:prev"
sg docker -c "docker tag geomind-frontend:candidate geomind-frontend:latest && docker compose up -d --no-build"

sleep 3
echo "bundle: $(curl -s https://geomind.team/ | grep -o 'assets/index-[^"]*' | head -1)"
echo "version: $(node -p 'require("./package.json").version')"
