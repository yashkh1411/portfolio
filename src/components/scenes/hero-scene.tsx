import { lazy, Suspense, useEffect, useState, type ComponentType } from "react";
import { siteConfig } from "@/lib/site-config";
import { SpaceField } from "@/components/space-field";
import { initMotionState, isReduced, subscribeMotion } from "@/hooks/motion-state";


const SolarSystem = lazy(async (): Promise<{ default: ComponentType }> => {
  if (import.meta.env.SSR) {
    return { default: function SolarPlaceholder() { return null; } };
  }
  const loaded = await import("@/components/solar-system");
  return { default: loaded.SolarSystem };
});

function SolarLayer() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    initMotionState();
    let idle = 0;
    let timer = 0;
    const arm = () => {
      if (idle) window.cancelIdleCallback?.(idle);
      if (timer) window.clearTimeout(timer);
      const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
      if (isReduced() || saveData) {
        setEnabled(false);
        return;
      }
      const start = () => {
        if (!isReduced()) setEnabled(true);
      };
      if (window.requestIdleCallback) idle = window.requestIdleCallback(start, { timeout: 700 });
      else timer = window.setTimeout(start, 280);
    };
    arm();
    const unMotion = subscribeMotion(arm);
    window.addEventListener("resize", arm);
    return () => {
      if (idle) window.cancelIdleCallback?.(idle);
      if (timer) window.clearTimeout(timer);
      unMotion();
      window.removeEventListener("resize", arm);
    };
  }, []);
  return enabled ? (
    <Suspense fallback={null}>
      <SolarSystem />
    </Suspense>
  ) : null;
}

function BoardWord({ word, id }: { word: string; id: string }) {
  return (
    <p className={`board-line board-${id}`} data-board={id}>
      {word.split("").map((ch, i) => (
        <span className="flap" key={`${id}-${i}`}>
          <span className="flap-face" data-board-face data-target={ch} data-i={i}>A</span>
        </span>
      ))}
    </p>
  );
}

function KineticWord({ word, id }: { word: string; id: string }) {
  return (
    <p data-sys={id} className={`sys-word sys-${id}`}>
      {Array.from(word).map((ch, i) => (
        <span key={`${id}-${i}`} className="sys-ch" data-ch={i}>
          {ch}
        </span>
      ))}
    </p>
  );
}

export function HeroScene({ onHire }: { onHire: () => void }) {
  return (
    <section className="hero-scene" id="top" aria-label="Introduction" data-hero-scene data-theme-on="void">
      <h1 className="sr-only">
        {siteConfig.name} — I build intelligent products. {siteConfig.role}
      </h1>

      <div className="hero-pin" data-hero-pin>
        <div className="hero-void" data-hero-void aria-hidden="true">
          <SpaceField />
          <i className="space-dust" data-space-dust />
          <div className="solar" data-solar>
            <div className="solar-rig">
              <i className="sun" />
              <span className="orbit o1 is-mercury">
                <i className="disc" />
              </span>
              <span className="orbit o2">
                <i className="disc" />
              </span>
              <span className="orbit o3">
                <i className="disc" />
              </span>
              <span className="orbit o4">
                <i className="disc" />
              </span>
              <span className="orbit o5">
                <i className="disc" />
              </span>
            </div>
          </div>
          <SolarLayer />
          <div className="mercury-stage" data-mercury>
            <div className="mercury-disc">
              <img src="/portraits/mercury.jpg" alt="" width={800} height={800} loading="lazy" decoding="async" />
            </div>
          </div>
          <div className="iris" data-iris />
        </div>

        <div className="cabin" data-cabin aria-hidden="true">
          <BoardWord word="WELCOME" id="welcome" />
          <BoardWord word="ABOARD" id="aboard" />
          <p className="cabin-meta" data-cabin-meta>Ideas, built into products.</p>
        </div>

        <div className="hero-exit" data-hero-exit>
          <div className="hero-plate" data-hero-plate>
            <picture>
              <source
                type="image/webp"
                srcSet="/portraits/plate-hills-800.webp 800w, /portraits/plate-hills.webp 1230w"
                sizes="100vw"
              />
              <img
                className="plate-hills"
                data-plate-hills
                src="/portraits/plate-hills.png"
                alt=""
                width={1230}
                height={768}
                loading="lazy"
                decoding="async"
              />
            </picture>
            <div className="plate-print" data-plate-print>
              <picture>
                <source
                  type="image/webp"
                  srcSet="/portraits/hero-800.webp 800w, /portraits/hero-1600.webp 1600w"
                  sizes="(max-width: 1023px) 72vw, 280px"
                />
                <img
                  className="hero-photo"
                  data-hero-photo
                  src="/portraits/hero.jpg"
                  width={1200}
                  height={1600}
                  alt="Yash Khairwal in profile against Himalayan foothills, wearing a denim jacket"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </div>
            <i className="plate-rule" data-plate-rule />
            <p className="plate-colophon" data-plate-colophon>
              PLATE 01 · MUSSOORIE · ORIGINAL
            </p>
          </div>

          <div className="hero-identity" data-identity>
            <div className="hero-lockup" data-lockup>
              <p className="hero-name hero-name-yash" data-yash>
                <span>YASH</span>
              </p>
              <p className="hero-name hero-name-khair" data-khair>
                <span data-khai>KHAI</span><span className="name-gap" aria-hidden="true" /><span data-rwal>RWAL</span>
              </p>
            </div>
            <p className="hero-kicker" data-hero-kicker>AI Product Engineer</p>
            <p className="hero-statement" data-hero-statement>
              I build <em>intelligent products.</em>
            </p>
            <p className="hero-caps" data-hero-caps>
              AI agents · automation · full-stack
            </p>
            <div className="hero-ui" data-hero-ui>
              <div className="hero-actions">
                <a className="cta-line" href="#work">
                  View work <span aria-hidden="true">↓</span>
                </a>
                <button className="cta-line" type="button" onClick={onHire} data-magnetic>
                  Start a project <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="systems-over" data-systems-over aria-hidden="true">
          <KineticWord word="AI" id="ai" />
          <KineticWord word="AGENTS" id="agents" />
          <KineticWord word="AUTOMATION" id="auto" />
          <KineticWord word="SYSTEMS" id="sys" />
          <i className="sys-grid" data-sys-grid />

        </div>

        <p className="scroll-cue" data-scroll-cue aria-hidden="true">
          <span>Scroll</span>
        </p>
      </div>
    </section>
  );
}
