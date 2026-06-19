import { createFileRoute } from "@tanstack/react-router";
import { publishCardEvent, hexToDecimal, type CardEvent } from "@/lib/card-events.server";

// Loopback-only bridge endpoint. The PC/SC daemon on the kiosk POSTs here.
// Optional shared secret via KIOSK_BRIDGE_SECRET env var (sent as Bearer).
export const Route = createFileRoute("/api/public/card-event")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.KIOSK_BRIDGE_SECRET;
        if (secret) {
          const auth = request.headers.get("authorization") ?? "";
          if (auth !== `Bearer ${secret}`) {
            return new Response("Unauthorized", { status: 401 });
          }
        }

        let body: { event?: string; uid?: string };
        try {
          body = (await request.json()) as { event?: string; uid?: string };
        } catch {
          return new Response("Bad JSON", { status: 400 });
        }

        const now = Date.now();
        let ev: CardEvent;
        if (body.event === "remove") {
          ev = { type: "remove", at: now };
        } else if (body.event === "insert" && typeof body.uid === "string") {
          const cardNo = hexToDecimal(body.uid);
          if (!cardNo) return new Response("Bad uid", { status: 400 });
          ev = { type: "insert", uid: body.uid, cardNo, at: now };
        } else {
          return new Response("Bad event", { status: 400 });
        }

        publishCardEvent(ev);
        return Response.json({ ok: true });
      },
    },
  },
});