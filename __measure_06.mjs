import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newContext({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 }).then(c => c.newPage());
const hide = async () => p.addStyleTag({ content: 'nextjs-portal{display:none !important}' });

const box = async (sel, root) => p.evaluate(([s, r]) => {
  const scope = r ? document.querySelector(r) : document;
  const el = scope && scope.querySelector(s);
  if (!el) return null;
  const b = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return { x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2),
    bg: cs.backgroundColor, color: cs.color, bc: cs.borderColor, bw: cs.borderWidth, br: cs.borderRadius,
    op: cs.opacity, fw: cs.fontWeight, fs: cs.fontSize, pad: cs.padding, gap: cs.gap, text: el.textContent };
}, [sel, root || null]);

// ---------- 1. plain listing: strip chips ----------
await p.goto('http://localhost:3007/userjourney/seller/kartik', { waitUntil: 'networkidle' });
await hide();
const strip = await p.evaluate(() => {
  const btns = [...document.querySelectorAll('button')].filter(el => {
    const b = el.getBoundingClientRect();
    return b.height > 30 && b.height < 50 && b.y > 56 && b.y < 130;
  });
  return btns.map(el => {
    const b = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    const glyph = el.querySelector('img,svg,span[style*="mask"],div');
    const gb = glyph && glyph.getBoundingClientRect();
    const label = [...el.querySelectorAll('*')].find(n => n.children.length === 0 && n.textContent.trim());
    const lcs = label && getComputedStyle(label);
    const lb = label && label.getBoundingClientRect();
    return { text: el.textContent.trim(),
      x: +b.x.toFixed(2), y: +b.y.toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2),
      bg: cs.backgroundColor, bc: cs.borderColor, bw: cs.borderWidth, br: cs.borderRadius,
      pad: cs.padding, gap: cs.gap,
      glyph: gb && { tag: glyph.tagName, cls: glyph.className && String(glyph.className).slice(0,60), x:+gb.x.toFixed(2), y:+gb.y.toFixed(2), w:+gb.width.toFixed(2), h:+gb.height.toFixed(2) },
      label: lb && { t: label.textContent, x:+lb.x.toFixed(2), y:+lb.y.toFixed(2), w:+lb.width.toFixed(2), h:+lb.height.toFixed(2), color: lcs.color, op: lcs.opacity, fw: lcs.fontWeight, fs: lcs.fontSize, ff: lcs.fontFamily.slice(0,30) } };
  });
});
// divider
const divider = await p.evaluate(() => {
  const ds = [...document.querySelectorAll('div,span')].filter(el => { const b = el.getBoundingClientRect(); return b.width <= 2 && b.height > 20 && b.height < 40 && b.y > 56 && b.y < 130; });
  return ds.map(el => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { x:+b.x.toFixed(2), y:+b.y.toFixed(2), w:+b.width.toFixed(2), h:+b.height.toFixed(2), bg: cs.backgroundColor }; });
});

// ---------- 2. category applied, filters open, Size selected ----------
await p.goto('http://localhost:3007/userjourney/seller/kartik?category=womens-t-shirts', { waitUntil: 'networkidle' });
await hide();
const stripApplied = await p.evaluate(() => {
  const btns = [...document.querySelectorAll('button')].filter(el => { const b = el.getBoundingClientRect(); return b.height > 30 && b.height < 50 && b.y > 56 && b.y < 130; });
  return btns.slice(0,3).map(el => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    const kids = [...el.children].map(k => { const kb = k.getBoundingClientRect(); const kcs = getComputedStyle(k);
      return { tag: k.tagName, t: k.textContent, x:+kb.x.toFixed(2), y:+kb.y.toFixed(2), w:+kb.width.toFixed(2), h:+kb.height.toFixed(2), bg: kcs.backgroundColor, br: kcs.borderRadius, color: kcs.color, fw: kcs.fontWeight, fs: kcs.fontSize, op: kcs.opacity }; });
    return { text: el.textContent.trim(), x:+b.x.toFixed(2), w:+b.width.toFixed(2), bg: cs.backgroundColor, bc: cs.borderColor, kids }; });
});

await p.getByRole('button', { name: /Filter/ }).first().click();
await p.waitForTimeout(600);
await hide();
await p.getByRole('button', { name: /^Size$/ }).click();
await p.waitForTimeout(400);

const sheet = await p.evaluate(() => {
  const out = {};
  // rail: find the scrollable column of facet buttons
  const btns = [...document.querySelectorAll('button')].filter(el => { const b = el.getBoundingClientRect(); return b.x < 5 && b.width > 100 && b.width < 200 && b.height > 50 && b.height < 70; });
  out.railRows = btns.map(el => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    const badge = [...el.querySelectorAll('*')].find(n => /^\d+$/.test(n.textContent.trim()) && n.getBoundingClientRect().width < 40);
    const bb = badge && badge.getBoundingClientRect(); const bcs = badge && getComputedStyle(badge);
    const lbl = [...el.querySelectorAll('*')].find(n => n.children.length === 0 && n.textContent.trim() && !/^\d+$/.test(n.textContent.trim()));
    const lb = lbl && lbl.getBoundingClientRect(); const lcs = lbl && getComputedStyle(lbl);
    return { t: el.textContent.trim(), x:+b.x.toFixed(2), y:+b.y.toFixed(2), w:+b.width.toFixed(2), h:+b.height.toFixed(2),
      bg: cs.backgroundColor, pad: cs.padding, gap: cs.gap, borderR: cs.borderRightWidth + ' ' + cs.borderRightColor, borderT: cs.borderTopWidth + ' ' + cs.borderTopColor,
      label: lb && { t: lbl.textContent, x:+lb.x.toFixed(2), w:+lb.width.toFixed(2), color: lcs.color, fw: lcs.fontWeight, fs: lcs.fontSize, lh: lcs.lineHeight },
      badge: bb && { t: badge.textContent, x:+bb.x.toFixed(2), y:+bb.y.toFixed(2), w:+bb.width.toFixed(2), h:+bb.height.toFixed(2), bg: bcs.backgroundColor, color: bcs.color, fw: bcs.fontWeight, fs: bcs.fontSize, br: bcs.borderRadius, minW: bcs.minWidth } }; });
  // rail container = parent of first row
  if (btns[0]) { const rc = btns[0].parentElement; const b = rc.getBoundingClientRect(); const cs = getComputedStyle(rc);
    out.rail = { x:+b.x.toFixed(2), y:+b.y.toFixed(2), w:+b.width.toFixed(2), h:+b.height.toFixed(2), bg: cs.backgroundColor, scrollTop: rc.scrollTop, scrollH: rc.scrollHeight, cls: String(rc.className).slice(0,80) };
    const outer = rc.parentElement; const ob = outer.getBoundingClientRect();
    out.railOuter = { x:+ob.x.toFixed(2), y:+ob.y.toFixed(2), w:+ob.width.toFixed(2), h:+ob.height.toFixed(2), scrollTop: outer.scrollTop, scrollH: outer.scrollHeight, cls: String(outer.className).slice(0,80) };
  }
  // panel: option rows with checkboxes
  const opts = [...document.querySelectorAll('label,button')].filter(el => { const b = el.getBoundingClientRect(); return b.x > 100 && b.width > 150 && b.height > 40 && b.height < 70; });
  out.options = opts.slice(0, 9).map(el => { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    const cb = el.querySelector('span,div'); const cbb = cb && cb.getBoundingClientRect();
    return { t: el.textContent.trim(), x:+b.x.toFixed(2), y:+b.y.toFixed(2), w:+b.width.toFixed(2), h:+b.height.toFixed(2), pad: cs.padding, gap: cs.gap, box: cbb && { x:+cbb.x.toFixed(2), y:+cbb.y.toFixed(2), w:+cbb.width.toFixed(2), h:+cbb.height.toFixed(2) } }; });
  if (opts[0]) { const pc = opts[0].parentElement; const b = pc.getBoundingClientRect(); out.panel = { x:+b.x.toFixed(2), y:+b.y.toFixed(2), w:+b.width.toFixed(2), h:+b.height.toFixed(2), cls: String(pc.className).slice(0,80) }; }
  const showBtn = [...document.querySelectorAll('button')].find(el => /Show \d+ results/.test(el.textContent));
  out.show = showBtn && showBtn.textContent.trim();
  return out;
});
await p.screenshot({ path: '/private/tmp/claude-501/-Users-jumbotail-Desktop-filter-prototype/a0e202e6-682d-426a-b140-4fc5ab028b4c/scratchpad/mine/live-06.png' });
console.log(JSON.stringify({ strip, divider, stripApplied, sheet }, null, 1));
await b.close();
