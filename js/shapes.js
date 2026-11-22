// Floating 3D objects, one per chapter, each built from Yash's own work.
// Every builder returns { group, tick(t, dt, ctx) } and optional setters.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const COL = {
  bone: 0xe7e5e3, mute: 0x878583, cobalt: 0xdf3b16, cobaltDeep: 0x4d4b49, cobaltSoft: 0xeb5836,
  signal: 0xe83f18, sage: 0x8a8886, slate: 0x22201e,
};
const TAU = Math.PI * 2;

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
}

/* ---------- materials ---------- */
export function makeMaterials(lowPower) {
  const glass = lowPower
    ? new THREE.MeshPhysicalMaterial({ color: 0xf0eeec, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.32, clearcoat: 1, envMapIntensity: 1.5 })
    : new THREE.MeshPhysicalMaterial({
      color: 0xfffffd, transmission: 1, thickness: 0.9, roughness: 0.1, ior: 1.5, clearcoat: 1, clearcoatRoughness: 0.08,
      attenuationColor: new THREE.Color(0xeeecea), attenuationDistance: 2.5, envMapIntensity: 1.3,
    });
  return {
    glass,
    chrome: new THREE.MeshPhysicalMaterial({ color: 0xdbd9d7, metalness: 1, roughness: 0.13, envMapIntensity: 1.35 }),
    ink: new THREE.MeshPhysicalMaterial({ color: 0x181614, metalness: 0.1, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.75 }),
    paperCobalt: new THREE.MeshPhysicalMaterial({ color: COL.cobalt, roughness: 0.4, clearcoat: 0.6, side: THREE.DoubleSide, flatShading: true }),
    pulse: new THREE.MeshBasicMaterial({ color: 0xef765a, toneMapped: false }),
    cobalt: new THREE.MeshPhysicalMaterial({ color: COL.cobalt, roughness: 0.3, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.55 }),
    cobaltDeep: new THREE.MeshPhysicalMaterial({ color: COL.cobaltDeep, roughness: 0.3, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.15, envMapIntensity: 0.55 }),
    cobaltSoft: new THREE.MeshPhysicalMaterial({ color: COL.cobaltSoft, roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 0.55 }),
    bone: new THREE.MeshPhysicalMaterial({ color: COL.bone, roughness: 0.5, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.4 }),
    paper: new THREE.MeshPhysicalMaterial({ color: COL.bone, roughness: 0.75, metalness: 0, side: THREE.DoubleSide, flatShading: true }),
    signal: new THREE.MeshPhysicalMaterial({ color: COL.signal, roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15, emissive: COL.signal, emissiveIntensity: 0.15 }),
    sage: new THREE.MeshPhysicalMaterial({ color: COL.sage, roughness: 0.3, clearcoat: 1, emissive: COL.sage, emissiveIntensity: 0.15 }),
    slate: new THREE.MeshPhysicalMaterial({ color: COL.slate, roughness: 0.42, metalness: 0.25, clearcoat: 0.7, clearcoatRoughness: 0.3 }),
    track: new THREE.MeshPhysicalMaterial({ color: 0x302e2c, roughness: 0.5, metalness: 0.3 }),
    glow: new THREE.MeshBasicMaterial({ color: 0xf9f7f5, toneMapped: false }),
    sheen: new THREE.MeshPhysicalMaterial({ color: 0xfffffd, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.14, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.4 }),
    copper: new THREE.MeshPhysicalMaterial({ color: 0xeb5532, metalness: 0.9, roughness: 0.16, clearcoat: 0.6, clearcoatRoughness: 0.1, envMapIntensity: 1.2 }),
    titanium: new THREE.MeshPhysicalMaterial({ color: 0x1e1c1a, metalness: 0.92, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.1 }),
    brass: new THREE.MeshPhysicalMaterial({ color: 0xa7a5a3, metalness: 0.88, roughness: 0.18, clearcoat: 0.5, envMapIntensity: 1.2 }),
  };
}

/* ---------- helpers ---------- */
function canvasTexture(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const redraw = (...args) => { ctx.clearRect(0, 0, w, h); draw(ctx, w, h, ...args); tex.needsUpdate = true; };
  return { tex, redraw };
}
const label = (tex) => new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false });

function rod(a, b, radius, mat) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 10), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return m;
}

// Clockwise arc starting at 12 o'clock, `frac` of a full turn.
function arcGeometry(radius, tube, frac) {
  const g = new THREE.TorusGeometry(radius, tube, 12, 96, Math.max(0.001, frac) * TAU);
  g.rotateZ(Math.PI / 2);
  g.scale(-1, 1, 1);
  return g;
}

const SANS = '"Host Grotesk", sans-serif';
const MONO = '"Geist Mono", monospace';

/* ---------- WHAT I DO: glass/chrome neural nodes with a signal travelling one path ---------- */
export function lattice(M) {
  const r = rng(21);
  const layers = [3, 4, 4, 2];
  const xs = [-2.1, -0.7, 0.7, 2.1];
  const nodes = layers.map((n, li) => Array.from({ length: n }, (_, k) => new THREE.Vector3(xs[li], (k - (n - 1) / 2) * 0.9, (r() - 0.5) * 0.9)));
  const active = [1, 2, 1, 0];
  const spin = new THREE.Group();
  const sphere = new THREE.SphereGeometry(0.17, 32, 16);
  nodes.forEach((layer, li) => layer.forEach((p, k) => {
    const m = new THREE.Mesh(sphere, k === active[li] ? M.signal : li % 2 ? M.cobalt : M.ink);
    m.position.copy(p);
    spin.add(m);
  }));
  for (let li = 0; li < layers.length - 1; li++) {
    nodes[li].forEach((a, ai) => nodes[li + 1].forEach((b, bi) => {
      const hot = ai === active[li] && bi === active[li + 1];
      spin.add(rod(a, b, hot ? 0.022 : 0.009, hot ? M.signal : M.cobaltSoft));
    }));
  }
  const path = active.map((k, li) => nodes[li][k]);
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 8), M.glow);
  spin.add(pulse);
  const group = new THREE.Group();
  group.add(spin);
  return {
    group,
    tick(t, dt, { reduced }) {
      const u = reduced ? 0.5 : ((t * 0.35) % 1) * (path.length - 1);
      const i = Math.min(Math.floor(u), path.length - 2);
      pulse.position.lerpVectors(path[i], path[i + 1], u - i);
      if (!reduced) { spin.rotation.y = -0.45 + Math.sin(t * 0.3) * 0.3; spin.rotation.x = Math.sin(t * 0.25) * 0.08; }
    },
  };
}

/* ---------- PROMPTFORGE: glass chip with the real 52 -> 64 score ---------- */
export function chip(M) {
  const W = 3.3, H = 2.2;
  const spin = new THREE.Group();
  const back = new THREE.Mesh(new RoundedBoxGeometry(W, H, 0.16, 4, 0.16), M.ink);
  back.position.z = -0.08;
  const rim = new THREE.Mesh(new RoundedBoxGeometry(W + 0.08, H + 0.08, 0.1, 4, 0.18), M.chrome);
  rim.position.z = -0.14;
  spin.add(back, rim);
  const ringCenter = new THREE.Vector3(-0.85, 0.12, 0.02);
  const track = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.028, 10, 96), M.track);
  track.position.copy(ringCenter);
  const arc = new THREE.Mesh(arcGeometry(0.6, 0.055, 0.52), M.cobalt);
  arc.position.copy(ringCenter);
  spin.add(track, arc);

  const face = canvasTexture(1024, 682, (ctx, w, h, score) => {
    const cx = ((ringCenter.x / W) + 0.5) * w, cy = (0.5 - ringCenter.y / H) * h;
    ctx.fillStyle = '#191715';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 46);
    ctx.fill();
    ctx.fillStyle = '#e9e7e5';
    ctx.textAlign = 'center';
    ctx.font = `600 132px ${SANS}`;
    ctx.fillText(String(Math.round(score)), cx, cy + 40);
    ctx.font = `400 26px ${MONO}`;
    ctx.fillStyle = '#979593';
    ctx.fillText('/ 100', cx, cy + 86);
    ctx.textAlign = 'left';
    const x = 470;
    ctx.fillText('PROMPT SCORE', x, 170);
    ctx.fillStyle = '#e9e7e5';
    ctx.font = `500 40px ${SANS}`;
    ctx.fillText(score < 63.5 ? '“help me plan a picnic”' : 'Role: Editor', x, 240);
    ctx.fillStyle = '#cbc9c7';
    ctx.font = `400 30px ${SANS}`;
    if (score >= 63.5) { ctx.fillText('Mission: help me plan a picnic.', x, 290); }
    ctx.strokeStyle = 'rgba(233,231,229,.18)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, 340); ctx.lineTo(w - 70, 340); ctx.stroke();
    ctx.font = `500 32px ${SANS}`;
    ctx.fillStyle = '#a5a3a1';
    ctx.fillText('Improve', x, 400);
    ctx.fillStyle = '#e9e7e5';
    ctx.fillText('Keep mine', x + 160, 400);
    if (score >= 63.5) ctx.fillText('Undo', x + 340, 400);
    ctx.font = `400 23px ${MONO}`;
    ctx.fillStyle = '#979593';
    ctx.fillText(score >= 63.5 ? 'PROMPT IMPROVED. REVIEW BEFORE SENDING.' : 'READY TO IMPROVE.', x, 470);
    ctx.fillText('NOTHING IS SENT FOR YOU', x, 510);
  });
  face.redraw(52);
  const facePlane = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.98, H * 0.98), label(face.tex));
  facePlane.position.z = 0.012;
  spin.add(facePlane);
  const group = new THREE.Group();
  group.add(spin);

  let shown = 52, target = 52, armed = true;
  function setScore(v) {
    shown = v;
    arc.geometry.dispose();
    arc.geometry = arcGeometry(0.6, 0.055, v / 100);
    face.redraw(v);
  }
  return {
    group,
    tick(t, dt, { reduced, presence }) {
      if (presence > 0.85 && armed) { armed = false; target = 64; if (reduced) setScore(64); }
      if (presence < 0.2 && !armed) { armed = true; target = 52; setScore(52); }
      if (Math.abs(shown - target) > 0.05) setScore(shown + (target - shown) * Math.min(1, dt * 2.2));
      if (!reduced) { spin.rotation.y = -0.32 + Math.sin(t * 0.4) * 0.16; spin.rotation.x = 0.06 + Math.sin(t * 0.3) * 0.05; }
    },
  };
}

/* ---------- DO: six asks braid into one plan, ending at a hold-to-approve button ---------- */
export function braid(M) {
  const spin = new THREE.Group();
  const x0 = -2.4, x1 = 1.2;

  // Convergence collar where the 6 input lines meet the harness
  const collarGeo = new THREE.CylinderGeometry(0.36, 0.40, 0.16, 32);
  collarGeo.rotateZ(Math.PI / 2);
  const collar = new THREE.Mesh(collarGeo, M.titanium || M.ink);
  collar.position.set(x0, 0, 0);
  const collarRim = new THREE.Mesh(new THREE.TorusGeometry(0.39, 0.016, 12, 48), M.brass || M.chrome);
  collarRim.rotation.y = Math.PI / 2;
  collarRim.position.set(x0, 0, 0);
  spin.add(collar, collarRim);

  // 4 intertwined precision neural strands (copper + titanium obsidian)
  for (let k = 0; k < 4; k++) {
    const pts = [];
    const phase = (k / 4) * TAU;
    for (let i = 0; i <= 80; i++) {
      const x = x0 + ((x1 - x0) * i) / 80;
      const th = (x - x0) * 3.2 + phase;
      const env = Math.min(1, (x - x0) / 0.45) * Math.min(1, (x1 - x) / 0.35 + 0.3);
      pts.push(new THREE.Vector3(x, env * 0.28 * Math.sin(th), env * 0.24 * Math.cos(th)));
    }
    const mat = (k % 2 === 0) ? (M.copper || M.cobalt) : (M.titanium || M.ink);
    spin.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.072, 12), mat));
  }

  // 2 fine brass tracer filaments wrapping around the bundle
  for (let k = 0; k < 2; k++) {
    const pts = [];
    const phase = (k / 2) * TAU + Math.PI / 4;
    for (let i = 0; i <= 80; i++) {
      const x = x0 + ((x1 - x0) * i) / 80;
      const th = (x - x0) * 4.6 + phase;
      const env = Math.min(1, (x - x0) / 0.45) * Math.min(1, (x1 - x) / 0.35 + 0.3);
      pts.push(new THREE.Vector3(x, env * 0.32 * Math.sin(th), env * 0.27 * Math.cos(th)));
    }
    spin.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 140, 0.020, 8), M.brass || M.chrome));
  }

  // 6 input request lines converging gracefully into the collar
  const asks = [];
  const nodeGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.08, 16);
  nodeGeo.rotateZ(Math.PI / 2);
  for (let k = 0; k < 6; k++) {
    const s = new THREE.Vector3(-4.5, -1.4 + k * 0.56, (k % 2 ? 0.22 : -0.22));
    const mid = new THREE.Vector3(-3.3, s.y * 0.45, s.z * 0.4);
    const curve = new THREE.CatmullRomCurve3([s, mid, new THREE.Vector3(x0, 0, 0)]);
    asks.push(curve);
    spin.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.026, 8), M.titanium || M.ink));

    // Terminal input node fitting
    const node = new THREE.Mesh(nodeGeo, M.brass || M.chrome);
    node.position.copy(s);
    spin.add(node);
  }

  // AI flow: elongated light capsules streaming along the fibers into the core
  const core = new THREE.LineCurve3(new THREE.Vector3(x0, 0, 0.01), new THREE.Vector3(1.85, 0, 0.01));
  const beadGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.28, 8);
  beadGeo.rotateZ(Math.PI / 2);
  const beads = Array.from({ length: 12 }, (_, i) => {
    const m = new THREE.Mesh(beadGeo, M.pulse);
    spin.add(m);
    return { m, ask: asks[i % 6], phase: i / 12 };
  });

  // Precision terminal execution gateway & dial
  const btn = new THREE.Group();
  btn.position.set(1.85, 0, 0);

  // Anodized titanium chassis with chamfered profile
  const bodyGeo = new THREE.CylinderGeometry(0.68, 0.72, 0.22, 64);
  bodyGeo.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, M.titanium || M.chrome);

  // Brushed brass bezel ring
  const bezelRing = new THREE.Mesh(new THREE.TorusGeometry(0.69, 0.022, 16, 64), M.brass || M.chrome);
  bezelRing.position.z = 0.11;

  // Ultra-crisp engraved dial face
  const faceTex = canvasTexture(512, 512, (ctx, w, h, state) => {
    const cx = w / 2, cy = h / 2;
    // Dark sapphire-obsidian background
    ctx.fillStyle = '#141210';
    ctx.beginPath(); ctx.arc(cx, cy, cx - 4, 0, TAU); ctx.fill();

    // Outer calibration ticks
    ctx.strokeStyle = 'rgba(233,231,229, 0.16)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * TAU;
      const r1 = (i % 4 === 0) ? cx - 18 : cx - 12;
      const r2 = cx - 6;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }

    // Inner optical circle
    ctx.strokeStyle = (state === 'done') ? 'rgba(181,179,177, 0.4)' : 'rgba(235,85,50, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, cx - 40, 0, TAU); ctx.stroke();

    ctx.textAlign = 'center';
    if (state === 'done') {
      ctx.fillStyle = '#b5b3b1'; ctx.font = `600 52px ${SANS}`;
      ctx.fillText('APPROVED', cx, cy - 2);
      ctx.fillStyle = '#9f9d9b'; ctx.font = `500 20px ${MONO}`;
      ctx.fillText('1 PLAN · VERIFIED', cx, cy + 34);
    } else if (state === 'holding') {
      ctx.fillStyle = '#ee6d4f'; ctx.font = `600 48px ${SANS}`;
      ctx.fillText('ARMING', cx, cy - 6);
      ctx.fillStyle = '#d8d6d4'; ctx.font = `500 20px ${MONO}`;
      ctx.fillText('HOLD STEADY', cx, cy + 30);
    } else {
      ctx.fillStyle = '#a7a5a3'; ctx.font = `500 18px ${MONO}`;
      ctx.fillText('AGENT GATEWAY', cx, cy - 36);
      ctx.fillStyle = '#f6f4f2'; ctx.font = `600 46px ${SANS}`;
      ctx.fillText('Hold to', cx, cy + 4);
      ctx.fillText('approve', cx, cy + 46);
    }
  });
  faceTex.redraw('idle');

  const face = new THREE.Mesh(new THREE.CircleGeometry(0.58, 64), label(faceTex.tex));
  face.position.z = 0.115;

  // Precision calibration track & laser arc
  const trackRing = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.015, 10, 96), M.track);
  trackRing.position.z = 0.05;
  const prog = new THREE.Mesh(arcGeometry(0.82, 0.038, 0), M.signal);
  prog.position.z = 0.05;

  btn.add(body, bezelRing, face, trackRing, prog);
  spin.add(btn);
  spin.position.x = 1.1;

  const group = new THREE.Group();
  group.add(spin);

  let lastFrac = -1, lastState = 'idle', flow = 0;
  function setApprove(frac, state) {
    if (state !== lastState) {
      faceTex.redraw(state);
      prog.material = (state === 'done') ? M.sage : M.signal;
      beads.forEach((b) => { b.m.material = (state === 'done') ? M.sage : M.pulse; });
      lastState = state;
    }
    if (Math.abs(frac - lastFrac) > 0.004) {
      prog.geometry.dispose();
      prog.geometry = arcGeometry(0.82, 0.038, frac);
      lastFrac = frac;
    }
  }

  const tmp = new THREE.Vector3();
  const tmpTangent = new THREE.Vector3();
  return {
    group,
    setApprove,
    tick(t, dt, { reduced }) {
      if (!reduced) {
        spin.rotation.y = -0.28 + Math.sin(t * 0.32) * 0.14;
        spin.rotation.x = Math.sin(t * 0.25) * 0.05;
      }
      btn.scale.setScalar(lastState === 'holding' ? 0.96 : 1);
      flow += dt * (lastState === 'holding' ? 0.65 : 0.18);
      beads.forEach((b) => {
        const u = reduced ? b.phase : (flow + b.phase) % 1;
        if (u < 0.5) {
          b.ask.getPointAt(u * 2, tmp);
          b.ask.getTangentAt(u * 2, tmpTangent);
        } else {
          core.getPointAt((u - 0.5) * 2, tmp);
          core.getTangentAt((u - 0.5) * 2, tmpTangent);
        }
        b.m.position.copy(tmp);
        b.m.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tmpTangent.normalize());
        b.m.scale.setScalar(u > 0.92 ? Math.max(0.01, (1 - u) / 0.08) : 1);
      });
    },
  };
}

/* ---------- PROCESS: a chrome rail with five vermilion stations ---------- */
export function rail(M) {
  const spin = new THREE.Group();
  const stations = [-2.4, -1.2, 0, 1.2, 2.4].map((x, i) => new THREE.Vector3(x, Math.sin(i * 1.3) * 0.35, i % 2 ? 0.3 : -0.3));
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-3.3, -0.2, 0), ...stations, new THREE.Vector3(3.3, 0.3, 0)]);
  spin.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 200, 0.03, 10), M.chrome));
  const bead = new THREE.SphereGeometry(0.16, 32, 16);
  stations.forEach((p) => { const m = new THREE.Mesh(bead, M.signal); m.position.copy(p); spin.add(m); });
  const runner = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 8), M.glow);
  spin.add(runner);
  const group = new THREE.Group();
  group.add(spin);
  return {
    group,
    tick(t, dt, { reduced }) {
      runner.position.copy(curve.getPointAt(reduced ? 0.5 : (t * 0.09) % 1));
      if (!reduced) { spin.rotation.y = Math.sin(t * 0.3) * 0.25; spin.rotation.x = 0.15 + Math.sin(t * 0.25) * 0.06; }
    },
  };
}

/* ---------- ABOUT: portrait behind floating glass ---------- */
export function portrait(M, img) {
  const tex = new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  const w = 2.5, h = (w * img.naturalHeight) / img.naturalWidth;
  const spin = new THREE.Group();
  const back = new THREE.Mesh(new RoundedBoxGeometry(w + 0.26, h + 0.26, 0.1, 4, 0.1), M.chrome);
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  photo.position.z = 0.055;
  const pane = new THREE.Mesh(new RoundedBoxGeometry(w + 0.26, h + 0.26, 0.06, 4, 0.1), M.sheen);
  pane.position.z = 0.16;
  const tag = new THREE.Mesh(new RoundedBoxGeometry(0.16, 0.16, 0.1, 2, 0.03), M.signal);
  tag.position.set(w / 2 - 0.12, -h / 2 + 0.12, 0.22);
  spin.add(back, photo, pane, tag);
  const group = new THREE.Group();
  group.add(spin);
  return {
    group,
    tick(t, dt, { reduced, mouse }) {
      if (reduced) return;
      spin.rotation.y += ((-0.28 + mouse.x * 0.35) - spin.rotation.y) * Math.min(1, dt * 3);
      spin.rotation.x += ((mouse.y * -0.2) - spin.rotation.x) * Math.min(1, dt * 3);
    },
  };
}

/* ---------- CONTACT: a paper plane, ready to send ---------- */
export function plane(M) {
  const v = [
    [1.6, 0, 0], [-1, 0.18, 1.15], [-0.7, 0, 0.06],
    [1.6, 0, 0], [-0.7, 0, -0.06], [-1, 0.18, -1.15],
    [1.6, 0, 0], [-0.7, 0, 0.06], [-0.95, -0.42, 0],
    [1.6, 0, 0], [-0.95, -0.42, 0], [-0.7, 0, -0.06],
  ].flat();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  g.computeVertexNormals();
  const body = new THREE.Mesh(g, M.paperCobalt);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(g), new THREE.LineBasicMaterial({ color: COL.signal }));
  const spin = new THREE.Group();
  spin.add(body, edge);
  spin.rotation.y = -0.6;
  const group = new THREE.Group();
  group.add(spin);
  return {
    group,
    tick(t, dt, { reduced }) {
      if (reduced) return;
      spin.rotation.z = Math.sin(t * 0.9) * 0.12 + 0.15;
      spin.rotation.x = Math.sin(t * 0.6) * 0.18;
      spin.position.y = Math.sin(t * 1.1) * 0.12;
    },
  };
}

/* ---------- DUST: soft drifting particles in every scene ---------- */
export function dust(count) {
  const r = rng(41);
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), spd = new Float32Array(count);
  const palette = [[0.15, 0.13, 0.12], [0.45, 0.40, 0.35], [0.72, 0.65, 0.55], [0.82, 0.42, 0.22], [0.65, 0.35, 0.2]];
  for (let i = 0; i < count; i++) {
    pos.set([(r() - 0.5) * 22, (r() - 0.5) * 13, -7 + r() * 10], i * 3);
    col.set(palette[Math.floor(r() * (r() < 0.9 ? 4 : 5))], i * 3);
    spd[i] = 0.05 + r() * 0.18;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aSpeed', new THREE.BufferAttribute(spd, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    uniforms: { uTime: { value: 0 }, uScroll: { value: 0 }, uPR: { value: Math.min(devicePixelRatio || 1, 1.75) } },
    vertexShader: /* glsl */ `
      attribute vec3 color; attribute float aSpeed;
      uniform float uTime; uniform float uScroll; uniform float uPR;
      varying vec3 vC; varying float vA;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + uTime * aSpeed + uScroll * (0.4 + aSpeed * 2.0) + 6.5, 13.0) - 6.5;
        p.x += sin(uTime * 0.2 + aSpeed * 40.0) * 0.3;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (10.0 + aSpeed * 30.0) * uPR / -mv.z;
        vC = color;
        vA = 0.32 * smoothstep(6.5, 4.5, abs(p.y));
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vC; varying float vA;
      void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vC, smoothstep(0.5, 0.0, d) * vA); }`,
  });
  const points = new THREE.Points(g, mat);
  points.frustumCulled = false;
  return { points, uniforms: mat.uniforms };
}
