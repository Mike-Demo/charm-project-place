import { createFileRoute } from "@tanstack/react-router";
import { AGENT_TOOLS, callAgentTool, callerHash } from "@/lib/agent-booking.server";

interface RpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: { name?: string; arguments?: unknown; protocolVersion?: string };
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, mcp-session-id, mcp-protocol-version, authorization",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...CORS } });
}

async function handle(msg: RpcRequest, caller: string): Promise<unknown | null> {
  const id = msg.id ?? null;
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id, result });
  switch (msg.method) {
    case "initialize":
      return ok({
        protocolVersion: msg.params?.protocolVersion ?? "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "fresh-ink-booking", version: "1.0.0" },
        instructions: "Book tattoo sessions at Fresh Ink (Saint Paul, MN) for your user. The user must open the checkout_url themselves to lock the session in (free while in proof of concept).",
      });
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: AGENT_TOOLS });
    case "tools/call": {
      const toolName = msg.params?.name ?? "";
      if (!AGENT_TOOLS.some((t) => t.name === toolName)) {
        return { jsonrpc: "2.0", id, error: { code: -32602, message: `Unknown tool: ${toolName}. Available tools: ${AGENT_TOOLS.map((t) => t.name).join(", ")}` } };
      }
      return ok(await callAgentTool(toolName, msg.params?.arguments ?? {}, caller));
    }
    default:
      if (msg.method?.startsWith("notifications/")) return null;
      return { jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } };
  }
}

export const Route = createFileRoute("/api/public/mcp")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      OPTIONS: () => new Response(null, { status: 204, headers: CORS }),
      GET: () => json({ name: "fresh-ink-booking", transport: "streamable-http", docs: "https://freshink.art/agents" }),
      POST: async ({ request }) => {
        let body: RpcRequest | RpcRequest[];
        try {
          body = (await request.json()) as RpcRequest | RpcRequest[];
        } catch {
          return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400);
        }
        const caller = callerHash(request);
        if (Array.isArray(body)) {
          const out = (await Promise.all(body.slice(0, 10).map((m) => handle(m, caller)))).filter((r) => r !== null);
          return out.length ? json(out) : new Response(null, { status: 202, headers: CORS });
        }
        const out = await handle(body, caller);
        return out === null ? new Response(null, { status: 202, headers: CORS }) : json(out);
      },
    },
  },
});
