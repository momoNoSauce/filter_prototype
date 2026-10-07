# SOLV — Filter & Sort Prototype

A clickable Next.js prototype of filter and sort for SOLV's B2B commerce app. It
runs the Figma designs against a seeded catalog of 1,070 products, plus a
separate 540-product storefront catalog, using a client-side filter engine.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # vitest — engine, seed, Kartik catalog, panel fit
npm run build    # production build + typecheck
npx eslint .     # lint, from the repo root
```

No environment variables are needed locally.

## Routes

### The 2×2 — main catalog (1,070 products)

| Variant | Home | Listing | Controls | Starts |
|---|---|---|---|---|
| **A** | `/` | `/results?q=shirt` | Filter · Sort in a floating pill at the bottom | All categories |
| **B** | `/b` | `/b/results?q=shirt` | Filter · Sort as chips under the app bar | All categories |
| **C** | — | `/c` | Floating pill | Inside one category |
| **D** | — | `/d` | Top chips | Inside one category |

- A and B: Home → tap the search bar → type `shirt` → tap a suggestion.
- C and D open straight on a listing. Other seller/category pairs are at
  `/c/seller/[sellerId]/[categoryId]` and `/d/seller/[sellerId]/[categoryId]`.
- `/seller/[sellerId]` and `/b/seller/[sellerId]` are seller listings.
- Each variant stays in its own route tree: links from `/b` stay under `/b`.

### Kartik storefront — separate catalog (540 tees)

| Route | What it shows |
|---|---|
| `/userjourney` | Redirects to `/userjourney/seller/kartik`. Filters sheet with a flat rail: 7 rows, no style filters. |
| `/pvfilters` | Same listing plus a **Find It Fast** block: choose a category, then style buttons that open the matching filter panel. |
| `/pvfilters2` | Same listing. The Filters sheet ends with a locked **More Filters** row. Picking a category unlocks six style filters under a "More Filters" heading. **This is the version going forward.** |

Every listing has a product detail page at `{base}/product/[productId]`.

## Demo scripts

**Variant A — filter and sort**

1. `/` → search bar → type `shirt` → tap the first suggestion → 1,070 results.
2. Filters → Category → tick *Men's Casual Shirts* and *Men's Casual T-Shirts*
   → footer reads *Show 416 results* → apply. The Filter control shows **2**.
3. Filters → Seller → tick *Grasim Fabrics* and *Gagan Garments Ltd.* → apply →
   202 results.
4. Sort → *Highest Margin on MRP* → the order changes and Sort shows a dot.
5. Filters → **Clear Filters** → back to 1,070, URL cleared, toast
   `All filters cleared`.

The URL tracks every step and the back button unwinds it.

**Variant B — facet pruning:** Filters → Gender → *Girls* → Category → only
*Girl's T-Shirts* (108) remains.

**Brand pruning (any variant):** Category → *Boy's Casual T-Shirts* (107) →
Filters → Brands → two brands remain: Killer and Monte Carlo.

**`/pvfilters2` — gated style filters**

1. Open Filters. The rail reads Price Range · Margin on MRP · MOQ · Cashback ·
   Seller Offer · SOLV Target Scheme · Category · More Filters 🔒.
2. Tap **More Filters** and pick a category in its panel. The rail scrolls up
   and Size, Fit, Neck Type, Sleeve Type, Pattern and Closure Type appear under
   a grey "More Filters" heading.

## Project layout

```
app/          routes (one folder per variant / storefront)
components/   PlpScreen, FilterScreen, sheets, cards, UI primitives
lib/catalog/  seeded catalogs (seed.ts, kartik.ts), product images, search
lib/filters/  filter engine, facet registry, rails, URL state, panel fit
public/       Figma exports, category photos, product art, style icons
proxy.ts      password gate for the Vercel deployment
```

## Docs

| File | Contents |
|---|---|
| `CLAUDE.md` | Rules for working in this repo: routes, invariants, design source, deploy |
| `docs/architecture.md` | How the engine, facets, rails, catalog and state work |
| `docs/backlog.md` | Open UX issues and open design questions |

## Deploy

- Vercel project `momonosauce/filter-prototype`, connected to this repo.
  **A push to `main` deploys.**
- Live at https://filter-prototype-sandy.vercel.app. It's password-protected:
  leave the username blank and enter the password from the `SITE_PASSWORD`
  Vercel env var.
- `proxy.ts` applies HTTP Basic Auth only when `VERCEL` is set, so localhost is
  never gated. With no `SITE_PASSWORD` set, the deployment returns 503.
- Vercel builds only commits authored by the project owner's GitHub account.
  See `CLAUDE.md` → *Deploy*.
