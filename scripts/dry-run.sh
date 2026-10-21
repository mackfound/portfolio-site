#!/bin/sh
# dry-run — rehearses deploy.sh end to end with a throwaway ed25519 key made in a
# temp directory and deleted afterwards (projectplan.md §9, §11 P4 gate). The real
# signing key is never read.
set -eu

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

ssh-keygen -q -t ed25519 -N "" -C "mdoyle-site throwaway dry-run key" -f "$tmp/key"
printf 'michael namespaces="mdoyle-site" %s\n' "$(cat "$tmp/key.pub")" > "$tmp/allowed_signers"

sh "$(dirname "$0")/../deploy.sh" --dry-run --key "$tmp/key" --signers "$tmp/allowed_signers"
