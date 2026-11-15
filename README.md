# Yash Khairwal · portfolio site

A single-page, scroll-driven portfolio: three real builds (PromptForge, SteadyNest, Project DO), how I work, and a Fiverr call to action.
It's a plain static site: one `index.html`, no build step, no dependencies, no external requests.

## Run it locally (PowerShell)

1. `cd "C:\Users\yash\Downloads\claude portfolio\portfolio-site"`
2. `python -m http.server 8820 --bind 127.0.0.1`
3. Open `http://127.0.0.1:8820/` in Chrome. Expected: the blue loader with orbiting screens counts to 100%, then the hero.

Opening `index.html` straight from the file system may not load the fonts; use the server.

## Before it goes public

- [x] **Fiverr link.** Set to your gig, `https://www.fiverr.com/s/ZozlZwa`, in three places in `index.html`: `const FIVERR = ...` and the two links in the `<noscript>` block.
- [x] **Link preview image.** `og:image` is the full URL `https://yash-khairwal.pages.dev/og.jpg`. Change it if you move to a custom domain.
- [ ] **SteadyNest in public.** Your rule says PromptForge docs and public material never mention SteadyNest. Confirm that showing SteadyNest on this portfolio is okay.
- [ ] **Real-phone check** and a **Lighthouse** run (not done yet).

## Deploy (static, no build step)

The folder root is the site. Any static host works: no build command, publish directory = the repo root.
**Vercel Hobby (free) is not a safe fit.** Vercel's Terms of Service (last updated 19 Oct 2026, checked 14 Nov 2026) say: "You shall only use the Services under a Hobby plan for your personal or non-commercial use." A portfolio whose job is to win paid Fiverr work is commercial, so use Vercel Pro (paid) or another host.
**GitHub Pages** (free) forbids sites "primarily directed at either facilitating commercial transactions" or running an online business; a portfolio that links out to Fiverr is not a store, but read the rule yourself before relying on it.
**Cloudflare Pages (free) fits.** Cloudflare's Self-Serve Subscription Agreement (last updated 12 Sep 2025, checked 14 Nov 2026) has no personal or non-commercial clause; the free-plan rule that matters here is not to "process or collect personal or business credit card information" on the site, and this site collects nothing. Pages limits (checked the same day): 20,000 files per site and 25 MiB per file on Free; this site is 20 files, the largest 0.58 MB. Free sites get no SLA or support.

## Files

- `index.html` – the whole site (styles and script inline). Phone layout below 0.9 width/height; reduced-motion and no-JavaScript versions included.
- `assets/` – real screen captures (PromptForge at 2x from the lossless originals, SteadyNest, the DO render) and the Range cards: six earlier builds of this portfolio plus two AI-assisted concept images (`range-gpt1/2`, tagged "Concept art" on the page).
- `fonts/` – Barlow Condensed ExtraBold, Inter Tight, JetBrains Mono Medium (all SIL Open Font License 1.1; each licence text is included). The JetBrains Mono licence was downloaded on 14 Nov 2026 from https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/OFL.txt.
- `og.jpg` – link preview image (1200x630). `favicon.svg` – tab icon.

## Checked on 14 Nov 2026 (local, headless Chrome)

- moment-check: desktop PASS 103.1 fps, 0 ms long tasks. Phone at 4x CPU PASS 104.2 fps, 79 ms longest load task. Reduced motion PASS 143 fps.
- No page errors, no failed requests, no external requests. Full content visible at 1440x900, 1366x768, 1024x768, 2560x1080 and 360x800. No-JS version readable on desktop and phone.
- Not tested: a real phone, Lighthouse, Safari/Firefox.
