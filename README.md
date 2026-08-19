# SOLV — Filter & Sort Prototype

A runnable prototype of SOLV's B2B commerce app, built to demonstrate **filter and sort**, which the product doesn't have today. The designs existed in Figma but nothing was clickable, so filter behaviour couldn't be evaluated. This makes it real: 1,070 seeded products behind a working faceted-search engine and the designed UI.

**Live:** https://filterprototype.vercel.app — public, no login.

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # filter engine unit tests
npm run build    # production build; also typechecks
npx eslint .     # lint (from the repo root)
```

## The two variants

Home → tap *Baheti Garments* → PLP → filter and sort. Two control layouts over that one journey:

| | Home | PLP | Controls |
|---|---|---|---|
| **Variant A** | `/` | `/seller/baheti` | Sort · Filters pinned to the bottom |
| **Variant B** | `/b` | `/b/seller/baheti` | The same two as chips at the top, no bottom bar |

Card, catalog, engine and sheets are shared — one `PlpScreen` with a `variant` prop. Only the controls differ, so a preference between them is about control placement. Switch by editing the URL; each variant is a closed loop and neither inherits the other's state.

## Where the documentation lives

Three files, and they are the source of truth rather than something to re-derive:

- **`plan.md`** — architecture, the filter engine's one load-bearing rule, the catalog's shape, and every decision taken where the designs were silent.
- **`progress_tracker.md`** — current state, what's been verified, the UX backlog, and the open questions for the designer.
- **`CLAUDE.md`** / **`AGENTS.md`** — conventions for anyone (or anything) writing code here: the Figma node map, which decisions are settled, and the traps.

## Two things to know before changing anything

**Designs come from Figma, never from eyeballing.** File `hdArN93DmnLu5JDB46SOwd`, pulled through the Figma MCP. `CLAUDE.md` maps every screen to its node. Guessing at a spec that has a frame wastes a round trip — and the frames disagree with intuition more often than not.

**Determinism is load-bearing.** The catalog comes from a fixed-seed PRNG, so facet counts must be identical between reloads and between server and client. A change that makes generation non-deterministic breaks hydration and makes the demo look broken.

## Deploying

GitHub and Vercel are **not connected**, so a push deploys nothing and a deploy commits nothing. Both have to be run:

```bash
git push origin main
npx vercel --prod
```

Connecting the repo in the Vercel project's Git settings would collapse this to one step; it's browser-only.
