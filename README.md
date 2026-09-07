# SOLV — Filter & Sort Prototype

A runnable prototype of SOLV's B2B commerce app, built to demonstrate **filter and sort**, which the product doesn't have today. The designs existed in Figma but nothing was clickable, so filter behaviour couldn't be evaluated. This makes it real: 1,070 seeded products behind a working faceted-search engine and the designed UI.

**Live:** https://filterprototype.vercel.app — **password-protected**. Leave the
username blank; the password is the `SITE_PASSWORD` env var on Vercel and is
never in the repo. Localhost is never gated — `proxy.ts` keys off `VERCEL`.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # filter engine unit tests
npm run build    # production build; also typechecks
npx eslint .     # lint (from the repo root)
```

## The four variants, and the journey

Four variants over one catalog. A and B walk Home → **search for `shirt`** → PLP → filter and sort; C and D drop you straight inside a product vertical.

| | Home | PLP | Controls |
|---|---|---|---|
| **Variant A** | `/` | `/results?q=shirt` | Filters · Sort in a floating pill at the bottom |
| **Variant B** | `/b` | `/b/results?q=shirt` | The same two as chips at the top, no bottom bar |
| **Variant C** | — | `/c` | The same pill, already inside one vertical |
| **Variant D** | — | `/d` | Top chips, already inside one vertical |

A and B start across every category; C and D start *inside* one, so there is no Category control at all. Together they make a 2×2 of that against control placement. `/c` and `/d` are the listing itself — other seller/vertical pairs are at `/c/seller/[sellerId]/[categoryId]`.

**`/userjourney` is a fifth route and outside the 2×2** — one buyer's named flow (Home → *Kartik exporters* banner → storefront → filter → detail), built 1:1 from screengrabs of the live app rather than from Figma, over its own catalog of 540 tees. It is where controls get tried first: the Filters bottom sheet, the typed min/max on every range facet, and the offer magnitudes all live there and not in A–D.

Card, catalog, engine and sheets are shared — one `PlpScreen` throughout — so within a row of the 2×2 a preference is about control placement, and within a column it is about starting scope. Switch by editing the URL. A and B are closed loops: hand someone `/b` and the whole journey stays in B.

## Where the documentation lives

Four files, one job each, and they are the source of truth rather than something to re-derive. The deepest reasoning is in the code comments beside the thing they describe — these files run 30–77% comment, and that copy is the one that can't drift from what it documents.

- **`CLAUDE.md`** / **`AGENTS.md`** — rules and traps only, loaded into every AI session: the Figma node map, the route table, and what must not be broken.
- **`plan.md`** — the architecture narrative: the filter engine's load-bearing rules, the catalog's shape, the panels.
- **`docs/decisions.md`** — the long-form record: every call, why it was made, and what was rejected. Read before reversing anything.
- **`progress_tracker.md`** — the chronology, what's been verified, the UX backlog, and the open questions for the designer.

## Two things to know before changing anything

**Designs come from Figma, never from eyeballing.** File `hdArN93DmnLu5JDB46SOwd`, pulled through the Figma MCP. `CLAUDE.md` maps every screen to its node. Guessing at a spec that has a frame wastes a round trip — and the frames disagree with intuition more often than not.

**Determinism is load-bearing.** The catalog comes from a fixed-seed PRNG, so facet counts must be identical between reloads and between server and client. A change that makes generation non-deterministic breaks hydration and makes the demo look broken.

## Deploying

Source: **https://github.com/momoNoSauce/filter_prototype** (private, transferred
from `cheeseKracker` on 2026-08-25 — the old path still redirects).

GitHub and Vercel are **not connected**, so a push deploys nothing and a deploy commits nothing. Both have to be run:

```bash
git push origin main
npx vercel --prod --scope bitihotra-karaks-projects
```

**The `--scope` is not optional** — the project belongs to the team, so a bare
`vercel --prod` fails with `Not authorized` even when `vercel whoami` says you
are logged in, which reads as an expired session and isn't one.

Connecting the repo in the Vercel project's Git settings would collapse this to one step; it's browser-only.

### If a deploy hangs with no output, it is blocked, not slow

Vercel reads the **HEAD commit's author email** and refuses to build when that
address isn't on the Vercel team. Nothing in the CLI says so: `vercel ls` reports
`UNKNOWN` with no duration, `inspect` shows `Builds: . [0ms]`, `inspect --logs`
prints nothing, and the deployment URL answers 302 like a healthy one — that is
the password gate replying, not the app. Only the dashboard, or the API, carries
the sentence:

```bash
TOKEN=$(python3 -c "import json;print(json.load(open('$HOME/Library/Application Support/com.vercel.cli/auth.json'))['token'])")
curl -s -H "Authorization: Bearer $TOKEN" \
  "https://api.vercel.com/v13/deployments/<dpl_id>?teamId=team_7RaExFdsAbYFb54kXtQVYw3h" \
  | python3 -m json.tool | grep -iE "readyState|Reason|block"
```

`git config user.email` must stay `m23ldx002@iitj.ac.in` until an address on the
`momoNoSauce` account is added to the Vercel team. See `CLAUDE.md`.
