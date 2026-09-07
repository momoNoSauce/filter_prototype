import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 });
await p.goto('http://localhost:3007/userjourney/seller/kartik', { waitUntil: 'networkidle' });
await p.addStyleTag({ content: 'nextjs-portal{display:none !important}' });
await p.waitForTimeout(400);

const out = {};

// chip strip before opening
out.chips = await p.evaluate(() => {
  const res = [];
  document.querySelectorAll('button, div').forEach(() => {});
  return res;
});

// Open Sort
await p.getByRole('button', { name: /^Sort/ }).click();
await p.waitForTimeout(700);

out.sheet = await p.evaluate(() => {
  const dump = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      x: +r.x.toFixed(2), y: +r.y.toFixed(2), w: +r.width.toFixed(2), h: +r.height.toFixed(2),
      font: `${cs.fontFamily.split(',')[0]} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight}`,
      color: cs.color, bg: cs.backgroundColor, radius: cs.borderRadius,
      pad: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
      gap: cs.gap, shadow: cs.filter !== 'none' ? cs.filter : cs.boxShadow,
      text: (el.textContent||'').slice(0,60),
    };
  };
  const sheet = document.querySelector('[data-sheet]');
  const scrim = document.querySelector('.z-40 > button');
  const header = sheet.children[0];
  const title = header.querySelector('p');
  const closeBtn = header.querySelector('button');
  const closeImg = closeBtn.querySelector('img');
  const list = sheet.children[1];
  const rows = [...list.querySelectorAll(':scope > button')];
  const divs = [...list.querySelectorAll(':scope > div')];
  return {
    scrimBg: scrim ? getComputedStyle(scrim).backgroundColor : null,
    sheet: dump(sheet),
    header: dump(header),
    title: dump(title),
    closeBtn: dump(closeBtn),
    closeImg: closeImg ? { src: closeImg.getAttribute('src'), ...dump(closeImg) } : null,
    list: dump(list),
    rows: rows.map(r => {
      const spans = [...r.querySelectorAll('span')];
      const iconWrap = spans.find(s => getComputedStyle(s).width === '24px');
      const labelEl = spans[spans.length-1];
      const check = r.querySelector('img');
      const mask = r.querySelector('[style*="mask"], span > span > *');
      return {
        row: dump(r),
        inner: dump(spans[0]),
        iconWrap: dump(iconWrap),
        iconInner: iconWrap ? { html: iconWrap.innerHTML.slice(0,300), ...dump(iconWrap.firstElementChild) } : null,
        label: dump(labelEl),
        check: check ? { src: check.getAttribute('src'), ...dump(check) } : null,
      };
    }),
    dividers: divs.map(d => dump(d)),
  };
});

await p.screenshot({ path: '/private/tmp/claude-501/-Users-jumbotail-Desktop-filter-prototype/a0e202e6-682d-426a-b140-4fc5ab028b4c/scratchpad/mine/live-sort.png' });
console.log(JSON.stringify(out.sheet, null, 1));
await b.close();
