import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DeskAtmosphere } from "@/components/DeskAtmosphere";
import { SketchFooter } from "@/components/SketchFooter";
import { SitePreloader } from "@/components/SitePreloader";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const APPLE_SPLASH_DEVICES: ReadonlyArray<{ width: number; height: number; ratio: number }> = [
  { width: 375, height: 667, ratio: 2 },
  { width: 414, height: 896, ratio: 2 },
  { width: 375, height: 812, ratio: 3 },
  { width: 390, height: 844, ratio: 3 },
  { width: 393, height: 852, ratio: 3 },
  { width: 402, height: 874, ratio: 3 },
  { width: 414, height: 896, ratio: 3 },
  { width: 428, height: 926, ratio: 3 },
  { width: 430, height: 932, ratio: 3 },
  { width: 440, height: 956, ratio: 3 },
];

const appleStartupImageLinks = APPLE_SPLASH_DEVICES.map(({ width, height, ratio }) => ({
  rel: "apple-touch-startup-image",
  href: `/splash/splash-${width * ratio}x${height * ratio}.png`,
  media: `(device-width: ${width}px) and (device-height: ${height}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`,
}));

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "author", content: "Fresh Ink" },
      { name: "google-site-verification", content: "TQqMKLXzsEbhXIj_qpMfvRmvCEP_Dz-w7iQ7bV9IVYw" },
      { name: "theme-color", content: "#FBF2DD" },
      { name: "apple-mobile-web-app-title", content: "Fresh Ink" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Coming+Soon&family=JetBrains+Mono:wght@400;500;600&display=swap" },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      ...appleStartupImageLinks,
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <SitePreloader />
      {/* Desk marks are anchored to this frame so they scroll with the page content. */}
      <div className="relative flex min-h-dvh flex-col">
        <DeskAtmosphere />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <SketchFooter />
      </div>
    </QueryClientProvider>
  );
}
