// ROAM OS: a light, illustrated atlas of central Delhi from real OpenStreetMap data.
// Paper ground with parks, roads and road names; stone buildings; trees; India Gate; labelled stops; route arcs.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from './shapes.js?v=14';

const LAT0 = 28.6045, LON0 = 77.222, KM = 6.6 / 3300;
const MX = 111320 * Math.cos((LAT0 * Math.PI) / 180), MY = 110540;
const proj = ([lon, lat]) => [(lon - LON0) * MX * KM, -(lat - LAT0) * MY * KM];
const HX = 3.3, HZ = 3.6;
const STOP_NAMES = ['India Gate', 'National Museum', 'Lodhi Gardens'];
const inside = (x, z) => (x / HX) ** 2 + (z / HZ) ** 2 < 0.8;

function inPoly(x, z, poly) {
  let ins = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i], [xj, zj] = poly[j];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) ins = !ins;
  }
  return ins;
}

function groundTexture(lines) {
  const CWp = 2048, CHp = Math.round((2048 * HZ) / HX);
  const cv = document.createElement('canvas');
  cv.width = CWp; cv.height = CHp;
  const ctx = cv.getContext('2d');
  const px = ([x, z]) => [((x + HX) / (2 * HX)) * CWp, ((z + HZ) / (2 * HZ)) * CHp];
  const trace = (pts) => { ctx.beginPath(); pts.forEach((p, i) => { const [a, b] = px(p); if (i) ctx.lineTo(a, b); else ctx.moveTo(a, b); }); };
  ctx.fillStyle = '#e2e0de';
  ctx.fillRect(0, 0, CWp, CHp);
  lines.filter((l) => l.park).forEach((l) => {
    trace(l.pts); ctx.closePath();
    ctx.fillStyle = l.name === 'Lodhi Gardens' ? '#a7a5a3' : '#b6b4b2'; ctx.fill();
    ctx.strokeStyle = '#848280'; ctx.lineWidth = 2; ctx.stroke();
  });
  const roads = lines.filter((l) => !l.park);
  roads.forEach((l) => { trace(l.pts); ctx.strokeStyle = l.name ? '#a09e9c' : '#bebcba'; ctx.lineWidth = l.name ? 13 : 6; ctx.lineJoin = 'round'; ctx.stroke(); });
  roads.forEach((l) => { trace(l.pts); ctx.strokeStyle = l.name ? '#eceae8' : '#eae8e6'; ctx.lineWidth = l.name ? 8 : 3; ctx.stroke(); });
  // road names along the longest segment of each named road
  const best = new Map();
  roads.filter((l) => l.name).forEach((l) => {
    for (let i = 0; i < l.pts.length - 1; i++) {
      const [a, b] = [px(l.pts[i]), px(l.pts[i + 1])];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (!best.has(l.name) || best.get(l.name).len < len) best.set(l.name, { a, b, len });
    }
  });
  [...best.entries()].sort((p, q) => q[1].len - p[1].len).slice(0, 16).forEach(([name, { a, b, len }]) => {
    if (len < 140) return;
    let ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    if (ang > Math.PI / 2 || ang < -Math.PI / 2) ang += Math.PI;
    ctx.save();
    ctx.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    ctx.rotate(ang);
    ctx.font = '600 17px "Host Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.lineWidth = 5; ctx.strokeStyle = '#eae8e6'; ctx.strokeText(name.toUpperCase(), 0, -10);
    ctx.fillStyle = '#716f6d'; ctx.fillText(name.toUpperCase(), 0, -10);
    ctx.restore();
  });
  // melt the edges into the page
  ctx.globalCompositeOperation = 'destination-in';
  const g = ctx.createRadialGradient(CWp / 2, CHp / 2, CWp * 0.36, CWp / 2, CHp / 2, CWp * 0.5);
  g.addColorStop(0, 'rgba(2,0,0,1)'); g.addColorStop(1, 'rgba(2,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, CWp, CHp);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function labelSprite(n, name) {
  const cv = document.createElement('canvas');
  cv.width = 512; cv.height = 112;
  const ctx = cv.getContext('2d');
  ctx.fillStyle = 'rgba(250,248,246,.96)';
  ctx.beginPath(); ctx.roundRect(4, 4, 504, 104, 20); ctx.fill();
  ctx.strokeStyle = 'rgba(28,26,24,.15)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.font = '500 30px "Geist Mono", monospace'; ctx.fillStyle = '#df3b16'; ctx.fillText(`0${n}`, 30, 68);
  ctx.font = '600 40px "Host Grotesk", sans-serif'; ctx.fillStyle = '#1c1a18'; ctx.fillText(name, 92, 70);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, toneMapped: false }));
  s.scale.set(1.05, 0.23, 1);
  s.center.set(0.08, -0.35);
  return s;
}

export function city(M, buildingsGeo, dataGeo) {
  const r = rng(31);
  const map = new THREE.Group();
  const lines = dataGeo.features.filter((f) => f.geometry.type === 'LineString')
    .map((f) => ({ pts: f.geometry.coordinates.map(proj), park: f.properties.kind === 'park', name: f.properties.name || '' }));

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(HX * 2, HZ * 2), new THREE.MeshBasicMaterial({ map: groundTexture(lines), transparent: true, depthWrite: false, toneMapped: false }));
  ground.rotation.x = -Math.PI / 2;
  map.add(ground);

  const stones = ['#d4d2d0', '#c1bfbd', '#b0aeac'].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.88, metalness: 0.03 }));
  const buckets = [[], [], []];
  buildingsGeo.features.forEach((f) => {
    const ring = f.geometry.coordinates[0].map(proj);
    const cx = ring.reduce((s, p) => s + p[0], 0) / ring.length, cz = ring.reduce((s, p) => s + p[1], 0) / ring.length;
    if (!inside(cx, cz)) return;
    const p = f.properties || {};
    const hm = parseFloat(p.height) || parseFloat(p['building:levels']) * 3.2 || 6 + r() * 12;
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(ring.map(([x, z]) => new THREE.Vector2(x, -z))), { depth: Math.max(0.02, hm * KM * 2.4), bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    buckets[Math.floor(r() * 3)].push(g);
  });
  buckets.forEach((b, i) => { if (b.length) map.add(new THREE.Mesh(mergeGeometries(b), stones[i])); });

  // trees inside parks
  const parks = lines.filter((l) => l.park && l.pts.length > 3);
  const spots = [];
  parks.forEach((pk) => {
    let minx = Infinity, maxx = -Infinity, minz = Infinity, maxz = -Infinity;
    pk.pts.forEach(([x, z]) => { minx = Math.min(minx, x); maxx = Math.max(maxx, x); minz = Math.min(minz, z); maxz = Math.max(maxz, z); });
    const n = Math.min(60, Math.round((maxx - minx) * (maxz - minz) * 90));
    for (let i = 0, tries = 0; i < n && tries < n * 10; tries++) {
      const x = minx + r() * (maxx - minx), z = minz + r() * (maxz - minz);
      if (inside(x, z) && inPoly(x, z, pk.pts)) { spots.push([x, z]); i++; }
    }
  });
  if (spots.length) {
    const crowns = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: '#fffffd', roughness: 0.95, envMapIntensity: 0.3 }), spots.length);
    const o = new THREE.Object3D(), c = new THREE.Color();
    spots.forEach(([x, z], i) => {
      const s = 0.035 + r() * 0.035;
      o.position.set(x, 0.03 + s, z);
      o.scale.set(s, s * 0.85, s);
      o.updateMatrix();
      crowns.setMatrixAt(i, o.matrix);
      c.setHSL(0.2 + r() * 0.035, 0.22 + r() * 0.1, 0.24 + r() * 0.1);
      crowns.setColorAt(i, c);
    });
    map.add(crowns);
  }

  const stops = dataGeo.features.filter((f) => f.geometry.type === 'Point').map((f) => proj(f.geometry.coordinates));

  // India Gate, illustrated
  if (stops[0]) {
    const arch = new THREE.Shape();
    arch.moveTo(-0.34, 0); arch.lineTo(-0.34, 0.83); arch.lineTo(0.34, 0.83); arch.lineTo(0.34, 0); arch.lineTo(0.145, 0); arch.lineTo(0.145, 0.44);
    arch.bezierCurveTo(0.145, 0.63, -0.145, 0.63, -0.145, 0.44); arch.lineTo(-0.145, 0); arch.closePath();
    const gate = new THREE.Mesh(new THREE.ExtrudeGeometry(arch, { depth: 0.235, bevelEnabled: false, curveSegments: 16 }), new THREE.MeshStandardMaterial({ color: '#dedcda', roughness: 0.8 }));
    gate.scale.setScalar(0.42);
    gate.rotation.y = Math.PI / 2;
    gate.position.set(stops[0][0] + 0.05, 0, stops[0][1]);
    map.add(gate);
  }

  // pins with labels and halos
  const poleMat = new THREE.MeshStandardMaterial({ color: '#5e5c5a', roughness: 0.5, metalness: 0.4 });
  const headMat = new THREE.MeshStandardMaterial({ color: '#df3b16', roughness: 0.4, metalness: 0.12 });
  const pins = stops.map(([x, z], i) => {
    const pin = new THREE.Group();
    pin.position.set(x, 0, z);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.8, 8), poleMat);
    pole.position.y = 0.4;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.075, 20, 12), headMat);
    head.position.y = 0.82;
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.17, 0.19, 64), new THREE.MeshBasicMaterial({ color: '#df3b16', transparent: true, opacity: 0, side: THREE.DoubleSide, toneMapped: false }));
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = 0.02;
    const tag = labelSprite(i + 1, STOP_NAMES[i] || '');
    tag.position.y = 0.9;
    pin.add(pole, head, halo, tag);
    map.add(pin);
    return { pin, head, halo, tag };
  });

  // route arcs and a travelling bead
  const routeMat = new THREE.MeshStandardMaterial({ color: '#df3b16', metalness: 0.18, roughness: 0.52 });
  const legs = [];
  const tubes = [];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = new THREE.Vector3(stops[i][0], 0.82, stops[i][1]), b = new THREE.Vector3(stops[i + 1][0], 0.82, stops[i + 1][1]);
    const mid = a.clone().lerp(b, 0.5);
    mid.y += a.distanceTo(b) * 0.4;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    legs.push(curve);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, 0.016, 8), routeMat);
    tubes.push(tube);
    map.add(tube);
  }
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), new THREE.MeshBasicMaterial({ color: '#bdbbb9', toneMapped: false }));
  map.add(bead);
  const tmp = new THREE.Vector3();

  // Camera tour: map content pans so the focus sits at the origin; the tilt group zooms.
  const turn = new THREE.Group();
  turn.add(map);
  const spin = new THREE.Group();
  spin.add(turn);
  spin.rotation.x = 0.78;
  const group = new THREE.Group();
  group.add(spin);

  const center = stops.reduce((acc, [x, z]) => [acc[0] + x / stops.length, acc[1] + z / stops.length], [0, 0]);
  // keyframes: overview, each stop, overview. [scrollProgress, focusX, focusZ, zoom, selectedStop]
  const keys = [[0, center[0], center[1], 1, -1], ...stops.map(([x, z], i) => [0.25 + i * 0.235, x, z, 1.7, i]), [0.94, center[0], center[1], 1.05, -1]];
  const sm = (a, b, t) => { const v = Math.min(1, Math.max(0, (t - a) / (b - a))); return v * v * (3 - 2 * v); };
  let progress = null, selected = 0;
  const focus = new THREE.Vector2(center[0], center[1]);
  let zoom = 1, flowT = 0;

  function target(p) {
    let i = 0;
    while (i < keys.length - 2 && p > keys[i + 1][0]) i++;
    const A = keys[i], B = keys[i + 1];
    const te = sm(0.22, 0.78, (p - A[0]) / (B[0] - A[0]));
    const lift = A[4] >= 0 && B[4] >= 0 ? Math.sin(te * Math.PI) * 0.45 : 0;
    return { x: A[1] + (B[1] - A[1]) * te, z: A[2] + (B[2] - A[2]) * te, zoom: A[3] + (B[3] - A[3]) * te - lift, sel: te < 0.5 ? A[4] : B[4] };
  }
  function drawRoute(frac) {
    tubes.forEach((tube, i) => {
      const f = Math.min(1, Math.max(0, frac * tubes.length - i));
      const segs = tube.geometry.parameters.tubularSegments, rad = tube.geometry.parameters.radialSegments;
      tube.geometry.setDrawRange(0, Math.floor(segs * f) * rad * 6);
    });
  }

  return {
    group,
    setStop(i) { selected = i; },
    setProgress(p) { progress = p; },
    tick(t, dt, { reduced }) {
      let tx, tz, tzoom, sel, routeFrac;
      if (progress === null) {
        const s = selected >= 0 ? stops[selected] : center;
        tx = s[0]; tz = s[1]; tzoom = selected >= 0 ? 1.7 : 1; sel = selected; routeFrac = 1;
      } else {
        const k = target(progress);
        tx = k.x; tz = k.z; tzoom = k.zoom; sel = k.sel;
        routeFrac = Math.min(1, Math.max(0, (progress - 0.22) / (0.72 - 0.22)));
        if (progress > 0.9) routeFrac = 1;
      }
      const ease = reduced ? 1 : 1 - Math.pow(0.04, dt);
      focus.x += (tx - focus.x) * ease;
      focus.y += (tz - focus.y) * ease;
      zoom += (tzoom - zoom) * ease;
      map.position.set(-focus.x, 0, -focus.y);
      spin.scale.setScalar(zoom);
      drawRoute(routeFrac);

      if (legs.length) {
        let u;
        if (routeFrac < 1) u = routeFrac;
        else { flowT += dt * (reduced ? 0 : 0.1); u = flowT % 1; }
        const L = u * legs.length, li = Math.min(Math.floor(L), legs.length - 1);
        legs[li].getPointAt(Math.min(1, L - li), tmp);
        bead.position.copy(tmp);
      }
      pins.forEach((p, i) => {
        const on = i === sel;
        const s = p.pin.scale.y + ((on ? 1.25 : 0.85) - p.pin.scale.y) * Math.min(1, dt * 6);
        p.pin.scale.set(1, s, 1);
        p.head.scale.set(1, 1 / s, 1);
        p.tag.scale.set(1.05, 0.23 / s, 1);
        p.tag.material.opacity = on || sel < 0 ? 1 : 0.5;
        const ph = reduced ? 0.4 : (t * 0.6) % 1;
        p.halo.material.opacity = on ? (1 - ph) * 0.8 : 0;
        p.halo.scale.setScalar(on ? 1 + ph * 2.4 : 1);
      });
      if (!reduced) turn.rotation.y = -0.42 + Math.sin(t * 0.18) * 0.1;
    },
  };
}
