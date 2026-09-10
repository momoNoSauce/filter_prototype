/**
 * The line art on `/pvfilters`' style-filter buttons, keyed by facet id.
 *
 * **Supplied 2026-09-10, not exported from Figma** — the frames have never
 * drawn these buttons, so the art comes from outside and lives in
 * `public/style/` rather than `public/figma/`, which is for exact Figma
 * exports and should stay that way. Same reasoning as `public/categories/`.
 *
 * Each is one `currentColor` path on a 2048 viewBox, which is why they go
 * through `MaskIcon`: an `<img>` renders a `currentColor` SVG in whatever the
 * file's own context resolves to, and the button needs them in a token.
 *
 * **Pattern has no icon yet.** A facet missing from this map keeps the grey
 * placeholder box, so a sixth file dropped into `public/style/` and one line
 * here is all it takes — nothing else needs to know.
 */
export const STYLE_FACET_ICONS: Record<string, string> = {
  size: "/style/size.svg",
  fit: "/style/fit.svg",
  neck: "/style/neck.svg",
  sleeve: "/style/sleeve.svg",
  closure: "/style/closure.svg",
};
