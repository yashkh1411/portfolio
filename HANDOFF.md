# Portfolio v2: handoff (21 Nov 2026)

Open a NEW Claude Code session in this folder and say: "Read HANDOFF.md and continue." A fresh session is far cheaper than continuing the old, very long chat.

## Run it
```powershell
python -m http.server 5510 --bind 127.0.0.1 --directory "C:\Users\yash\Downloads\portfoplio need\yash-portfolio-v2"
```
Then open http://127.0.0.1:5510 . Do NOT double-click index.html: as a file, the browser blocks the JavaScript (no 3D, no animation).

## What exists (jobs-focused page)
- Hero: proof-led headline, tools, GitHub/LinkedIn, draggable 3D ring of real proof cards (js/proofs.js), 4 proof tiles with royal door transitions (js/ui.js `doors`).
- What I do (3D neural lattice), Work list (door previews), PromptForge (device 52->64, real screenshots, demo scorer), DO (braid + hold-to-approve sim with AI pulses).
- FinPulse X: exact port of the ChatGPT chapter (js/chapters/finpulse.js, GSAP ScrollTrigger, packet data-flow). Illustrative data.
- SteadyNest (was ROAM OS): exact port of the ChatGPT map story (js/chapters/roam.js + js/roam/*.js engine, types stripped). India Gate photo CC BY-SA 3.0, credited.
- Process, Toolbelt, About (portrait card), dark portrait sign-off (LinkedIn + GitHub only, no Fiverr).
- Stack: static HTML/CSS/JS; three@0.170.0, gsap@3.13.0, lenis@1.3.0 from jsdelivr via importmap. No npm. Cache-busting `?v=N` on all imports (bump N after edits).

## Files
index.html, css/style.css (site), css/chapters.css (ported fp-/rm- rules), js/main.js, js/ui.js, js/stage.js, js/shapes.js, js/proofs.js, js/chapters/finpulse.js, js/chapters/roam.js, js/roam/*.js, assets/.
Unused leftovers safe to delete later: js/atlas.js, and the `finStory` / `stops` functions in js/ui.js plus their old CSS (.fin__*, .tour, .stops*).

## Open decisions / rules
- SteadyNest is now named on the page. CLAUDE.md says public material never mentions SteadyNest: confirm before publishing.
- Fiverr /studio page: planned, not built. Email and resume link: not added (need Yash's input).
- DO cinematic chapter (sunset photo, giant DO): parked, Yash undecided.
- Desktop (Yash OS windows): decided against.

## Next improvement plan (in order)
1. Polish pass: one type scale and spacing rhythm across all chapters; unify the ported chapters' fonts and buttons with the rest.
2. Chapter transitions: colour "climate" wipes between paper, burgundy and dark (palette swatch wipe from reel p2-02).
3. Process: one ember line drawing down through 4 steps (reel p1-09).
4. Hero CTA micro-interaction (reel pc-02) and kinetic headline reveal.
5. Phone pass, reduced-motion pass, then a real-phone test before anything goes live.

## Checks so far
Headless Chrome via CDP (scratch script), 1440x900 and 390x844: hero, doors, PromptForge, DO, FinPulse (all beats), SteadyNest (4 beats), sign-off. No console errors. NOT tested: real phone, real GPU smoothness, keyboard-only, reduced motion.
