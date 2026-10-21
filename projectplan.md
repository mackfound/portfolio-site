# projectplan.md — M. Doyle, Vol. V

Personal site rebuild. Replaces the fourth iteration at `mdoyle.pages.dev`.
This document is the spec. Claude Code reads it in full before starting any phase and treats every **MUST** as a hard rule.

---

## 0. How to use this document

- Work phase by phase (section 11). Do not start a phase until the previous phase's review gate is cleared by Michael.
- Section 12 lists the conditions under which Claude Code **MUST stop and ask** instead of deciding. When in doubt, stop and ask.
- Michael writes all substantive text (section 7). Claude Code builds structure, not voice.
- Placeholders use the literal string `DOMAIN` until the domain is purchased.

---

## 1. Goals and audience

**Audience weighting:** 70% recruiters and industry, 20% research and grad school, 10% everyone else.

**The ten-second test.** A recruiter landing on the front page on a phone must be able to answer, without clicking or scrolling past the first screen:
1. Who is this (name, school, year)?
2. What does he build (positioning line)?
3. Proof that he has shipped (at least one current project, linked)?
4. Where is the resume?

**Other goals**
- **Modularity:** adding a section is one folder plus one config line. Adding an entry is one Markdown file.
- **Zero-click overview:** the front page shows the latest items from every visible section. One click goes to depth.
- **Editable by hand:** templates are plain HTML with template slots. Michael must be able to open any template and change it without learning a framework.
- **Memorable without being flashy:** the "catch" is the Edition structure plus the Attested signing pipeline (section 3).

---

## 2. Non-goals

Do not build any of these. If one seems necessary, stop and ask.

- No archive of previous site versions.
- No contact form. Contact is an email address and profile links.
- No dark-mode toggle. The site follows the visitor's system setting through CSS.
- No scroll-driven animation, parallax, fade-in-on-scroll, or layout animation.
- No client-side framework (React, Vue, Svelte, etc.).
- No CSS framework (Tailwind, Bootstrap, etc.).
- No analytics script. Traffic data comes from Cloudflare zone-level stats only.
- No newsletter or email delivery. That is a future, separate, non-professional project.
- No AI-generated prose anywhere in shipped content (section 7).

### The "AI website" look — explicitly avoid

Inter or Geist as the font, a centered giant-headline hero, gradients and blurred blobs, glassmorphism, bento-grid cards with soft shadows, emoji bullets, "Hi, I'm X 👋" openers, neon accents on a dark-only theme. Prefer rules (lines) and whitespace over cards and shadows.

---

## 3. Design direction

### Concept

**Edition (structure).** The front page is set like a publication of record.
- **Masthead:** "M. Doyle".
- **Dateline:** a rule-separated line under the masthead: `Vol. V · No. N` on the left, the edition date on the right.
- **Late Edition:** in dark mode, the dateline reads "Late Edition", appended to the left side (`Vol. V · No. N · Late Edition`); the date stays visible. This is CSS-only, using `prefers-color-scheme` and a `::after` or visibility swap. No JavaScript.

**Attested (signature).** Every page footer carries the short source commit SHA, the signing key fingerprint, and a link to `/verify/`. The signing pipeline is specified in section 9.

### Edition numbering

`Vol. V` is fixed: this is the fifth iteration. `No. N` increments only when content changes, not on every commit.

- `src/_data/edition.json` holds `{ "number": N, "date": "YYYY-MM-DD", "contentHash": "<sha256>" }`.
- Before each deploy, `scripts/edition.js` computes a SHA-256 over the sorted list of content files (all Markdown and JSON under the collection folders and `src/_data/sections.json`).
- If that hash differs from `contentHash`, the script increments `number`, sets `date` to today, and writes the file. The deploy script then commits the change.
- The dateline uses `edition.date`, never build time. Build output **MUST** be deterministic (section 10).

### Front page order

1. Masthead (left-aligned), standing line `TODO-COPY(home-standing)` with school and year, dateline, and an index strip of section links plus Resume (generated from `sections.json`).
2. Positioning line: one sentence, `TODO-COPY(home-positioning)`.
3. Lead stories: projects with `status: current`, `kind: project`, ordered by `order`.
4. Research: projects with `status: current`, `kind: research`.
5. Writing: the latest entries, with a link to all.
6. Notes: hidden at launch (`show: false` in `sections.json`).
7. About: a short blurb linking to the full page. Includes the contact line.
8. Footer: attestation line and resume link.

Sections 3–7 render from `sections.json` in configured order. The order above is the default config, not hard-coded.

### Typography

- **Typeface:** Source Serif 4, self-hosted as WOFF2 and subset to Latin. Use the optical-size axis: display end for the masthead, text end for body.
- **Weights:** 400 and 500 only, plus 400 italic.
- **Sans:** if UI labels need one, use the system stack (`system-ui, -apple-system, …`). Do not ship a second webfont.
- **Measure:** body text max-width around 65 characters.
- **Text details:** hyphenation on, ragged right.
- **Numerals:** tabular figures (`font-variant-numeric: tabular-nums`) for all dates, edition numbers, and hashes.
- **Monospace:** the system mono stack for hashes and commands.
- **Font budget:** if the variable font files exceed the font budget (section 8), stop and ask. The likely alternative is static instances (400, 500, 400 italic) plus one display instance for the masthead.
- **Shipped setup (approved at P2):** the variable roman instanced to wght 400–500 with the full opsz axis, renamed "Doyle Serif" under the OFL Reserved Font Name clause, plus Fontsource's static 400 italic. `scripts/fonts/build-fonts.sh` rebuilds both reproducibly.

### Color and theme

- All colors are CSS custom properties on `:root`, redefined under `@media (prefers-color-scheme: dark)`.
- **Light:** warm off-white paper, near-black ink, one muted accent for links.
- **Dark:** deep ink background, warm light text, the same accent adjusted for contrast.
- Both themes must meet WCAG AA contrast.

### Layout

- Mobile first. The front page is a single column on phones and moves to a two-column grid only where the content benefits (lead stories, writing list).
- No horizontal page scroll at any width. Wide content (code, hashes) scrolls inside its own container.

---

## 4. Stack

| Concern | Choice |
|---|---|
| Static site generator | Eleventy (current stable major), exact version pinned in `package.json` and the lockfile |
| Templates | Nunjucks (`.njk`) with plain HTML structure |
| Content | Markdown with YAML front matter |
| Feed | `@11ty/eleventy-plugin-rss` (Notes collection; built at launch, linked only once Notes is shown) |
| Styles | One hand-written CSS file (or a few, concatenated at build), custom properties, no preprocessor |
| JavaScript | None by default (section 8) |
| Node | Current LTS, pinned in `.nvmrc` |
| Hosting | Cloudflare Pages, **Direct Upload** project (not Git-connected) |
| Deploy CLI | Wrangler, pinned as a dev dependency |
| Signing | OpenSSH `ssh-keygen -Y sign/verify`, ed25519 key |

All dependencies use exact versions with no ranges. Pick versions at least two weeks old.

---

## 5. Repository structure

```
/
├─ projectplan.md
├─ README.md                  # public-facing: what this is, how verification works
├─ .nvmrc
├─ package.json / package-lock.json
├─ eleventy.config.js
├─ budget-exceptions.json     # approved budget overrides (section 8)
├─ deploy.sh                  # the only way to publish (section 9)
├─ allowed_signers            # public key line for verification (no private material)
├─ scripts/
│  ├─ edition.js              # edition bump logic
│  ├─ manifest.js             # hash _site/ → manifest.txt
│  ├─ verify-local.sh         # verify signature against allowed_signers
│  ├─ verify-live.js          # fetch live URLs, compare to manifest
│  ├─ check-copy.js           # fail on TODO-COPY
│  ├─ check-budgets.js        # page weight and JS budgets
│  ├─ check-determinism.sh    # build twice, diff
│  └─ check-content.js        # front matter schema validation
├─ tests/                     # test runner config and fixtures (incl. throwaway test key generation)
├─ drafts/                    # gitignored; previewed locally, never deployed
└─ src/
   ├─ _data/
   │  ├─ site.json            # name, domain, key fingerprint, profile links
   │  ├─ sections.json        # section registry (section 6)
   │  └─ edition.json
   ├─ _includes/
   │  ├─ base.njk             # html shell, head, footer attestation line
   │  ├─ masthead.njk
   │  ├─ section-list.njk     # generic renderer for a section on the front page
   │  ├─ project.njk          # project detail layout
   │  └─ note.njk
   ├─ assets/
   │  ├─ css/site.css
   │  ├─ fonts/               # Source Serif 4 WOFF2 subsets
   │  └─ media/               # resume PDF, images
   ├─ index.njk               # front page
   ├─ projects/               # one .md per project or research entry
   ├─ writing/                # one .md per published piece (metadata only)
   ├─ notes/                  # one .md per post (hidden section at launch)
   ├─ about/index.md
   ├─ resume/index.md
   ├─ verify/index.md
   └─ 404.njk
```

---

## 6. Content model

### Section registry: `src/_data/sections.json`

```json
[
  { "id": "projects", "label": "Projects", "collection": "projects", "filter": { "kind": "project", "status": "current" }, "limit": 3, "show": true },
  { "id": "research", "label": "Research", "collection": "projects", "filter": { "kind": "research", "status": "current" }, "limit": 2, "show": true },
  { "id": "writing",  "label": "Writing",  "collection": "writing",  "limit": 5, "show": true },
  { "id": "notes",    "label": "Notes",    "collection": "notes",    "limit": 3, "show": false },
  { "id": "about",    "label": "About",    "page": "/about/",       "show": true }
]
```

- **Adding a section:** create a folder under `src/` (its entries plus a `<folder>.11tydata.json` setting layout and permalink), and add one entry here. `eleventy.config.js` registers every collection named in this file from `src/<collection>/*.md`, so it needs no edit.
- **Generic renderer:** `section-list.njk` renders any registered section.
- **Validation:** `check-content.js` validates this file against a schema.

### Projects: `src/projects/*.md`

```yaml
title: Passagework
kind: project            # project | research
status: current          # current | past
order: 1                 # front-page ordering within kind+status
period: Jul–Aug 2026
role: Sole developer
stack: [TypeScript, Vite, AudioWorklet]
links:
  live: https://passagework.us
  source: https://github.com/mackfound/passagework
summary: TODO-COPY(project-passagework-summary)
detail: high-level       # research only: high-level | deep
pi_signoff: false        # research only
```

- **Body:** every project body uses the same headings: Problem · What I built · Stack · Result · Links. Each body section starts as `TODO-COPY(<slug>-<section>)`.
- **Projects index:** `/projects/` lists `current` first, then a "Past work" group for `status: past`.
- **Research guardrail:** a research entry with `detail: deep` **MUST** have `pi_signoff: true`, or `check-content.js` fails the build. Launch content is `detail: high-level` only.

**Seed entries.** Create these; Michael writes the copy.

| File | kind | status | Notes |
|---|---|---|---|
| `passagework.md` | project | current | Links and stack as above |
| `remote-attestation.md` | research | current | DSP lab, high-level only |
| `radiohound-fpga-workflow.md` | project | past | FPGA dev workflow, Python → synthesizable Verilog, Zynq-7000 validation |

### Writing: `src/writing/*.md`

These entries are metadata only, with no body. They render as external links.

```yaml
title: No Easy Path Upward
outlet: The Wall Street Journal
date: 2026-01-13
url: https://www.wsj.com/opinion/what-does-the-u-s-operation-in-venezuela-mean-6a297227
category: World
deck: <carry over verbatim from current site>
```

**Seed entries**, migrated from the current site. Decks are Michael's existing text; copy them verbatim from the live site.

| Title | Outlet | Date | URL |
|---|---|---|---|
| You Should Be Excited to Write | The Observer | 2026-01-29 | https://www.ndsmcobserver.com/article/2026/01/you-should-be-excited-to-write |
| No Easy Path Upward | The Wall Street Journal | 2026-01-13 | (above) |
| It's a Terrible Day, Thanks be to God | The Observer | 2025-11-07 | https://www.ndsmcobserver.com/article/2025/11/it-s-a-terrible-day-thanks-be-to-god |
| What Has 13 Years of Catholic Education Taught Me? | The Observer | 2025-10-03 | https://www.ndsmcobserver.com/article/2025/10/what-has-13-years-of-catholic-education-actually-taught-me |
| Our Crisis of Compassion | The Observer | 2025-09-19 | https://www.ndsmcobserver.com/article/2025/09/our-crisis-of-compassion |

### Notes: `src/notes/*.md`

```yaml
title: …
date: YYYY-MM-DD
summary: TODO-COPY(note-<slug>-summary)
draft: false
```

- Posts with `draft: true` are excluded from builds that deploy.
- The RSS feed is generated at `/notes/feed.xml` but not linked anywhere while `notes.show` is false.

### Pages

| Page | Contents |
|---|---|
| `/about/` | Bio `TODO-COPY(about-bio)`, plus the contact line: email and profile links from `site.json` |
| `/resume/` | Full resume as semantic HTML (`TODO-COPY(resume-*)` slots, structured from Michael's source), plus a link to the PDF at `/assets/media/michael-doyle-resume.pdf` |
| `/verify/` | Explanation `TODO-COPY(verify-explainer)`, the command walkthrough (Michael approves wording), a copyable `allowed_signers` line, the key fingerprint, and a link to the GitHub profile where the fingerprint is also published |
| `/404` | Short label-level message (Claude Code may write this) |

---

## 7. Copy rules

**Claude Code MAY write:** structural labels only. That covers navigation names, "All writing →", "Past work", date formats, the 404 line, button labels, `aria-label`s on purely structural elements, and the literal commands on `/verify/`.

**Claude Code MUST NOT write:** anything else. That includes the bio, project text, section intros, the positioning line, the verify explainer, meta descriptions, Open Graph descriptions, image alt text, and resume content.

**Placeholder format:** `TODO-COPY(slot-name)`. Slot names are unique and descriptive.

**Enforcement:**
- `check-copy.js` scans `src/` and `_site/` and lists every remaining slot.
- `deploy.sh` refuses to run if any slot remains.
- Local dev builds render placeholders visibly, highlighted, so they are easy to find.

**Meta tags:** every page has `<title>`, `<meta name="description">`, and Open Graph title, description, and URL. Descriptions are `TODO-COPY(meta-<page>)`.

---

## 8. Budgets and review gates

Michael's constraint is to be wary of how dynamic the site gets, because experience degrades as flashy features accumulate. Budgets are **review triggers, not design constraints**. Claude Code must not shrink or degrade a feature to squeeze under a budget. It stops and presents the decision.

| Budget | Limit | Measured as |
|---|---|---|
| JavaScript per page | ≤ 10 KB | Brotli-compressed bytes of all scripts the page loads, including inline |
| Fonts, site-wide | ≤ 120 KB | Sum of compressed WOFF2 files |
| CSS, site-wide | ≤ 20 KB | Brotli-compressed |
| HTML per page | ≤ 50 KB | Brotli-compressed |
| Images | No fixed cap | Every `<img>` has width/height, `loading="lazy"` below the fold, and modern formats where possible |

**Always flagged, regardless of size:**
- Any script or stylesheet from a third-party origin.
- Any JavaScript that runs on scroll, animates layout, or blocks first render.
- Any feature that does not work with JavaScript disabled.

**Exception process:**
- `check-budgets.js` fails with a clear report of what exceeded which budget.
- Approved overrides go in `budget-exceptions.json` as `{ "path": "…", "budget": "js", "limit": "…", "reason": "…", "approved": "YYYY-MM-DD" }`.
- Only Michael adds entries. Claude Code may draft an entry for him to review, but may never add one itself.

**Known future flag:** an in-browser "verify this page" feature using Web Crypto will likely exceed the JS budget, because of SSH signature parsing. It is post-launch backlog and requires review.

---

## 9. Signing and deploy pipeline

### Trust model

The signing key lives only on Michael's laptop. A valid signature proves that every byte served was approved by the holder of that key. It does **not** prove the site was built from the public source; reproducible builds are backlog. It cannot protect against a compromised laptop.

### Hard rules for Claude Code

- Claude Code **MUST NEVER** generate, read, print, copy, move, or otherwise handle the real private signing key. Key setup is a manual step for Michael (below).
- Tests that exercise signing generate a throwaway ed25519 key in a temp directory and delete it afterward.
- No page may contain its own hash or the manifest's hash. A page cannot include its own hash without changing the bytes being hashed. Footers carry the source commit SHA and the key fingerprint only.

### One-time manual setup (Michael)

1. Generate a dedicated key: `ssh-keygen -t ed25519 -f ~/.ssh/mdoyle_site -C "mdoyle-site signing"`, with a passphrase.
2. Back up the private key offline.
3. Publish the fingerprint (`ssh-keygen -lf ~/.ssh/mdoyle_site.pub`) on the GitHub profile, outside the site.
4. Put `michael namespaces="mdoyle-site" <public key line>` in the repo's `allowed_signers`, and the fingerprint in `site.json`.
5. Optionally, register the same key as a GitHub SSH signing key for commits. The namespace keeps site signatures and commit signatures from being interchangeable.
6. Cloudflare setup:
   - Create the Pages project from the CLI: `npx wrangler login`, then `npx wrangler pages project create <name> --production-branch main`. This makes an empty **Direct Upload** project and uploads nothing. Never upload through the dashboard: the first upload is `./deploy.sh`. As far as known, a Direct Upload project cannot later switch to Git integration; confirm in Cloudflare's docs before creating it.
   - Attach the custom domain.
   - In the zone, disable every feature that rewrites HTML in transit: email address obfuscation, automatic HTTPS rewrites, Rocket Loader, and Web Analytics auto-injection.
   - `verify-live.js` is the backstop for anything missed.

### Manifest format: `_site/manifest.txt`

```
# mdoyle-site manifest v1
# source <full commit sha>
<sha256 hex>  /index.html
<sha256 hex>  /projects/passagework/index.html
…
```

- Lists every served file in `_site/` except `manifest.txt`, `manifest.txt.sig`, and Cloudflare config files that are not served (`_headers`, `_redirects`).
- Paths are sorted bytewise, with LF line endings and UTF-8 encoding, so the same `_site/` always yields an identical manifest.

### `deploy.sh`: the only way to publish

Each step aborts the deploy on failure.

1. **Preflight:** the git tree is clean and on the main branch; `npm test` passes; `check-copy.js` finds zero `TODO-COPY`; `check-budgets.js` passes (with approved exceptions).
2. **Edition:** run `scripts/edition.js`. If `edition.json` changed, commit it (`edition: No. N`).
3. **Build:** `npx @11ty/eleventy` into a clean `_site/`.
4. **Manifest:** run `scripts/manifest.js`.
5. **Sign:** `ssh-keygen -Y sign -f ~/.ssh/mdoyle_site -n mdoyle-site _site/manifest.txt`. This step prompts for the passphrase.
6. **Verify locally:** `ssh-keygen -Y verify -f allowed_signers -I michael -n mdoyle-site -s _site/manifest.txt.sig < _site/manifest.txt`.
7. **Deploy:** `npx wrangler pages deploy _site --project-name <name>`.
8. **Verify live:** `scripts/verify-live.js`.
   - Fetches every manifest path from `https://DOMAIN` and maps `/x/index.html` → `/x/` and `/index.html` → `/`, following Pages' canonical-URL redirects.
   - Hashes the decoded body bytes and compares each to the manifest.
   - Exits non-zero with a list of any mismatched URLs.
9. **Push:** push the commits to GitHub.

`check-copy.js --strict` also runs on the built site after step 3, because the meta-description slots exist only in output. A real deploy refuses while `PAGES_PROJECT` (top of `deploy.sh`) is empty.

**Dry run** (`npm run deploy:dry-run`, approved at P4): makes a throwaway key and runs `deploy.sh --dry-run --key <tmp> --signers <tmp>`.
- Not being on `main` and remaining `TODO-COPY` slots are warnings; a dirty tree and a failing `npm test` still abort.
- `edition.json` is bumped for the build and restored afterwards; nothing is committed.
- Steps 7 and 9 are skipped.
- Step 8 runs `verify-live.js --local _site` against a local server that resolves URLs the way Pages does.

### Footer attestation line

`build <short commit sha> · signed <key fingerprint, shortened> · verify →`

Set in monospace with tabular figures. It links to `/verify/`.

---

## 10. Testing and guardrails

`npm test` runs all of the following. All must pass before any phase's review gate.

| Check | What it enforces |
|---|---|
| `check-content.js` | Front matter schemas for every collection and `sections.json`; the research `deep` → `pi_signoff` rule |
| `check-copy.js` | Lists remaining `TODO-COPY` slots (warns in dev, fails in deploy) |
| `check-budgets.js` | Section 8 budgets and the always-flag list |
| `check-determinism.sh` | Builds twice into separate directories; the outputs must be byte-identical |
| Manifest round-trip | Test key → manifest → sign → verify succeeds; mutating one byte makes verification fail |
| Internal links | Every internal `href` resolves to a file in `_site/` |
| No third-party origins | No `src`/`href` in `_site/` points to an external origin for scripts, styles, fonts, or images (external content links are fine) |
| Basic accessibility | `lang` set, one `h1` per page, every `<img>` has an `alt` attribute (alt text itself is copy), and contrast tokens meet AA |

**Determinism rules:**
- No timestamps, random IDs, or environment-dependent values in output.
- Dates come from content front matter or `edition.json`.
- The commit SHA comes from `git rev-parse HEAD`.

---

## 11. Phases and review gates

Each phase ends with a review gate. Claude Code stops, summarizes what was built, and waits for Michael's approval.

| Phase | Scope | Review gate |
|---|---|---|
| **P0 — Scaffold** | Repo, pinned toolchain, Eleventy config, folder structure, `npm test` harness with empty or passing checks | Michael confirms the structure and that templates read as plain HTML |
| **P1 — Content model** | Collections, `sections.json`, the generic section renderer, seed entries with `TODO-COPY` slots, all checks except budgets, unstyled pages | Adding a test section via one folder plus one config line works end to end |
| **P2 — Edition design** | Typography, masthead, dateline, Late Edition, color tokens, front-page layout, phone and desktop layouts | Screenshots of the front page and one project page at 375px and 1280px, light and dark. **Design review: no further styling until approved** |
| **P3 — Pages** | Projects index and detail, writing index, about plus contact, resume (HTML structure), verify, 404, RSS | Every launch page renders, and all checks pass apart from copy |
| **P4 — Signing pipeline** | `manifest.js`, `edition.js`, `verify-live.js`, `deploy.sh`, round-trip tests with a throwaway key | `deploy.sh` dry run (`--dry-run` skips Wrangler and push) succeeds end to end with a test key |
| **P5 — Infrastructure (manual, Michael)** | Key setup, domain purchase, Cloudflare project, zone settings, `site.json` real values | Infrastructure in place, and `./deploy.sh --dry-run` passes with the real key and the repo's `allowed_signers` |
| **P6 — Copy and launch** | Michael fills every `TODO-COPY` slot | First signed deploy to the live domain with `verify-live.js` clean, then the launch checklist (section 13) is complete |

---

## 12. Stop-and-ask triggers

Claude Code **MUST stop and ask** before:

- Adding any dependency not listed in section 4.
- Exceeding or approaching any budget in section 8, or adding anything on the always-flag list.
- Writing any text outside the allowed-label list in section 7.
- Touching anything involving the real signing key, Cloudflare account settings, DNS, or the domain registrar.
- Changing the content schema, `sections.json` structure, manifest format, or determinism rules.
- Deviating from the design direction in section 3, or introducing anything from the "AI website" list in section 2.
- Deleting or renaming existing content files.
- Starting the next phase before the current review gate is cleared.

---

## 13. Launch checklist

- [ ] Launch pages exist and render: front page, `/projects/` (plus details), `/writing/`, `/about/` (with contact), `/resume/` (HTML plus PDF), `/verify/`, `/404`.
- [ ] Zero `TODO-COPY` slots remain.
- [ ] `npm test` passes; `check-determinism.sh` is byte-identical.
- [ ] Front page passes the ten-second test on a real phone.
- [ ] Both themes are checked on a real phone and a laptop, including the Late Edition dateline.
- [ ] Key fingerprint is on the GitHub profile and matches `site.json` and `allowed_signers`.
- [ ] `deploy.sh` completes; `verify-live.js` is clean on every URL.
- [ ] Manual verification from a second machine following `/verify/` exactly as written succeeds.
- [ ] HTML-rewriting zone features are confirmed off.
- [ ] Old site at `mdoyle.pages.dev` updated to point to `https://DOMAIN` (redirect or notice).
- [ ] Resume PDF and LinkedIn/GitHub profiles updated to the new domain.

---

## 14. Post-launch backlog

These are not in launch scope. Each needs its own review.

- **Notes:** the first post, then flip `notes.show` to `true`.
- **In-browser verification:** a Web Crypto "verify this page" button. Expect a budget flag.
- **Footer verification disclosure:** an info icon on the footer attestation line that opens Michael's explanation, `TODO-COPY(footer-attestation-explainer)`: what the line is, what it does, and why it's there. Alongside it, all the verification details: the full commit SHA, the full key fingerprint, links to `manifest.txt` and `manifest.txt.sig`, and the `/verify/` commands. It should work with JavaScript disabled (e.g. a native `<details>`/`<summary>` disclosure, no script), so it adds nothing to the JS budget. Open question for its review: does it replace the `/verify/` link or sit beside it? It also covers explaining how to check pages other than the front page (raised at the P3 gate).
- **Reproducible builds:** publish build instructions so anyone can rebuild from source and match the manifest. Determinism is already enforced, so this is mostly documentation plus a CI rebuild check.
- **Commit signing:** sign git commits with the same key under the `git` namespace.
- **Deeper research write-up:** only with `pi_signoff: true`.
- **Newsletter:** a separate, non-professional identity, out of scope for this repo.

---

## 15. Open items (Michael)

- [ ] Domain name (replace `DOMAIN` everywhere).
- [ ] Resume source content for the HTML resume page. Pending upload: `/resume/` is a generic skeleton until then, and `TODO-COPY(resume-pdf)` blocks deploy until the PDF is committed.
- [ ] Any projects beyond the three seed entries.
- [ ] Positioning line for the front page.
- [ ] Cloudflare Pages project name.
