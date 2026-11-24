const { chromium } = require('C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright-core');
const path = require('path'), url = require('url');
const dir = process.argv[2], out = process.argv[3];
const P = { p1: ['ready','loading','notfound','denied','processing','failed','submiterror'], p2: ['ready','loading','empty','stale'], p3: ['ready','loading','error','stale'], p4: ['ready','stale'], p5: ['ready','loading','notfound','submitted','saveerror'] };
const F = { p1: 'p1-cv-review', p2: 'p2-ranking', p3: 'p3-pipeline', p4: 'p4-public', p5: 'p5-evaluation' };
const P4V = ['list','job','company','expired','apply','done','track','withdrawn','badtoken','nope'];
(async () => {
  const b = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch());
  const res = [];
  for (const k of Object.keys(F)) for (const w of [1440, 1024, 768, 390]) {
    const views = k === 'p4' ? P4V.map(v => ['ready', v]) : P[k].map(s => [s, '']);
    for (const [s, h] of views) {
      const p = await b.newPage({ viewport: { width: w, height: 900 } }); const errs = [];
      p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
      await p.goto(url.pathToFileURL(path.join(dir, F[k] + '.html')).href + '?state=' + s + (h ? '#' + h : ''), { waitUntil: 'networkidle' });
      await p.evaluate(() => document.fonts.ready);
      const r = await p.evaluate(() => {
        const vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
        const els = [...document.querySelectorAll('header a, header button, .btn, .badge, h1')].filter(vis).map(e => e.getBoundingClientRect());
        let ov = 0; for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { const a = els[i], c = els[j]; if (a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1) ov++; }
        const t = document.querySelector('table'), wr = t && t.closest('.wrap');
        return { sw: document.documentElement.scrollWidth, iw: innerWidth, ov, h1: [...document.querySelectorAll('h1')].filter(vis).length, tbl: t && vis(t) ? [t.scrollWidth, wr.clientWidth] : null };
      });
      if (w === 1440 || w === 390) await p.screenshot({ path: path.join(out, `${k}-${s}${h ? '-' + h : ''}-${w}.png`) });
      res.push({ k, w, s: s + (h ? '#' + h : ''), ...r, errs: errs.filter(e => !/favicon/.test(e)).length });
      await p.close();
    }
  }
  console.log(JSON.stringify(res)); await b.close();
})();
