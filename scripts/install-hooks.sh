#!/usr/bin/env sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

cd "${ROOT_DIR}"

# Docker/CI copies only package.json + scripts before npm ci — .githooks is not present.
if [ ! -f .githooks/pre-commit ]; then
  echo "Skipping git hooks install (no .githooks — e.g. Docker build or sparse checkout)."
  exit 0
fi

if ! command -v git >/dev/null 2>&1; then
  echo "Skipping git hooks install (git not available)."
  exit 0
fi

chmod +x .githooks/pre-commit
git config core.hooksPath .githooks

echo "Git hooks installed for endplan-web-client."
echo "Configured core.hooksPath=.githooks"
