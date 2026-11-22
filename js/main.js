import Lenis from '../vendor/lenis.mjs';
import { initHero } from './hero.js?v=17';
import { initChapterLinks } from './transitions.js?v=14';
// Boot: smooth scroll (optional), page UI, then the 3D stage if WebGL and the CDN are available.
import { initUI } from './ui.js?v=15';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initFinPulse } from './chapters/finpulse.js?v=15';
import { initRoam } from './chapters/roam.js?v=16';

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPower = matchMedia('(max-width: 860px)').matches || (navigator.hardwareConcurrency || 4) <= 4;
const webgl = (() => {try {const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));} catch {return false;}})();

let lenis = null;
if (!reduced) {
  try {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, touchMultiplier: 1.2 });
  } catch (err) {
    lenis = null;
  }
}
const getScroll = () => (lenis ? lenis.scroll : window.scrollY);

if (lenis) lenis.on('scroll', ScrollTrigger.update);
initFinPulse(document.getElementById('finpulse'), lenis);
initRoam(document.getElementById('roam'), lenis);

initChapterLinks();
const ui = initUI({ lenis, reduced });
if (webgl && !reduced) {
  initHero({ reduced }).then(scene => {if(!scene) root.classList.add('no-hero-webgl');}).catch(() => root.classList.add('no-hero-webgl'));
} else root.classList.add('no-hero-webgl');

let stage = null;
if (webgl && !reduced && !lowPower) {
  try {
    const mod = await import('./stage.js?v=14');
    stage = await mod.createStage(document.getElementById('stage'), { reduced, getScroll });
  } catch (err) {
    stage = null;
  }
}

if (stage) ui.bind(stage);
else root.classList.add('no-webgl');

ui.finishLoading(() => { if (stage) stage.startIntro(); });

let hidden = document.hidden;
document.addEventListener('visibilitychange', () => { hidden = document.hidden; });
// When a GPU is absent, the original proof image still gets the same scroll-in / zoom-out arc.
const heroSection = document.getElementById('top');
function updateFallbackProof() {
  if (!root.classList.contains('no-hero-webgl')) return;
  const p=Math.max(0,Math.min(1,-heroSection.getBoundingClientRect().top/Math.max(1,heroSection.offsetHeight-innerHeight)));
  root.style.setProperty('--proof-zoom',String(1+p*.08));
  root.style.setProperty('--proof-opacity',String(Math.max(0,1-(p-.85)*6.7)));
}
addEventListener('scroll',updateFallbackProof,{passive:true});updateFallbackProof();
let heroVisible = true;
const heroObserver = new IntersectionObserver(([e]) => {heroVisible = e.isIntersecting;}, { threshold: 0.02 });
heroObserver.observe(document.getElementById('top'));
let lastStageFrame = 0;

function tick(now) {
  if (lenis) lenis.raf(now);
  // Avoid two WebGL renders at once while the lake-proof shot occupies the viewport.
  if (stage && !hidden && !heroVisible && now - lastStageFrame > 33) {
    lastStageFrame = now;
    stage.frame(now);
  }
  ui.frame();
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

// Chapter climates: whichever chapter holds the middle of the screen sets the page background.
const climates = [...document.querySelectorAll('[data-bg]')];
const climateIO = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting && e.target.dataset.bg) {
      document.body.style.backgroundColor = e.target.dataset.bg;
    }
  });
}, { rootMargin: '-40% 0px -40% 0px' });
climates.forEach((el) => climateIO.observe(el));
