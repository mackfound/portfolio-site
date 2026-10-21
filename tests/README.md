# tests

Run with `npm test` (Node's built-in `node:test`). From P4, signing tests
generate a throwaway ed25519 key in a temp directory and delete it afterward;
the real signing key is never used here.
