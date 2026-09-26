/**
 * WebMCP: exposes the booking capability to the user's own in-browser agent
 * through navigator.modelContext (Chrome built-in AI / WebMCP proposal).
 * Tools call the public REST API, so browser agents and HTTP agents see the
 * same behavior, rate limits, and structured errors.
 */
interface WebMcpToolInput {
  name: string;
  description: string;
  execute: (input: Record<string, unknown>) => Promise<string>;
}

interface WebMcpNavigator extends Navigator {
  modelContext?: { addTool: (tool: WebMcpToolInput) => void };
}

const STUDIO_INFO_TOOL: WebMcpToolInput = {
  name: "get_studio_info",
  description: "Fresh Ink studio details: address, appointment-only hours, session times, and how booking works.",
  execute: async () => {
    const response = await fetch("/api/public/studio");
    return response.text();
  },
};

const OPEN_TIMES_TOOL: WebMcpToolInput = {
  name: "list_open_times",
  description: "List open appointment times between two dates. Input: { from, to } as YYYY-MM-DD.",
  execute: async (input) => {
    const params = new URLSearchParams({ from: String(input.from ?? ""), to: String(input.to ?? "") });
    const response = await fetch(`/api/public/availability?${params}`);
    return response.text();
  },
};

const HOLD_TOOL: WebMcpToolInput = {
  name: "hold_slot",
  description:
    "Hold an open time for 15 minutes for the user. Input: { date, time_slot, name, email, phone }. Returns a checkout_url the user opens to lock the session in.",
  execute: async (input) => {
    const response = await fetch("/api/public/holds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    return response.text();
  },
};

const STATUS_TOOL: WebMcpToolInput = {
  name: "get_booking_status",
  description: "Check a held booking: pending, confirmed, expired or cancelled. Input: { booking_id }.",
  execute: async (input) => {
    const response = await fetch(`/api/public/bookings/${encodeURIComponent(String(input.booking_id ?? ""))}`);
    return response.text();
  },
};

export function registerWebMcpTools(): void {
  if (typeof window === "undefined") return;
  const nav = navigator as WebMcpNavigator;
  if (!nav.modelContext) return;
  for (const tool of [STUDIO_INFO_TOOL, OPEN_TIMES_TOOL, HOLD_TOOL, STATUS_TOOL]) {
    try {
      nav.modelContext.addTool(tool);
    } catch {
      // Registration is best-effort; the REST API remains the source of truth.
    }
  }
}
