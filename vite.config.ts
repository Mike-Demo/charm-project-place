// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

// The generated Supabase client reads env with bracket notation
// (import.meta.env['VITE_SUPABASE_URL']). Build-time define replacement only
// matches dot notation, so the values were missing in the production bundle.
// Normalize bracket lookups to dot notation before the define pass runs.
const normalizeEnvAccess: Plugin = {
  name: "normalize-bracket-env-access",
  enforce: "pre",
  transform(code, id) {
    if (id.includes("node_modules")) return null;
    if (!code.includes("import.meta.env[") && !code.includes("process.env[")) return null;
    const next = code
      .replace(/import\.meta\.env\[\s*['"]([A-Za-z_$][\w$]*)['"]\s*\]/g, "import.meta.env.$1")
      .replace(/process\.env\[\s*['"]([A-Za-z_$][\w$]*)['"]\s*\]/g, "process.env.$1");
    return next === code ? null : { code: next, map: null };
  },
};

// Public (publishable) backend connection values. These are safe to ship in the
// client bundle and act as build-time fallbacks when the deploy environment does
// not provide a .env file, which is what broke the published site.
const SUPABASE_URL = process.env["VITE_SUPABASE_URL"] ?? "https://xhdnpnmztysdpxuxguww.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ?? "sb_publishable_AD1SWAemnZo3ImwjXDFtyQ_UFPYFwz7";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Prerender the homepage and key static routes at build time so they skip
    // per-request SSR. Only routes whose HTML is identical for every visitor
    // are listed; autoStaticPathsDiscovery is off so nothing else is captured.
    pages: [{ path: "/" }, { path: "/licenses" }, { path: "/agents" }],
    prerender: { enabled: true, autoStaticPathsDiscovery: false },
  },
  nitro: {
    routeRules: {
      // Immutable hashed build assets: cache forever at the edge and in browsers.
      "/assets/**": { headers: { "cache-control": "public, max-age=31536000, immutable" } },
      // Public textures/icons: cache for a week, revalidate in the background.
      "/textures/**": { headers: { "cache-control": "public, max-age=604800, stale-while-revalidate=86400" } },
      "/*.webp": { headers: { "cache-control": "public, max-age=604800, stale-while-revalidate=86400" } },
      "/*.png": { headers: { "cache-control": "public, max-age=604800, stale-while-revalidate=86400" } },
      "/*.jpg": { headers: { "cache-control": "public, max-age=604800, stale-while-revalidate=86400" } },
      "/manifest.webmanifest": { headers: { "cache-control": "public, max-age=86400" } },
    },
  },
  vite: {
    plugins: [normalizeEnvAccess],
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(SUPABASE_URL),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(SUPABASE_PUBLISHABLE_KEY),
      "process.env.SUPABASE_URL": JSON.stringify(SUPABASE_URL),
      "process.env.SUPABASE_PUBLISHABLE_KEY": JSON.stringify(SUPABASE_PUBLISHABLE_KEY),
    },
  },
});
