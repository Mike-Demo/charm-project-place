import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type ReactElement } from "react";
import { APP_ORIGIN } from "@/lib/studio-location";
import { OG_IMAGE_URL } from "@/lib/social";

const MCP_URL = `${APP_ORIGIN}/api/public/mcp`;
const SNIPPET = `{
  "mcpServers": {
    "fresh-ink": {
      "type": "http",
      "url": "${MCP_URL}"
    }
  }
}`;
const EXAMPLE = `curl -s ${MCP_URL} \\
  -H 'content-type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"list_open_times",
                 "arguments":{"from":"2026-10-01","to":"2026-10-07"}}}'`;

const TOOLS = [
  ["get_studio_info", "Address, hours, session times, and how booking works."],
  ["list_open_times", "Open times between two dates (up to 31 days)."],
  ["hold_slot", "Holds a time for 15 minutes and returns a checkout link for the client."],
  ["get_booking_status", "Pending, confirmed, expired, or cancelled."],
] as const;

export const Route = createFileRoute("/agents")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "For AI agents — Fresh Ink: Book your session" },
      { name: "description", content: "Connect ChatGPT, Claude, or any MCP-capable assistant to book Tattoo Atelier sessions in Saint Paul on behalf of its user." },
      { property: "og:title", content: "For AI agents — Fresh Ink: Book your session" },
      { property: "og:description", content: "Connect any MCP-capable assistant to book Tattoo Atelier sessions on behalf of its user." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${APP_ORIGIN}/agents` },
      { property: "og:image", content: OG_IMAGE_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: OG_IMAGE_URL },
    ],
    links: [{ rel: "canonical", href: `${APP_ORIGIN}/agents` }],
  }),
  component: AgentsPage,
});

function CodeBlock({ code, label }: { code: string; label: string }): ReactElement {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative mt-3">
      <pre className="overflow-x-auto rounded-sm border border-ink-dim/30 bg-muted p-4 font-mono text-xs leading-relaxed text-foreground"><code>{code}</code></pre>
      <button
        aria-label={`Copy ${label}`}
        className="absolute right-2 top-2 min-h-11 min-w-11 rounded-sm border border-ink-dim/30 bg-card px-2 font-mono text-xs"
        onClick={() => void navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); })}
        type="button"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function AgentsPage(): ReactElement {
  return (
    <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Field notes // agents</p>
      <h1 className="mt-2 font-hand text-4xl font-bold text-foreground">Book through your AI assistant</h1>
      <p className="mt-3 max-w-prose text-sm text-muted-foreground">
        Assistants like ChatGPT and Claude can check open times and hold a session for their user through our MCP connector. The client always pays the $1 deposit themselves through the checkout link, then gets their private session pass by email.
      </p>

      <section className="mt-8 rounded-sm border border-ink-dim/30 bg-card p-5">
        <h2 className="font-hand text-2xl font-bold">Connect</h2>
        <p className="mt-2 text-sm">Connector address (Streamable HTTP, no sign-in):</p>
        <CodeBlock code={MCP_URL} label="connector address" />
        <p className="mt-4 text-sm">Client config snippet:</p>
        <CodeBlock code={SNIPPET} label="config snippet" />
      </section>

      <section className="mt-6 rounded-sm border border-ink-dim/30 bg-card p-5">
        <h2 className="font-hand text-2xl font-bold">Tools</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {TOOLS.map(([name, desc]) => (
            <li key={name}><code className="font-mono font-semibold">{name}</code> — {desc}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm">Example call:</p>
        <CodeBlock code={EXAMPLE} label="example call" />
      </section>

      <section className="mt-6 rounded-sm border border-ink-dim/30 bg-card p-5 text-sm">
        <h2 className="font-hand text-2xl font-bold">Rules</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Confirm name, email, phone, date, and time with the user before holding.</li>
          <li>Holds expire after 15 minutes if unpaid. Up to 5 holds per hour per agent.</li>
          <li>Proof of concept: the checkout is test mode — no real charge.</li>
        </ul>
        <p className="mt-4">Prefer the regular way? <Link className="underline" to="/">Book on the site</Link>.</p>
      </section>
    </main>
  );
}
