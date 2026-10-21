#!/bin/sh
# verify-local — checks a built site before upload (projectplan.md §9, step 6):
# the manifest still matches every file on disk, and its signature verifies
# against allowed_signers under the mdoyle-site namespace.
#
#   sh scripts/verify-local.sh [site-dir] [allowed_signers]
set -eu

site="${1:-_site}"
signers="${2:-allowed_signers}"

node "$(dirname "$0")/manifest.js" --check "$site"
ssh-keygen -Y verify -f "$signers" -I michael -n mdoyle-site \
  -s "$site/manifest.txt.sig" < "$site/manifest.txt"
