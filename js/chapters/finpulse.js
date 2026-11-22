// FinPulse X chapter, ported from the earlier ChatGPT portfolio (FinChapter.tsx + FinDataFlow.tsx).
// Same markup classes, same GSAP scroll timeline, same packet data-flow. Illustrative data only.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const week = [['Monday', 420], ['Tuesday', 610], ['Wednesday', 340], ['Thursday', 780], ['Friday', 520], ['Saturday', 1480], ['Sunday', 690]].map(([day, amount]) => ({ day, amount }));
const money = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const total = week.reduce((s, d) => s + d.amount, 0);
const running = week.map((_, i) => week.slice(0, i + 1).reduce((s, d) => s + d.amount, 0));
const beatNames = ['The number', 'The pattern', 'The system'];
const beatCopy = ['One week. One question. What did it cost?', 'The same amount, unfolded into seven days.', 'Follow one entry. Every view stays in agreement.'];
const NS = 'http://www.w3.org/2000/svg';

function template() {
  const glyphs = Array.from(money(total)).map((ch) => {
    const faces = [0, 1, 2, 3].map((n) => `<span class="fp-digit-face">${/\d/.test(ch) ? (n === 3 ? ch : ['2', '6', '0'][n]) : ch}</span>`).join('');
    return `<span class="fp-glyph${ch === '₹' ? ' fp-rupee' : ''}${ch === ',' ? ' fp-comma' : ''}" aria-hidden="true"><span class="fp-glyph-window"><span class="fp-glyph-track">${faces}</span></span></span>`;
  }).join('');
  const bars = week.map((d, i) => `<button type="button" class="fp-bar" data-i="${i}"><span class="fp-bar-slot"><span class="fp-bar-value"></span><span class="fp-bar-body"><i class="fp-bar-front"></i><i class="fp-bar-top"></i><i class="fp-bar-side"></i></span></span><span class="fp-bar-day">${d.day.slice(0, 3)}</span></button>`).join('');
  const rows = week.map((d, i) => `<button type="button" data-i="${i}" aria-label="Follow ${d.day}, ${money(d.amount)}"><span>${d.day.slice(0, 3).toUpperCase()}</span><b>${money(d.amount)}</b><i style="width:${7 + (d.amount / 1480) * 23}px"></i></button>`).join('');
  const options = week.map((d, i) => `<option value="${i}">${d.day}</option>`).join('');
  const table = week.map((d, i) => `<tr data-i="${i}"><th scope="row">${d.day}</th><td>${money(d.amount)}</td><td>${money(running[i])}</td></tr>`).join('');
  return `<div class="fp-sticky">
  <div class="fp-ambient" aria-hidden="true"></div>
  <header class="fp-mast"><span>05 / FINPULSE X</span><span>PRODUCT ENGINEERING<br />AN INTERACTIVE EXPLORATION</span></header>
  <div class="fp-stage">
    <div class="fp-step-heading fp-step-intro" id="fin-number"><p>A little clarity goes a long way.</p><h2 id="fp-title">What did<br /><em>this week cost?</em></h2></div>
    <div class="fp-step-heading fp-step-chart"><p>01 / THE SAME NUMBER, UNFOLDED</p><h3>The shape<br /><em>of your week.</em></h3></div>
    <div class="fp-step-heading fp-step-system"><p>02 / THE THINKING BENEATH IT</p><h3>One source.<br /><em>Every view.</em></h3></div>
    <div class="fp-number" role="img" aria-label="${money(total)} in illustrative weekly spending">${glyphs}</div>
    <p class="fp-intro-note"><span>${money(total)}</span> isn’t the whole story.<br />Scroll to see what it’s made of. <i>↓</i></p>
    <div class="fp-view-controls">
      <div class="fp-toggle" role="group" aria-label="Spending chart view"><button type="button" data-mode="daily">Daily</button><button type="button" data-mode="cumulative">Cumulative</button></div>
      <label class="fp-day-select"><span>Inspect</span><select aria-label="Inspect a sample day">${options}</select></label>
    </div>
    <div class="fp-chart-shell" id="fin-chart" aria-label="Interactive weekly spending chart">
      <span class="fp-chart-cap">03 / THE VIEW — SAME CHART</span>
      <div class="fp-axis" aria-hidden="true"><span data-axis="0"></span><span data-axis="1"></span><span>0</span></div>
      <div class="fp-bars">${bars}</div>
    </div>
    <div class="fp-diagram" id="fin-flow">
      <svg class="fp-live-flow" aria-hidden="true"></svg>
      <div class="fp-node fp-source-node"><span class="fp-node-label">01 / INPUT</span><strong>Ledger entries</strong><span class="fp-code">[day, amount]</span><small>7 entries · illustrative data</small></div>
      <div class="fp-node fp-transform-node"><span class="fp-node-label">02 / TRANSFORM</span><strong data-transform-title>Sum &amp; select</strong><span class="fp-code" data-transform-code>sum(entries.amount)</span><small>No duplicated totals</small></div>
      <div class="fp-node fp-state-node"><span class="fp-node-label">THE SHARED STATE</span><strong>The week, as data.</strong><div class="fp-data-rows" role="group" aria-label="Select an entry in the shared dataset">${rows}</div></div>
      <div class="fp-node fp-total-node"><span class="fp-node-label">ONE SOURCE · RECONCILED</span><strong>${money(total)}</strong><small>${week.map((d) => d.amount.toLocaleString('en-IN')).join(' + ')} = ${total.toLocaleString('en-IN')}</small><button type="button" class="fp-mobile-ledger" data-open-ledger>Open ledger ↗</button></div>
      <button type="button" class="fp-node fp-table-node" data-open-ledger><span class="fp-node-label">ANOTHER WAY TO READ IT</span><strong>Readable ledger <i>↗</i></strong></button>
    </div>
  </div>
  <div class="fp-readout"><div><span class="fp-node-label" data-readout-label></span><strong data-readout-value></strong></div><p><span data-readout-text></span><br /><span>Select a bar. See the same data differently.</span></p><button type="button" data-open-ledger>Inspect the ledger <span>↗</span></button></div>
  <div class="fp-proof-strip"><article><span>THE QUESTION</span><p>What did this week cost?</p></article><article><span>THE BUILD</span><p>One dataset. Three reading modes.</p></article><article><span>THE PROOF</span><p data-proof></p></article><article><span>THE PRINCIPLE</span><p>Every view should reconcile.</p></article></div>
  <footer class="fp-footer"><nav aria-label="FinPulse story chapters">${beatNames.map((n, i) => `<button type="button" data-jump="${i}"><span>0${i + 1}</span>${n}<i></i></button>`).join('')}</nav><span>Illustrative data / no bank connection</span></footer>
  <p class="fp-sr" aria-live="polite"></p>
</div>
<dialog class="fp-ledger" aria-labelledby="fp-ledger-title" data-lenis-prevent>
  <header><div><span>FINPULSE X / THE UNDERLYING VALUES</span><h3 id="fp-ledger-title">A week, in full.</h3></div><button type="button" aria-label="Close sample ledger" data-close-ledger>×</button></header>
  <table><caption>Illustrative sample. No bank connection.</caption><thead><tr><th scope="col">Day</th><th scope="col">Amount</th><th scope="col">Cumulative</th></tr></thead><tbody>${table}</tbody><tfoot><tr><th scope="row">Week total</th><td>${money(total)}</td><td>${money(total)}</td></tr></tfoot></table>
  <p>These exact seven values also drive the total, chart and shared dataset.</p>
</dialog>`;
}

export function initFinPulse(root, lenis) {
  root.classList.add('fp-chapter');
  root.dataset.theme = 'dark';
  root.innerHTML = template();
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const stage = $('.fp-stage');
  const svg = $('.fp-live-flow');
  const dialog = $('.fp-ledger');
  let beat = 0, selected = 5, cumulative = false, isStatic = matchMedia('(prefers-reduced-motion: reduce)').matches, scroll = null, visible = false;

  /* ---------- data flow (FinDataFlow port): routes measured from rendered ports ---------- */
  const flow = (() => {
    let active = false, frame = 0, last = '';
    const routes = [];
    const curve = (id, a, b, delay, row) => {
      const bend = Math.max(16, Math.abs(b[0] - a[0]) * 0.48);
      const f = (n) => n.toFixed(1);
      routes.push({ id, d: `M${f(a[0])},${f(a[1])} C${f(a[0] + bend)},${f(a[1])} ${f(b[0] - bend)},${f(b[1])} ${f(b[0])},${f(b[1])}`, delay, row });
    };
    function draw(w, h) {
      const sig = JSON.stringify([w, h, routes, selected, cumulative, visible, active]);
      if (sig === last) return;
      last = sig;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.dataset.running = String(active && visible && !isStatic);
      svg.replaceChildren();
      routes.forEach((r) => {
        const hot = r.row === selected;
        const g = document.createElementNS(NS, 'g');
        g.setAttribute('class', `fp-route${hot ? ' fp-route-selected' : ''}${r.row === undefined ? ' fp-route-main' : ''}`);
        const base = document.createElementNS(NS, 'path'); base.setAttribute('d', r.d); base.setAttribute('class', 'fp-route-base');
        g.appendChild(base);
        if (visible && !isStatic) {
          const dash = document.createElementNS(NS, 'path'); dash.setAttribute('d', r.d); dash.setAttribute('class', 'fp-route-dashes'); dash.setAttribute('pathLength', '1'); dash.style.animationDelay = `${-r.delay}s`;
          g.appendChild(dash);
          for (let k = 0; k < 3; k++) {
            const c = document.createElementNS(NS, 'circle'); c.setAttribute('r', hot ? '3' : '2.1'); c.setAttribute('class', 'fp-packet');
            const m = document.createElementNS(NS, 'animateMotion');
            m.setAttribute('path', r.d); m.setAttribute('dur', r.row === undefined ? '2.5s' : '3.4s'); m.setAttribute('begin', `${-r.delay - k * 1.1}s`); m.setAttribute('repeatCount', 'indefinite');
            c.appendChild(m); g.appendChild(c);
          }
        }
        svg.appendChild(g);
      });
    }
    function measure() {
      frame = 0;
      routes.length = 0;
      if (!active || isStatic || !visible) { draw(1, 1); return; }
      const bounds = stage.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const box = (sel) => { const n = root.querySelector(sel); if (!n) return null; const r = n.getBoundingClientRect(); return { x: r.left - bounds.left, y: r.top - bounds.top, w: r.width, h: r.height }; };
      const source = box('.fp-source-node'), transform = box('.fp-transform-node'), state = box('.fp-state-node');
      if (!source || !transform || !state) return;
      curve('input', [source.x + source.w, source.y + source.h * 0.55], [transform.x, transform.y + transform.h * 0.55], 0);
      if (transform.y + transform.h < state.y) {
        const sx = transform.x + transform.w * 0.5, sy = transform.y + transform.h, ex = state.x + state.w * 0.5, ey = state.y;
        routes.push({ id: 'state', d: `M${sx},${sy} C${sx},${sy + 16} ${ex},${ey - 16} ${ex},${ey}`, delay: 0.55 });
      } else curve('state', [transform.x + transform.w, transform.y + transform.h * 0.55], [state.x, state.y + 38], 0.55);
      const rows = root.querySelectorAll('.fp-data-rows button'), bars = root.querySelectorAll('.fp-bar-body');
      rows.forEach((row, i) => {
        const bar = bars[i]; if (!bar) return;
        const r = row.getBoundingClientRect(), b = bar.getBoundingClientRect();
        curve(`day-${i}`, [state.x + state.w, r.top - bounds.top + r.height / 2], [b.left - bounds.left + b.width / 2, b.top - bounds.top - 5], 1.05 + i * 0.11, i);
      });
      const tot = box('.fp-total-node');
      if (tot) curve('total', [state.x + state.w, state.y + state.h - 16], [tot.x, tot.y + tot.h * 0.5], 1.6);
      const table = box('.fp-table-node');
      if (table && table.w > 0) { const x = state.x + state.w * 0.5; routes.push({ id: 'ledger', d: `M${x},${state.y + state.h} V${table.y}`, delay: 1.8 }); }
      draw(bounds.width, bounds.height);
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    new ResizeObserver(schedule).observe(stage);
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; schedule(); }).observe(stage);
    addEventListener('scroll', schedule, { passive: true });
    addEventListener('resize', schedule, { passive: true });
    stage.addEventListener('transitionend', schedule);
    return { update(a) { active = a; last = ''; schedule(); } };
  })();

  /* ---------- state -> DOM ---------- */
  function render() {
    const values = cumulative ? running : week.map((d) => d.amount);
    const ceiling = cumulative ? 5000 : 1600;
    const current = week[selected], currentValue = values[selected];
    root.dataset.beat = String(beat);
    root.classList.toggle('fp-static', isStatic);
    $$('.fp-bar').forEach((b, i) => {
      b.classList.toggle('fp-selected', i === selected);
      b.setAttribute('aria-pressed', String(i === selected));
      b.setAttribute('aria-label', `${week[i].day}, ${money(values[i])}`);
      b.querySelector('.fp-bar-slot').style.height = `${(values[i] / ceiling) * 100}%`;
      b.querySelector('.fp-bar-value').textContent = money(values[i]);
    });
    $('[data-axis="0"]').textContent = money(ceiling);
    $('[data-axis="1"]').textContent = money(ceiling / 2);
    $$('.fp-toggle button').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.mode === 'cumulative') === cumulative)));
    $('.fp-day-select select').value = String(selected);
    $('[data-transform-title]').textContent = cumulative ? 'Accumulate' : 'Sum & select';
    $('[data-transform-code]').textContent = cumulative ? 'prefixSum(entries)' : 'sum(entries.amount)';
    $$('.fp-data-rows button').forEach((b, i) => { b.classList.toggle('fp-data-selected', i === selected); b.setAttribute('aria-pressed', String(i === selected)); });
    $('[data-readout-label]').textContent = `${current.day.toUpperCase()} / ${cumulative ? 'WEEK TO DATE' : 'A CLOSER LOOK'}`;
    $('[data-readout-value]').textContent = money(currentValue);
    $('[data-readout-text]').textContent = cumulative ? `Monday through ${current.day}.` : `${((current.amount / total) * 100).toFixed(1)}% of this sample week.`;
    const proof = $('[data-proof]');
    const strong = document.createElement('b'); strong.textContent = money(currentValue);
    proof.replaceChildren(strong, ` ${cumulative ? 'through' : 'on'} ${current.day.toLowerCase()} — chart & ledger agree.`);
    $$('.fp-ledger tbody tr').forEach((tr, i) => tr.classList.toggle('fp-ledger-selected', i === selected));
    $$('.fp-footer button').forEach((x, i) => x.setAttribute('aria-pressed', String(beat === i)));
    const activeChart = isStatic || beat >= 1, activeSystem = isStatic || beat === 2;
    $('.fp-view-controls').inert = !isStatic && beat === 0;
    $('.fp-chart-shell').inert = !activeChart;
    $('.fp-diagram').inert = !activeSystem;
    $('.fp-readout').inert = !isStatic && beat !== 1;
    $('.fp-proof-strip').inert = !activeSystem;
    $('.fp-sr').textContent = `${beatCopy[beat]} ${current.day}: ${money(currentValue)}.`;
    flow.update(activeSystem);
  }

  /* ---------- interactions ---------- */
  const select = (i) => { selected = i; render(); };
  $$('.fp-bar').forEach((b, i) => { b.addEventListener('click', () => select(i)); b.addEventListener('focus', () => select(i)); });
  $$('.fp-data-rows button').forEach((b, i) => b.addEventListener('click', () => select(i)));
  $('.fp-day-select select').addEventListener('change', (e) => select(Number(e.target.value)));
  $$('.fp-toggle button').forEach((b) => b.addEventListener('click', () => { cumulative = b.dataset.mode === 'cumulative'; render(); }));
  $$('[data-open-ledger]').forEach((b) => b.addEventListener('click', () => { if (!dialog.open) { dialog.showModal(); if (lenis) lenis.stop(); } }));
  $('[data-close-ledger]').addEventListener('click', () => { if (dialog.open) dialog.close(); });
  dialog.addEventListener('close', () => { if (lenis) lenis.start(); });
  $$('[data-jump]').forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.jump);
    if (scroll) {
      const top = scroll.start + [0.19, 0.52, 0.955][i] * (scroll.end - scroll.start);
      if (lenis) lenis.scrollTo(top, { duration: 1, force: true }); else window.scrollTo({ top, behavior: 'smooth' });
    } else root.querySelector(['#fin-number', '#fin-chart', '#fin-flow'][i])?.scrollIntoView({ behavior: 'auto', block: 'center' });
  }));

  /* ---------- the scroll timeline (unchanged from the original) ---------- */
  const mm = gsap.matchMedia();
  mm.add({ wide: '(min-width: 761px)', narrow: '(max-width: 760px)', reduced: '(prefers-reduced-motion: reduce)', short: '(max-height: 620px)' }, (context) => {
    const compact = Boolean(context.conditions?.narrow);
    const reduced = Boolean(context.conditions?.reduced || context.conditions?.short);
    isStatic = reduced;
    if (reduced) { beat = 1; render(); return undefined; }
    render();
    const digits = $$('.fp-glyph'), bars = $$('.fp-bar-body'), cells = $$('.fp-bar');
    const chart = $('.fp-chart-shell'), number = $('.fp-number');
    const target = (i) => {
      const cell = cells[[0, 1, 2, 3, 5, 6][i]], body = bars[[0, 1, 2, 3, 5, 6][i]], digit = digits[i];
      return {
        x: chart.offsetLeft + cell.parentElement.offsetLeft + cell.offsetLeft + cell.offsetWidth / 2 - number.offsetLeft - digit.offsetLeft - digit.offsetWidth / 2,
        y: chart.offsetTop + cell.parentElement.offsetTop + cell.offsetTop + body.parentElement.offsetTop + body.offsetHeight / 2 - number.offsetTop - digit.offsetTop - digit.offsetHeight / 2,
      };
    };
    gsap.set('.fp-step-chart, .fp-step-system, .fp-diagram, .fp-proof-strip, .fp-readout, .fp-view-controls, .fp-chart-cap, .fp-axis, .fp-bar-day, .fp-bar-value', { opacity: 0 });
    gsap.set(bars, { scaleY: 0.005, transformOrigin: '50% 100%' });
    gsap.set(digits, { x: 0, y: 0, scaleX: 1, scaleY: 1, rotateX: 0, rotateY: 0, opacity: 1 });
    gsap.set('.fp-glyph-track', { y: 0, yPercent: 0 });
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root, start: 'top top', end: 'bottom bottom', scrub: true, invalidateOnRefresh: true,
        onUpdate: (self) => { const next = self.progress < 0.31 ? 0 : self.progress < 0.71 ? 1 : 2; if (next !== beat) { beat = next; render(); } },
      },
    });
    scroll = tl.scrollTrigger;
    // On phones the odometer roll read as scattered digits mid-scroll, so show the settled number straight away.
    if (compact) gsap.set('.fp-glyph-track', { y: 0, yPercent: -75 });
    else tl.fromTo(digits, { rotateX: 60, rotateY: -14, y: 25, opacity: 0 }, { rotateX: 0, rotateY: 0, y: 0, opacity: 1, duration: 0.1, stagger: 0.009, ease: 'power3.out' }, 0)
      .fromTo('.fp-glyph-track', { y: 0, yPercent: 0 }, { y: 0, yPercent: -75, stagger: 0.009, duration: 0.12, ease: 'power3.out' }, 0.025);
    tl.to('.fp-intro-note', { opacity: 0, y: -12, duration: 0.07 }, 0.2)
      .to('.fp-step-intro', { opacity: 0, y: -35, duration: 0.08 }, 0.23);
    digits.forEach((digit, i) => {
      const at = 0.24 + i * 0.012;
      tl.to(digit, { x: () => target(i).x, y: () => target(i).y, rotateX: -84, rotateY: i % 2 ? 12 : -12, scaleX: 0.42, scaleY: 0.16, duration: 0.155, ease: 'power2.inOut' }, at)
        .to(digit, { opacity: 0, duration: 0.035 }, at + 0.12);
    });
    tl.to(bars, { scaleY: 1, duration: 0.17, stagger: 0.012, ease: 'power3.inOut' }, 0.32)
      .to('.fp-step-chart', { opacity: 1, y: 0, duration: 0.08 }, 0.35)
      .to('.fp-axis, .fp-bar-day, .fp-bar-value', { opacity: 1, duration: 0.08 }, 0.39)
      .to('.fp-view-controls', { opacity: 1, duration: 0.07 }, 0.43)
      .to('.fp-readout', { opacity: 1, duration: 0.08 }, 0.46)
      .to('.fp-step-chart', { opacity: 0, y: -28, duration: 0.08 }, 0.65)
      .to('.fp-readout', { opacity: 0, duration: 0.06 }, 0.67)
      .to(chart, { left: compact ? '60%' : '69%', top: compact ? '47%' : '29%', width: compact ? '40%' : '30%', height: compact ? '29%' : '43%', duration: 0.18, ease: 'power3.inOut' }, 0.68)
      .to('.fp-bar-value', { opacity: 0, duration: 0.06 }, 0.7)
      .to('.fp-chart-cap', { opacity: 1, duration: 0.06 }, 0.76)
      .to('.fp-axis', { opacity: 0.3, duration: 0.08 }, 0.72)
      .to('.fp-step-system', { opacity: 1, y: 0, duration: 0.09 }, 0.73)
      .to('.fp-diagram', { opacity: 1, duration: 0.1 }, 0.75)
      .fromTo('.fp-source-node', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.045 }, 0.75)
      .fromTo('.fp-transform-node', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.045 }, 0.79)
      .fromTo('.fp-state-node', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.045 }, 0.83)
      .fromTo('.fp-total-node, .fp-table-node', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.045 }, 0.88)
      .to('.fp-proof-strip', { opacity: 1, y: 0, duration: 0.08 }, 0.89)
      .to({}, { duration: 0.03 }, 0.97);
    const observer = new ResizeObserver(() => ScrollTrigger.refresh());
    observer.observe(stage);
    return () => { scroll = null; observer.disconnect(); };
  }, root);
  render();
}
