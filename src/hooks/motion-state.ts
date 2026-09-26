type Listener = (reduced: boolean) => void;

let reduced = false;
let inited = false;
const listeners = new Set<Listener>();

export function initMotionState() {
  if (inited || typeof window === "undefined") return;
  inited = true;
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const apply = () => {
    reduced = mq.matches;
    document.documentElement.classList.toggle("reduce", reduced);
    document.body.dataset.motion = reduced ? "off" : "on";
    listeners.forEach((fn) => fn(reduced));
  };
  mq.addEventListener("change", apply);
  apply();
}

export function isReduced() {
  return reduced;
}

export function subscribeMotion(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
