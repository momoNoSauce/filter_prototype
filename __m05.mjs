import { chromium } from 'playwright';
const SHOT='/private/tmp/claude-501/-Users-jumbotail-Desktop-filter-prototype/a0e202e6-682d-426a-b140-4fc5ab028b4c/scratchpad/mine/';
const b=await chromium.launch();
const p=await b.newPage({viewport:{width:360,height:800},deviceScaleFactor:3});
await p.goto('http://localhost:3007/userjourney/seller/kartik',{waitUntil:'networkidle'});
await p.addStyleTag({content:'nextjs-portal{display:none !important}'});

await p.getByRole('button',{name:/^\d*\s*Filter$/}).click();
await p.waitForTimeout(400);
// tick a category
await p.getByRole('button',{name:/^Category/}).click();
await p.waitForTimeout(300);
await p.getByText(/Women's T-Shirts/).first().click();
await p.waitForTimeout(400);
await p.getByRole('button',{name:/^Price Range/}).click();
await p.waitForTimeout(400);

const inputs = await p.locator('input[inputmode="numeric"]').all();
await inputs[0].fill('900');
await inputs[1].fill('450');
await inputs[1].blur();
await p.waitForTimeout(600);

const m = await p.evaluate(()=>{
  const R=e=>{const r=e.getBoundingClientRect();return {x:+r.x.toFixed(2),y:+r.y.toFixed(2),w:+r.width.toFixed(2),h:+r.height.toFixed(2)};};
  const out={};
  // chip strip
  out.chips=[...document.querySelectorAll('button,div')].filter(e=>e.className&&typeof e.className==='string'&&/rounded/.test(e.className)).slice(0,0);
  // rail rows: find the rail container
  const railBtns=[...document.querySelectorAll('button')].filter(b=>/^(Price Range|Margin on MRP|MOQ|Cashback|Seller Offer|SOLV Target Scheme|Category|Brands|Colour|Fabric|Size|Fit|Neck Type|Sleeve Type|Pattern|Closure Type)/.test(b.textContent.trim()));
  out.rail=railBtns.map(b=>{
    const badge=b.querySelector('span:last-child');
    const cs=getComputedStyle(b);
    const lbl=b.firstElementChild;
    return {t:b.textContent.trim(), ...R(b),
      pad:[cs.paddingTop,cs.paddingRight,cs.paddingBottom,cs.paddingLeft], gap:cs.columnGap||cs.gap,
      bg:cs.backgroundColor, bs:cs.boxShadow, borderR:cs.borderRightWidth+' '+cs.borderRightColor, borderT:cs.borderTopWidth+' '+cs.borderTopColor,
      label: lbl?{...R(lbl), fs:getComputedStyle(lbl).fontSize, fw:getComputedStyle(lbl).fontWeight, col:getComputedStyle(lbl).color, lh:getComputedStyle(lbl).lineHeight}:null,
      kids: [...b.children].map(k=>({tag:k.tagName,cls:(k.className||'').toString().slice(0,120),t:k.textContent.trim(),...R(k),
        cs:{fs:getComputedStyle(k).fontSize,fw:getComputedStyle(k).fontWeight,col:getComputedStyle(k).color,bg:getComputedStyle(k).backgroundColor,br:getComputedStyle(k).borderRadius,minW:getComputedStyle(k).minWidth}}))
    };
  });
  const railParent = railBtns[0] ? railBtns[0].parentElement : null;
  out.railBox = railParent?{...R(railParent), cs:{w:getComputedStyle(railParent).width, bg:getComputedStyle(railParent).backgroundColor, overflow:getComputedStyle(railParent).overflowY}}:null;
  out.railGrandparent = railParent&&railParent.parentElement?R(railParent.parentElement):null;
  // panel
  const ins=[...document.querySelectorAll('input[inputmode="numeric"]')];
  out.inputs=ins.map(i=>{const box=i.closest('div');const cs=getComputedStyle(box);return {v:i.value,...R(box),inner:R(i),
    br:cs.borderRadius, bw:cs.borderWidth, bc:cs.borderColor, pad:[cs.paddingTop,cs.paddingRight,cs.paddingBottom,cs.paddingLeft], gap:cs.columnGap||cs.gap, bg:cs.backgroundColor};});
  const rowWrap = ins[0]?ins[0].closest('div').parentElement:null;
  out.rangeRow = rowWrap?{...R(rowWrap), cs:{pad:[getComputedStyle(rowWrap).paddingTop,getComputedStyle(rowWrap).paddingRight,getComputedStyle(rowWrap).paddingBottom,getComputedStyle(rowWrap).paddingLeft], gap:getComputedStyle(rowWrap).columnGap}, kids:[...rowWrap.children].map(k=>({t:k.textContent.trim().slice(0,20),...R(k)}))}:null;
  out.rangeRowParent = rowWrap&&rowWrap.parentElement?{...R(rowWrap.parentElement), cls:(rowWrap.parentElement.className||'').toString().slice(0,200)}:null;
  // symbols
  out.symbols=[...document.querySelectorAll('span')].filter(s=>s.textContent.trim()==='₹').map(s=>({...R(s),fs:getComputedStyle(s).fontSize,col:getComputedStyle(s).color}));
  // bands
  const bands=[...document.querySelectorAll('label,button')].filter(e=>/Under ₹200|₹200 – ₹400|₹400 – ₹600|₹600 – ₹900|₹900/.test(e.textContent));
  out.bands=bands.map(e=>({t:e.textContent.trim(),...R(e),op:getComputedStyle(e).opacity, pad:[getComputedStyle(e).paddingTop,getComputedStyle(e).paddingRight,getComputedStyle(e).paddingBottom,getComputedStyle(e).paddingLeft],
    kids:[...e.children].map(k=>({t:k.textContent.trim().slice(0,30),...R(k),cs:{fs:getComputedStyle(k).fontSize,col:getComputedStyle(k).color,br:getComputedStyle(k).borderRadius,bw:getComputedStyle(k).borderWidth,bc:getComputedStyle(k).borderColor}}))}));
  // toast
  const toast=[...document.querySelectorAll('div')].find(d=>/can't be higher than max/.test(d.textContent)&&d.children.length===0);
  out.toast=toast?{t:toast.textContent,...R(toast),cs:{bg:getComputedStyle(toast).backgroundColor,br:getComputedStyle(toast).borderRadius,fs:getComputedStyle(toast).fontSize,fw:getComputedStyle(toast).fontWeight,pad:[getComputedStyle(toast).paddingTop,getComputedStyle(toast).paddingRight,getComputedStyle(toast).paddingBottom,getComputedStyle(toast).paddingLeft],col:getComputedStyle(toast).color,lh:getComputedStyle(toast).lineHeight}}:null;
  // footer
  out.footerBtns=[...document.querySelectorAll('button')].filter(b=>/Clear Filters|Show \d+ result/.test(b.textContent)).map(b=>({t:b.textContent.trim(),...R(b)}));
  // sheet
  const sheet=document.querySelector('[role="dialog"]')||null;
  out.sheet=sheet?R(sheet):null;
  return out;
});
console.log(JSON.stringify(m,null,1));
await p.screenshot({path:SHOT+'live-05-error.png'});
await b.close();
