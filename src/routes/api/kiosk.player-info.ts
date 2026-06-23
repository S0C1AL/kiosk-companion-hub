import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { fetchPlayerInfoRaw, getPlayerInfoUrl, pickPlayer } from "@/lib/player-api.server";

export const Route = createFileRoute("/api/kiosk/player-info")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = z
          .object({ cardNo: z.coerce.number().int().positive() })
          .safeParse({ cardNo: url.searchParams.get("cardNo") });

        if (!parsed.success) {
          return Response.json({ ok: false, error: "Missing or invalid cardNo" }, { status: 400 });
        }

        try {
          const raw = await fetchPlayerInfoRaw(parsed.data.cardNo);
          const player = pickPlayer(raw);
          return Response.json({ ok: true, found: Boolean(player), player, raw });
        } catch (error) {
          console.error("[api/kiosk/player-info]", error);
          const upstreamUrl = await getPlayerInfoUrl(parsed.data.cardNo);
          return Response.json(
            {
              ok: false,
              error: error instanceof Error ? error.message : "Player lookup failed",
              cause: error instanceof Error && error.cause instanceof Error ? error.cause.message : undefined,
              upstreamUrl,
            },
            { status: 502 },
          );
        }
      },
    },
  },
});