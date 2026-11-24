// PROTOTYPE ONLY — simulates the behaviour the Phase 03 contracts assume (Radix-backed in Phase 05). Not product code.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const params = new URLSearchParams(location.search);
const state = params.get('state') || 'ready';
// state switcher: every prototype renders [data-state] blocks and shows the matching one
function applyState() {
  $$('[data-state]').forEach(el => { el.hidden = !el.dataset.state.split(' ').includes(state); });
  const sel = $('#stateSel'); if (sel) sel.value = state;
}
function stateSwitcher(states) {
  const bar = $('.proto-bar'); if (!bar) return;
  const s = document.createElement('select'); s.id = 'stateSel'; s.setAttribute('aria-label', 'Trạng thái prototype');
  states.forEach(v => s.add(new Option(v, v)));
  s.onchange = () => { params.set('state', s.value); location.search = params.toString(); };
  bar.append(' · trạng thái: ', s);
}
// dialog helpers: native <dialog> gives focus trap + Escape; we add focus return
function openDialog(id, trigger) {
  const d = document.getElementById(id); d._trigger = trigger || document.activeElement; d.showModal();
  d.addEventListener('close', () => d._trigger && d._trigger.focus(), { once: true });
}
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]'); if (o) { e.preventDefault(); openDialog(o.dataset.open, o); }
  const c = e.target.closest('[data-close]'); if (c) c.closest('dialog').close();
});
// tabs: arrows + Home/End (contract: Tabs)
function tabs(root) {
  const t = $$('[role=tab]', root);
  const sel = i => { t.forEach((x, j) => { x.setAttribute('aria-selected', i === j); x.tabIndex = i === j ? 0 : -1; const p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = i !== j; }); t[i].focus(); };
  t.forEach((x, i) => { x.onclick = () => sel(i); x.onkeydown = e => { const k = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: t.length - 1 }[e.key]; if (k !== undefined) { e.preventDefault(); sel((k + t.length) % t.length); } }; });
}
// timing helper for the owner's timed pass: logs ms since page load per marked action
window.mark = (label) => console.log('[timing]', label, Math.round(performance.now()), 'ms');
document.addEventListener('DOMContentLoaded', applyState);
