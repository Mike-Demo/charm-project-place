import { createFileRoute } from "@tanstack/react-router";
import { apiError, optionsResponse } from "@/lib/public-api.server";

// Structured JSON 404 for every unknown /api/public/* path — never HTML.
export const Route = createFileRoute("/api/public/$")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: ({ params }) => apiError("not_found", `No API endpoint at /api/public/${params._splat}. See /api/public/openapi.json for the full catalog.`, 404),
      POST: ({ params }) => apiError("not_found", `No API endpoint at /api/public/${params._splat}. See /api/public/openapi.json for the full catalog.`, 404),
      DELETE: ({ params }) => apiError("not_found", `No API endpoint at /api/public/${params._splat}. See /api/public/openapi.json for the full catalog.`, 404),
    },
  },
});
