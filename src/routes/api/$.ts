// Catch-all for unknown /api/* paths: agents get a JSON error, not the SPA shell.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/$")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      ANY: async () => {
        const { apiError } = await import("@/lib/public-api.server");
        return apiError(
          "not_found",
          "Unknown API path. See https://freshink.art/api/public/openapi.json for the API reference.",
          404
        );
      },
    },
  },
});
