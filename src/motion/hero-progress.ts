let p = 0;
const listeners = new Set<(n: number) => void>();

export function setHeroProgress(n: number) {
  p = Math.max(0, Math.min(1, n));
  listeners.forEach((fn) => fn(p));
}

export function getHeroProgress() {
  return p;
}

export function onHeroProgress(fn: (n: number) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
