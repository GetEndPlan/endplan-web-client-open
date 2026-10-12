#!/usr/bin/env sh

set -eu

if [ "$#" -eq 0 ]; then
  echo "Usage: $0 <command> [args...]"
  exit 1
fi

NVM_DIR="${NVM_DIR:-$HOME/.nvm}"

if [ -s "${NVM_DIR}/nvm.sh" ]; then
  unset npm_config_prefix
  unset PREFIX
  # shellcheck disable=SC1090
  . "${NVM_DIR}/nvm.sh"
  nvm use >/dev/null 2>&1 || true
fi

if ! node -e "const [major, minor] = process.versions.node.split('.').map(Number); process.exit(major > 22 || (major === 22 && minor >= 12) ? 0 : 1)"; then
  echo "Node.js 22.12+ is required for web-client development and CI parity."
  echo "Current version: $(node -v)"
  echo "Tip: run 'nvm use' in endplan-web-client/"
  exit 1
fi

exec "$@"
