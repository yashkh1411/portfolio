import { useEffect, useRef } from "react";
import { initMotionState, isReduced, subscribeMotion } from "@/hooks/motion-state";
import { getHeroProgress, onHeroProgress } from "@/motion/hero-progress";

type Star = {
  x: number;
  y: number;
  r: number;
  a: number;
  s: number;
  vx: number;
  vy: number;
  kind: "dust" | "tiny" | "mid" | "spark";
  c: string;
};

export function SpaceField() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    initMotionState();
    let raf = 0;
    let stars: Star[] = [];
    let nebula: { x: number; y: number; r: number; a: number; tint: string }[] = [];
    let w = 0;
    let h = 0;
    let visible = true;

    const seedStars = () => {
      const parent = el.parentElement;
      w = parent?.clientWidth || window.innerWidth;
      h = parent?.clientHeight || window.innerHeight;
      if (w < 8 || h < 8) return;
      const dpr = Math.min(1.75, window.devicePixelRatio || 1);
      el.width = Math.floor(w * dpr);
      el.height = Math.floor(h * dpr);
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      const area = w * h;
      const tinyN = Math.max(48, Math.min(120, Math.floor(area / 9000)));
      const midN = Math.max(12, Math.min(28, Math.floor(area / 32000)));
      const sparkN = Math.max(2, Math.min(5, Math.floor(area / 140000)));
      const dustN = Math.max(4, Math.min(10, Math.floor(area / 70000)));
      let seed = 11;
      const rnd = () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
      };
      const pick = (): string => {
        const t = rnd();
        if (t < 0.16) return "186,206,255";
        if (t < 0.3) return "210,186,255";
        return "236,242,255";
      };
      stars = [];
      for (let i = 0; i < tinyN; i += 1) {
        stars.push({
          x: rnd() * w,
          y: rnd() * h,
          r: 0.4 + rnd() * 0.45,
          a: 0.22 + rnd() * 0.4,
          s: 0.25 + rnd() * 1.2,
          vx: (rnd() - 0.5) * 0.016,
          vy: (rnd() - 0.5) * 0.011,
          kind: "tiny",
          c: pick(),
        });
      }
      for (let i = 0; i < midN; i += 1) {
        stars.push({
          x: rnd() * w,
          y: rnd() * h,
          r: 0.85 + rnd() * 0.55,
          a: 0.4 + rnd() * 0.45,
          s: 0.4 + rnd() * 1.6,
          vx: (rnd() - 0.5) * 0.013,
          vy: (rnd() - 0.5) * 0.009,
          kind: "mid",
          c: pick(),
        });
      }
      for (let i = 0; i < sparkN; i += 1) {
        stars.push({
          x: rnd() * w,
          y: rnd() * h,
          r: 1.15 + rnd() * 0.7,
          a: 0.55 + rnd() * 0.4,
          s: 0.55 + rnd() * 1.4,
          vx: (rnd() - 0.5) * 0.011,
          vy: (rnd() - 0.5) * 0.008,
          kind: "spark",
          c: rnd() < 0.45 ? "255,244,220" : "232,226,214",
        });
      }
      for (let i = 0; i < dustN; i += 1) {
        stars.push({
          x: rnd() * w,
          y: rnd() * h,
          r: 0.7 + rnd() * 1.4,
          a: 0.05 + rnd() * 0.08,
          s: 0.12 + rnd() * 0.3,
          vx: (rnd() - 0.5) * 0.024,
          vy: (rnd() - 0.5) * 0.016,
          kind: "dust",
          c: "170,198,255",
        });
      }
      nebula = [];
    };

    const drawSpark = (ctx: CanvasRenderingContext2D, x: number, y: number, len: number, alpha: number, rgb: string) => {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(${rgb},${alpha.toFixed(3)})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(x - len, y);
      ctx.lineTo(x + len, y);
      ctx.moveTo(x, y - len * 0.7);
      ctx.lineTo(x, y + len * 0.7);
      ctx.stroke();
      ctx.restore();
    };

    const draw = (t: number) => {
      if (!running) return;
      const voidEl = el.closest("[data-hero-void]");
      const webglLive = Boolean(voidEl?.classList.contains("has-webgl-live"));
      if (!visible || document.visibilityState === "hidden" || isReduced() || getHeroProgress() < .01 || getHeroProgress() > 0.46 || webglLive) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(draw);
      const ctx = el.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(1.75, window.devicePixelRatio || 1);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const time = t * 0.001;
      ctx.globalCompositeOperation = "lighter";
      for (const n of nebula) {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        g.addColorStop(0, `rgba(${n.tint},${n.a})`);
        g.addColorStop(0.45, `rgba(${n.tint},${(n.a * 0.35).toFixed(3)})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const star of stars) {
        star.x += star.vx;
        star.y += star.vy;
        if (star.x < -4) star.x = w + 4;
        if (star.x > w + 4) star.x = -4;
        if (star.y < -4) star.y = h + 4;
        if (star.y > h + 4) star.y = -4;
        const tw = 0.48 + 0.52 * Math.sin(time * star.s * 1.32 + star.x * 0.01);
        const alpha = star.a * (star.kind === "dust" ? 1 : tw);
        ctx.fillStyle = `rgba(${star.c},${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
        if (star.kind === "spark") {
          const pulse = 0.35 + 0.65 * tw;
          drawSpark(ctx, star.x, star.y, 3.8 + star.r * 2.4 * pulse, alpha * 0.7, star.c);
        }
      }
      ctx.globalCompositeOperation = "source-over";
    };

    let running = true;
    seedStars();
    const resume = () => {
      if (running && !raf) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    const io = new IntersectionObserver(([e]) => {
      visible = Boolean(e?.isIntersecting);
      if (visible) resume();
    }, { threshold: 0.02 });
    io.observe(el);
    const voidEl = el.closest("[data-hero-void]");
    const mo = voidEl
      ? new MutationObserver(() => {
          if (!voidEl.classList.contains("has-webgl-live")) resume();
        })
      : null;
    if (voidEl && mo) mo.observe(voidEl, { attributes: true, attributeFilter: ["class"] });
    const onVis = () => {
      if (document.visibilityState === "visible") resume();
    };
    document.addEventListener("visibilitychange", onVis);
    const onResize = () => seedStars();
    window.addEventListener("resize", onResize);
    const unsub = subscribeMotion(() => {
      if (!isReduced()) resume();
    });
    const unsubProgress = onHeroProgress(() => {
      if (!isReduced() && getHeroProgress() < 0.46) resume();
    });
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      mo?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      unsub();
      unsubProgress();
    };
  }, []);

  return <canvas ref={canvas} className="space-field" data-space aria-hidden="true" />;
}
