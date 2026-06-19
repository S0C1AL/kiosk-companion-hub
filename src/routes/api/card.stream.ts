import { createFileRoute } from "@tanstack/react-router";
import { cardBus, getLastCardEvent, type CardEvent } from "@/lib/card-events.server";

// SSE stream of card insert/remove events for the kiosk browser.
export const Route = createFileRoute("/api/card/stream")({
  server: {
    handlers: {
      GET: async () => {
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            const enc = new TextEncoder();
            const send = (ev: CardEvent) => {
              controller.enqueue(enc.encode(`data: ${JSON.stringify(ev)}\n\n`));
            };
            // Initial snapshot so a freshly opened tab sees the current card.
            const last = getLastCardEvent();
            if (last) send(last);
            const listener = (ev: CardEvent) => send(ev);
            cardBus.on("event", listener);
            const ka = setInterval(() => controller.enqueue(enc.encode(`: keepalive\n\n`)), 15_000);
            (controller as unknown as { _cleanup?: () => void })._cleanup = () => {
              cardBus.off("event", listener);
              clearInterval(ka);
            };
          },
          cancel(reason) {
            const c = this as unknown as { _cleanup?: () => void };
            c._cleanup?.();
            void reason;
          },
        });

        return new Response(stream, {
          status: 200,
          headers: {
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-cache, no-transform",
            "x-accel-buffering": "no",
            connection: "keep-alive",
          },
        });
      },
    },
  },
});