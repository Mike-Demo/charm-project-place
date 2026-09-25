import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Only the $1 slot-lock price may be resolved; callers cannot choose the price.
const SLOT_LOCK_EXTERNAL_PRICE_ID = "slot_lock_1usd";

export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ environment: z.enum(["sandbox", "live"]) }).parse(data))
  .handler(async ({ data }) => {
    const { gatewayFetch } = await import("./paddle.server");
    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(SLOT_LOCK_EXTERNAL_PRICE_ID)}`,
    );
    const result = (await response.json()) as { data?: Array<{ id: string }> };
    const first = result.data?.[0];
    if (!first) throw new Error("Price not found");
    return first.id;
  });
