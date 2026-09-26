import gsap from "gsap";
import { setHeroProgress } from "@/motion/hero-progress";

const range = (value: number, start: number, end: number) => Math.max(0, Math.min(1, (value - start) / (end - start)));
const ease = (value: number) => value * value * (3 - 2 * value);
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type Frame = {
  autoAlpha?: number;
  opacity?: number;
  x?: number;
  y?: number;
  yPercent?: number;
  rotateX?: number;
  rotateY?: number;
  scale?: number;
  scaleX?: number;
  transformOrigin?: string;
  clipPath?: string;
};

function paint(targets: HTMLElement | NodeListOf<HTMLElement> | null, frame: Frame) {
  const elements = targets instanceof HTMLElement ? [targets] : targets ?? [];
  for (const element of elements) {
    const style = element.style;
    if (frame.autoAlpha !== undefined) {
      style.opacity = String(frame.autoAlpha);
      style.visibility = frame.autoAlpha > 0 ? "inherit" : "hidden";
    }
    if (frame.opacity !== undefined) style.opacity = String(frame.opacity);
    if (frame.clipPath !== undefined) style.clipPath = frame.clipPath;
    if (frame.transformOrigin !== undefined) style.transformOrigin = frame.transformOrigin;
    if ([frame.x, frame.y, frame.yPercent, frame.rotateX, frame.rotateY, frame.scale, frame.scaleX].some((value) => value !== undefined)) {
      style.transform = `translate3d(${frame.x ?? 0}px, ${frame.y ?? 0}px, 0) translateY(${frame.yPercent ?? 0}%) rotateX(${frame.rotateX ?? 0}deg) rotateY(${frame.rotateY ?? 0}deg) scale(${frame.scaleX ?? frame.scale ?? 1}, ${frame.scale ?? 1})`;
    }
  }
}

function flapState(target: string, t: number) {
  const goal = ALPHA.indexOf(target.toUpperCase());
  if (goal <= 0) return { ch: target, spin: 0 };
  const travel = Math.min(goal, Math.max(0, t) * goal);
  const idx = Math.min(goal, Math.floor(travel));
  return { ch: ALPHA[idx] ?? target, spin: idx < goal ? travel - idx : 0 };
}

/** One clock owns the cinematic hero. Scroll advances a tween, not independent timers. */
export function initHero(root: HTMLElement, reduced: boolean, onEnter: () => void) {
  const find = (selector: string) => root.querySelectorAll<HTMLElement>(selector);
  const scene = root.querySelector<HTMLElement>("[data-hero-scene]");
  const pin = root.querySelector<HTMLElement>("[data-hero-pin]");
  if (!scene || !pin) return;
  const identity = find("[data-identity]");
  const exit = find("[data-hero-exit]");
  const plate = find("[data-hero-plate]");
  const photo = find("[data-plate-print], [data-plate-hills]");
  const solar = find("[data-solar]");
  const space = find("[data-space], [data-space-dust]");
  const cue = find("[data-scroll-cue]");
  const grid = find("[data-sys-grid]");
  const typeLayer = find("[data-systems-over]");
  const cabin = find("[data-cabin]");
  const meta = find("[data-cabin-meta]");
  const voidLayer = root.querySelector<HTMLElement>("[data-hero-void]");
  const compact = window.matchMedia("(max-width: 599px)").matches;
  const words = [
    { id: "ai", start: 0.54, end: 0.65, mode: "depth" },
    { id: "agents", start: 0.65, end: 0.76, mode: "spread" },
    { id: "auto", start: 0.76, end: 0.87, mode: "roll" },
    { id: "sys", start: 0.87, end: 1, mode: "thread" },
  ].map((beat) => ({
    ...beat,
    element: root.querySelector<HTMLElement>(`[data-sys="${beat.id}"]`),
    letters: find(`[data-sys="${beat.id}"] [data-ch]`),
  }));
  const nameBits = find("[data-yash], [data-khair], [data-hero-kicker], [data-hero-ui], [data-hero-statement], [data-hero-caps]");
  const faces = [...root.querySelectorAll<HTMLElement>("[data-board-face]")];

  paint(nameBits, { autoAlpha: 1 });
  paint(find("[data-plate-rule], [data-plate-colophon]"), { autoAlpha: 0 });
  if (reduced) {
    paint(exit, { autoAlpha: 1 });
    paint(identity, { autoAlpha: 1, y: 0, scale: 1 });
    paint(plate, { autoAlpha: 0 });
    paint(find("[data-hero-void], [data-systems-over], [data-cabin]"), { autoAlpha: 0 });
    setHeroProgress(1);
    return;
  }
  paint(find("[data-hero-void]"), { autoAlpha: 1 });
  paint(typeLayer, { autoAlpha: 0 });
  paint(cabin, { autoAlpha: 0 });

  const apply = (p: number) => {
    setHeroProgress(p);
    pin.dataset.p = p.toFixed(3);
    const opening = 1 - ease(range(p, 0.12, 0.2));
    const readable = opening;
    paint(exit, { autoAlpha: p < 0.56 ? 1 : 0 });
    paint(identity, { autoAlpha: readable, y: (1 - readable) * 16, scale: 1, transformOrigin: "left bottom" });
    paint(nameBits, { autoAlpha: 1 });
    paint(plate, { autoAlpha: 0 });
    paint(photo, { autoAlpha: 0 });

    const fallback = !voidLayer?.classList.contains("has-webgl-live");
    const solarOn = 1 - ease(range(p, 0.3, 0.4));
    paint(solar, { autoAlpha: fallback ? solarOn : 0, scale: 1 });
    paint(space, { autoAlpha: 1 - ease(range(p, 0.28, 0.38)) });
    paint(cue, { autoAlpha: (1 - range(p, 0.02, 0.08)) * opening });

    const cabinIn = ease(range(p, 0.4, 0.44));
    const cabinOut = ease(range(p, 0.5, 0.54));
    const cabinOn = cabinIn * (1 - cabinOut);
    paint(cabin, { autoAlpha: cabinOn, y: (1 - cabinIn) * 12 - cabinOut * 10 });
    const welcomeT = range(p, 0.4, 0.445);
    const aboardT = range(p, 0.418, 0.462);
    faces.forEach((face) => {
      const line = face.closest("[data-board]")?.getAttribute("data-board");
      const index = Number(face.dataset.i || 0);
      const local = line === "aboard"
        ? Math.max(0, Math.min(1, (aboardT - index * 0.06) / 0.55))
        : Math.max(0, Math.min(1, (welcomeT - index * 0.045) / 0.62));
      const { ch, spin } = flapState(face.dataset.target || "A", ease(local));
      if (face.textContent !== ch) face.textContent = ch;
      paint(face, { rotateX: -spin * 86, transformOrigin: "50% 0%" });
    });
    paint(meta, { autoAlpha: cabinOn * ease(range(p, 0.45, 0.48)) });

    paint(typeLayer, { autoAlpha: range(p, 0.52, 0.56) });
    words.forEach(({ start, end, mode, element, letters }) => {
      const t = range(p, start, end);
      const enter = ease(range(t, 0, 0.25));
      const leave = ease(range(t, 0.75, 1));
      const presence = enter * (1 - leave);
      paint(element, {
        autoAlpha: presence,
        scale: mode === "depth" ? 1.06 - enter * 0.06 : 0.98 + enter * 0.02,
        yPercent: mode === "thread" ? leave * 18 : (1 - enter) * 6,
        transformOrigin: "50% 50%",
      });
      letters.forEach((letter, i) => {
        const mid = (letters.length - 1) / 2;
        const spread = mode === "spread" ? (i - mid) * (compact ? 18 : 46) * (1 - enter) : 0;
        const roll = mode === "roll" ? (1 - enter) * (i % 2 === 0 ? -78 : 78) : 0;
        const thread = mode === "thread" ? (1 - enter) * (i - mid) * 8 : 0;
        paint(letter, {
          x: spread + thread,
          y: mode === "depth" ? (1 - enter) * 24 : 0,
          rotateX: roll,
          transformOrigin: "50% 50%",
        });
      });
    });
    paint(grid, { opacity: range(p, 0.96, 1), scaleX: range(p, 0.9, 1) });
  };

  const clock = { progress: 0 };
  apply(0);
  gsap.to(clock, {
    progress: 1,
    ease: "none",
    onUpdate: () => apply(clock.progress),
    scrollTrigger: {
      id: "hero-cinematic",
      trigger: scene,
      start: "top top",
      end: "bottom bottom",
      scrub: compact ? 0.2 : 0.4,
      invalidateOnRefresh: true,
      onEnter,
      onEnterBack: onEnter,
    },
  });
}
