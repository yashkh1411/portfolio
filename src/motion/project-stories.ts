import gsap from "gsap";

/** Runs inside the site's matchMedia context, so a breakpoint/reduced-motion
 * change reverts every owned tween. Content remains readable without JS. */
export function initProjectStories(root: HTMLElement, reduced: boolean) {
  const chart = root.querySelector<HTMLElement>("[data-fin-chart]");
  const mask = chart?.querySelector("[data-fin-reveal]");
  if (chart && mask && !reduced) {
    gsap.fromTo(mask, { attr: { width: "0%" } }, {
      attr: { width: "100%" }, ease: "none",
      scrollTrigger: { trigger: chart, start: "top 85%", end: "top 32%", scrub: .4 },
    });
  }

  const story = root.querySelector<HTMLElement>("[data-travel-story]");
  const camera = story?.querySelector("[data-travel-camera]");
  if (!story || !camera || reduced) return;
  const compact = window.matchMedia("(max-width: 767px)").matches;
  // Only a tiny viewport skips the scroll story. Shorter phones and laptops
  // still advance Plan → Translate → Navigate; CSS shortens the pin.
  if (window.innerHeight < 520) return;
  let previous = -1;
  let stick = false;
  let ignoreScrollUntil = 0;
  const clock = { progress: 0 };
  const buttons = compact ? [...story.querySelectorAll<HTMLButtonElement>(".travel-controls button")] : [];
  const onClick = () => {
    stick = true;
    ignoreScrollUntil = performance.now() + 420;
  };
  const onScroll = () => {
    if (performance.now() < ignoreScrollUntil) return;
    stick = false;
  };
  buttons.forEach((btn) => btn.addEventListener("click", onClick));
  if (compact) window.addEventListener("scroll", onScroll, { passive: true });
  gsap.to(clock, {
    progress: 1, ease: "none",
    scrollTrigger: { trigger: story, start: "top top", end: "bottom bottom", scrub: compact ? 0.22 : 0.45, invalidateOnRefresh: true },
    onUpdate: () => {
      const p = clock.progress;
      if (!compact) {
        (camera as HTMLElement).style.transform = `perspective(1100px) rotateX(${12 - p * 10}deg) rotateZ(${-4 + p * 3}deg) scale(${.96 + p * .05})`;
      }
      if (compact && stick) return;
      const next = Math.min(2, Math.floor(p * 3));
      // Direct DOM painting avoids creating GSAP tweens inside a scroll callback.
      if (next !== previous) {
        previous = next;
        story.dispatchEvent(new CustomEvent("roam-step", { detail: next }));
      }
    },
  });
  // CSS owns the static transform; don't leave a desktop camera on a phone.
  return () => {
    buttons.forEach((btn) => btn.removeEventListener("click", onClick));
    if (compact) window.removeEventListener("scroll", onScroll);
    (camera as HTMLElement).style.removeProperty("transform");
  };
}
