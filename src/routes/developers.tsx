import { createFileRoute, Link } from "@tanstack/react-router";
import { APP_ORIGIN } from "@/lib/studio-location";
import { OG_IMAGE_URL } from "@/lib/social";

export const Route = createFileRoute("/developers")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Developer portal — Fresh Ink: Book your session" },
      { name: "description", content: "Build on Fresh Ink's booking API and MCP server: quickstart, endpoints, API keys, rate limits, and discovery docs." },
      { property: "og:title", content: "Developer portal — Fresh Ink: Book your session" },
      { property: "og:description", content: "Quickstart and reference for the Fresh Ink booking API and MCP server." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${APP_ORIGIN}/developers` },
      { property: "og:image", content: OG_IMAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${APP_ORIGIN}/developers` }],
  }),
  component: DevelopersPage,
});

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-sm border border-ink-dim/30 bg-muted p-4 font-mono text-xs leading-relaxed text-foreground">
      <code>{children}</code>
    </pre>
  );
}

function DevelopersPage() {
  return (
    <div className="sketchbook-canvas relative min-h-dvh px-4 py-6 sm:px-6 sm:py-10">
      <div className="paper-fiber" aria-hidden="true" />
      <main className="relative z-10 mx-auto w-full max-w-3xl">
        <Link to="/" className="group inline-flex items-center gap-1.5 font-hand text-lg text-ink-pencil transition-colors hover:text-foreground">
          <span className="font-mono text-sm transition-transform group-hover:-translate-x-1">←</span>
          <span className="underline decoration-ink-dim/40 underline-offset-4">Back to the booking desk</span>
        </Link>
        <header className="mt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-pencil/70">Field Notes // Build On It</p>
          <h1 className="mt-2 font-hand text-4xl font-bold text-foreground sm:text-5xl">Developer portal</h1>
          <p className="mt-3 max-w-xl font-hand text-lg text-ink-pencil">
            A free booking API and MCP server for Fresh Ink sessions. No signup required to start;
            an optional API key raises your rate limits.
          </p>
        </header>

        <section className="mt-8 space-y-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-ink-pencil/70">Quickstart</h2>
          <p className="font-hand text-lg text-ink-pencil">Find open times next week:</p>
          <Code>{`curl "https://freshink.art/api/public/availability?from=2026-10-05&to=2026-10-12"`}</Code>
          <p className="font-hand text-lg text-ink-pencil">Hold a slot (idempotent — safe to retry with the same key):</p>
          <Code>{`curl -X POST https://freshink.art/api/public/holds \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: my-unique-key-123" \\
  -d '{"date":"2026-10-08","time_slot":"1:00 PM","name":"Alex Rivera","email":"alex@example.com","phone":"6515550100"}'`}</Code>
          <p className="font-hand text-lg text-ink-pencil">
            Responses use <span className="font-mono text-sm">{"{ data, ... }"}</span> on success and{" "}
            <span className="font-mono text-sm">{"{ error: { code, message } }"}</span> on failure.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-ink-pencil/70">MCP server</h2>
          <p className="font-hand text-lg text-ink-pencil">
            Connect any MCP-capable assistant to <span className="font-mono text-sm">https://freshink.art/api/public/mcp</span>{" "}
            (Streamable HTTP, no authentication). Tools: <span className="font-mono text-sm">get_studio_info</span>,{" "}
            <span className="font-mono text-sm">list_open_times</span>, <span className="font-mono text-sm">hold_slot</span>,{" "}
            <span className="font-mono text-sm">get_booking_status</span>. Full walkthrough on the{" "}
            <Link to="/agents" className="underline decoration-cyan-draft/60 underline-offset-2 hover:text-foreground">agent docs page</Link>.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-ink-pencil/70">API keys &amp; limits</h2>
          <p className="font-hand text-lg text-ink-pencil">
            Anonymous: 60 reads/min, 5 writes/hour. Mint a free key with{" "}
            <span className="font-mono text-sm">POST /api/public/agent-keys</span> (<span className="font-mono text-sm">{"{email, label?}"}</span>)
            for 600 reads/min and 30 writes/hour; send it as <span className="font-mono text-sm">Authorization: Bearer</span>.
            Hitting a limit returns HTTP 429 with a <span className="font-mono text-sm">Retry-After</span> header.
            There is no sandbox environment — the API is read-mostly and holds expire on their own.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-ink-pencil/70">Discovery docs</h2>
          <ul className="mt-3 space-y-2 font-hand text-lg">
            {[
              ["/llms.txt", "llms.txt", "agent-readable summary with when-to-use guidance"],
              ["/developers/llms.txt", "developers/llms.txt", "scoped context for this portal"],
              ["/api/public/openapi.json", "openapi.json", "machine-readable OpenAPI 3.1 spec"],
              ["/auth.md", "auth.md", "authentication model"],
              ["/pricing.md", "pricing.md", "pricing in markdown"],
              ["/.well-known/agent-card.json", "agent card", "A2A-style capability card"],
              ["/.well-known/agent-skills/index.json", "agent skills index", "capability index"],
              ["/.well-known/mcp/server-card.json", "MCP server card", "branded MCP listing"],
              ["/.well-known/ard.json", "ard.json", "Agentic Resource Discovery catalog"],
              ["/.well-known/api-catalog", "api-catalog", "RFC 9727 API catalog"],
            ].map(([href, label, note]) => (
              <li key={href}>
                <a href={href} className="underline decoration-cyan-draft/60 underline-offset-2 hover:text-foreground">{label}</a>
                <span className="text-ink-pencil"> — {note}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-ink-pencil/70">Source code</h2>
          <p className="font-hand text-lg text-ink-pencil">
            The site is open source at{" "}
            <a href="https://github.com/Mike-Demo/charm-project-place" target="_blank" rel="noopener noreferrer" className="underline decoration-cyan-draft/60 underline-offset-2 hover:text-foreground">
              github.com/Mike-Demo/charm-project-place
            </a>, with agent instructions in{" "}
            <a href="https://github.com/Mike-Demo/charm-project-place/blob/main/AGENTS.md" target="_blank" rel="noopener noreferrer" className="underline decoration-cyan-draft/60 underline-offset-2 hover:text-foreground">
              AGENTS.md
            </a>.
          </p>
        </section>
      </main>
    </div>
  );
}
