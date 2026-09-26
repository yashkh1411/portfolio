# Yash Khairwal — Portfolio

Scroll-driven portfolio for Yash Khairwal (New Delhi). React 19, TanStack Start, Vite, GSAP ScrollTrigger, and one Three.js solar scene.

This package is the current workspace source. It is not an older export.

## Requirements

- Node.js 22.x (verified locally on 22.23.1)
- npm

This app is pinned to Node 22 for local development and for Vercel. `package.json` `engines.node` is `22.x`, `.node-version` is `22`, and the Nitro Vercel preset emits the `nodejs22.x` runtime. Vercel’s project default of Node 24 is not used: the lockfile and `@types/node` are on the 22 line, and the site was verified on 22. Do not bump the runtime without re-running typecheck, tests, and a production build.

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

Open http://localhost:8080/

The dev server binds to `0.0.0.0:8080`. `npm run dev` runs Vite through `scripts/with-app-env.mjs`. A missing `.grok/app-env.json` is ignored. Auth is off. No database is required.

## Checks

```bash
npm run typecheck
npm run lint
npm run test
```

## Production build

```bash
npm run build
npm run preview
```

`npm run build` runs the Vite production build, then `scripts/migrate.mjs`.

- If `DATABASE_URL` is unset, migrations are skipped. This portfolio does not need a database for the public site.
- If `DATABASE_URL` is set, pending SQL files in `migrations/` (not `migrations/auth/`) are applied.

The Vite config uses the Nitro Vercel preset. `npm run build` writes the deploy output the host expects. Deploy that output with your host’s Node/Vite adapter. Do not commit `.env` or API keys.

## Optional environment

Copy `.env.example` to `.env` only if you are wiring a database. Leave it empty for a normal local run. Auth is off. No API keys are required.

## What is in this tree

- `src/` — routes, scenes, motion, solar system, project demos
- `public/` — portraits, fonts, solar textures, map, favicon
- `scripts/` — env wrapper, preview, checks
- `server/` — platform middleware used by the Vite build
Auth is off. There is no database and no AI API key in this package.

Project DO on the site is a local UI simulation. FinPulse numbers are sample data. ROAM is a concept map, not a live routing product.
