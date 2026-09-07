import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 });
await p.goto('http://localhost:3007/userjourney/seller/kartik', { waitUntil: 'networkidle' });
await p.addStyleTag({ content: 'nextjs-portal{display:none !important}' });
await p.waitForTimeout(400);

const strip = await p.evaluate(() => {
  const out = [];
  document.querySelectorAll('button, [role="button"]').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top > 50 && r.top < 130 && r.height > 30 && r.height < 50) {
      out.push({ t: el.innerText.trim().replace(/\n/g,' '), x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) });
    }
  });
  return out;
});

// open filters
await p.getByRole('button', { name: /^\d*\s*Filter$/ }).click();
await p.waitForTimeout(600);
// click Category rail row
await p.getByRole('button', { name: 'Category', exact: true }).click();
await p.waitForTimeout(300);
// tick Women's T-Shirts
await p.getByRole('button', { name: /Women's T-Shirts \(\d+\)/ }).click();
await p.waitForTimeout(500);

const state = await p.evaluate(() => {
  const R = el => { const r = el.getBoundingClientRect(); return { x:+r.x.toFixed(2), y:+r.y.toFixed(2), w:+r.width.toFixed(2), h:+r.height.toFixed(2) }; };
  const res = { rail: [], panel: [], footer: [], sheet: null, railBox: null, panelBox: null };
  // rail = container with w 140
  const all = [...document.querySelectorAll('div,button,span')];
  const railC = all.find(e => e.className && typeof e.className === 'string' && e.className.includes('w-[140px]'));
  if (railC) {
    res.railBox = R(railC);
    [...railC.children].forEach(ch => {
      const label = ch.querySelector('span');
      const badge = [...ch.querySelectorAll('span')].find(s => s.className.includes('min-w-[18px]'));
      const lr = label ? R(label) : null;
      res.rail.push({ t: ch.innerText.trim().replace(/\n/g,'\\n'), box: R(ch),
        labelBox: lr, labelLines: label ? Math.round(lr.h / 18) : 0,
        badge: badge ? { t: badge.innerText.trim(), ...R(badge) } : null });
    });
    const panelC = railC.nextElementSibling;
    if (panelC) {
      res.panelBox = R(panelC);
      [...panelC.children].forEach(ch => {
        const o = { tag: ch.tagName, t: ch.innerText.trim().replace(/\n/g,'\\n'), box: R(ch) };
        const cb = ch.querySelector('span'); const img = ch.querySelector('img'); const spans=[...ch.querySelectorAll(':scope > span')];
        if (spans.length) o.parts = spans.map(s => ({ cls: s.className.slice(0,60), ...R(s), t: s.innerText.trim().replace(/\n/g,'\\n') }));
        if (img) o.img = { src: img.getAttribute('src'), ...R(img) };
        res.panel.push(o);
      });
    }
  }
  const showBtn = [...document.querySelectorAll('button')].find(e => /^Show /.test(e.innerText.trim()));
  if (showBtn) res.footer.push({ t: showBtn.innerText.trim(), ...R(showBtn) });
  const clr = [...document.querySelectorAll('button')].find(e => /Clear Filters/.test(e.innerText.trim()));
  if (clr) res.footer.push({ t: clr.innerText.trim(), ...R(clr) });
  return res;
});

console.log(JSON.stringify({ strip, state }, null, 1));
await p.screenshot({ path: '/private/tmp/claude-501/-Users-jumbotail-Desktop-filter-prototype/a0e202e6-682d-426a-b140-4fc5ab028b4c/scratchpad/live03.png' });
await b.close();
