import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "@/motion/tokens";
import { initHero } from "@/motion/hero";
import { initProjectStories } from "@/motion/project-stories";
import { initMotionState } from "@/hooks/motion-state";

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

type Theme = "paper" | "void" | "obsidian";

export function initChoreography(root: HTMLElement) {
  initMotionState();
  document.documentElement.classList.add("motion-ready");

  const progress = root.querySelector<HTMLElement>("[data-progress]");
  const setTheme = (_owner: string, theme: Theme) => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "void" ? "#040609" : theme === "obsidian" ? "#0C1118" : "#F4F5F2");
  };
  setTheme("hero", "void");

  const mm = gsap.matchMedia();

  const kill = () => {
    document.documentElement.classList.remove("motion-ready");
    document.documentElement.classList.remove("identity-on");
    mm.revert();
    ScrollTrigger.getAll().forEach((t) => {
      const trigger = t.trigger;
      if (trigger instanceof Node && root.contains(trigger)) t.kill();
    });
  };

  mm.add({ desktop: "(min-width: 1024px)", tablet: "(min-width: 600px) and (max-width: 1023px)", mobile: "(max-width: 599px)", compactStory: "(max-width: 767px)", tallStory: "(min-height: 700px)", tallPhoneStory: "(min-height: 780px)", reduced: "(prefers-reduced-motion: reduce)" }, (media) => {
    const reduced = Boolean(media.conditions?.reduced);
    const listeners: Array<() => void> = [];
    let disposed = false;
    const compactMq = window.matchMedia("(max-width: 767px)");
    {
      gsap.set("[data-do-b], [data-do-mark], [data-do-phone], [data-do-caption]", { autoAlpha: 0 });
      gsap.set("[data-do-kicker], [data-do-a]", { autoAlpha: 1 });
      gsap.set("[data-carry]", { scaleX: 0, autoAlpha: 0, transformOrigin: "0% 50%" });
      const pin = root.querySelector<HTMLElement>("[data-hero-pin]");
      initHero(root, reduced, () => setTheme("hero", "void"));

      const doTrack = root.querySelector<HTMLElement>("[data-do-track]");
      if (doTrack) {
        const doTl = gsap.timeline({
          scrollTrigger: {
            trigger: doTrack,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.3,
            invalidateOnRefresh: true,
            onEnter: () => setTheme("do", "void"),
            onEnterBack: () => setTheme("do", "void"),
            onLeave: () => {
              setTheme("case", "obsidian");
              gsap.to("[data-carry]", { autoAlpha: 0, duration: 0.18, overwrite: true });
            },
            onLeaveBack: () => setTheme("do", "void"),
          },
        });
        if (!reduced) {
          doTl.set("[data-do-kicker], [data-do-a]", { autoAlpha: 1 }, 0);
          doTl.to("[data-do-a]", { autoAlpha: 0, y: -24, duration: 0.08 }, 0.12);
          doTl.to("[data-do-b]", { autoAlpha: 1, duration: 0.06 }, 0.14);
          doTl.to("[data-do-b]", { autoAlpha: 0, y: -24, duration: 0.06 }, 0.22);
          doTl.fromTo("[data-do-mark]", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.1, ease: "none" }, 0.22);
          doTl.to("[data-do-mark]", { autoAlpha: 0, y: -40, duration: 0.08, ease: "none" }, 0.34);
          doTl.to({}, { duration: 0.42 }, 0.36);
          doTl.to({}, { duration: 0.22 }, 0.78);
          doTl.eventCallback("onUpdate", () => {
            const pinEl = doTrack.querySelector<HTMLElement>("[data-do-pin]");
            const wrap = doTrack.querySelector<HTMLElement>("[data-do-phone]");
            const rails = [...doTrack.querySelectorAll<HTMLElement>("[data-rail]")];
            const t = doTl.time();
            const phase = t < 0.36 ? "intro" : t < 0.46 ? "request" : t < 0.78 ? "exec" : "phone";
            if (pinEl && pinEl.dataset.phase !== phase) pinEl.dataset.phase = phase;
            if (wrap) {
              const dwell = phase === "phone" ? (t < 0.86 ? "home" : "plan") : "off";
              if (wrap.dataset.dwell !== dwell) {
                wrap.dataset.dwell = dwell;
                window.dispatchEvent(new CustomEvent("yk-do-dwell", { detail: dwell }));
              }
            }
            const live =
              t < 0.46 ? -1 : t < 0.52 ? 0 : t < 0.6 ? 1 : t < 0.66 ? 2 : t < 0.72 ? 3 : t < 0.78 ? 4 : -1;
            rails.forEach((el, i) => {
              el.classList.toggle("is-live", i === live);
              el.classList.toggle("is-gate", i === 1 && live === 1);
              el.classList.toggle("is-wait", i === 2 && live === 2);
              el.classList.toggle("is-verify", i === 3 && live === 3);
              el.classList.toggle("is-done", i === 4 && live === 4);
            });
          });
        } else {
          const pinEl = doTrack.querySelector<HTMLElement>("[data-do-pin]");
          if (pinEl) pinEl.dataset.phase = "phone";
          gsap.set("[data-do-phone], [data-do-caption]", { autoAlpha: 1, y: 0 });
        }
      }

      root.querySelectorAll<HTMLElement>("[data-case]").forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          end: "bottom 20%",
          onEnter: () => setTheme("case", "obsidian"),
          onEnterBack: () => setTheme("case", "obsidian"),
          onLeave: () => {
            /* FinPulse/ROAM handlers own the paper handoff */
          },
        });
      });
      const finCase = root.querySelector<HTMLElement>("#finpulse");
      if (finCase) {
        ScrollTrigger.create({
          trigger: finCase,
          start: "top 70%",
          end: "bottom 28%",
          onEnter: () => setTheme("paper", "paper"),
          onEnterBack: () => setTheme("paper", "paper"),
          onLeave: () => setTheme("paper", "paper"),
          onLeaveBack: () => setTheme("case", "obsidian"),
        });
        if (!reduced) {
          const reveal = finCase.querySelector<SVGRectElement>("[data-fin-reveal]");
          if (reveal) reveal.setAttribute("width", "0%");
          ScrollTrigger.create({
            trigger: finCase,
            start: "top 72%",
            end: "top 28%",
            scrub: 0.4,
            onUpdate: (self) => {
              if (reveal) reveal.setAttribute("width", `${Math.max(0.04, self.progress) * 100}%`);
            },
            onEnterBack: (self) => {
              if (reveal) reveal.setAttribute("width", `${Math.max(0.04, self.progress) * 100}%`);
            },
          });
        } else {
          finCase.querySelector<SVGRectElement>("[data-fin-reveal]")?.setAttribute("width", "100%");
        }
      }

      const roamChapter = root.querySelector<HTMLElement>("#roam");
      if (roamChapter) {
        ScrollTrigger.create({
          trigger: roamChapter,
          start: "top 55%",
          onEnter: () => setTheme("paper", "paper"),
          onLeaveBack: () => setTheme("paper", "paper"),
        });
      }

      const cleanProjectStories = initProjectStories(root, reduced);
      if (cleanProjectStories) listeners.push(cleanProjectStories);

      const evidence = root.querySelector<HTMLElement>("#do-evidence");
      if (evidence) {
        const flagship = [...evidence.querySelectorAll<HTMLElement>("[data-flagship]")];
        const flagIntro = flagship.filter((el) => !el.classList.contains("kicker"));
        const flagSteps = [...evidence.querySelectorAll<HTMLElement>(".arch-flow > li")];
        const flagRule = evidence.querySelector<HTMLElement>("[data-flagship-rule]");
        if (reduced) {
          gsap.set(flagship, { clearProps: "all", autoAlpha: 1, y: 0 });
          gsap.set(flagRule, { scaleX: 1 });
          flagSteps.forEach((el) => el.classList.remove("is-live"));
        } else {
          gsap.set(evidence.querySelector(".kicker"), { autoAlpha: 1, y: 0 });
          gsap.set(flagIntro, { autoAlpha: 0, y: 36 });
          if (flagRule) gsap.set(flagRule, { scaleX: 0, transformOrigin: "0% 50%" });
          ScrollTrigger.create({
            trigger: evidence,
            start: "top 88%",
            end: "top 42%",
            scrub: 0.42,
            onUpdate: (self) => {
              const p = self.progress;
              flagIntro.forEach((el, i) => {
                const t = Math.max(0, Math.min(1, (p - i * 0.1) / 0.34));
                gsap.set(el, { autoAlpha: t, y: (1 - t) * 36 });
              });
            },
          });
          if (flagSteps.length) {
            ScrollTrigger.create({
              trigger: evidence,
              start: "top 70%",
              end: "+=140%",
              scrub: 0.42,
              onUpdate: (self) => {
                const p = self.progress;
                const n = flagSteps.length;
                const live = Math.min(n - 1, Math.floor(p * n));
                flagSteps.forEach((el, i) => {
                  const on = i === live;
                  el.classList.toggle("is-live", on);
                  gsap.set(el, { opacity: on ? 1 : 0.3, x: on ? 4 : 0 });
                });
                if (flagRule) gsap.set(flagRule, { scaleX: p });
              },
            });
          }
        }
      }

      const ykEnd = root.querySelector<HTMLElement>("[data-yk-end]");
      const yk = root.querySelector<HTMLElement>("[data-yk-sign]");
      const ykStar = root.querySelector<HTMLElement>("[data-yk-star]");
      const ykField = root.querySelector<HTMLElement>("[data-yk-field]");
      const gate = root.querySelector<HTMLElement>("[data-gate-board]");
      const yLetter = yk?.querySelector<SVGPathElement>("[data-yk-y]");
      const kLetter = yk?.querySelector<SVGPathElement>("[data-yk-k]");
      const flaps = gate ? [...gate.querySelectorAll<HTMLElement>("[data-flap]")] : [];

      if (ykEnd && yk && yLetter && kLetter) {
        if (reduced) {
          gsap.set([yLetter, kLetter], { strokeDasharray: 1, strokeDashoffset: 0, x: 0, y: 0, rotate: 0 });
          gsap.set(gate, { autoAlpha: 1 });
        } else {
          const burstCanvas = ykEnd.querySelector<HTMLCanvasElement>("[data-yk-burst]");
          const burstCtx = burstCanvas?.getContext("2d") ?? null;
          type Shard = { ox: number; oy: number; vx: number; vy: number; size: number; delay: number; depth: number; trail: boolean; spark: boolean };
          let shards: Shard[] = [];
          const smooth = (t: number) => { const x = Math.max(0, Math.min(1, t)); return x * x * (3 - 2 * x); };
          const sampleBurst = () => {
            const stage = ykEnd.getBoundingClientRect();
            const svg = yk.querySelector("svg");
            if (!svg || stage.width < 8) return;
            const box = svg.getBoundingClientRect();
            const next: Shard[] = [];
            const take = (path: SVGPathElement, count: number) => {
              const len = path.getTotalLength();
              const local: { x: number; y: number }[] = [];
              for (let i = 0; i < count; i += 1) {
                const pt = path.getPointAtLength(((i + 0.5) / count) * len);
                local.push({
                  x: box.left - stage.left + (pt.x / 220) * box.width,
                  y: box.top - stage.top + (pt.y / 160) * box.height,
                });
              }
              const cx = local.reduce((s, p) => s + p.x, 0) / local.length;
              const cy = local.reduce((s, p) => s + p.y, 0) / local.length;
              const reach = Math.min(stage.width, stage.height) * 0.34;
              local.forEach((p, i) => {
                const ang = Math.atan2(p.y - cy, p.x - cx);
                const depth = (i % 5) / 4;
                const kick = 0.45 + (i % 7) * 0.08 + depth * 0.35;
                next.push({
                  ox: p.x,
                  oy: p.y,
                  vx: Math.cos(ang) * reach * kick,
                  vy: Math.sin(ang) * reach * kick,
                  size: depth > 0.75 ? 1.6 : 0.7 + (i % 3) * 0.25,
                  delay: (i % 11) * 0.012,
                  depth,
                  trail: i % 17 === 0,
                  spark: i % 29 === 0,
                });
              });
            };
            take(yLetter, compactMq.matches ? 48 : 90);
            take(kLetter, compactMq.matches ? 48 : 90);
            shards = next;
            if (burstCanvas) {
              const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
              burstCanvas.width = Math.floor(stage.width * dpr);
              burstCanvas.height = Math.floor(stage.height * dpr);
              burstCanvas.style.width = `${stage.width}px`;
              burstCanvas.style.height = `${stage.height}px`;
            }
          };
          const paintBurst = (progress: number) => {
            if (!burstCtx || !burstCanvas) return;
            const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
            burstCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
            burstCtx.clearRect(0, 0, burstCanvas.width, burstCanvas.height);
            if (progress < 0.35 || shards.length === 0) return;
            const dissolve = smooth((progress - 0.35) / 0.3);
            const drift = smooth((progress - 0.65) / 0.2);
            const settle = smooth((progress - 0.85) / 0.15);
            shards.forEach((shard) => {
              const fly = smooth(Math.max(0, Math.min(1, (dissolve - shard.delay) / 0.62)));
              const travel = fly * (1 + drift * 0.28) * (0.72 + shard.depth * 0.55);
              const x = shard.ox + shard.vx * travel;
              const y = shard.oy + shard.vy * travel;
              const alpha = fly * (shard.depth > 0.7 ? 0.45 : 0.92) * (1 - settle * 0.72);
              if (alpha < 0.03) return;
              if (shard.trail) {
                burstCtx.strokeStyle = `rgba(214, 222, 232, ${(alpha * 0.45).toFixed(3)})`;
                burstCtx.lineWidth = 1;
                burstCtx.beginPath();
                burstCtx.moveTo(x - shard.vx * 0.08, y - shard.vy * 0.08);
                burstCtx.lineTo(x, y);
                burstCtx.stroke();
              }
              burstCtx.beginPath();
              burstCtx.fillStyle = shard.spark
                ? `rgba(255, 255, 255, ${alpha.toFixed(3)})`
                : `rgba(214, 222, 232, ${alpha.toFixed(3)})`;
              burstCtx.arc(x, y, shard.size, 0, Math.PI * 2);
              burstCtx.fill();
            });
          };
          gsap.set(yLetter, { strokeDasharray: 1, strokeDashoffset: 0, x: 0, rotate: 0, transformOrigin: "50% 50%" });
          gsap.set(kLetter, { strokeDasharray: 1, strokeDashoffset: 0, x: 0, rotate: 0, transformOrigin: "50% 50%" });
          gsap.set(yk, { autoAlpha: 1, scale: 1, x: 0, y: 0, transformOrigin: "50% 50%" });
          gsap.set(ykStar, { autoAlpha: 0 });
          gsap.set(ykField, { autoAlpha: 0 });
          gsap.set(gate, { opacity: 0, y: 12 });
          gsap.set(flaps, { rotateX: 70, transformOrigin: "50% 0%" });
          gsap.set(ykEnd, { backgroundColor: "#F2EDE3" });

          const end = gsap.timeline({
            scrollTrigger: {
              trigger: ykEnd,
              start: "top top",
              end: "+=85%",
              scrub: 0.42,
              pin: true,
              anticipatePin: 1,
              onUpdate: (self) => {
                if (self.progress > 0.34 && shards.length === 0) sampleBurst();
                if (self.progress < 0.32) shards = [];
                paintBurst(self.progress);
                if (self.progress > 0.46) setTheme("yk", "void");
                else setTheme("yk", "paper");
              },
              onEnter: () => setTheme("yk", "paper"),
              onLeaveBack: () => setTheme("paper", "paper"),
            },
          });
          end.to({}, { duration: 0.16 }, 0);
          end.to(yLetter, { stroke: "#8A5A32", ease: "none", duration: 0.08 }, 0.16);
          end.to(kLetter, { stroke: "#5C5348", ease: "none", duration: 0.08 }, 0.16);
          end.to([yLetter, kLetter], { stroke: "#F4F7FB", ease: "none", duration: 0.15 }, 0.2);
          end.to(ykEnd, { backgroundColor: "#0B1018", ease: "none", duration: 0.16 }, 0.28);
          end.to(yk, { autoAlpha: 0, ease: "none", duration: 0.22 }, 0.38);
          end.to(gate, { opacity: 1, y: 0, ease: "none", duration: 0.12 }, 0.85);
          end.to(flaps, { rotateX: 0, stagger: 0.02, ease: "none", duration: 0.12 }, 0.85);
          listeners.push(() => { shards = []; });
        }
      }

      const work = root.querySelector<HTMLElement>("[data-work]");
      const workItems = work ? [...work.querySelectorAll<HTMLElement>("[data-work-in]")] : [];
      if (work && workItems.length) {
        if (!reduced) {
          let played = false;
          const playWork = () => {
            if (played) return;
            played = true;
            gsap.fromTo(
              workItems,
              { y: 14, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.42,
                ease: motion.ease.enter,
                stagger: 0.09,
                overwrite: true,
              },
            );
          };
          ScrollTrigger.create({
            trigger: work.querySelector(".work-index") ?? work,
            start: "top 99%",
            once: true,
            onEnter: playWork,
            onEnterBack: playWork,
          });
          const rows = [...work.querySelectorAll<HTMLElement>(".work-index a")];
          const peek = work.querySelector<HTMLElement>(".wi-preview");
          ScrollTrigger.create({
            trigger: doTrack || work.querySelector(".work-index") || work,
            start: "top bottom",
            end: "top 18%",
            scrub: 0.35,
            onUpdate: (self) => {
              const p = self.progress;
              rows.forEach((row, i) => {
                const a = i / Math.max(rows.length, 1);
                const b = (i + 1) / Math.max(rows.length, 1);
                row.classList.toggle("is-live", p >= a && p < b + 0.12);
              });
              if (peek) peek.classList.toggle("is-peek", p > 0.02 && p < 0.5);
            },
          });
          const spine = work.querySelector<HTMLElement>("[data-work-spine]");
          const capWords = [...work.querySelectorAll<HTMLElement>("[data-cap-word]")];
          const orgLinks = [...work.querySelectorAll<SVGPathElement>("[data-org-link]")];
          const orgNodes = [...work.querySelectorAll<SVGElement>("[data-org-node]")];
          const orgPanel = work.querySelector<SVGElement>("[data-org-panel]");
          if (spine) gsap.set(spine, { scaleX: 0, transformOrigin: "0% 50%" });
          orgLinks.forEach((el) => {
            const len = el.getTotalLength?.() ?? 240;
            el.style.strokeDasharray = `${len}`;
            el.style.strokeDashoffset = `${len}`;
          });
          ScrollTrigger.create({
            trigger: work,
            start: "top 80%",
            end: "bottom 40%",
            scrub: 0.4,
            onUpdate: (self) => {
              const p = self.progress;
              if (spine) gsap.set(spine, { scaleX: p });
              const live = Math.min(capWords.length - 1, Math.floor(p * capWords.length));
              capWords.forEach((el, i) => el.classList.toggle("is-live", i === live));
              orgLinks.forEach((el, i) => {
                const len = el.getTotalLength?.() ?? 240;
                const t = Math.max(0, Math.min(1, (p - i * 0.08) / 0.4));
                el.style.strokeDashoffset = `${len * (1 - t)}`;
              });
              orgNodes.forEach((el, i) => {
                const on = p > i / Math.max(orgNodes.length, 1) * 0.7;
                gsap.set(el, { opacity: on ? 1 : 0.15, scale: on ? 1 : 0.6 });
              });
              if (orgPanel) gsap.set(orgPanel, { opacity: p > 0.55 ? Math.min(1, (p - 0.55) / 0.25) : 0 });
            },
          });
        } else {
          gsap.set(workItems, { clearProps: "all", autoAlpha: 1 });
        }
      }

      const approach = root.querySelector<HTMLElement>("[data-approach]");
      const approachItems = approach ? [...approach.querySelectorAll<HTMLElement>("[data-approach-in]")] : [];
      if (approach && approachItems.length) {
        if (!reduced) {
          let played = false;
          const playApproach = () => {
            if (played) return;
            played = true;
            gsap.fromTo(
              approachItems,
              { y: 14, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.42,
                ease: motion.ease.enter,
                stagger: 0.09,
                overwrite: true,
              },
            );
          };
          ScrollTrigger.create({
            trigger: approach,
            start: "top 92%",
            once: true,
            onEnter: playApproach,
            onEnterBack: playApproach,
          });
          ScrollTrigger.create({
            trigger: approach,
            start: () => (compactMq.matches ? "top top" : "top 80%"),
            end: () => (compactMq.matches ? "bottom bottom" : "bottom 28%"),
            scrub: 0.35,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const p = self.progress;
              const steps = [...approach.querySelectorAll<HTMLElement>(".proof li")];
              const n = steps.length;
              const live = n ? Math.min(n - 1, Math.floor(p * n)) : -1;
              approachItems.forEach((el) => el.classList.remove("is-live"));
              steps.forEach((el, i) => el.classList.toggle("is-live", i === live));
              if (compactMq.matches) {
                const phase = p < 0.25 ? "inputs" : p < 0.5 ? "system" : p < 0.75 ? "pipeline" : "product";
                if (approach.dataset.procPhase !== phase) approach.dataset.procPhase = phase;
                return;
              }
              const bits = [...approach.querySelectorAll<HTMLElement>("[data-proc-bit]")];
              const frame = approach.querySelector<HTMLElement>("[data-proc-frame]");
              const line = approach.querySelector<HTMLElement>("[data-proc-line]");
              const board = approach.querySelector<HTMLElement>(".proc-object");
              const span = Math.max(280, (board?.clientWidth || approach.clientWidth) * 0.9);
              const step = span / Math.max(bits.length - 1, 1);
              bits.forEach((bit, i) => {
                const clustered = p > 0.22;
                const built = p > 0.55;
                const col = i % 4;
                const row = Math.floor(i / 4);
                const scatterX = (col - 1.5) * (compactMq.matches ? 70 : 140);
                const scatterY = (row - 0.5) * 90 + (i % 2) * 24;
                gsap.set(bit, {
                  x: clustered ? (i - (bits.length - 1) / 2) * step : scatterX,
                  y: clustered ? 0 : scatterY,
                  xPercent: -50,
                  yPercent: -50,
                  opacity: built ? 1 : 0.72,
                  scale: 1,
                });
              });
              if (line) gsap.set(line, { scaleX: Math.max(0, (p - 0.22) / 0.4) });
              if (frame) {
                gsap.set(frame, { opacity: p > 0.5 ? Math.min(1, (p - 0.5) / 0.35) : 0, scale: 0.86 + Math.min(1, p) * 0.14 });
              }
            },
          });
          gsap.fromTo(
            approach.querySelectorAll(".kicker, .proof li span"),
            { y: 0 },
            {
              y: -4,
              ease: "none",
              immediateRender: false,
              scrollTrigger: {
                trigger: approach,
                start: "top 80%",
                end: "bottom 30%",
                scrub: 0.45,
              },
            },
          );
        } else {
          gsap.set(approachItems, { clearProps: "all", autoAlpha: 1 });
        }
      }

      if (!reduced) {
        root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
          if (el.closest("[data-flagship]") || el.hasAttribute("data-flagship")) return;
          gsap.set(el, { y: 16, opacity: 0 });
          ScrollTrigger.create({
            trigger: el,
            start: "top 98%",
            once: false,
            onEnter: () => {
              gsap.to(el, {
                y: 0,
                opacity: 1,
                duration: 0.42,
                ease: motion.ease.enter,
                overwrite: true,
              });
            },
            onEnterBack: () => {
              gsap.set(el, { y: 0, opacity: 1 });
            },
            onRefresh: (self) => {
              if (self.progress > 0 || el.getBoundingClientRect().top < window.innerHeight * 0.98) {
                gsap.set(el, { y: 0, opacity: 1 });
              }
            },
          });
        });
        const about = root.querySelector<HTMLElement>("#about");
        const aboutPic = about?.querySelector<HTMLElement>("picture");
        const aboutImg = about?.querySelector<HTMLElement>(".about-photo");
        if (about && aboutPic && aboutImg) {
          gsap.fromTo(
            aboutImg,
            { y: 22 },
            {
              y: -22,
              ease: "none",
              immediateRender: false,
              scrollTrigger: {
                trigger: about,
                start: "top 85%",
                end: "bottom 15%",
                scrub: 0.5,
              },
            },
          );
        }
      } else {
        root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.set(el, { clearProps: "all", autoAlpha: 1 });
        });
      }

      if (progress) {
        gsap.to(progress, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { scrub: 0.2, start: 0, end: "max" },
        });
      }

      if (pin && !compactMq.matches && !reduced) {
        const move = (e: PointerEvent) => {
          const r = pin.getBoundingClientRect();
          const mx = (e.clientX - r.left) / r.width - 0.5;
          const my = (e.clientY - r.top) / r.height - 0.5;
          gsap.to("[data-hero-photo]", { x: mx * 8, y: my * 5, duration: motion.duration.reveal, ease: motion.ease.enter, overwrite: "auto" });
        };
        const leave = () => gsap.to("[data-hero-photo]", { x: 0, y: 0, duration: 1, ease: motion.ease.enter, overwrite: "auto" });
        pin.addEventListener("pointermove", move);
        pin.addEventListener("pointerleave", leave);
        listeners.push(() => {
          pin.removeEventListener("pointermove", move);
          pin.removeEventListener("pointerleave", leave);
        });
      }

      if (!compactMq.matches && !reduced) {
        root.querySelectorAll<HTMLElement>("[data-magnetic]").forEach((btn) => {
          const move = (e: PointerEvent) => {
            const r = btn.getBoundingClientRect();
            const dx = Math.max(-motion.magnetic, Math.min(motion.magnetic, e.clientX - (r.left + r.width / 2)));
            const dy = Math.max(-motion.magnetic, Math.min(motion.magnetic, e.clientY - (r.top + r.height / 2)));
            gsap.to(btn, { x: dx * 0.35, y: dy * 0.35, duration: motion.duration.fast, ease: motion.ease.enter });
          };
          const leave = () => gsap.to(btn, { x: 0, y: 0, duration: motion.duration.standard, ease: motion.ease.enter });
          btn.addEventListener("pointermove", move);
          btn.addEventListener("pointerleave", leave);
          listeners.push(() => {
            btn.removeEventListener("pointermove", move);
            btn.removeEventListener("pointerleave", leave);
          });
        });
      }
    }

    const refresh = () => { if (!disposed) ScrollTrigger.refresh(); };
    const frame = requestAnimationFrame(refresh);
    root.querySelectorAll("details").forEach((details) => {
      details.addEventListener("toggle", refresh);
      listeners.push(() => details.removeEventListener("toggle", refresh));
    });
    window.addEventListener("load", refresh);
    listeners.push(() => {
      window.removeEventListener("load", refresh);
    });
    if (document.fonts?.ready) void document.fonts.ready.then(refresh);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      listeners.forEach((fn) => fn());
      gsap.killTweensOf(root.querySelectorAll("[data-magnetic], [data-hero-photo]"));
    };
  }, root);

  return kill;
}
