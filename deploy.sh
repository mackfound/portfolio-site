#!/bin/sh
# deploy.sh — the only way to publish (projectplan.md §9). Each step aborts on failure.
#
#   ./deploy.sh                  build, sign, upload, verify live, push
#   ./deploy.sh --dry-run        rehearse every step without uploading or pushing:
#                                  - not on main / TODO-COPY slots left are warnings
#                                  - edition.json is bumped for the build, then restored
#                                  - verify-live runs against a local Pages-like server
#   --key PATH                   signing key (default ~/.ssh/mdoyle_site)
#   --signers PATH               allowed_signers file; dry runs only (scripts/dry-run.sh)
set -eu

# Cloudflare Pages project name (projectplan.md §15). A real deploy refuses while empty.
PAGES_PROJECT="mdoyle-v5"

dry=0
key="$HOME/.ssh/mdoyle_site"
signers=allowed_signers
custom_signers=0
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) dry=1 ;;
    --key) key="$2"; shift ;;
    --signers) signers="$2"; custom_signers=1; shift ;;
    *) echo "deploy: unknown option $1" >&2; exit 2 ;;
  esac
  shift
done

cd "$(dirname "$0")"

step() { printf '\n== %s\n' "$1"; }
fail() { echo "deploy: $1" >&2; exit 1; }
warn_or_fail() {
  if [ "$dry" = 1 ]; then echo "deploy: warning (dry run): $1" >&2; else fail "$1"; fi
}

[ "$custom_signers" = 0 ] || [ "$dry" = 1 ] || fail "--signers is for dry runs only; real deploys verify against the repo's allowed_signers"

step "1. Preflight"
[ -z "$(git status --porcelain)" ] || fail "the working tree is not clean"
branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = main ] || warn_or_fail "on branch $branch, not main"
[ "$dry" = 1 ] || [ -n "$PAGES_PROJECT" ] || fail "PAGES_PROJECT is not set at the top of deploy.sh"
[ -f "$key" ] || fail "no signing key at $key"
[ "$(node -v)" = "v$(cat .nvmrc)" ] \
  || fail "Node is $(node -v); the repo pins v$(cat .nvmrc). Run: nvm install && nvm use"
npm ls --depth=0 >/dev/null 2>&1 || fail "dependencies are missing or out of date. Run: npm ci"
npm test
node scripts/check-copy.js --strict >/dev/null 2>&1 \
  || warn_or_fail "TODO-COPY slots remain in src/ (node scripts/check-copy.js lists them)"

step "2. Edition"
if [ "$dry" = 1 ]; then
  saved="$(mktemp)"
  cp src/_data/edition.json "$saved"
  trap 'cp "$saved" src/_data/edition.json; rm -f "$saved"' EXIT
fi
node scripts/edition.js
if ! git diff --quiet -- src/_data/edition.json; then
  number="$(node -p 'JSON.parse(require("fs").readFileSync("src/_data/edition.json","utf8")).number')"
  if [ "$dry" = 1 ]; then
    echo "dry run: would commit \"edition: No. $number\""
  else
    git add src/_data/edition.json
    git commit -q -m "edition: No. $number"
  fi
fi

step "3. Build"
rm -rf _site
npx @11ty/eleventy --quiet
node scripts/check-copy.js --strict >/dev/null 2>&1 \
  || warn_or_fail "TODO-COPY slots remain in the built site (node scripts/check-copy.js lists them)"

step "4. Manifest"
node scripts/manifest.js _site

step "5. Sign"
ssh-keygen -Y sign -f "$key" -n mdoyle-site _site/manifest.txt

step "6. Verify locally"
sh scripts/verify-local.sh _site "$signers"

step "7. Deploy"
if [ "$dry" = 1 ]; then
  echo "dry run: skipped wrangler pages deploy"
else
  npx wrangler pages deploy _site --project-name "$PAGES_PROJECT"
fi

step "8. Verify live"
if [ "$dry" = 1 ]; then
  node scripts/verify-live.js --local _site
else
  node scripts/verify-live.js
fi

step "9. Push"
if [ "$dry" = 1 ]; then
  echo "dry run: skipped git push"
else
  git push origin main
fi

printf '\ndeploy: %s\n' "$([ "$dry" = 1 ] && echo "dry run complete" || echo "published and verified")"
