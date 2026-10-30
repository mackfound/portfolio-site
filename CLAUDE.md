# M. Doyle, Vol. V: working notes for Claude Code

`projectplan.md` is the spec. This file records how we work, what's been decided since the spec was written, and what's next. If this file disagrees with the spec, say so; don't silently pick one.

## Hard rules

- **Signing key.** Never generate, read, print, copy, move, or otherwise handle the real private signing key. `allowed_signers` (public) is fine.
- **No AI-written prose in shipped content.** Michael writes the copy. The one exception is meta descriptions (spec §7): draft each one from the page's existing copy, get Michael's approval, then commit. Never draft a meta before the copy it summarizes exists. Until then, it stays a `TODO-COPY(meta-…)` slot.
- **Critique before committing copy.** When Michael sends copy, review it for coherence, contradictions with other pages (resume, About, project pages), tone, and length *before* committing. Be direct; don't soften.
- **Stop and ask before** adding a dependency, approaching or exceeding a budget (§8), changing a content schema, renaming content files, or deviating from the agreed design direction.
- **One PR per phase or step.** After a PR is merged, restart the working branch from `origin/main` before new work. Never stack on merged history.
- **Determinism.** The build must stay byte-identical across runs (`scripts/check-determinism.sh`). Dates come from `edition.json` or front matter, never build time.

## How Michael likes to work

- Ask clarifying questions where a choice is his; offer a recommended option.
- Be clear when he's wrong. No flattery.
- Prefer interactive diagrams or artifacts over long text dumps. Design choices are made from rendered samples, not descriptions.

## Commands

| Task | Command |
|---|---|
| Toolchain | `fnm use` (reads `.nvmrc`), then `npm ci` |
| Dev server (slots highlighted) | `npm run serve` |
| All checks | `npm test` (content, copy slots, budgets, unit/site tests, determinism) |
| Deploy dry run | `./deploy.sh --dry-run` (Michael runs real deploys; the key is on his laptop) |
| Copy Desk page | `node tools/copy-desk/gen-tracker.mjs` → republish `tools/copy-desk/copy-desk.html` |
| Preview build | `node tools/preview/build.mjs <dir>` then `node tools/preview/relink.mjs <dir> <sha>` |
| R1 sampler | `node design/r1-sampler/assemble.mjs` |
| Favicon | `python3 scripts/fonts/build-favicon.py` (fonttools 4.55.3 + brotli 1.1.0), then rasterize `scripts/fonts/apple-touch-icon.svg` to `src/assets/icons/apple-touch-icon.png` at 180 px |

## Artifacts on claude.ai

These are private to Michael. To update one from a new session, read it by URL, then publish to the same URL.

- Copy Desk (copy slot tracker; checkbox state lives in its database): https://claude.ai/artifact/WHLBgTAuCHPRjbUiCvAUyv
- Site preview (static build, links relinked): https://claude.ai/artifact/6sP9zuxfNuWyGU81JHcAwA. The artifact host wraps the main page in its own skeleton, so the preview's `index.html` carries a one-rule `body` font/color override.
- R1 design sampler (the approved direction): https://claude.ai/artifact/Kuz8evYrFzCLi26KVwRJL7. Publish `out/vol-v-directions.html` with `brahms4-iii.mp4` and `brahms4-iii.ogg` (now in `src/assets/media/`) in `files`.

## Decisions since the spec (newest last)

- **2026-10-24: R1 redesign review.** On seeing the preview, Michael found the P2 look bland: warm cream, serif, brick accent, and hairline rules, a common "generated site" cluster. Decisions:
  - **Direction: Broadsheet+.** Keep the publication-of-record concept but commit to it:
    - a bigger masthead;
    - a **lead story** with its working figure;
    - press red `#c8102e` (dark `#ff7a70`) replacing the brick accent;
    - newsprint paper `#f3f2ee` (dark `#121211`);
    - 3 px section rules.

    The exact tokens and CSS are in `design/r1-sampler/sampler.src.html`. The Title block and Manifest directions were rejected.
  - **Motion rule** (replaces spec §2's motion ban; write it into the spec in R3): motion only answers the visitor (hover, focus, click, drag, navigation), plus **exactly one ambient element**. Nothing is scroll-triggered. Honor `prefers-reduced-motion`. Every page fully works with JS off.
  - **Ambient element: the dateline tick.** The edition number and content hash resolve into place once on load.
  - **Randomart:** the signing-key fingerprint drawn as OpenSSH randomart (drunken bishop; verified identical to `ssh-keygen -lv`). It is static and lives **only on `/verify/`**, beside the fingerprint. It is not in the masthead or the footer.
  - **Working figures:** at most one per entry page. Passagework's figure loops a real recording: the opening 25 s of Brahms Symphony No. 4, III (Musopen, CC0; see `src/assets/media/CREDITS.txt`).
    - At 100% speed the loop is sample-accurate (`AudioBufferSourceNode` loop). Below 100% it uses `<audio>` with `preservesPitch`, and the caption says that can leave a seam the real tool doesn't.
    - Audio loads only on Play. Serve AAC (`.mp4`) where supported and Opus (`.ogg`) otherwise.
    - Figure JS is ~1.8 KB brotli.
    - RadioHound's figure (an FPGA-vs-software spectrum overlay) and the attestation figure are R3 candidates.
  - **Expand in place:** entry details use native `<details>`.
- **2026-10-24: R2, merged as PR 19.** Research and Projects are separate collections:
  - `src/research/`, served at `/research/`; `src/projects/`, served at `/projects/`.
  - RadioHound is past research.
  - The `kind` field is gone. `detail` and `pi_signoff` are required on research and rejected on projects.
  - Optional `lead: true`, at most one site-wide (checked by `check-content`). Passagework is the lead.
- **Copy facts:**
  - RadioHound role is "Undergraduate research assistant", period Jan–Nov 2026, to match the resume.
  - RadioHound has `pi_signoff: false`. That's valid at high-level detail; don't change it to `true` without Michael confirming a sign-off.
  - Remote attestation stack is Intel TDX, Google Cloud Platform, OpenSSL.

- **2026-10-25: R3 scope.** Michael chose:
  - The dateline tick runs on the **front page only**. Inner pages keep a static dateline and ship no JS.
  - The Passagework figure lives on **`/projects/passagework/` only**. The front-page lead has no player.
  - **Projects (with the lead) come before Research** on the front page, per spec §3.
- **2026-10-25: R3 built.** Structure, for future changes:
  - Tokens and styles are in `site.css`; the sampler is the reference, not a source.
  - `entry.njk` renders kickers and `<details>` facts; `section-list.njk` puts the `lead: true` entry first.
  - The tick is `src/_includes/dateline-tick.njk`, included by `base.njk` on `/` only. Values marked `data-tick` are already final in the HTML.
  - The figure is `src/_includes/passagework-figure.njk` plus `src/assets/js/passagework-figure.js`. Peaks are in `src/_data/passageworkPeaks.json`; the `waveformSvg` filter draws the no-JS waveform.
  - Randomart is `scripts/lib/randomart.js`, rendered by the `randomart` filter on `/verify/`, and tested against `ssh-keygen -lv` with throwaway keys.
  - Pages with JS need a `budget-exceptions.json` entry, and only Michael adds those (spec §8).

- **2026-10-25: UI fixes after launch.** Michael chose, from the UI options sampler (https://claude.ai/artifact/HCKPd7jHno3KCwSXsyBhKd):
  - **Red means clickable.** Only links and controls use the accent. Kickers ("Lead", "Current", resume roles) are ink semibold, and dates are muted.
  - **Resume as a ledger:** 3 px section rules, a hairline between jobs, role and dates as a kicker, and bullets hung off a margin rule. Pages opt in with `pageClass` in front matter.
  - **Text buttons** for actions ("All …", Live/Source, PDF, contact): red small caps, underlined on hover. Links inside sentences stay underlined. The footer's duplicate Resume link is gone.
  - **Hover lights up only the link,** never the whole entry.
  - The front page shows **2 writing entries**.

- **2026-10-25: "Bland to click through" fixes.** Michael chose, from the second options sampler (https://claude.ai/artifact/H2zGpCMDLzJfzHFHAVNLAt):
  - **Page transitions,** CSS only. Pages rise in from below; returning home settles in from above.
  - **Numbered sections and a "Next" strip** on entry pages. No lede; it repeated the summary.
  - **Lead figure:** a static waveform beside the lead story on wide screens.
  - **Footer band** with the edition mark.
  - Rejected: front-page columns and the narrow page.
  - Next candidates: working figures for RadioHound and remote attestation. Each needs real data and its own review.

- **2026-10-25: Launched.** mdoyle.dev is live on the `mdoyle-v5` Pages project with the custom domain attached. Deploys go only through `./deploy.sh` from an up-to-date main, never by uploading `_site/` by hand (the first upload was a hand-uploaded test build with no manifest). The favicon (the masthead M, PR 27) is the last change merged.
- **2026-10-25: Figures dropped; pivot opened.** Michael rejected both mocked R3 figures (RadioHound Amaranth↔Verilog, TDX quote anatomy) as too large. Neither was built in. He finds the newspaper direction unoriginal and the site reads like his resume. Where it stands:
  - **Keep regardless:** the signing pipeline, content model, `deploy.sh`, and tests. Only `site.css` and the templates are in play.
  - **Claude's view:** a new look alone won't fix the resume feel. The site's one original idea is that it's signed ("don't trust this page, verify it"), and that's currently buried in the footer and `/verify/`.
  - **Seeds offered:** Proof (the site verifies itself in front of you), Notebook (first-person, Notes as the main content), Score (work laid out like a piece of music; gimmick risk), Almost nothing (one strong paragraph, minimal interface).
  - **Process:** go wide before going deep. Sketch genuinely different directions, not variations on the current one, and don't pick on first viewing. Michael said he takes the first idea too often.
  - **Waiting on Michael:** 2–3 sites that made him stop scrolling, or the closest seed. Don't start sketching before that.
  - **Also raised:** the positioning line reads like resume-speak (his to rewrite), and Notes is built but hidden.
- **2026-10-25: Contact address.** The site publishes `contact@mdoyle.dev`. That's Cloudflare Email Routing, forwarding to Michael's **personal** address.
  - It receives only, by choice: replies come from his own address, and no sending service is set up.
  - Not nd.edu: Notre Dame's mail system silently drops forwarded mail. The activity log said "Forwarded", but nothing arrived, even in spam. A personal address also outlives graduation.
  - `contactLinks.js` writes the address as HTML character references at build time, to stop naive scrapers.
  - **Cloudflare Email Address Obfuscation must stay off.** It rewrote every page carrying the address, injected `/cdn-cgi` JS, and broke the signed hashes; `verify-live` caught it.
  - The resume PDF still shows the nd.edu address. It's Michael's file to update.
- **2026-10-26: Old address redirect.** A separate classic Pages project, `mdoyle`, owns `mdoyle.pages.dev`, the old site's address that's in 100+ job applications.
  - Its only content is a `_redirects` rule, `/* https://mdoyle.dev/:splat 301`, plus a fallback `index.html`. It isn't part of the repo or the signed site.
  - **Never delete it:** the name would be free for anyone to claim.
  - Recreating it needs `wrangler pages project create mdoyle --production-branch main --force`. Without `--force`, new wrangler creates a Workers project with a `workers.dev` address.
  - Old-site paths that don't exist on the new site land on the 404 page. Add specific redirects if Michael names any.
- **2026-10-25: Repo moved** from `~/Desktop/Projects/` (synced by iCloud, which caused hung tests, a git bus error, and failed pushes) to `~/Projects/portfolio-site`. Keep it out of iCloud.

## Open items

- **Pivot:** waiting on Michael (see 2026-10-25 above).
- **§13 launch checklist:** not yet worked through.
- **workerd:** if `wrangler pages deploy` fails, run `npm install-scripts approve workerd` (npm held back its install script during the `npm ci` reinstall).
- **Node:** bump `.nvmrc` and `engines.node` from 24.21.0 to 24.22.1 after 2026-11-03, once it's two weeks old. First check that no newer 24.x security release supersedes it. Keep that diff to the pin only.
- **RadioHound:** Michael will revise the entry now that he's left the lab.
- **Post-launch backlog:** spec §14.
