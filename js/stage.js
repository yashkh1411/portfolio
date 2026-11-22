// The 3D stage: one floating object per chapter, lit like a product shot, with drifting dust.
// Scroll position is the single progress source; each object rises in, holds, and lifts out.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as O from './shapes.js?v=14';
import { proofs } from './proofs.js?v=14';

const smooth = (a, b, t) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);
const FOV = 35, CAM_Z = 12, NARROW = 860;

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{ reduced: boolean, getScroll: () => number }} opts
 */
export async function createStage(canvas, { reduced, getScroll }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (err) {
    return null;
  }
  const isNarrow = () => innerWidth < NARROW;
  const lowPower = isNarrow() || (navigator.hardwareConcurrency || 4) <= 4;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, lowPower ? 1.5 : 1.75));
  renderer.setClearColor(0x020000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, innerWidth / innerHeight, 0.1, 100);
  camera.position.set(0, 0, CAM_Z);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xf4f2f0, 1.4);
  key.position.set(4, 6, 7);
  const rim = new THREE.DirectionalLight(0xdedcda, 1.6);
  rim.position.set(-6, 2, -5);
  scene.add(key, rim, new THREE.AmbientLight(0xfffffd, 0.12));

  try {
    await Promise.all([document.fonts.load('600 120px "Host Grotesk"'), document.fonts.load('400 30px "Geist Mono"')]);
  } catch (err) { /* fallback fonts are fine */ }

  const M = O.makeMaterials(lowPower);

  // Soft contact shadow: one radial-gradient texture, one plane per object, kept on the "floor" below it.
  const shadowCv = document.createElement('canvas');
  shadowCv.width = shadowCv.height = 128;
  const sctx = shadowCv.getContext('2d');
  const grad = sctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(23,21,19,0.55)');
  grad.addColorStop(0.5, 'rgba(23,21,19,0.18)');
  grad.addColorStop(1, 'rgba(23,21,19,0)');
  sctx.fillStyle = grad;
  sctx.fillRect(0, 0, 128, 128);
  const shadowTex = new THREE.CanvasTexture(shadowCv);
  const shadowGeo = new THREE.PlaneGeometry(1, 1);

  const objects = {};
  const mount = (name, obj, [shadowY, shadowW]) => {
    const root = new THREE.Group();
    root.visible = false;
    root.add(obj.group);
    scene.add(root);
    const shadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, toneMapped: false }));
    shadow.visible = false;
    scene.add(shadow);
    objects[name] = { ...obj, root, shadow, shadowY, shadowW, phase: Object.keys(objects).length * 1.3 };
  };
  mount('proofs', proofs(), [-1.75, 6.4]);
  mount('lattice', O.lattice(M), [-2.1, 5]);
  mount('chip', O.chip(M), [-1.55, 3.8]);
  mount('braid', O.braid(M), [-1.9, 7]);
  mount('rail', O.rail(M), [-1.2, 5.5]);
  mount('plane', O.plane(M), [-1.3, 3.2]);

  const dust = O.dust(lowPower ? 420 : 900);
  scene.add(dust.points);

  fetch('assets/data/delhi-data.geojson')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((d) => objects.proofs.setMap(d))
    .catch(() => { /* the hero card keeps its simple map drawing */ });

  const img = new Image();
  img.decoding = 'async';
  img.onload = () => mount('portrait', O.portrait(M, img), [-2.2, 3.4]);
  img.src = 'assets/img/yash-studio-672.webp';

  /* ---------- anchors from sections ---------- */
  const sections = [...document.querySelectorAll('[data-shape]')];
  let anchors = [];
  function measure() {
    const narrow = isNarrow();
    const sy = getScroll();
    anchors = sections.map((el) => {
      const r = el.getBoundingClientRect();
      const d = el.dataset;
      const num = (k, def) => (d[k] !== undefined ? parseFloat(d[k]) : def);
      const base = { x: num('x', 0), y: num('y', 0), s: num('s', 1) };
      const p = narrow ? { x: num('mx', 0), y: num('my', base.y), s: num('ms', base.s) } : base;
      const top = r.top + sy;
      const pinned = el.hasAttribute('data-pin') && r.height > innerHeight * 1.6;
      const at = top + r.height / 2;
      return { ...p, el, shape: d.shape, at, from: pinned ? top + innerHeight * 0.5 : at, to: pinned ? top + r.height - innerHeight * 0.5 : at };
    });
  }

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    measure();
  }
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(resize, 120); });
  new ResizeObserver(() => { clearTimeout(rT); rT = setTimeout(measure, 200); }).observe(document.body);
  resize();

  /* ---------- input ---------- */
  const mouse = new THREE.Vector2(), mouseS = new THREE.Vector2(), zero = new THREE.Vector2();
  let pointerActive = false;
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    pointerActive = true;
    mouse.set((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { pointerActive = false; });

  /* ---------- hero proof ring: hover, drag to spin, click to enter a chapter ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hoverMesh = null, down = null;
  const isControl = (el) => !!(el && el.closest && el.closest('a,button,input,textarea,label,select,.card'));
  const pickCard = (x, y) => {
    const p = objects.proofs;
    if (!p || !p.root.visible) return null;
    ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(p.cards, false)[0];
    return hit ? hit.object : null;
  };
  const setHover = (m) => {
    if (m === hoverMesh) return;
    hoverMesh = m;
    objects.proofs.setHover(m);
    document.documentElement.classList.toggle('proof-hover', !!m);
  };
  addEventListener('pointermove', (e) => {
    if (down) {
      if (Math.abs(e.clientX - down.x) > 6 || Math.abs(e.clientY - down.y) > 6) down.moved = true;
      if (down.moved && e.pointerType !== 'touch') objects.proofs.drag(e.clientX - down.lastX);
      down.lastX = e.clientX;
      return;
    }
    if (e.pointerType === 'touch') return;
    setHover(isControl(e.target) ? null : pickCard(e.clientX, e.clientY));
  }, { passive: true });
  addEventListener('pointerdown', (e) => {
    if (isControl(e.target) || !pickCard(e.clientX, e.clientY)) return;
    down = { x: e.clientX, y: e.clientY, lastX: e.clientX, moved: false };
  });
  addEventListener('pointerup', (e) => {
    if (!down) return;
    const d = down;
    down = null;
    if (d.moved) return;
    const hit = pickCard(e.clientX, e.clientY);
    if (hit) dispatchEvent(new CustomEvent('proof:enter', { detail: { target: hit.userData.target, x: e.clientX, y: e.clientY } }));
  });

  /* ---------- progress ---------- */
  function targetProgress() {
    const pos = getScroll() + innerHeight * 0.5;
    const last = anchors.length - 1;
    if (pos <= anchors[0].to) return 0;
    if (pos >= anchors[last].from) return last;
    for (let k = 0; k < last; k++) {
      if (pos <= anchors[k].to) return k;
      if (pos < anchors[k + 1].from) {
        const t = (pos - anchors[k].to) / (anchors[k + 1].from - anchors[k].to);
        return k + (reduced ? (t < 0.5 ? 0 : 1) : smooth(0.18, 0.82, t));
      }
    }
    return last;
  }

  let P = 0;
  let introStart = reduced ? 0 : -1;
  let last = performance.now();
  const createdAt = last;
  const INTRO_SAFETY_MS = 5000;
  const pending = { stop: 0 };

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = now / 1000;
    const target = targetProgress();
    P = reduced ? target : lerp(P, target, 1 - Math.pow(0.0015, dt));
    mouseS.lerp(pointerActive && !reduced ? mouse : zero, 1 - Math.pow(0.01, dt));
    if (introStart < 0 && now - createdAt > INTRO_SAFETY_MS) introStart = now;
    const intro = introStart < 0 ? 0 : reduced ? 1 : easeOut(Math.min(1, (now - introStart) / 1800));
    const narrowNow = isNarrow();

    Object.entries(objects).forEach(([name, o]) => {
      let best = -1, bestD = Infinity;
      anchors.forEach((a, k) => { if (a.shape === name && Math.abs(P - k) < bestD) { bestD = Math.abs(P - k); best = k; } });
      if (best < 0) { o.root.visible = false; o.shadow.visible = false; return; }
      let w = Math.max(0, 1 - bestD);
      if (best === 0) w *= intro;
      // Phones: the object owns the space above its chapter heading and gives way as the text scrolls up.
      if (narrowNow && best > 0) {
        const top = anchors[best].el.getBoundingClientRect().top;
        w *= Math.min(1, Math.max(0, (top + innerHeight * 0.28) / (innerHeight * 0.28)));
      }
      const e = easeInOut(w);
      o.root.visible = e > 0.01;
      o.shadow.visible = o.root.visible;
      if (!o.root.visible) return;
      const a = anchors[best];
      const dir = P < best ? -1 : 1;
      const bob = reduced ? 0 : Math.sin(t * 0.8 + o.phase) * 0.09;
      o.root.position.set(a.x + mouseS.x * 0.15, a.y + bob + dir * (1 - e) * (reduced ? 0 : 1.8), 0);
      o.root.scale.setScalar(a.s * (reduced ? 1 : 0.35 + 0.65 * e) * (reduced ? (e > 0.5 ? 1 : 0.0001) : 1));
      o.root.rotation.set(-mouseS.y * 0.12 + (reduced ? 0 : dir * (1 - e) * 0.35), mouseS.x * 0.22 + (reduced ? 0 : dir * (1 - e) * 0.9), 0);
      o.tick(t, dt, { reduced, presence: e, mouse: mouseS });
      const sw = o.shadowW * a.s * e * (1 - bob * 0.8);
      o.shadow.position.set(a.x, a.y + o.shadowY * a.s, -1.2);
      o.shadow.scale.set(sw, sw * 0.2, 1);
      o.shadow.material.opacity = e * (0.85 - bob * 2);
    });

    dust.uniforms.uTime.value = reduced ? 0 : t;
    dust.uniforms.uScroll.value = getScroll() / innerHeight;
    dust.points.rotation.y = mouseS.x * 0.06;
    dust.points.rotation.x = -mouseS.y * 0.04;
    renderer.render(scene, camera);
  }

  return {
    frame,
    startIntro() { if (introStart < 0) introStart = performance.now(); },
    setStop(i) { pending.stop = i; if (objects.city) objects.city.setStop(i); },
    setRoam(p) { pending.roam = p; if (objects.city) objects.city.setProgress(p); },
    setApprove(frac, state) { objects.braid.setApprove(frac, state); },
  };
}
