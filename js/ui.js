import { createChapterEntrance } from './transitions.js?v=14';
// Page behaviour: loader, reveals, nav, HUD and the four project demos.
// Everything here works without WebGL; the stage is an optional listener.

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

export function initUI({ lenis, reduced }) {
  let stage = null;
  const send = (fn, ...args) => { if (stage) stage[fn](...args); };

  clock();
  splitText();
  reveals();
  const door = createChapterEntrance(lenis, reduced);
  const nav = navigation(lenis, door);
  addEventListener('proof:enter', (e) => {
    const { target, x, y } = e.detail;
    door.enter(target, { left: x - 90, top: y - 60, width: 180, height: 120 });
  });
  const hud = hudBar();
  scorer();
  compare();
  const doSim = approvalSim(reduced, (frac, state) => send('setApprove', frac, state));
  const loader = loading(reduced);

  return {
    bind(s) { stage = s; doSim.sync(); },
    finishLoading(onDone) { loader.finish(onDone); },
    frame() { hud.frame(); nav.frame(); },
  };
}

/* ---------- loader ---------- */
// Time-based, so a slow GPU never stalls it. Never blocks longer than SAFETY_MS.
function loading(reduced) {
  const root = document.documentElement;
  const el = $('[data-count]');
  const MIN_MS = 250, END_MS = 200, SAFETY_MS = 6000;
  const t0 = performance.now();
  let p = 0, from = 0, finishedAt = 0, done = null, fired = false;
  const fire = () => {
    if (fired) return;
    fired = true;
    if (el) el.textContent = '100';
    root.classList.add('is-loaded');
    if (done) done();
  };
  const step = (now) => {
    if (fired) return;
    if (!finishedAt) {
      p = 88 * (1 - Math.exp(-(now - t0) / 600));
    } else {
      const k = Math.min(1, (now - finishedAt) / END_MS);
      p = from + (100 - from) * k;
      if (k >= 1 && now - t0 >= MIN_MS) { fire(); return; }
    }
    if (el) el.textContent = String(Math.floor(p)).padStart(3, '0');
    requestAnimationFrame(step);
  };
  if (reduced) root.classList.add('is-loaded');
  else requestAnimationFrame(step);
  setTimeout(() => { if (!fired && !done) { root.classList.add('is-loaded'); } }, SAFETY_MS);
  return {
    finish(onDone) {
      if (reduced || root.classList.contains('is-loaded')) { fired = true; root.classList.add('is-loaded'); onDone(); return; }
      done = onDone;
      from = p;
      finishedAt = performance.now();
      // Do not depend on animation frames alone; a slow GPU must never keep the page covered.
      setTimeout(fire, Math.max(END_MS, MIN_MS - (finishedAt - t0)) + 80);
    },
  };
}

/* ---------- clock + year ---------- */
function clock() {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
  const tick = () => $$('[data-clock]').forEach((el) => { el.textContent = fmt.format(new Date()); });
  tick();
  setInterval(tick, 15000);
  $$('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
}

/* ---------- word-split headings ---------- */
function splitText() {
  $$('.split').forEach((el) => {
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((ch) => {
        if (ch.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.textContent = part;
            inner.style.setProperty('--i', String(i++));
            w.appendChild(inner);
            frag.appendChild(w);
          });
          ch.replaceWith(frag);
        } else if (ch.nodeType === Node.ELEMENT_NODE) {
          walk(ch);
        }
      });
    };
    walk(el);
  });
}

/* ---------- reveal on scroll ---------- */
function reveals() {
  $$('.sec').forEach((sec) => $$('[data-reveal]', sec).forEach((el, i) => el.style.setProperty('--d', `${(i % 6) * 70}ms`)));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('[data-reveal], .split').forEach((el) => io.observe(el));
}

/* ---------- nav: smooth anchors, active link, scrolled state ---------- */
function navigation(lenis, door) {
  const bar = $('[data-nav]');
  const groups = { work: ['work', 'promptforge', 'do', 'finpulse', 'roam'], craft: ['craft', 'process', 'stack'], about: ['about'], contact: ['contact'] };
  const owner = {};
  Object.entries(groups).forEach(([k, ids]) => ids.forEach((id) => { owner[id] = k; }));
  const links = $$('[data-link]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const k = owner[e.target.id];
      links.forEach((a) => a.classList.toggle('is-active', a.dataset.link === k));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => io.observe(s));

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    if (a.dataset.door) {
      const preview = a.querySelector('.door') || a;
      door.enter(id, preview.getBoundingClientRect());
      history.replaceState(null, '', `#${id}`);
      return;
    }
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    history.replaceState(null, '', `#${id}`);
    const focusable = target.querySelector('h1, h2');
    if (focusable) { focusable.setAttribute('tabindex', '-1'); focusable.focus({ preventScroll: true }); }
  });
  return { frame() { bar.classList.toggle('is-scrolled', scrollY > 40); } };
}

/* ---------- HUD: chapter label + page progress ---------- */
function hudBar() {
  const idx = $('[data-hud-index]'), name = $('[data-hud-name]'), fill = $('[data-hud-bar]');
  const secs = $$('[data-label]');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      idx.textContent = String(secs.indexOf(e.target)).padStart(2, '0');
      name.textContent = e.target.dataset.label;
    });
  }, { rootMargin: '-50% 0px -50% 0px' });
  secs.forEach((s) => io.observe(s));
  return {
    frame() {
      const max = document.documentElement.scrollHeight - innerHeight;
      fill.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    },
  };
}

/* ---------- PromptForge idea demo: six-slot check (a simplified stand-in, not the extension) ---------- */
function scorer() {
  const root = $('[data-scorer]');
  if (!root) return;
  const input = $('[data-scorer-input]', root), out = $('[data-scorer-score]', root), arc = $('[data-scorer-arc]', root);
  const hint = $('[data-scorer-hint]', root), fill = $('[data-scorer-fill]', root);
  const words = (t) => (t.trim().match(/\S+/g) || []).length;
  const rules = {
    role: (t) => /\b(you are|act as|as an? [a-z]+|role\s*:)/i.test(t),
    task: (t) => /\b(write|plan|create|build|explain|summari[sz]e|draft|design|list|compare|help|make|generate|review|fix|analy[sz]e)\b/i.test(t),
    context: (t) => /\b(for|because|i am|i'm|my|our|we|audience|background|who)\b/i.test(t) && words(t) >= 8,
    limits: (t) => /\b(under|within|no more than|at most|limit|budget|must|avoid|don't|do not|only|max|by \w+day)\b|\d/i.test(t),
    format: (t) => /\b(table|bullets?|list|json|steps|outline|format|markdown|paragraphs?|checklist|headings?|timeline)\b/i.test(t),
    example: (t) => /\b(example|e\.g\.|for instance|such as|sample)\b/i.test(t),
  };
  const names = { role: 'a role', task: 'a clear task', context: 'context', limits: 'limits', format: 'an output format', example: 'an example' };
  const run = () => {
    const t = input.value;
    const hits = Object.entries(rules).map(([k, fn]) => [k, fn(t)]);
    const n = hits.filter(([, ok]) => ok).length;
    const score = t.trim() ? Math.min(100, Math.round(18 + n * 12 + (Math.min(words(t), 80) / 80) * 10)) : 0;
    out.textContent = String(score);
    arc.style.strokeDashoffset = String(119.4 * (1 - score / 100));
    arc.style.stroke = score < 45 ? 'var(--signal)' : score < 75 ? 'var(--bone)' : 'var(--cobalt)';
    hits.forEach(([k, ok]) => $(`[data-slot="${k}"]`, root).classList.toggle('on', ok));
    const missing = hits.filter(([, ok]) => !ok).map(([k]) => names[k]);
    hint.textContent = !t.trim() ? 'Type a draft to see which parts are missing.'
      : missing.length ? `Try adding ${missing.slice(0, 3).join(', ')}.` : 'Every slot is covered. Review it, then you press Send.';
  };
  input.addEventListener('input', run);
  fill.addEventListener('click', () => {
    input.value = 'You are a friendly event planner. Plan a picnic for 6 friends in Lodhi Gardens this Sunday, budget under ₹2,000, no cooking. Give a checklist and a timeline as bullet points, for example: 10:00 buy fruit.';
    run();
    input.focus();
  });
  run();
}

/* ---------- before / after compare ---------- */
function compare() {
  const root = $('[data-compare]');
  if (!root) return;
  const frame = $('.compare__frame', root), range = $('[data-compare-range]', root);
  const set = (v) => { frame.style.setProperty('--cut', `${v}%`); range.value = String(v); };
  range.addEventListener('input', () => set(range.value));
  let drag = false;
  const move = (e) => { const r = frame.getBoundingClientRect(); set(Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)))); };
  frame.addEventListener('pointerdown', (e) => { drag = true; frame.setPointerCapture(e.pointerId); move(e); });
  frame.addEventListener('pointermove', (e) => { if (drag) move(e); });
  frame.addEventListener('pointerup', () => { drag = false; });
  set(50);
}

/* ---------- DO: plan, hold to approve, receipt (simulation only) ---------- */
function approvalSim(reduced, emit) {
  const root = $('[data-do]');
  const run = $('[data-do-run]', root), hold = $('[data-do-hold]', root), reset = $('[data-do-reset]', root);
  const ring = $('[data-do-ring]', root), holdLabel = $('[data-do-hold-label]', root), receipt = $('[data-do-receipt]', root);
  const items = $$('[data-do-plan] li', root);
  const HOLD_MS = 1100;
  let timers = [], holdStart = 0, raf = 0, holding = false;
  const setState = (s) => { root.dataset.state = s; };
  const ringTo = (f) => { ring.style.strokeDashoffset = String(132 * (1 - f)); };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const write = (lines) => {
    receipt.replaceChildren(...lines.map(([text, cls]) => {
      const p = document.createElement('p');
      if (cls) p.className = cls;
      p.textContent = text;
      return p;
    }));
  };

  function idle() {
    clearTimers(); cancelAnimationFrame(raf); holding = false;
    items.forEach((li) => li.classList.remove('on'));
    run.disabled = false; hold.disabled = true; hold.classList.remove('is-holding');
    holdLabel.textContent = 'Hold to approve';
    ringTo(0); receipt.replaceChildren(); setState('idle'); emit(0, 'idle');
  }
  function plan() {
    if (root.dataset.state !== 'idle') return;
    setState('planning'); run.disabled = true;
    items.forEach((li, i) => timers.push(setTimeout(() => li.classList.add('on'), reduced ? 0 : 420 * (i + 1))));
    timers.push(setTimeout(() => {
      setState('ready'); hold.disabled = false;
      write([['Plan ready. Nothing has run yet.', ''], ['Hold the button to approve, or release early to cancel.', 'mono']]);
    }, reduced ? 0 : 420 * (items.length + 1)));
  }
  function startHold() {
    if (hold.disabled || holding || root.dataset.state !== 'ready') return;
    holding = true; holdStart = performance.now(); hold.classList.add('is-holding'); holdLabel.textContent = 'Keep holding';
    setState('holding');
    const step = (now) => {
      const f = Math.min(1, (now - holdStart) / HOLD_MS);
      ringTo(f); emit(f, 'holding');
      if (f >= 1) { complete(); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }
  function endHold() {
    if (!holding) return;
    holding = false; cancelAnimationFrame(raf); hold.classList.remove('is-holding');
    if (root.dataset.state === 'done') return;
    ringTo(0); emit(0, 'idle'); holdLabel.textContent = 'Hold to approve'; setState('ready');
    write([['Released early. Cancelled, nothing ran.', 'no'], ['Hold for about a second to approve.', 'mono']]);
  }
  function complete() {
    holding = false; hold.classList.remove('is-holding'); hold.disabled = true; holdLabel.textContent = 'Approved';
    setState('done'); emit(1, 'done');
    const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date());
    const ref = `DO-SIM-${Math.floor(1000 + Math.random() * 9000)}`;
    write([
      [`Approved by you at ${time} IST.`, 'ok'],
      [`Simulated payment: ₹1,240 · ref ${ref}`, ''],
      ['No money moved. No account or bank was contacted.', 'mono'],
    ]);
  }

  run.addEventListener('click', plan);
  reset.addEventListener('click', idle);
  hold.addEventListener('pointerdown', (e) => { if (e.button === 0) { hold.setPointerCapture(e.pointerId); startHold(); } });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => hold.addEventListener(ev, endHold));
  hold.addEventListener('keydown', (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(); } });
  hold.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); endHold(); } });
  hold.addEventListener('contextmenu', (e) => e.preventDefault());
  idle();
  return { sync() { emit(0, 'idle'); } };
}

/* ---------- Door transition: the preview flies to full screen, the leaves swing open onto the chapter ---------- */
function doors(lenis, reduced) {
  const names = {
    promptforge: ['PromptForge', 'pf'], do: ['DO', 'do'], finpulse: ['FinPulse X', 'fin'], roam: ['SteadyNest', 'roam'],
    stack: ['Toolbelt', 'pf'], process: ['How I work', 'pf'], about: ['About', 'pf'], craft: ['What I do', 'pf'],
  };
  const FLY_MS = 760, OPEN_MS = 1150;
  let busy = false;
  const jump = (el) => {
    const top = el.getBoundingClientRect().top + scrollY;
    if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
    else window.scrollTo(0, top);
  };
  const focusIn = (el) => {
    const h = el.querySelector('h2, h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  };
  function enter(id, rect) {
    const el = document.getElementById(id);
    if (!el || busy) return;
    if (reduced) { jump(el); focusIn(el); return; }
    busy = true;
    if (lenis) lenis.stop();
    const [label, key] = names[id] || [id, 'pf'];
    const portal = document.createElement('div');
    portal.className = `portal portal--${key}`;
    portal.setAttribute('aria-hidden', 'true');
    const leafL = document.createElement('div'); leafL.className = 'portal__leaf portal__leaf--l'; leafL.appendChild(document.createElement('i'));
    const leafR = document.createElement('div'); leafR.className = 'portal__leaf portal__leaf--r'; leafR.appendChild(document.createElement('i'));
    const seam = document.createElement('span'); seam.className = 'portal__seam';
    const name = document.createElement('span'); name.className = 'portal__label'; name.textContent = label;
    const sill = document.createElement('span'); sill.className = 'portal__sill';
    portal.append(leafL, leafR, seam, name, sill);
    Object.assign(portal.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    document.body.appendChild(portal);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      portal.classList.add('is-flying');
      Object.assign(portal.style, { left: '0px', top: '0px', width: `${innerWidth}px`, height: `${innerHeight}px` });
    }));
    const finish = () => {
      if (portal.parentNode) portal.parentNode.removeChild(portal);
      busy = false;
      if (lenis) lenis.start();
      focusIn(el);
      document.removeEventListener('keydown', onKey);
    };
    const t1 = setTimeout(() => { jump(el); portal.classList.add('is-open'); }, FLY_MS);
    const t2 = setTimeout(finish, FLY_MS + OPEN_MS);
    const onKey = (e) => { if (e.key === 'Escape') { clearTimeout(t1); clearTimeout(t2); jump(el); finish(); } };
    document.addEventListener('keydown', onKey);
  }
  return { enter };
}

/* ---------- FinPulse: the number, then the pattern, then the system. One dataset drives every view. ---------- */
function finStory(reduced, lenis) {
  const root = $('[data-fin-story]');
  const stage = $('.fin__stage', root);
  const rowsEl = $('[data-fin-rows]', root), totalEl = $('[data-fin-total]', root), chart = $('[data-fin-chart]', root);
  const range = $('[data-fin-range]', root), satEl = $('[data-fin-sat]', root), shareEl = $('[data-fin-share]', root);
  const sumEl = $('[data-fin-sum]', root), svg = $('[data-fin-links]', root), tabs = $$('[data-fin-go]', root);
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const NS = 'http://www.w3.org/2000/svg';
  const narrow = () => innerWidth < 860;
  let amounts = [420, 610, 340, 780, 520, 1480, 690];
  let step = -1, shown = 0, tween = 0, counted = false, linkTimer = 0;

  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; };
  const bars = days.map((d, i) => {
    const b = mk('div', `fin__bar${i === 5 ? ' hi' : ''}`);
    const col = mk('i'), v = mk('span', 'v'), dl = mk('span', 'd', d);
    b.append(v, col, dl);
    chart.appendChild(b);
    return { b, v };
  });
  const rows = days.map((d, i) => {
    const li = mk('li', i === 5 ? 'hi' : '');
    const bar = mk('span', 'bar'), fill = mk('i'), v = mk('span', 'v');
    bar.appendChild(fill);
    li.append(mk('span', 'd', d), bar, v);
    rowsEl.appendChild(li);
    return { li, fill, v };
  });

  const total = () => amounts.reduce((s, a) => s + a, 0);
  const setTotal = (n) => { shown = n; totalEl.textContent = inr(n); };
  const countTo = (to, ms) => {
    cancelAnimationFrame(tween);
    if (reduced) { setTotal(to); return; }
    const from = shown, t0 = performance.now();
    const tick = (now) => { const k = Math.min(1, (now - t0) / ms); setTotal(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) tween = requestAnimationFrame(tick); };
    tween = requestAnimationFrame(tick);
  };

  let selected = 5, redrawTimer = 0;
  const svgEl = (tag, attrs) => { const e = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, String(v))); return e; };
  const curve = (a, b) => {
    const bend = Math.max(16, Math.abs(b[0] - a[0]) * 0.48);
    return `M${a[0].toFixed(1)},${a[1].toFixed(1)} C${(a[0] + bend).toFixed(1)},${a[1].toFixed(1)} ${(b[0] - bend).toFixed(1)},${b[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
  };
  function route(d, cls, delay, row) {
    const g = svgEl('g', { class: `route ${cls}` });
    if (row !== undefined) g.dataset.row = String(row);
    g.style.setProperty('--d', `${delay}s`);
    g.append(svgEl('path', { d, class: 'base' }), svgEl('path', { d, class: 'dash', pathLength: 1 }));
    if (!reduced) {
      for (let k = 0; k < 3; k++) {
        const c = svgEl('circle', { r: 2.6 });
        c.appendChild(svgEl('animateMotion', { path: d, dur: row === undefined ? '2.6s' : '3.4s', begin: `${-(delay + k * 1.13).toFixed(2)}s`, repeatCount: 'indefinite' }));
        g.appendChild(c);
      }
    }
    svg.appendChild(g);
  }
  function select(i) {
    selected = i;
    rows.forEach((r, k) => r.li.classList.toggle('sel', k === i));
    bars.forEach((x, k) => x.b.classList.toggle('sel', k === i));
    svg.querySelectorAll('g[data-row]').forEach((g) => g.classList.toggle('hot', Number(g.dataset.row) === i));
  }
  function drawLinks() {
    svg.replaceChildren();
    if (narrow() || step < 1) return;
    const box = stage.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${box.width} ${box.height}`);
    const rel = (el) => { const r = el.getBoundingClientRect(); return { x: r.left - box.left, y: r.top - box.top, w: r.width, h: r.height }; };
    const tops = bars.map((x) => { const b = rel(x.b.querySelector('i')); return [b.x + b.w / 2, b.y - 16]; });
    let td = `M${tops[0][0]},${tops[0][1]}`;
    for (let i = 1; i < tops.length; i++) {
      const [x0, y0] = tops[i - 1], [x1, y1] = tops[i], mx = (x0 + x1) / 2;
      td += ` C${mx},${y0} ${mx},${y1} ${x1},${y1}`;
    }
    svg.appendChild(svgEl('path', { d: td, class: 'trend', pathLength: 1 }));
    tops.forEach(([x, y], i) => svg.appendChild(svgEl('circle', { cx: x, cy: y, r: i === 5 ? 4.5 : 3, class: `node${i === 5 ? ' hi' : ''}` })));
    if (step < 2) return;
    const src = rel($('[data-node="source"]', root)), tr = rel($('[data-node="transform"]', root)), st = rel($('[data-node="state"]', root)), tot = rel(totalEl);
    route(curve([src.x + src.w, src.y + src.h * 0.55], [tr.x, tr.y + tr.h * 0.55]), 'main', 0);
    const sx = tr.x + tr.w * 0.5, sy = tr.y + tr.h, ex = st.x + st.w * 0.6, ey = st.y;
    route(`M${sx},${sy} C${sx},${sy + 30} ${ex},${ey - 30} ${ex},${ey}`, 'main', 0.55);
    rows.forEach((r, i) => {
      const a = rel(r.li), b = rel(bars[i].b.querySelector('i'));
      route(curve([st.x + st.w, a.y + a.h / 2], [b.x + b.w / 2, b.y - 6]), i === selected ? 'hot' : '', 1.05 + i * 0.11, i);
    });
    route(curve([st.x + st.w, st.y + 24], [tot.x - 8, tot.y + tot.h * 0.55]), 'main total', 1.6);
  }
  rows.forEach((r, i) => r.li.addEventListener('pointerenter', () => select(i)));
  const redrawSoon = () => { clearTimeout(redrawTimer); redrawTimer = setTimeout(drawLinks, 60); };

  function render(animate) {
    const t = total(), max = Math.max(...amounts, 1);
    bars.forEach((x, i) => { x.b.style.setProperty('--h', String(amounts[i] / max)); x.v.textContent = inr(amounts[i]); });
    rows.forEach((r, i) => { r.fill.style.setProperty('--v', String(amounts[i] / max)); r.v.textContent = inr(amounts[i]); });
    satEl.textContent = inr(amounts[5]);
    shareEl.textContent = `${Math.round((amounts[5] / t) * 100)}%`;
    sumEl.textContent = `${amounts.join(' + ')} = ${t.toLocaleString('en-IN')}`;
    if (counted) { if (animate) countTo(t, 500); else setTotal(t); }
    if (step >= 1) redrawSoon();
    select(selected);
  }

  function setStep(n) {
    if (n === step) return;
    step = n;
    stage.dataset.step = String(n);
    tabs.forEach((b) => b.setAttribute('aria-current', String(Number(b.dataset.finGo) === n)));
    clearTimeout(linkTimer);
    svg.replaceChildren();
    if (n >= 1) linkTimer = setTimeout(drawLinks, reduced ? 0 : 1150);
  }
  chart.addEventListener('transitionend', (e) => { if (step >= 1 && (e.target === chart || e.propertyName === 'height')) redrawSoon(); });

  range.addEventListener('input', () => { amounts = amounts.map((a, i) => (i === 5 ? Number(range.value) : a)); render(true); });
  tabs.forEach((b) => b.addEventListener('click', () => {
    const r = root.getBoundingClientRect();
    const span = root.offsetHeight - innerHeight;
    const top = r.top + scrollY + span * [0.05, 0.47, 0.85][Number(b.dataset.finGo)];
    if (lenis) lenis.scrollTo(top, { duration: 1.2 }); else window.scrollTo({ top, behavior: 'smooth' });
  }));
  addEventListener('resize', () => { if (step >= 1) redrawSoon(); });

  setTotal(reduced ? total() : 0);
  if (reduced) counted = true;
  render(false);
  return {
    frame() {
      const r = root.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      if (!counted && r.top < innerHeight * 0.6) { counted = true; countTo(total(), 1400); }
      if (narrow() || reduced) { setStep(2); return; }
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, root.offsetHeight - innerHeight)));
      setStep(p < 0.3 ? 0 : p < 0.64 ? 1 : 2);
    },
  };
}

/* ---------- ROAM tour: scroll drives the camera, the route and the card. Phones auto-cycle. ---------- */
function stops(emit, emitRoam, lenis, reduced) {
  const root = $('#roam');
  const detail = $('[data-roam-detail]', root);
  const buttons = $$('[data-stop]', root);
  const rail = $$('.tour li', root);
  const data = [
    { name: 'India Gate', text: 'The war memorial arch on Kartavya Path. Start early, walk the lawns, then head west.', next: 'Next: National Museum, about 1 km west', hi: 'Museum yahan se kitni door hai?', en: 'How far is the museum from here?' },
    { name: 'National Museum', text: 'On Janpath, a short walk from India Gate. Plan two hours inside.', next: 'Next: Lodhi Gardens, about 2 km south', hi: 'Ticket kahan milega?', en: 'Where do I get a ticket?' },
    { name: 'Lodhi Gardens', text: 'Green lawns around 15th and 16th-century tombs. End the day here before sunset.', next: 'Day complete: three stops', hi: 'Gate kab band hota hai?', en: 'When does the gate close?' },
  ];
  const phases = [
    { name: 'Arrive in central Delhi', text: 'Three stops, one day, about 3 km. The camera flies to each stop and the route draws itself as you scroll.', next: 'First stop: India Gate' },
    ...data,
    { name: 'The whole day', text: 'India Gate, National Museum and Lodhi Gardens, each placed on real streets with the words you need there.', next: 'Scroll on, or pick a stop to revisit it' },
  ];
  const centers = [0.05, 0.25, 0.485, 0.72, 0.97];
  const pinMq = matchMedia('(min-width: 861px) and (prefers-reduced-motion: no-preference)');
  const CYCLE_MS = 3600;
  let phase = -1, cycle = 0, lastSwitch = 0, inView = false;

  const io = new IntersectionObserver((entries) => { inView = entries.some((e) => e.isIntersecting); }, { threshold: 0.25 });
  io.observe(root);

  function show(ph) {
    if (ph === phase) return;
    phase = ph;
    const d = phases[ph];
    buttons.forEach((b, k) => b.setAttribute('aria-pressed', String(k === ph - 1)));
    rail.forEach((li, k) => { li.classList.toggle('is-done', k < ph); li.classList.toggle('is-now', k === ph); });
    const h = document.createElement('h3'); h.textContent = d.name;
    const p = document.createElement('p'); p.textContent = d.text;
    const n = document.createElement('p'); n.className = 'mono'; n.textContent = d.next;
    const parts = [h, p, n];
    if (d.hi) {
      const ph2 = document.createElement('p'); ph2.className = 'phrase';
      const em = document.createElement('em'); em.textContent = `“${d.hi}”`;
      ph2.append(em, document.createTextNode(` → ${d.en}`));
      parts.push(ph2);
    }
    detail.replaceChildren(...parts);
    detail.classList.remove('swap'); void detail.offsetWidth; detail.classList.add('swap');
  }
  const scrollToPhase = (ph) => {
    const r = root.getBoundingClientRect();
    const top = r.top + scrollY + (root.offsetHeight - innerHeight) * centers[ph];
    if (lenis) lenis.scrollTo(top, { duration: 1.4 }); else window.scrollTo({ top, behavior: 'smooth' });
  };
  buttons.forEach((b) => b.addEventListener('click', () => {
    const i = Number(b.dataset.stop);
    if (pinMq.matches) { scrollToPhase(i + 1); return; }
    cycle = i; lastSwitch = performance.now() + 4000; show(i + 1); emit(i);
  }));

  show(1);
  emit(0);
  return {
    sync() { emit(Math.max(0, phase - 1)); },
    frame() {
      if (pinMq.matches) {
        const r = root.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const p = Math.min(1, Math.max(0, -r.top / Math.max(1, root.offsetHeight - innerHeight)));
        emitRoam(p);
        show(p < 0.14 ? 0 : p < 0.37 ? 1 : p < 0.6 ? 2 : p < 0.84 ? 3 : 4);
        return;
      }
      emitRoam(null);
      if (!inView || reduced) return;
      const now = performance.now();
      if (now - lastSwitch > CYCLE_MS) {
        lastSwitch = now;
        cycle = (cycle + 1) % data.length;
        show(cycle + 1);
        emit(cycle);
      }
    },
  };
}
