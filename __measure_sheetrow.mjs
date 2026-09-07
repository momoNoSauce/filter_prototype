import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 360, height: 800 }, deviceScaleFactor: 3 });
await p.goto('http://localhost:3007/userjourney/seller/kartik', { waitUntil: 'networkidle' });
await p.addStyleTag({ content: 'nextjs-portal{display:none !important}' });

await p.getByRole('button', { name: /^Sort/ }).click();
await p.waitForSelector('[data-sheet]');
await p.waitForTimeout(600);

const data = await p.evaluate(() => {
  const sheet = document.querySelector('[data-sheet]');
  const rows = [...sheet.querySelectorAll('button[aria-pressed]')];
  const r = (el) => { const b = el.getBoundingClientRect(); return [+b.x.toFixed(2), +b.y.toFixed(2), +b.width.toFixed(2), +b.height.toFixed(2)]; };
  const cs = (el, keys) => { const s = getComputedStyle(el); return Object.fromEntries(keys.map(k => [k, s[k]])); };
  const describe = (row) => {
    const group = row.firstElementChild;
    const glyph = group.firstElementChild;
    const label = group.lastElementChild;
    const check = row.querySelector('img');
    return {
      label: label.textContent,
      pressed: row.getAttribute('aria-pressed'),
      rowBox: r(row),
      rowStyle: cs(row, ['height', 'paddingLeft', 'paddingRight', 'justifyContent', 'alignItems']),
      groupBox: r(group),
      groupStyle: cs(group, ['columnGap', 'alignItems']),
      glyphBox: r(glyph),
      glyphColor: cs(glyph, ['backgroundColor', 'width', 'height']),
      labelBox: r(label),
      labelStyle: cs(label, ['fontSize', 'lineHeight', 'fontWeight', 'color', 'fontFamily']),
      checkBox: check ? r(check) : null,
    };
  };
  const dividers = [...sheet.querySelectorAll('div')].filter(d => d.className.includes('h-px')).map(r);
  return {
    sheetBox: r(sheet),
    sheetStyle: cs(sheet, ['borderTopLeftRadius', 'backgroundColor']),
    listStyle: cs(sheet.querySelector('button[aria-pressed]').parentElement, ['rowGap', 'paddingBottom', 'alignItems']),
    rowCount: rows.length,
    first: describe(rows[0]),
    second: describe(rows[1]),
    active: describe(rows.find(x => x.getAttribute('aria-pressed') === 'true')),
    dividers,
  };
});

console.log(JSON.stringify(data, null, 2));
await b.close();
