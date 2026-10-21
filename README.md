# M. Doyle, Vol. V

TODO-COPY(readme-intro)

## Build

```sh
nvm use
npm ci
npm run serve   # local preview
npm test        # all checks
```

## Verification

TODO-COPY(readme-verification)

```sh
ssh-keygen -Y verify -f allowed_signers -I michael -n mdoyle-site \
  -s manifest.txt.sig < manifest.txt
```

## Layout

The spec is `projectplan.md`. `drafts/` is gitignored and holds local-only previews that are never deployed.
