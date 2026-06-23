import { createFileRoute } from "@tanstack/react-router";
import {
  fetchPlayerInfoRaw,
  fetchPlayerBalance,
  pickPlayer,
  getPlayerInfoUrl,
} from "@/lib/player-api.server";

// Diagnostic-only route. Safe to delete once kiosk performance is dialled in.
// Usage: GET /api/kiosk/health?cardNo=691694651
export const Route = createFileRoute("/api/kiosk/health")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const cardNoStr = url.searchParams.get("cardNo");
        const t0 = performance.now();
        const out: Record<string, unknown> = {
          ok: true,
          node: process.version,
          uptimeSec: Math.round(process.uptime()),
          mem: process.memoryUsage(),
        };

        if (cardNoStr) {
          const cardNo = Number(cardNoStr);
          out.upstreamUrl = await getPlayerInfoUrl(cardNo);
          try {
            const t1 = performance.now();
            const raw = await fetchPlayerInfoRaw(cardNo);
            const t2 = performance.now();
            const player = pickPlayer(raw);
            out.playerInfoMs = Math.round(t2 - t1);
            out.playerFound = Boolean(player);
            if (player) {
              const t3 = performance.now();
              try {
                await fetchPlayerBalance(player.playerId);
                out.balanceMs = Math.round(performance.now() - t3);
              } catch (e) {
                out.balanceError = e instanceof Error ? e.message : String(e);
              }
            }
          } catch (e) {
            out.ok = false;
            out.playerInfoError = e instanceof Error ? e.message : String(e);
          }
        }

        out.totalMs = Math.round(performance.now() - t0);
        return Response.json(out);
      },
    },
  },
});