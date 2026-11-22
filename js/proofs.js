// Hero object: a slowly turning ring of real proof cards. Drag to spin, click a card to enter its chapter.
import * as THREE from 'three';

const SANS = '"Host Grotesk", sans-serif';
const MONO = '"Geist Mono", monospace';
const SERIF = '"Instrument Serif", serif';
const CW = 640, CH = 430, TAU = Math.PI * 2;
const WEEK = [420, 610, 340, 780, 520, 1480, 690];

function makeCard(draw) {
  const cv = document.createElement('canvas');
  cv.width = CW; cv.height = CH;
  const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const redraw = (...args) => {
    ctx.clearRect(0, 0, CW, CH);
    ctx.save();
    ctx.beginPath(); ctx.roundRect(0, 0, CW, CH, 34); ctx.clip();
    draw(ctx, ...args);
    ctx.restore();
    tex.needsUpdate = true;
  };
  return { tex, redraw };
}
const fill = (ctx, c) => { ctx.fillStyle = c; ctx.fillRect(0, 0, CW, CH); };
const text = (ctx, s, x, y, font, color) => { ctx.font = font; ctx.fillStyle = color; ctx.fillText(s, x, y); };
const arc = (ctx, x, y, r, frac, color, w) => { ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * frac); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke(); };

const pfShot = new Image();
const portrait = new Image();

const DEFS = [
  { target: 'promptforge', draw: (ctx) => {
    fill(ctx, '#1a1816');
    text(ctx, 'PROMPTFORGE · CHROME EXTENSION', 36, 60, `500 21px ${MONO}`, '#f0836a');
    text(ctx, '52 → 64', 36, 200, `600 112px ${SANS}`, '#e9e7e5');
    text(ctx, 'prompt score after Improve', 36, 250, `400 27px ${SANS}`, '#cbc9c7');
    arc(ctx, 548, 140, 54, 1, 'rgba(233,231,229,.15)', 9); arc(ctx, 548, 140, 54, 0.64, '#ec5d3c', 9);
    ctx.fillStyle = 'rgba(233,231,229,.15)'; ctx.fillRect(36, 300, CW - 72, 2);
    text(ctx, '● 473 / 475 TESTS PASSING · 10 NOV 2026', 36, 360, `500 20px ${MONO}`, '#b6b4b2');
  } },
  { target: 'promptforge', draw: (ctx) => {
    fill(ctx, '#161412');
    if (pfShot.complete && pfShot.naturalWidth) ctx.drawImage(pfShot, 280, 300, 880, 330, 0, 78, CW, 240);
    text(ctx, 'REAL CAPTURE · LOCAL TEST PAGE', 36, 52, `500 20px ${MONO}`, '#979593');
    text(ctx, 'Improve, review, then you press Send.', 36, 382, `500 27px ${SANS}`, '#e9e7e5');
  } },
  { target: 'do', draw: (ctx) => {
    fill(ctx, '#e7e5e3');
    text(ctx, 'DO · AGENT UX', 36, 60, `500 21px ${MONO}`, '#e83f18');
    text(ctx, 'Hold to approve.', 36, 140, `600 60px ${SANS}`, '#171513');
    ['Read the last bill amount', 'Use the saved payment method', 'Wait for the receipt'].forEach((s, i) => {
      ctx.beginPath(); ctx.arc(48, 202 + i * 46, 9, 0, TAU); ctx.strokeStyle = '#413f3d'; ctx.lineWidth = 3; ctx.stroke();
      text(ctx, s, 72, 211 + i * 46, `400 26px ${SANS}`, '#3d3b39');
    });
    ctx.beginPath(); ctx.arc(548, 300, 46, 0, TAU); ctx.fillStyle = '#171513'; ctx.fill();
    arc(ctx, 548, 300, 60, 0.72, '#e83f18', 8);
    text(ctx, 'SIMULATION · NO MONEY MOVES', 36, 392, `500 19px ${MONO}`, '#747270');
  } },
  { target: 'finpulse', draw: (ctx) => {
    fill(ctx, '#1d1b19');
    text(ctx, 'FINPULSE X · ONE WEEK', 36, 60, `500 21px ${MONO}`, '#f4a695');
    text(ctx, '₹4,840', 32, 196, `400 138px ${SERIF}`, '#f4f2f0');
    const max = Math.max(...WEEK);
    WEEK.forEach((v, i) => { const h = (v / max) * 110; ctx.fillStyle = i === 5 ? '#ee6c4e' : 'rgba(244,242,240,.5)'; ctx.fillRect(40 + i * 46, 360 - h, 28, h); });
    text(ctx, 'EVERY VIEW', 400, 330, `500 19px ${MONO}`, '#f4a695');
    text(ctx, 'ADDS UP', 400, 358, `500 19px ${MONO}`, '#f4a695');
  } },
  { target: 'roam', draw: (ctx, geo) => {
    fill(ctx, '#e7e5e3');
    const pts = [[150, 120], [250, 110], [240, 330]];
    if (geo) {
      const lon0 = 77.207, lon1 = 77.237, lat0 = 28.589, lat1 = 28.62;
      const px = ([lon, lat]) => [((lon - lon0) / (lon1 - lon0)) * CW, ((lat1 - lat) / (lat1 - lat0)) * CH];
      geo.features.forEach((f) => {
        if (f.geometry.type !== 'LineString') return;
        ctx.beginPath();
        f.geometry.coordinates.forEach((c, i) => { const [x, y] = px(c); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); });
        if (f.properties.kind === 'park') { ctx.fillStyle = '#9d9b99'; ctx.fill(); } else { ctx.strokeStyle = '#b8b6b4'; ctx.lineWidth = f.properties.name ? 4 : 2; ctx.stroke(); }
      });
      geo.features.filter((f) => f.geometry.type === 'Point').forEach((f, i) => { pts[i] = px(f.geometry.coordinates); });
    }
    ctx.beginPath(); ctx.moveTo(...pts[0]); ctx.quadraticCurveTo((pts[0][0] + pts[1][0]) / 2, pts[0][1] - 70, ...pts[1]);
    ctx.quadraticCurveTo((pts[1][0] + pts[2][0]) / 2 + 60, (pts[1][1] + pts[2][1]) / 2, ...pts[2]);
    ctx.strokeStyle = '#df3b16'; ctx.lineWidth = 5; ctx.stroke();
    pts.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.fillStyle = '#df3b16'; ctx.fill(); });
    ctx.fillStyle = 'rgba(244,242,240,.94)'; ctx.fillRect(0, CH - 92, CW, 92);
    text(ctx, 'STEADYNEST · NEW DELHI', 36, CH - 52, `600 26px ${SANS}`, '#171513');
    text(ctx, '1,595 REAL OSM BUILDINGS', 36, CH - 20, `500 18px ${MONO}`, '#747270');
  } },
  { target: 'stack', draw: (ctx) => {
    fill(ctx, '#181614');
    text(ctx, 'TOOLBELT', 36, 60, `500 21px ${MONO}`, '#f0836a');
    const chips = ['React', 'TypeScript', 'JavaScript', 'Python', 'three.js', 'Node.js', 'Ollama', 'Chrome MV3', 'GLSL'];
    let x = 36, y = 120;
    ctx.font = `500 28px ${SANS}`;
    chips.forEach((c) => {
      const w = ctx.measureText(c).width + 36;
      if (x + w > CW - 30) { x = 36; y += 66; }
      ctx.beginPath(); ctx.roundRect(x, y - 36, w, 50, 25); ctx.strokeStyle = 'rgba(233,231,229,.35)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#e9e7e5'; ctx.fillText(c, x + 18, y - 2);
      x += w + 12;
    });
  } },
  { target: 'process', draw: (ctx) => {
    fill(ctx, '#f3f1ef');
    text(ctx, 'HOW I WORK', 36, 60, `500 21px ${MONO}`, '#e83f18');
    ['Scope', 'Design', 'Build', 'Prove', 'Hand over'].forEach((s, i) => {
      text(ctx, `0${i + 1}`, 36, 122 + i * 58, `500 22px ${MONO}`, '#e83f18');
      text(ctx, s, 96, 124 + i * 58, `600 36px ${SANS}`, '#1c1a18');
    });
    ctx.strokeStyle = '#514f4d'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(470, 110); ctx.bezierCurveTo(600, 170, 420, 260, 560, 360); ctx.stroke();
  } },
  { target: 'about', draw: (ctx) => {
    fill(ctx, '#100e0c');
    if (portrait.complete && portrait.naturalWidth) {
      const s = CW / portrait.naturalWidth;
      ctx.drawImage(portrait, 0, -portrait.naturalHeight * s * 0.18, CW, portrait.naturalHeight * s);
    }
    const g = ctx.createLinearGradient(0, CH * 0.45, 0, CH);
    g.addColorStop(0, 'rgba(16,14,12,0)'); g.addColorStop(1, 'rgba(16,14,12,.92)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, CW, CH);
    text(ctx, 'YASH KHAIRWAL · NEW DELHI', 36, CH - 66, `500 20px ${MONO}`, '#e9e7e5');
    text(ctx, 'B.Tech AI and Data Science, 2026', 36, CH - 30, `400 24px ${SANS}`, '#cbc9c7');
  } },
];

export function proofs() {
  const group = new THREE.Group();
  const ring = new THREE.Group();
  ring.rotation.x = 0.12;
  group.add(ring);
  const R = 3.1, W = 1.8, H = (W * CH) / CW;
  const geo = new THREE.PlaneGeometry(W, H);
  const back = makeCard((ctx) => {
    fill(ctx, '#1c1a18');
    ctx.strokeStyle = 'rgba(233,231,229,.18)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(16, 16, CW - 32, CH - 32, 24); ctx.stroke();
  });
  back.redraw();
  const backMat = new THREE.MeshBasicMaterial({ map: back.tex, alphaTest: 0.5, toneMapped: false });
  let mapGeo = null;
  const cards = DEFS.map((d, i) => {
    const c = makeCard(d.draw);
    c.redraw();
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: c.tex, alphaTest: 0.5, toneMapped: false }));
    const rear = new THREE.Mesh(geo, backMat);
    rear.rotation.y = Math.PI;
    const holder = new THREE.Group();
    holder.add(mesh, rear);
    const th = (i / DEFS.length) * TAU;
    const baseY = Math.sin(i * 1.7) * 0.28;
    holder.position.set(R * Math.sin(th), baseY, R * Math.cos(th));
    holder.rotation.y = th;
    ring.add(holder);
    mesh.userData.target = d.target;
    return { mesh, holder, c, baseY, i };
  });
  const redrawAll = () => cards.forEach((k) => k.c.redraw(mapGeo));
  pfShot.onload = redrawAll;
  portrait.onload = redrawAll;
  pfShot.src = 'assets/proof/14-retry-final-composer.png';
  portrait.src = 'assets/img/yash-studio-672.webp';

  let angle = 0.35, vel = 0.11, hovered = null;
  return {
    group,
    cards: cards.map((k) => k.mesh),
    setHover(mesh) { hovered = mesh; },
    drag(dx) { angle += dx * 0.006; vel = dx * 0.25; },
    setMap(geoJson) { mapGeo = geoJson; cards[4].c.redraw(mapGeo); },
    tick(t, dt, { reduced }) {
      if (!reduced) {
        angle += vel * dt;
        vel += (0.11 - vel) * Math.min(1, dt * 1.2);
      }
      ring.rotation.y = angle;
      cards.forEach((k) => {
        const target = k.mesh === hovered ? 1.12 : 1;
        k.holder.scale.setScalar(k.holder.scale.x + (target - k.holder.scale.x) * Math.min(1, dt * 8));
        k.holder.position.y = k.baseY + (reduced ? 0 : Math.sin(t * 0.8 + k.i) * 0.06);
      });
    },
  };
}
