// SteadyNest map chapter, ported from the earlier ChatGPT portfolio (RoamChapter.tsx). Same markup classes,
// same scroll choreography: India Gate photograph -> aperture -> phrase -> particles -> 3D atlas flight -> itinerary.
import { isPortraitScene } from '../roam/scene-layout.js?v=14';

const places = [
  { name: 'India Gate', time: '09:00', category: 'A place to begin', description: 'Start with a landmark. Give the day an anchor.', coordinates: '28.6129° N / 77.2295° E' },
  { name: 'National Museum', time: '11:00', category: 'A little cultural context', description: 'A phrase becomes a place. The next stop feels familiar.', coordinates: '28.6116° N / 77.2193° E' },
  { name: 'Lodhi Gardens', time: '15:00', category: 'Room to slow down', description: 'Finish in the gardens. Leave a little space in the plan.', coordinates: '28.5935° N / 77.2196° E' },
];
const beats = [{ name: 'Arrive', p: 0.065 }, { name: 'Find the words', p: 0.365 }, { name: 'Connect', p: 0.55 }, { name: 'Explore', p: 0.91 }];
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const smooth = (a, b, n) => { const t = clamp((n - a) / (b - a)); return t * t * (3 - 2 * t); };

function template() {
  const wave = Array.from({ length: 29 }, (_, i) => `<i style="height:${8 + Math.sin(i * 0.61) ** 2 * 36}px;animation-delay:${i * 51}ms"></i>`).join('');
  const pins = places.map((p, i) => `<button type="button" class="rm-place-pin" data-i="${i}" aria-label="Select ${p.name}"><span>0${i + 1}</span><b>${p.name}</b><i>↗</i></button>`).join('');
  const list = places.map((p, i) => `<li><button type="button" data-i="${i}"><span>0${i + 1}</span><strong>${p.name}</strong><small>${p.time}</small><i>↗</i></button></li>`).join('');
  const nav = beats.map((b, i) => `<button type="button" data-jump="${i}"><span>0${i + 1}</span>${b.name}</button>`).join('');
  return `<div class="rm-pin">
  <div class="rm-world" id="rm-places">
    <div class="rm-map-fallback" aria-hidden="true"><img src="assets/img/steady-original-map.webp" alt="" /></div>
    <canvas class="rm-canvas" role="img" aria-label="Three-dimensional map of central New Delhi with raised connections between India Gate, National Museum and Lodhi Gardens"></canvas>
    <div class="rm-map-grain" aria-hidden="true"></div>
    ${pins}
  </div>
  <div class="rm-photograph" id="rm-arrive">
    <picture><source media="(max-width:700px)" srcset="assets/img/india-gate-dawn-1280.webp" /><img class="rm-photo-image" src="assets/img/india-gate-dawn-2560.webp" width="2560" height="1707" alt="" decoding="async" /></picture>
    <div class="rm-photo-shade" aria-hidden="true"></div><div class="rm-landmark-reticle" aria-hidden="true"><i></i><span>INDIA GATE / THE STARTING POINT</span></div>
    <div class="rm-photo-credit"><a href="https://commons.wikimedia.org/wiki/File:India_Gate_.jpg" target="_blank" rel="noreferrer">India Gate · Thebrowniris</a><span> / </span><a href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">CC BY-SA 3.0</a><small>Resized · WebP</small></div>
  </div>
  <header class="rm-chapter-meta"><span>06 / STEADYNEST</span><span>One city. A little more understanding.</span></header>
  <div class="rm-opening"><p class="rm-eyebrow">New Delhi / 28.61° N · 77.21° E</p><h2 id="rm-title">Find<br />your <em>way.</em></h2><p>A place becomes a phrase.<br />A phrase becomes a plan.</p><span class="rm-scroll-note">Scroll to discover the connection ↓</span></div>
  <div class="rm-words" id="rm-words" aria-label="Example Hindi to English phrase: संग्रहालय कहाँ है? Where is the museum?">
    <p class="rm-eyebrow">01 / Find the words</p>
    <div class="rm-wave" aria-hidden="true">${wave}</div>
    <div class="rm-language-stack"><h3 class="rm-hindi" lang="hi">संग्रहालय<br />कहाँ है?</h3><h3 class="rm-english">Where is<br />the <em class="rm-word-origin">museum?</em></h3></div>
    <div class="rm-translation-meta"><span>हिन्दी</span><i>↔</i><span>English</span><b>Example translation</b></div>
  </div>
  <canvas class="rm-phrase-particles" aria-hidden="true"></canvas>
  <div class="rm-camera-copy" aria-hidden="true"><span class="rm-eyebrow">02 / Make the connection</span><p>Every stop.<br /><em>Part of the story.</em></p><span>India Gate → National Museum → Lodhi Gardens</span></div>
  <div class="rm-itinerary" id="rm-itinerary">
    <p class="rm-eyebrow">03 / A day, connected</p><h3>A little<br /><em>less lost.</em></h3>
    <ol>${list}</ol>
    <div class="rm-place-detail" aria-live="polite"><span data-cat></span><p data-desc></p><small data-coord></small></div>
  </div>
  <div class="rm-map-caption"><span>NEW DELHI / CITY IN MINIATURE</span><span>Real footprints · illustrated heights</span></div>
  <footer class="rm-footer"><nav aria-label="SteadyNest story chapters">${nav}</nav><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a><span class="rm-progress-line" aria-hidden="true"></span></footer>
</div>`;
}

export function initRoam(el, lenis) {
  el.classList.add('rm-story');
  el.dataset.theme = 'paper';
  el.setAttribute('aria-labelledby', 'rm-title');
  el.innerHTML = template();
  const motionReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.dataset.rmReduced = String(motionReduced);
  const panel = el.querySelector('.rm-pin'), stage = el.querySelector('.rm-world'), canvas = el.querySelector('.rm-canvas');
  const photograph = el.querySelector('.rm-photograph'), itinerary = el.querySelector('.rm-itinerary');
  const particleCanvas = el.querySelector('.rm-phrase-particles'), particleInk = particleCanvas.getContext('2d');
  const english = el.querySelector('.rm-english'), origin = el.querySelector('.rm-word-origin');
  const markers = [...el.querySelectorAll('.rm-place-pin')];
  let api = null, progress = 0, selected = 1, lastBeat = -1;
  let frame = 0, layoutFrame = 0, sectionTop = 0, scrollLength = 1, width = 1, height = 1, sourceX = 0, sourceY = 0, pixelRatio = 1;
  let dots = [], labelSizes = places.map(() => ({ width: 150, height: 38 }));

  function showPlace(i) {
    markers.forEach((m, k) => { m.classList.toggle('is-selected', k === i); m.setAttribute('aria-pressed', String(k === i)); });
    el.querySelectorAll('.rm-itinerary button').forEach((b, k) => b.setAttribute('aria-pressed', String(k === i)));
    el.querySelector('[data-cat]').textContent = places[i].category;
    el.querySelector('[data-desc]').textContent = places[i].description;
    el.querySelector('[data-coord]').textContent = places[i].coordinates;
  }
  const choose = (i) => { selected = i; showPlace(i); if (api) api.update(progress, i); };

  const offsetWithinPanel = (node) => { let x = 0, y = 0, c = node; while (c && c !== panel) { x += c.offsetLeft; y += c.offsetTop; c = c.offsetParent; } return { x, y }; };
  function cacheLayout() {
    layoutFrame = 0;
    width = Math.max(1, stage.clientWidth); height = Math.max(1, stage.clientHeight);
    sectionTop = el.getBoundingClientRect().top + window.scrollY;
    scrollLength = Math.max(1, el.offsetHeight - window.innerHeight);
    labelSizes = markers.map((m) => ({ width: m.offsetWidth || 150, height: m.offsetHeight || 38 }));
    pixelRatio = Math.min(devicePixelRatio || 1, 1.5);
    particleCanvas.width = Math.round(width * pixelRatio); particleCanvas.height = Math.round(height * pixelRatio);
    if (particleInk) particleInk.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const off = offsetWithinPanel(english); sourceX = off.x; sourceY = off.y;
    const font = getComputedStyle(english), accent = getComputedStyle(origin);
    const size = parseFloat(font.fontSize), line = parseFloat(font.lineHeight) || size;
    const sample = document.createElement('canvas'); sample.width = Math.ceil(english.offsetWidth + 8); sample.height = Math.ceil(line * 2 + 8);
    const ink = sample.getContext('2d', { willReadFrequently: true });
    if (ink && sample.width > 8) {
      ink.fillStyle = '#020000'; ink.font = `${font.fontWeight} ${size}px ${font.fontFamily}`;
      ink.fillText('Where is', 0, size * 0.82); ink.fillText('the ', 0, line + size * 0.82);
      const prefix = ink.measureText('the ').width;
      ink.font = `italic ${accent.fontWeight} ${parseFloat(accent.fontSize)}px ${accent.fontFamily}`;
      ink.fillText('museum?', prefix, line + size * 0.82);
      const image = ink.getImageData(0, 0, sample.width, sample.height), result = [], step = width < 700 ? 4 : 5;
      for (let y = 0; y < sample.height; y += step) for (let x = 0; x < sample.width; x += step) {
        if (image.data[(y * sample.width + x) * 4 + 3] > 80) result.push({ x, y, seed: ((x * 37 + y * 17) % 101) / 101 });
      }
      dots = result;
    }
    measure();
  }
  const scheduleLayout = () => { if (!layoutFrame) layoutFrame = requestAnimationFrame(cacheLayout); };

  function renderFrame(points, p) {
    const s = el.style;
    s.setProperty('--rm-photo', String(1 - smooth(0.215, 0.235, p)));
    s.setProperty('--rm-reveal', `${150 * smooth(0.115, 0.215, p)}%`);
    s.setProperty('--rm-opening', String(1 - smooth(0.09, 0.145, p)));
    s.setProperty('--rm-phrase', String(smooth(0.255, 0.285, p) * (1 - smooth(0.43, 0.48, p))));
    s.setProperty('--rm-hindi', String(1 - smooth(0.3, 0.325, p)));
    s.setProperty('--rm-english', String(smooth(0.335, 0.36, p) * (1 - smooth(0.39, 0.435, p))));
    s.setProperty('--rm-itinerary', String(smooth(0.82, 0.885, p)));
    s.setProperty('--rm-sweep', String(smooth(0.52, 0.58, p) * (1 - smooth(0.78, 0.84, p))));
    s.setProperty('--rm-progress', String(p));
    el.dataset.theme = p < 0.17 ? 'dark' : 'paper';
    const currentBeat = p < 0.22 ? 0 : p < 0.46 ? 1 : p < 0.82 ? 2 : 3;
    el.dataset.rmBeat = String(currentBeat);
    itinerary.inert = !motionReduced && p < 0.82;
    photograph.inert = !motionReduced && p > 0.22;
    if (currentBeat !== lastBeat) { lastBeat = currentBeat; el.querySelectorAll('.rm-footer button').forEach((b, i) => { if (i === currentBeat) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); }); }
    const placed = [];
    const focus = p < 0.53 ? 1 : p < 0.615 ? 0 : p < 0.7 ? 1 : 2;
    points.forEach((point, i) => {
      const marker = markers[i]; if (!marker) return;
      const size = labelSizes[i] || { width: 150, height: 38 }, compact = isPortraitScene(width, height);
      const minimumX = compact || motionReduced ? 18 : width * 0.43;
      let x = clamp(point.x, minimumX + size.width / 2, width - 18 - size.width / 2);
      const minimumY = (motionReduced ? 18 : compact ? 148 : 150) + size.height;
      const maximumY = height - (motionReduced ? 24 : 115);
      let y = clamp(point.y, minimumY, maximumY);
      const show = point.visible && p > 0.455 && point.x > -24 && point.x < width + 24 && point.y > (motionReduced ? 18 : 105) && point.y < height - (motionReduced ? 24 : 78) && (motionReduced || (p > 0.84 ? (!compact || i === selected) : i === focus));
      if (show) {
        for (const box of placed) {
          if (x + size.width / 2 + 8 > box.left && x - size.width / 2 - 8 < box.right && y - 14 > box.top && y - size.height - 14 < box.bottom) {
            y = clamp(box.bottom + size.height + 26, minimumY, maximumY);
            if (y - size.height - 14 < box.bottom) x = clamp(box.left - size.width / 2 - 14, minimumX + size.width / 2, width - 18 - size.width / 2);
          }
        }
        placed.push({ left: x - size.width / 2, right: x + size.width / 2, top: y - size.height - 14, bottom: y - 14 });
      }
      const leaderFromTop = point.y < y - size.height - 14;
      const dx = point.x - x, dy = point.y - (leaderFromTop ? y - size.height - 14 : y - 14);
      marker.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,calc(-100% - 14px))`;
      marker.style.setProperty('--rm-leader-top', leaderFromTop ? '0%' : '100%');
      marker.style.setProperty('--rm-leader-length', show ? `${Math.hypot(dx, dy)}px` : '0px');
      marker.style.setProperty('--rm-leader-angle', `${(Math.atan2(dy, dx) * 180) / Math.PI - 90}deg`);
      marker.style.opacity = show ? '1' : '0'; marker.style.pointerEvents = show ? 'auto' : 'none'; marker.tabIndex = show ? 0 : -1; marker.setAttribute('aria-hidden', show ? 'false' : 'true');
    });
    if (particleInk) {
      particleInk.clearRect(0, 0, width, height);
      if (!motionReduced && p > 0.382 && p < 0.535 && points[1]) {
        const t = smooth(0.39, 0.52, p), target = points[1];
        particleInk.fillStyle = '#df3b16'; particleInk.globalAlpha = smooth(0.382, 0.405, p) * (1 - smooth(0.51, 0.535, p));
        particleInk.beginPath();
        const d = width < 700 ? 1.3 : 1.6;
        dots.forEach((dot) => {
          const q = smooth(0, 1, clamp((t - dot.seed * 0.12) / 0.88));
          const sx = sourceX + dot.x, sy = sourceY + dot.y;
          const arc = Math.sin(q * Math.PI), spread = Math.sin(Math.min(1, t * 3) * Math.PI) * 10;
          const x = sx + (target.x - sx) * q + Math.sin(dot.seed * 43) * spread * (1 - q);
          const y = sy + (target.y - sy) * q - arc * (55 + dot.seed * 50) + Math.cos(dot.seed * 31) * spread;
          particleInk.rect(x, y, d, d);
        });
        particleInk.fill(); particleInk.globalAlpha = 1;
      }
    }
  }
  const fallback = (p) => renderFrame([{ x: width * 0.74, y: height * 0.4, visible: true }, { x: width * 0.58, y: height * 0.43, visible: true }, { x: width * 0.6, y: height * 0.73, visible: true }], p);
  function measure() {
    frame = 0;
    const p = motionReduced ? 1 : clamp((window.scrollY - sectionTop) / scrollLength);
    progress = p;
    if (api) api.update(p, selected); else fallback(p);
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };

  const io = new IntersectionObserver((entries) => {
    if (!entries.some((e) => e.isIntersecting) || api) return;
    io.disconnect();
    import('../roam/RoamStage.js?v=16').then((m) => {
      try {
        api = m.mountRoamStage(canvas, stage, { reduced: motionReduced, onFrame: renderFrame, onReady: () => { el.dataset.rmReady = 'true'; }, onError: () => { el.dataset.rmFailed = 'true'; } });
        api.update(progress, selected);
      } catch (err) { el.dataset.rmFailed = 'true'; }
    }).catch(() => { el.dataset.rmFailed = 'true'; });
  }, { rootMargin: '100% 0px' });
  io.observe(el);

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', scheduleLayout, { passive: true });
  addEventListener('load', scheduleLayout);
  const observer = new ResizeObserver(scheduleLayout);
  [el, panel, stage, document.body, itinerary, ...markers].forEach((n) => observer.observe(n));
  document.fonts.ready.then(scheduleLayout);

  markers.forEach((m, i) => m.addEventListener('click', () => choose(i)));
  el.querySelectorAll('.rm-itinerary button').forEach((b, i) => b.addEventListener('click', () => choose(i)));
  el.querySelectorAll('.rm-footer button').forEach((b, i) => b.addEventListener('click', () => {
    if (motionReduced) { document.getElementById(['rm-arrive', 'rm-words', 'rm-places', 'rm-itinerary'][i])?.scrollIntoView({ behavior: 'auto', block: 'center' }); return; }
    if (lenis) { lenis.stop(); lenis.start(); lenis.resize(); }
    const top0 = el.getBoundingClientRect().top + window.scrollY;
    const end = top0 + Math.max(0, el.offsetHeight - window.innerHeight);
    sectionTop = top0; scrollLength = Math.max(1, end - top0);
    const top = Math.max(top0, Math.min(end, top0 + beats[i].p * (end - top0)));
    if (lenis) lenis.scrollTo(top, { duration: 0.9, force: true, lock: true, easing: (t) => 1 - Math.pow(1 - t, 3) }); else window.scrollTo({ top, behavior: 'smooth' });
  }));

  showPlace(1);
  cacheLayout();
}
