import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z.object({ priceId: z.string().min(1).max(64), environment: z.enum(["sandbox", "live"]) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { gatewayFetch } = await import("./paddle.server");
    const response = await gatewayFetch(
      data.environment,
      `/prices?external_id=${encodeURIComponent(data.priceId)}`,
    );
    const result = (await response.json()) as { data?: Array<{ id: string }> };
    const first = result.data?.[0];
    if (!first) throw new Error("Price not found");
    return first.id;
  });
