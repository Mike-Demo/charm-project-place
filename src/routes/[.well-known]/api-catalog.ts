// RFC 9727 API catalog, served with the linkset media type.
// (Static-file hosting serves extensionless files as application/octet-stream,
// so this is a server route to control the Content-Type header.)
import { createFileRoute } from "@tanstack/react-router";

const CATALOG = {
  linkset: [
    {
      anchor: "https://freshink.art/",
      item: [
        {
          href: "https://freshink.art/api/public/openapi.json",
          title: "Fresh Ink Booking API (OpenAPI)",
          type: "application/vnd.oai.openapi+json",
        },
        {
          href: "https://freshink.art/.well-known/agent-card.json",
          title: "Fresh Ink agent card",
          type: "application/json",
        },
        {
          href: "https://freshink.art/.well-known/mcp/server-card.json",
          title: "Fresh Ink MCP server card",
          type: "application/json",
        },
      ],
    },
  ],
};

export const Route = createFileRoute("/.well-known/api-catalog")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: () =>
        new Response(JSON.stringify(CATALOG), {
          status: 200,
          headers: {
            "Content-Type": 'application/linkset+json;profile="https://www.rfc-editor.org/info/rfc9727"',
            "Cache-Control": "public, max-age=3600",
          },
        }),
    },
  },
});
