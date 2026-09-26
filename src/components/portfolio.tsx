import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { HireDialog } from "@/components/hire-dialog";
import { HeroScene } from "@/components/scenes/hero-scene";
import { DoScene } from "@/components/scenes/do-scene";
import {
  AboutScene,
  ApproachScene,
  FinalCta,
  FinPulseScene,
  RoamScene,
  WorkIndex,
} from "@/components/scenes/rest-scenes";
import { siteConfig } from "@/lib/site-config";
import { initMotionState } from "@/hooks/motion-state";

const StudioCursor = lazy(() => import("@/components/studio-cursor").then((m) => ({ default: m.StudioCursor })));

export function Portfolio() {
  const root = useRef<HTMLDivElement>(null);
  const [hire, setHire] = useState(false);
  const [motionReady, setMotionReady] = useState(false);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    initMotionState();
  }, []);

  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;
    let secondFrame = 0;
    let anchorFrame = 0;
    let interacted = false;
    const initialHash = window.location.hash;
    const markInteraction = () => { interacted = true; };
    const inputEvents = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    inputEvents.forEach((event) => window.addEventListener(event, markInteraction, { passive: true, once: true }));
    // Pin geometry grows after hydration. Restore a direct link once that layout
    // is measured, but never pull a visitor back after they start navigating.
    const alignInitialAnchor = () => {
      cancelAnimationFrame(anchorFrame);
      anchorFrame = requestAnimationFrame(() => {
        if (disposed || interacted || !initialHash || window.location.hash !== initialHash) return;
        let id: string;
        try { id = decodeURIComponent(initialHash.slice(1)); } catch { return; }
        const target = document.getElementById(id);
        if (target && root.current?.contains(target)) window.scrollTo(0, window.scrollY + target.getBoundingClientRect().top);
      });
    };
    // Server-rendered identity gets a paint before loading/measuring scroll effects.
    const firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        void import("@/motion/choreography").then(({ initChoreography }) => {
          if (!disposed && root.current) {
            cleanup = initChoreography(root.current);
            setMotionReady(true);
            alignInitialAnchor();
            void document.fonts.ready.then(alignInitialAnchor);
          }
        }).catch(() => {
          // The CSS reading layout, links and interactive demos remain available.
          document.documentElement.classList.remove("motion-ready");
        });
      });
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(firstFrame); cancelAnimationFrame(secondFrame); cancelAnimationFrame(anchorFrame);
      inputEvents.forEach((event) => window.removeEventListener(event, markInteraction));
      cleanup?.();
    };
  }, []);

  const openHire = () => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setHire(true);
  };

  const closeHire = () => {
    setHire(false);
    requestAnimationFrame(() => opener.current?.focus());
  };

  return (
    <div ref={root} data-app className="site-root">
      <a className="skip-link" href="#work">
        Skip to work
      </a>
      {motionReady && <Suspense fallback={null}><StudioCursor /></Suspense>}
      <div className="progress" data-progress aria-hidden="true" />
      <i className="carry" data-carry aria-hidden="true" />
      <SiteHeader onHire={openHire} />
      <main>
        <HeroScene onHire={openHire} />
        <WorkIndex />
        <DoScene />
        <FinPulseScene />
        <RoamScene />
        <ApproachScene />
        <AboutScene />
        <FinalCta onHire={openHire} />
      </main>
      <footer className="site-footer">
        <span>{siteConfig.name} / New Delhi / 2026</span>
        <a href="/credits.html">Visual credits</a>
        <button type="button" className="cta-line" onClick={openHire}>Enquire about a project ↗</button>
        <noscript><p>Fiverr: @{siteConfig.fiverrUsername} · profile being prepared.</p></noscript>
      </footer>
      <HireDialog open={hire} onClose={closeHire} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: siteConfig.name,
            jobTitle: "AI Product Engineer",
            sameAs: [siteConfig.links.fiverr, siteConfig.links.github, siteConfig.links.linkedin].filter(Boolean),
            address: {
              "@type": "PostalAddress",
              addressLocality: "New Delhi",
              addressCountry: "IN",
            },
          }),
        }}
      />
    </div>
  );
}
