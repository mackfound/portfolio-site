#!/bin/sh
# check-determinism — build twice into separate directories; outputs must be
# byte-identical (projectplan.md §10).
set -eu

root="$(cd "$(dirname "$0")/.." && pwd)"
work="$root/.determinism"
rm -rf "$work"
mkdir -p "$work"
trap 'rm -rf "$work"' EXIT

cd "$root"
npx @11ty/eleventy --quiet --output="$work/a" >/dev/null
npx @11ty/eleventy --quiet --output="$work/b" >/dev/null

if diff -r "$work/a" "$work/b"; then
  echo "check-determinism: byte-identical"
else
  echo "check-determinism: builds differ" >&2
  exit 1
fi
