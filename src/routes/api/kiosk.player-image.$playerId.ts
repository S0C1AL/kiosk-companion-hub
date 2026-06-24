import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/kiosk/player-image/$playerId")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const playerId = Number(params.playerId);
        if (!Number.isInteger(playerId) || playerId <= 0) {
          return new Response("Bad playerId", { status: 400 });
        }
        const { readKioskConfig } = await import("@/lib/kiosk-config.server");
        const cfg = readKioskConfig();
        const host = cfg.baseIP.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0];
        const url = `http://${host}:${cfg.readPort}/api/player/${playerId}/image/last`;
        try {
          const res = await fetch(url);
          if (!res.ok) return new Response("Not found", { status: 404 });
          const buf = await res.arrayBuffer();
          return new Response(buf, {
            status: 200,
            headers: {
              "Content-Type": res.headers.get("Content-Type") ?? "image/jpeg",
              "Cache-Control": "private, max-age=60",
            },
          });
        } catch {
          return new Response("Upstream error", { status: 502 });
        }
      },
    },
  },
});