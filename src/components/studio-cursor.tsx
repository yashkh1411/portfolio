import { useEffect, useRef } from "react";
import gsap from "gsap";

export function StudioCursor() {
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ring.current;
    if (!el) return;
    const media = gsap.matchMedia();
    media.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
    document.documentElement.classList.add("has-cursor");
    const xTo = gsap.quickTo(el, "x", { duration: 0.45, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.45, ease: "power3.out" });

    const move = (e: PointerEvent) => {
      el.classList.add("is-on");
      xTo(e.clientX);
      yTo(e.clientY);
    };
    const over = (e: PointerEvent) => {
      const hit = (e.target as HTMLElement | null)?.closest("a, button, [data-magnetic]");
      el.classList.toggle("is-hot", Boolean(hit));
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerover", over);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      document.documentElement.classList.remove("has-cursor");
      el.classList.remove("is-on", "is-hot");
      xTo.tween.kill();
      yTo.tween.kill();
    };
    });
    return () => media.revert();
  }, []);

  return (
    <div className="studio-cursor" ref={ring} aria-hidden="true">
      <i />
    </div>
  );
}
