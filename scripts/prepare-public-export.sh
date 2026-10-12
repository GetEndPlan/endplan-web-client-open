#!/usr/bin/env sh
# Copy this sanitized OSS tree into a fresh directory for the first public-repo push.
# Does not create the GitHub repo or rewrite private history into the public remote.
#
# Usage:
#   sh scripts/prepare-public-export.sh [dest-dir]
#
# Default dest: ../endplan-web-client-public

set -eu

ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
DEST="${1:-$ROOT/../endplan-web-client-public}"

echo "Source: $ROOT"
echo "Dest:   $DEST"

if [ -e "$DEST" ] && [ "${FORCE:-}" != "1" ]; then
  echo "Destination already exists. Set FORCE=1 to replace, or pass a new path." >&2
  exit 1
fi

rm -rf "$DEST"
mkdir -p "$DEST"

# Curated copy — exclude private/local artifacts. Prefer rsync when available.
if command -v rsync >/dev/null 2>&1; then
  rsync -a \
    --exclude '.git/' \
    --exclude 'node_modules/' \
    --exclude 'dist/' \
    --exclude '.npm-cache/' \
    --exclude '.cache/' \
    --include '.env.example' \
    --include '.env.stubs.example' \
    --exclude '.env' \
    --exclude '.env.*' \
    --exclude 'FEATURES.md' \
    --exclude '.DS_Store' \
    --exclude 'coverage/' \
    "$ROOT/" "$DEST/"
else
  # Fallback: tar pipe with excludes
  tar -C "$ROOT" \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='.npm-cache' \
    --exclude='.cache' \
    --exclude='.env' \
    --exclude='FEATURES.md' \
    --exclude='.DS_Store' \
    --exclude='coverage' \
    -cf - . | tar -C "$DEST" -xf -
  # Drop accidental .env.* except example
  find "$DEST" -maxdepth 1 -name '.env.*' ! -name '.env.example' ! -name '.env.stubs.example' -exec rm -f {} +
fi

cd "$DEST"
npm run oss:sanity

echo ""
echo "Export ready at: $DEST"
echo "Next:"
echo "  cd \"$DEST\""
echo "  git init"
echo "  git add -A && git commit -m \"Initial public export from private v.1.0.1 (sanitized)\""
echo "  # create empty public GitHub repo, then:"
echo "  git remote add origin <PUBLIC_REPO_URL>"
echo "  git push -u origin HEAD:main"
echo "  git tag v0.1.0 && git push origin v0.1.0"
