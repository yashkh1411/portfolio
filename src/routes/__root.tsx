import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";
import cinematicCss from "../styles/cinematic.css?url";
import projectCss from "../styles/project-stories.css?url";
import fontCss from "../styles/fonts.css?url";

const APP_NAME = "Yash Khairwal — AI Product Engineer";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Yash Khairwal — AI product engineer and full-stack developer. Selected work: Project DO, FinPulse X, ROAM OS. From intent to a working system.",
      },
      { name: "theme-color", content: "#040609" },
      { name: "robots", content: "index,follow" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: fontCss },
      { rel: "stylesheet", href: cinematicCss },
      { rel: "stylesheet", href: projectCss },
      { rel: "preload", href: "/fonts/geist.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" data-theme="void" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
