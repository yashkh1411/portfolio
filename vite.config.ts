import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

// `0.0.0.0:8080` is the live-preview contract — don't change host/port.
// The dev server starts once `src/router.tsx` and `src/routes/` exist — see
// AGENTS.md § "First scaffold".
export default defineConfig(({ command, isPreview }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 8081,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true },
  build: {
    rolldownOptions: {
      output: {
        // Hero already lazy-loads Solar. Keep Three in that async graph as its
        // own chunk. The minified library stays above 500 kB; do not hide that
        // by raising chunkSizeWarningLimit.
        manualChunks(id: string) {
          if (id.includes("node_modules/three/") || id.includes("node_modules\\three\\")) return "three";
        },
      },
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart(),
    ...(command === "build" || isPreview
      ? [
          nitro({
            preset: "vercel",
            // Nitro's Vercel preset does not copy vercel.json response headers
            // into the Build Output API config. A header-only route must set
            // continue so it does not swallow the filesystem and server routes.
            vercel: {
              config: {
                routes: [
                  {
                    src: "/(.*)",
                    headers: {
                      "x-content-type-options": "nosniff",
                      "referrer-policy": "strict-origin-when-cross-origin",
                      "x-frame-options": "SAMEORIGIN",
                      "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
                    },
                    continue: true,
                  },
                ],
              },
            },
          }),
        ]
      : []),
    viteReact(),
  ],
}));
