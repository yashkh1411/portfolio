export const motion = {
  ease: {
    enter: "power3.out",
    exit: "power2.in",
    standard: "power2.out",
    cine: "power3.inOut",
  },
  duration: {
    fast: 0.22,
    standard: 0.38,
    reveal: 0.72,
    cine: 1.15,
  },
  magnetic: 4,
} as const;
