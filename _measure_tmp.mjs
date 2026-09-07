import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:3007/userjourney/seller/kartik', { waitUntil: 'networkidle' });
await p.addStyleTag({ content: 'nextjs-portal{display:none !important}' });
const rects = async (sel) => p.$$eval(sel, els => els.map(e => {
  const r = e.getBoundingClientRect();
  const cs = getComputedStyle(e);
  return { t: (e.innerText||'').replace(/\n/g,'\\n').slice(0,60), x:+r.x.toFixed(1), y:+r.y.toFixed(1), w:+r.width.toFixed(1), h:+r.height.toFixed(1),
    tag: e.tagName, cls: e.className.toString().slice(0,120), fs: cs.fontSize, fw: cs.fontWeight, ff: cs.fontFamily.split(',')[0], col: cs.color, bg: cs.backgroundColor, br: cs.borderRadius, bd: cs.border, pad: cs.padding };
}));
const out = {};
out.stripBefore = await rects('button, [role=button]');
// open filters
await p.getByRole('button', { name: /Filter/ }).first().click();
await p.waitForTimeout(500);
out.sheet = await rects('[class*=fixed][class*=bottom], [role=dialog]');
out.railRows = await rects('aside button, [class*=rail] button');
out.allBtns = await rects('button');
out.inputs = await rects('input');
out.divs = await p.$$eval('*', els => els.filter(e => {
  const r = e.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.y > 200 && r.x >= 130 && r.x < 360;
}).slice(0, 200).map(e => {
  const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
  return { t: (e.innerText||'').replace(/\n/g,'|').slice(0,40), tag: e.tagName, cls: e.className.toString().slice(0,90), x:+r.x.toFixed(1), y:+r.y.toFixed(1), w:+r.width.toFixed(1), h:+r.height.toFixed(1), fs: cs.fontSize, fw: cs.fontWeight, br: cs.borderRadius, bd: cs.borderColor+' '+cs.borderWidth, pad: cs.padding, gap: cs.gap };
}));
await p.screenshot({ path: '/private/tmp/claude-501/-Users-jumbotail-Desktop-filter-prototype/a0e202e6-682d-426a-b140-4fc5ab028b4c/scratchpad/mine/live-price.png' });
console.log(JSON.stringify(out, null, 1));
await b.close();
