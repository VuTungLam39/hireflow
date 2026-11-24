const { chromium } = require('C:/nvm4w/nodejs/node_modules/@playwright/cli/node_modules/playwright-core');
const path = require('path'), url = require('url');
const dir = process.argv[2];
const u = (f, q = '') => url.pathToFileURL(path.join(dir, f)).href + q;
(async () => {
  const b = await chromium.launch({ channel: 'chrome' });
  const out = [];
  async function flow(name, w, fn) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    const steps = []; let actions = 0;
    const t0 = Date.now();
    const act = async (label, f, waitSel) => { const s = Date.now(); await f(); if (waitSel) await p.waitForSelector(waitSel, { state: 'visible', timeout: 5000 }); actions++; steps.push([label, Date.now() - s]); };
    try { await fn(p, act); out.push({ name, w, ok: true, actions, systemMs: Date.now() - t0, steps }); }
    catch (e) { out.push({ name, w, ok: false, actions, error: e.message.split('\n')[0], steps }); }
    await p.close();
  }
  for (const w of [1440, 390]) {
    await flow('P1 evidence+decision (T2 proxy)', w, async (p, act) => {
      await p.goto(u('p1-cv-review.html', '?state=ready'), { waitUntil: 'networkidle' });
      await act('focus criterion 1 → evidence in CV', () => p.click('button.c[data-mark=m1]'), 'mark.focus');
      await act('open Chuyển trạng thái', () => p.click('#decide'), '#decision[open]');
    });
    await flow('P1 full reject with reason', w, async (p, act) => {
      await p.goto(u('p1-cv-review.html', '?state=ready'), { waitUntil: 'networkidle' });
      await act('open Chuyển trạng thái', () => p.click('#decide'), '#decision[open]');
      await act('submit without status (error recovery)', () => p.click('#confirm'), '#toErr');
      await act('choose Từ chối', () => p.selectOption('#to', 'Từ chối'), '#whyF');
      await act('choose reason', () => p.selectOption('#why', { index: 1 }));
      await act('confirm', () => p.click('#confirm'), '#done[open]');
    });
    await flow('P2 ranked list → one hồ sơ evidence', w, async (p, act) => {
      await p.goto(u('p2-ranking.html', '?state=ready'), { waitUntil: 'networkidle' });
      await act('expand row 1 evidence', () => p.click('#tb tr:first-child button[aria-expanded]'), 'tr.exp');
    });
    await flow('P2 change weight → order updates', w, async (p, act) => {
      await p.goto(u('p2-ranking.html', '?state=ready'), { waitUntil: 'networkidle' });
      const before = await p.textContent('#tb tr:first-child td');
      await act('set AWS weight 3', () => p.selectOption('[data-w="2"]', '3'));
      const after = await p.textContent('#tb tr:first-child td');
      if (before === after) throw new Error('order did not change');
    });
    await flow('P3 list → open hồ sơ (T1)', w, async (p, act) => {
      await p.goto(u('p3-pipeline.html', '?state=ready'), { waitUntil: 'networkidle' });
      await act('open quick view', () => p.click('[data-qv="0"]'), '#qv[open]');
      await act('Mở chi tiết', () => p.click('#qv a.btn.primary'), 'button.c');
    });
    await flow('P3 search + filter + bulk', w, async (p, act) => {
      await p.goto(u('p3-pipeline.html', '?state=ready'), { waitUntil: 'networkidle' });
      await act('type search', () => p.fill('#q', 'Nguyễn'));
      await act('open Bộ lọc', () => p.click('#fbtn'), '#filters[open]');
      await act('tick Mới', () => p.check('.f[value="Mới"]'));
      await act('Áp dụng', () => p.click('#filters .btn.primary'));
      await act('select first row', () => p.check('#tb tr:first-child input'), '#bulk');
      await act('bulk Sàng lọc', () => p.click('#bulk .btn'), '#toast .card');
    });
    await flow('P4 browse → company (T3)', w, async (p, act) => {
      await p.goto(u('p4-public.html', '?state=ready#list'), { waitUntil: 'networkidle' });
      await act('open Bộ lọc', () => p.click('button[data-open=flt]'), '#flt[open]');
      await act('Áp dụng', () => p.click('#flt .btn.primary'));
      await act('open company page', () => p.click('#colink'), '#v-company.on');
    });
    await flow('P4 apply (proxy)', w, async (p, act) => {
      await p.goto(u('p4-public.html', '?state=ready#job'), { waitUntil: 'networkidle' });
      await act('Ứng tuyển', () => p.click('#v-job a.btn.primary'), '#v-apply.on');
      await act('submit empty (error recovery)', () => p.click('#send'), '#e-nm');
      await act('fill name', () => p.fill('#nm', 'Nguyễn Văn An'));
      await act('fill email', () => p.fill('#em', 'an.nguyen@example.com'));
      await act('attach CV', () => p.setInputFiles('#cv', { name: 'cv.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4') }));
      await act('consent', () => p.check('#ok'));
      await act('Gửi hồ sơ', () => p.click('#send'), '#v-done.on');
    });
    await flow('P4 expired job (DL-17)', w, async (p, act) => {
      await p.goto(u('p4-public.html', '?state=ready#expired'), { waitUntil: 'networkidle' });
      if (!(await p.isDisabled('#v-expired button.primary'))) throw new Error('apply not disabled');
    });
    await flow('P5 Phiếu đánh giá (proxy)', w, async (p, act) => {
      await p.goto(u('p5-evaluation.html', '?state=ready'), { waitUntil: 'networkidle' });
      await act('submit empty (error recovery)', () => p.click('#send'), '#e-c1');
      await act('rate NestJS', () => p.click('input[name=c1][value="2"]'));
      await act('rate Docker', () => p.click('input[name=c2][value="3"]'));
      await act('recommendation', () => p.click('input[name=rec][value=hire]'));
      await act('Gửi Phiếu đánh giá', () => p.click('#send'), '[data-state=submitted]:not([hidden])');
    });
  }
  // keyboard-only checks
  const k = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await k.goto(u('p2-ranking.html', '?state=ready'), { waitUntil: 'networkidle' });
  await k.keyboard.press('j'); await k.keyboard.press('x');
  const kExp = await k.$('tr.exp') !== null;
  await k.goto(u('p2-ranking.html', '?state=ready'), { waitUntil: 'networkidle' });
  await k.focus('[role=tab][aria-selected=true]'); await k.keyboard.press('Home');
  const home = await k.getAttribute('[role=tab]:first-child', 'aria-selected');
  await k.goto(u('p1-cv-review.html', '?state=ready'), { waitUntil: 'networkidle' });
  await k.focus('button.c[data-mark=m1]'); await k.keyboard.press('Enter');
  const onMark = await k.evaluate(() => document.activeElement.id); await k.keyboard.press('Escape');
  const back = await k.evaluate(() => document.activeElement.className);
  await k.click('#decide'); await k.keyboard.press('Escape');
  const ret = await k.evaluate(() => document.activeElement.id);
  out.push({ name: 'keyboard', ranking_jx_expand: kExp, tabs_home: home, evidence_focus: onMark, evidence_escape_back: back, dialog_focus_return: ret });
  console.log(JSON.stringify(out, null, 1)); await b.close();
})();
