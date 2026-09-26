import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { getHeroProgress, onHeroProgress } from "@/motion/hero-progress";
import { initMotionState, isReduced, subscribeMotion } from "@/hooks/motion-state";

function clamp(n: number, a = 0, b = 1) {
  return Math.max(a, Math.min(b, n));
}
function easeInOut(t: number) {
  const x = clamp(t);
  return x < 0.5 ? 2 * x * x : 1 - ((-2 * x + 2) ** 2) / 2;
}
function mulberry(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function orbitPos(phase: number, r: number, inc: number, out: THREE.Vector3) {
  const x = Math.cos(phase) * r;
  const z0 = Math.sin(phase) * r;
  out.set(x, z0 * Math.sin(inc), z0 * Math.cos(inc));
  return out;
}

type BodyKind = "mercury" | "venus" | "earth" | "mars";

const SOLAR_MAPS = {
  sun: "/assets/solar/sun.webp",
  mercury: "/assets/solar/mercury.webp",
  venus: "/assets/solar/venus.webp",
  earth: "/assets/solar/earth.webp",
  mars: "/assets/solar/mars.webp",
  glowCore: "/assets/solar/glow-core.png",
  glowInner: "/assets/solar/glow-inner.png",
  glowOuter: "/assets/solar/glow-outer.png",
} as const;

function loadTexture(loader: THREE.TextureLoader, url: string, owned: Set<THREE.Texture>) {
  return new Promise<THREE.Texture>((resolve, reject) => {
    // Own the texture immediately, including pending/failed image requests.
    owned.add(loader.load(url, resolve, undefined, reject));
  });
}

function prepMap(tex: THREE.Texture, anisotropy: number) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

function makeBodyMat(map: THREE.Texture, wrap: number, rim: number, bump: number, gloss: number, shininess: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uOpacity: { value: 1 },
      uWrap: { value: wrap },
      uRim: { value: rim },
      uBump: { value: bump },
      uGloss: { value: gloss },
      uShininess: { value: shininess },
    },
    vertexShader: `
      varying vec3 vN; varying vec3 vP; varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 p = modelViewMatrix * vec4(position, 1.0);
        vP = p.xyz;
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * p;
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap; uniform float uOpacity; uniform float uWrap; uniform float uRim; uniform float uBump;
      uniform float uGloss; uniform float uShininess;
      varying vec3 vN; varying vec3 vP; varying vec2 vUv;
      void main() {
        vec2 uv = vUv;
        vec3 a = texture2D(uMap, uv).rgb;
        vec3 aR = texture2D(uMap, vec2(fract(uv.x + 0.01), uv.y)).rgb;
        float seamW = 1.0 - smoothstep(0.0, 0.03, min(uv.x, 1.0 - uv.x));
        vec3 albedo = mix(a, mix(a, aR, 0.5), seamW);
        float pole = smoothstep(0.76, 0.998, abs(uv.y * 2.0 - 1.0));
        vec3 p0 = texture2D(uMap, vec2(0.18, clamp(uv.y, 0.03, 0.97))).rgb;
        vec3 p1 = texture2D(uMap, vec2(0.5, clamp(uv.y, 0.03, 0.97))).rgb;
        vec3 p2 = texture2D(uMap, vec2(0.82, clamp(uv.y, 0.03, 0.97))).rgb;
        albedo = mix(albedo, (p0 + p1 + p2) / 3.0, pole * 0.92);
        albedo = mix(albedo, vec3(dot(albedo, vec3(0.299, 0.587, 0.114))), pole * 0.16);
        float luma = dot(albedo, vec3(0.299, 0.587, 0.114));
        albedo *= 0.72 + 0.62 * smoothstep(0.12, 0.78, luma);
        albedo = clamp(albedo, 0.0, 1.0);
        vec3 N = normalize(vN);
        vec3 sunPosition = (viewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
        vec3 L = normalize(sunPosition - vP);
        float ndl = dot(N, L);
        float wrap = uWrap;
        float diffuse = clamp((ndl + wrap) / (1.0 + wrap), 0.0, 1.0);
        diffuse = pow(max(diffuse, 0.0), 0.82);
        float terminator = smoothstep(-0.18, 0.42, ndl);
        vec3 V = normalize(-vP);
        float ndv = clamp(dot(N, V), 0.0, 1.0);
        vec3 sunCol = vec3(1.0, 0.9, 0.72);
        vec3 day = albedo * sunCol * (0.08 + 0.92 * diffuse);
        vec3 night = albedo * vec3(0.015, 0.016, 0.02);
        vec3 col = mix(night, day, terminator);
        float graze = pow(1.0 - ndv, 2.1) * smoothstep(-0.05, 0.55, ndl);
        col += sunCol * graze * (0.08 + uGloss * 0.35);
        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), uShininess) * uGloss * 0.42;
        col += sunCol * spec * smoothstep(0.15, 0.7, ndl);
        col += albedo * vec3(0.35, 0.42, 0.55) * pow(1.0 - ndv, 3.2) * uRim * 0.35;
        gl_FragColor = vec4(col, uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    transparent: true,
    toneMapped: true,
  });
}

function disposeScene(scene: THREE.Scene) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  scene.traverse((obj) => {
  if (
    obj instanceof THREE.Mesh ||
    obj instanceof THREE.Line ||
    obj instanceof THREE.Sprite ||
    obj instanceof THREE.Points ||
    obj instanceof Line2
  ) {
    geometries.add(obj.geometry);
    const mat = obj.material;
    const list = Array.isArray(mat) ? mat : [mat];
    list.forEach((m) => materials.add(m));
  }
  });
  geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  scene.clear();
}

const ORBIT_OPACITY: Record<BodyKind, number> = { mercury: 0.22, venus: 0.14, earth: 0.11, mars: 0.08 };
const SURFACES: Record<BodyKind, { bump: number; gloss: number; shininess: number }> = {
  mercury: { bump: 0.0011, gloss: 0.06, shininess: 22 },
  venus: { bump: 0.0004, gloss: 0.035, shininess: 18 },
  earth: { bump: 0.0016, gloss: 0.16, shininess: 48 },
  mars: { bump: 0.006, gloss: 0.04, shininess: 22 },
};

const BODIES: { name: BodyKind; au: number; size: number; phase: number; inc: number; speed: number; wrap: number; rim: number }[] = [
  { name: "mercury", au: 0.82, size: 0.11, phase: 0.95, inc: 0.08, speed: 0.02, wrap: 0.05, rim: 0.1 },
  { name: "venus", au: 1.28, size: 0.09, phase: 2.35, inc: 0.05, speed: 0.014, wrap: 0.06, rim: 0.1 },
  { name: "earth", au: 1.72, size: 0.095, phase: 3.7, inc: 0.04, speed: 0.01, wrap: 0.035, rim: 0.1 },
  { name: "mars", au: 2.12, size: 0.075, phase: 5.15, inc: 0.06, speed: 0.008, wrap: 0.03, rim: 0.08 },
];

export function SolarSystem() {
  const host = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    initMotionState();
    setReduced(isReduced());
    return subscribeMotion(setReduced);
  }, []);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    initMotionState();
    const voidEl = el.closest("[data-hero-void]");
    const frozen = reduced || isReduced();

    let live = true;
    let teardown: (() => void) | undefined;
    const fail = () => {
      el.dataset.fallback = "1";
      voidEl?.classList.remove("has-webgl-live");
    };

    void (async () => {
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      });
    } catch {
      fail();
      return;
    }

    const loader = new THREE.TextureLoader();
    const owned = new Set<THREE.Texture>();
    let packed: THREE.Texture[] = [];
    try {
      packed = await Promise.all([
        loadTexture(loader, SOLAR_MAPS.sun, owned),
        loadTexture(loader, SOLAR_MAPS.mercury, owned),
        loadTexture(loader, SOLAR_MAPS.venus, owned),
        loadTexture(loader, SOLAR_MAPS.earth, owned),
        loadTexture(loader, SOLAR_MAPS.mars, owned),
      ]);
    } catch {
      fail();
      owned.forEach((texture) => texture.dispose());
      renderer.dispose();
      return;
    }
    if (!live) {
      owned.forEach((t) => t.dispose());
      renderer.dispose();
      return;
    }
    const [sunTex, merTex, venTex, earTex, marTex] = packed;
    prepMap(sunTex, 4);
    prepMap(merTex, 8);
    prepMap(venTex, 2);
    prepMap(earTex, 2);
    prepMap(marTex, 2);
    const bodyMaps: Record<BodyKind, THREE.Texture> = {
      mercury: merTex,
      venus: venTex,
      earth: earTex,
      mars: marTex,
    };

    let dpr = 1;
    renderer.setPixelRatio(dpr);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.domElement.setAttribute("aria-hidden", "true");
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const system = new THREE.Group();
    scene.add(system);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.02, 90);
    const scratch = new THREE.Vector3();

    const sunUniforms = { uTime: { value: 0 }, uMap: { value: sunTex }, uFade: { value: 1 } };
    const sunMat = new THREE.ShaderMaterial({
      uniforms: sunUniforms,
      vertexShader: `
        varying vec3 vN; varying vec3 vW; varying vec2 vUv;
        void main() {
          vUv = uv; vN = normalize(normalMatrix * normal);
          vec4 w = modelViewMatrix * vec4(position, 1.0); vW = w.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime; uniform sampler2D uMap; uniform float uFade;
        varying vec3 vN; varying vec3 vW; varying vec2 vUv;
        void main() {
          vec3 view = normalize(-vW);
          float ndv = clamp(dot(normalize(vN), view), 0.0, 1.0);
          float limb = pow(ndv, 0.62);
          vec2 uv = vUv * vec2(18.0, 11.0);
          float boil = sin(uv.x * 2.1 + uTime * 0.17) * sin(uv.y * 1.7 - uTime * 0.13);
          float fine = sin(uv.x * 5.4 - uTime * 0.09 + boil) * sin(uv.y * 4.6 + uTime * 0.11);
          float cell = smoothstep(0.15, 0.85, 0.5 + 0.5 * (0.65 * boil + 0.35 * fine));
          vec3 photo = texture2D(uMap, fract(vUv + vec2(uTime * 0.0015, 0.0))).rgb;
          float photoL = dot(photo, vec3(0.3, 0.59, 0.11));
          vec3 core = vec3(1.0, 0.97, 0.88);
          vec3 midc = vec3(1.0, 0.72, 0.28);
          vec3 rimc = vec3(0.78, 0.22, 0.04);
          vec3 col = mix(rimc, mix(midc, core, limb), smoothstep(0.0, 0.82, ndv));
          col *= 0.78 + 0.22 * cell + 0.08 * photoL;
          col *= 0.86;
          gl_FragColor = vec4(col, uFade);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      toneMapped: true,
    });
    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.17, 96, 64), sunMat);
    sun.renderOrder = 4;
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = 256;
    glowCanvas.height = 256;
    const glowCtx = glowCanvas.getContext("2d");
    if (glowCtx) {
      const rad = glowCtx.createRadialGradient(128, 128, 8, 128, 128, 128);
      rad.addColorStop(0, "rgba(255,236,200,0)");
      rad.addColorStop(0.34, "rgba(255,214,150,0.42)");
      rad.addColorStop(0.58, "rgba(255,150,60,0.08)");
      rad.addColorStop(1, "rgba(255,120,40,0)");
      glowCtx.fillStyle = rad;
      glowCtx.fillRect(0, 0, 256, 256);
    }
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    glowTex.colorSpace = THREE.SRGBColorSpace;
    owned.add(glowTex);
    const sunGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        opacity: 0.9,
      }),
    );
    sunGlow.scale.set(0.62, 0.62, 1);
    sunGlow.renderOrder = 3;
    system.add(sun, sunGlow);

    type Body = {
      name: BodyKind;
      mesh: THREE.Mesh;
      mat: THREE.ShaderMaterial;
      r: number;
      size: number;
      phase: number;
      inc: number;
      speed: number;
    };
    const bodies: Body[] = BODIES.map((spec) => {
      const map = bodyMaps[spec.name];
      const surface = SURFACES[spec.name];
      const mat = makeBodyMat(map, spec.wrap, spec.rim, surface.bump, surface.gloss, surface.shininess);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(spec.size, spec.name === "mercury" ? 96 : 32, spec.name === "mercury" ? 96 : 32),
        mat,
      );
      mesh.renderOrder = 5;
      system.add(mesh);
      return { name: spec.name, mesh, mat, r: spec.au, size: spec.size, phase: spec.phase, inc: spec.inc, speed: spec.speed };
    });
    const mercury = bodies[0];

    type Orbit = { name: BodyKind; line: Line2; mat: LineMaterial };
    const orbits: Orbit[] = BODIES.map((spec) => {
      const pts: number[] = [];
      const cols: number[] = [];
      for (let i = 0; i <= 180; i += 1) {
        const a = (i / 180) * Math.PI * 2;
        orbitPos(a, spec.au, spec.inc, scratch);
        pts.push(scratch.x, scratch.y, scratch.z);
        const toward = Math.sin(a);
        const fade = toward < 0 ? Math.max(0, 0.22 + toward) : 0.35 + toward * 0.65;
        cols.push(0.78 * fade, 0.84 * fade, 0.96 * fade);
      }
      const geo = new LineGeometry();
      geo.setPositions(pts);
      geo.setColors(cols);
      const mat = new LineMaterial({
        vertexColors: true, transparent: true,
        opacity: ORBIT_OPACITY[spec.name],
        linewidth: spec.name === "mercury" ? 1.05 : 0.75, worldUnits: false, depthWrite: false, depthTest: true, toneMapped: false,
      });
      mat.blending = THREE.AdditiveBlending;
      const line = new Line2(geo, mat);
      line.computeLineDistances();
      line.renderOrder = 2;
      system.add(line);
      return { name: spec.name, line, mat };
    });

    const starUniforms = { uTime: { value: 0 }, uPixel: { value: dpr }, uOpacity: { value: 1 } };
    const starMat = new THREE.ShaderMaterial({
      uniforms: starUniforms,
      vertexShader: `
        attribute float aSize; attribute float aPhase;
        uniform float uTime; uniform float uPixel;
        varying float vTw; varying vec3 vCol;
        void main() {
          vCol = color;
          vTw = 0.82 + 0.18 * sin(uTime * (0.15 + aPhase * 0.2) + aPhase * 6.0);
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          float dist = max(0.12, -mv.z);
          gl_PointSize = clamp(aSize * uPixel * (52.0 / dist), 0.35, 1.8);
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: `
        varying float vTw; varying vec3 vCol; uniform float uOpacity;
        void main() {
          vec2 p = gl_PointCoord - vec2(0.5);
          float core = pow(clamp(1.0 - length(p) * 2.4, 0.0, 1.0), 2.4);
          float a = core * 0.55 * vTw * uOpacity;
          if (a < 0.016) discard;
          gl_FragColor = vec4(vCol, a);
        }
      `,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true, toneMapped: false,
    });
    const seedStars = (count: number, radMin: number, radSpan: number, seed: number, band = false) => {
      const pos = new Float32Array(count * 3);
      const col = new Float32Array(count * 3);
      const size = new Float32Array(count);
      const phase = new Float32Array(count);
      const rnd = mulberry(seed);
      for (let i = 0; i < count; i += 1) {
        const roll = rnd();
        if (band) {
          const a = rnd() * Math.PI * 2;
          const rad = radMin + rnd() * radSpan;
          pos[i * 3] = Math.cos(a) * rad;
          pos[i * 3 + 1] = (rnd() - 0.5) * rad * 0.07;
          pos[i * 3 + 2] = Math.sin(a) * rad * 0.42 - 6;
        } else {
          const theta = rnd() * Math.PI * 2;
          const phi = Math.acos(2 * rnd() - 1);
          const rad = radMin + rnd() * radSpan;
          pos[i * 3] = rad * Math.sin(phi) * Math.cos(theta);
          pos[i * 3 + 1] = rad * Math.cos(phi) * 0.72;
          pos[i * 3 + 2] = rad * Math.sin(phi) * Math.sin(theta);
        }
        if (roll < 0.18) {
          col[i * 3] = 0.62; col[i * 3 + 1] = 0.76; col[i * 3 + 2] = 1;
        } else if (roll < 0.28) {
          col[i * 3] = 1; col[i * 3 + 1] = 0.84; col[i * 3 + 2] = 0.7;
        } else {
          col[i * 3] = 0.9; col[i * 3 + 1] = 0.94; col[i * 3 + 2] = 1;
        }
        size[i] = (band ? 0.22 : 0.35) + rnd() * (band ? 0.35 : 0.7);
        phase[i] = rnd();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
      geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
      geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
      const pts = new THREE.Points(geo, starMat);
      pts.frustumCulled = false;
      pts.renderOrder = 1;
      return pts;
    };
    let starFar: THREE.Points | null = null;
    let starNear: THREE.Points | null = null;
    let starBand: THREE.Points | null = null;

    const mercuryWorld = new THREE.Vector3();
    const look = new THREE.Vector3();
    const camPos = new THREE.Vector3();
    const camStart = new THREE.Vector3();
    const kDay = new THREE.Vector3();
    const kLimb = new THREE.Vector3();
    const kCresc = new THREE.Vector3();
    const sunTarget = new THREE.Vector3();
    const sunDir = new THREE.Vector3();
    const right = new THREE.Vector3();
    const north = new THREE.Vector3();
    const worldUp = new THREE.Vector3(0, 1, 0);

    let w = 0;
    let h = 0;
    let compact = false;
    let phone = false;
    let wideColumn = false;
    let proven = false;

    const size = () => {
      w = el.clientWidth || window.innerWidth;
      h = el.clientHeight || window.innerHeight;
      if (w < 8 || h < 8) {
        proven = false;
        voidEl?.classList.remove("has-webgl-live");
        return;
      }
      compact = w < 1024;
      phone = w < 520;
      wideColumn = w >= 900;
      // Render crisp UI at any resolution; cap only the decorative GPU buffer.
      const pixels = phone ? 1_500_000 : 4_000_000;
      dpr = Math.min(window.devicePixelRatio || 1, phone ? 1.25 : 1.75, Math.sqrt(pixels / (w * h)));
      renderer!.setPixelRatio(dpr);
      starUniforms.uPixel.value = dpr;
      renderer!.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
      orbits.forEach((o) => o.mat.resolution.set(renderer!.domElement.width, renderer!.domElement.height));
      system.scale.setScalar(phone ? 0.92 : compact ? 1 : 1);
      system.position.y = phone ? 0.12 : compact ? 0.06 : 0.02;
      if (!starFar) {
        starFar = seedStars(phone ? 220 : compact ? 340 : 480, 16, 26, 42011);
        scene.add(starFar);
      }
      if (!starNear) {
        starNear = seedStars(phone ? 10 : 16, 6, 6, 8821);
        scene.add(starNear);
      }
      if (!starBand) {
        starBand = seedStars(phone ? 160 : compact ? 220 : 300, 10, 14, 12007, true);
        scene.add(starBand);
      }
    };
    size();

    let visible = true;
    let raf = 0;
    let t0 = performance.now();
    let contextLost = false;
    let pSmooth = getHeroProgress();
    requestAnimationFrame(() => {
      if (live) size();
    });

    const paint = (now: number) => {
      if (!live) return;
      raf = 0;
      const rawP = getHeroProgress();
      if (contextLost || !visible || document.hidden || (!frozen && rawP >= 0.6)) {
        if (!frozen && rawP >= 0.6) renderer!.domElement.style.visibility = "hidden";
        el.dataset.rendering = "paused";
        return;
      }
      el.dataset.rendering = "active";
      if (!frozen) raf = requestAnimationFrame(paint);
      const dt = Math.min(0.05, (now - t0) / 1000);
      t0 = now;
      if (Math.abs(rawP - pSmooth) > 0.35) pSmooth = rawP;
      else pSmooth += (rawP - pSmooth) * (1 - Math.exp(-dt / (phone ? 0.09 : 0.12)));
      const pView = frozen ? 0 : pSmooth;
      const reducedMotion = frozen;
      const tSec = now * 0.001;

      if (!reducedMotion && pView < 0.1) {
        bodies.forEach((b) => {
          b.phase += dt * b.speed * 0.35;
          b.mesh.rotation.y += dt * (b.name === "mercury" ? 0.08 : 0.03);
        });
        sun.rotation.y += dt * 0.02;
        if (starFar) starFar.rotation.y += dt * 0.004;
        if (starNear) starNear.rotation.y += dt * 0.008;
        if (starBand) starBand.rotation.y += dt * 0.006;
      }
      bodies.forEach((b) => {
        orbitPos(b.phase, b.r, b.inc, scratch);
        b.mesh.position.copy(scratch);
      });
      mercury.mesh.getWorldPosition(mercuryWorld);

      const vFovDeg = wideColumn ? 24 : phone ? 32 : 28;
      const envelope = 2.28;
      const vHalf = Math.tan((vFovDeg * Math.PI) / 360);
      const hHalf = vHalf * (w / Math.max(h, 1));
      const stageW = wideColumn ? w * 0.56 : w * 0.9;
      const stageH = wideColumn ? (h - 76) * 0.86 : (h - 76) * 0.5;
      const fill = wideColumn ? 0.98 : 0.92;
      const distW = envelope / (hHalf * (stageW / w) * fill);
      const distH = envelope / (vHalf * (stageH / h) * fill);
      const dist = Math.max(distW, distH);
      const elev = wideColumn ? 0.46 : 0.52;
      camStart.set(0, dist * Math.sin(elev), dist * Math.cos(elev));
      const lift = phone ? 0.04 : compact ? 0.02 : 0.0;
      sunTarget.set(0.0, lift, 0);
      const stageCx = wideColumn ? w * 0.71 : w * 0.5;
      const stageCy = wideColumn ? 76 + (h - 76) * 0.48 : 76 + (h - 76) * 0.3;
      camera.setViewOffset(w, h, w * 0.5 - stageCx, h * 0.5 - stageCy, w, h);

      const fovClose = Math.max(24, vFovDeg - 8);
      const halfClose = Math.tan((fovClose * Math.PI) / 360);
      const shortMul = Math.min(1, w / Math.max(h, 1));
      const fillAmt = 0.42;
      const fit = system.scale.x || 1;
      const dFill = (mercury.size * fit) / (fillAmt * halfClose * Math.max(0.55, shortMul));

      const merLen = Math.max(mercuryWorld.length(), 0.001);
      sunDir.copy(mercuryWorld).multiplyScalar(1 / merLen);
      right.crossVectors(worldUp, sunDir);
      if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
      right.normalize();
      north.crossVectors(sunDir, right).normalize();

      const dDay = (phone ? 1.72 : compact ? 1.58 : 1.5) * fit;
      const dLimb = (phone ? 1.22 : compact ? 1.12 : 1.06) * fit;
      kDay.copy(mercuryWorld).addScaledVector(right, dDay * 0.82).addScaledVector(sunDir, -dDay * 0.52).addScaledVector(north, dDay * 0.2);
      kLimb.copy(mercuryWorld).addScaledVector(right, dLimb * 0.78).addScaledVector(sunDir, dLimb * 0.12).addScaledVector(north, dLimb * 0.14);
      kCresc.copy(mercuryWorld).addScaledVector(right, dFill * 0.4).addScaledVector(sunDir, dFill * 0.74).addScaledVector(north, dFill * 0.08);

      const dayT = easeInOut(clamp((pView - 0.12) / 0.1));
      const limbT = easeInOut(clamp((pView - 0.22) / 0.1));
      const crescT = easeInOut(clamp((pView - 0.32) / 0.12));
      camPos.copy(camStart);
      camPos.lerp(kDay, dayT);
      camPos.lerp(kLimb, limbT);
      camPos.lerp(kCresc, crescT);
      look.copy(sunTarget);
      look.lerp(mercuryWorld, easeInOut(clamp((pView - 0.1) / 0.16)));

      camera.position.copy(camPos);
      camera.lookAt(look);
      camera.fov = vFovDeg - crescT * 8;
      camera.updateProjectionMatrix();

      const othersOut = 1 - easeInOut(clamp((pView - 0.16) / 0.1));
      const sunOut = 1 - easeInOut(clamp((pView - 0.42) / 0.1));
      const merHold = 1 - easeInOut(clamp((pView - 0.5) / 0.08));
      const orbitOut = 1 - easeInOut(clamp((pView - 0.3) / 0.14));
      const sky = Math.max(merHold, sunOut);

      sunUniforms.uTime.value = frozen ? 0 : tSec;
      sunUniforms.uFade.value = sunOut;
      starUniforms.uTime.value = frozen ? 0 : tSec;
      starUniforms.uOpacity.value = sky;
      sun.visible = sunOut > 0.02;
      sunGlow.visible = sunOut > 0.02;
      (sunGlow.material as THREE.SpriteMaterial).opacity = 0.9 * sunOut;
      const sceneFade = 1 - easeInOut(clamp((pView - 0.3) / 0.08));
      renderer!.domElement.style.opacity = String(sceneFade * merHold);

      orbits.forEach((o) => {
        const boost = o.name === "mercury" ? 1 : othersOut;
        const base = ORBIT_OPACITY[o.name];
        o.mat.opacity = base * orbitOut * boost;
        o.line.visible = o.mat.opacity > 0.025;
      });
      bodies.forEach((b) => {
        const fade = b.name === "mercury" ? merHold : othersOut;
        b.mat.uniforms.uOpacity.value = fade;
        b.mesh.visible = fade > 0.02;
      });

      renderer!.domElement.style.visibility = sceneFade * merHold < 0.04 ? "hidden" : "visible";
      renderer!.render(scene, camera);
      if (!proven && w > 8 && h > 8 && renderer!.info.render.triangles > 0) {
        proven = true;
        voidEl?.classList.add("has-webgl-live");
        el.removeAttribute("data-fallback");
      }
    };
    raf = requestAnimationFrame(paint);

    const onLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      cancelAnimationFrame(raf);
      raf = 0;
      proven = false;
      el.dataset.fallback = "1";
      voidEl?.classList.remove("has-webgl-live");
    };
    const onRestored = () => {
      contextLost = false;
      resume();
      el.removeAttribute("data-fallback");
      size();
    };
    renderer.domElement.addEventListener("webglcontextlost", onLost);
    renderer.domElement.addEventListener("webglcontextrestored", onRestored);
    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible && live && !raf) {
        t0 = performance.now();
        raf = requestAnimationFrame(paint);
      }
    }, { threshold: 0.02 });
    io.observe(el);
    const onVis = () => {
      if (document.visibilityState === "visible" && live) {
        t0 = performance.now();
        if (!raf) raf = requestAnimationFrame(paint);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    const resume = () => {
      if (live && !raf && !contextLost && !isReduced() && visible && !document.hidden && getHeroProgress() < 0.6) {
        t0 = performance.now();
        raf = requestAnimationFrame(paint);
      }
    };
    const unsubP = onHeroProgress(resume);
    const unsubM = subscribeMotion(resume);
    window.addEventListener("resize", size);
    const ro = new ResizeObserver(size);
    ro.observe(el);

    teardown = () => {
      live = false;
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("webglcontextlost", onLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onRestored);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", size);
      unsubP();
      unsubM();
      voidEl?.classList.remove("has-webgl-live");
      disposeScene(scene);
      owned.forEach((t) => t.dispose());
      renderer?.dispose();
      renderer?.domElement.remove();
    };
    })().catch(() => { teardown?.(); fail(); });

    return () => {
      live = false;
      teardown?.();
    };
  }, [reduced]);

  return <div className="solar-globe" data-solar-globe ref={host} aria-hidden="true" />;
}
