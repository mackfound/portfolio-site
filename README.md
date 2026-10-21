# M. Doyle, Vol. V

Source for [mdoyle.dev](https://mdoyle.dev), my portfolio site that includes research, projects, and writing. It’s a static Eleventy site with no client-side JavaScript, and every deploy is signed so anyone can check that the pages they received are the ones I published. The idea, proving rather than asserting, comes from my trusted execution environment research in Notre Dame’s Data Security and Privacy Lab.

## Build

```sh
nvm use         # or: fnm use
npm ci
npm run serve   # local preview
npm test        # all checks
```

## Verification

Each deploy publishes `manifest.txt`, a SHA-256 hash of every file the site serves, and `manifest.txt.sig`, my signature over it. The full walkthrough is at [mdoyle.dev/verify](https://mdoyle.dev/verify/). From a clone of this repository, which provides `allowed_signers`, the signature check is:

```sh
ssh-keygen -Y verify -f allowed_signers -I michael -n mdoyle-site \
  -s manifest.txt.sig < manifest.txt
```

Signing key fingerprint (also on my GitHub profile):

```
SHA256:SIrKxFe96nzghLrALjXmB/3/GKZknXeDV48jwZQXsrE mdoyle-site signing (ED25519)
```

## Layout

The spec is `projectplan.md`. `drafts/` is gitignored and holds local-only previews that are never deployed.
