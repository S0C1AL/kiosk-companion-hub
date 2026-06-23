import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  KioskClientConfig,
  PlayerInfo,
} from "./player-types";

export const getKioskClientConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<KioskClientConfig> => {
    const { readKioskConfig } = await import("./kiosk-config.server");
    const cfg = readKioskConfig();
    return { casinoId: cfg.casinoId };
  },
);

export const getPlayerInfo = createServerFn({ method: "GET" })
  .inputValidator((d: { cardNo: number }) =>
    z.object({ cardNo: z.number().int().positive() }).parse(d),
  )
  .handler(async ({ data }): Promise<PlayerInfo | null> => {
    const { fetchPlayerInfo } = await import("./player-api.server");
    return fetchPlayerInfo(data.cardNo);
  });

export const getPlayerBalance = createServerFn({ method: "GET" })
  .inputValidator((d: { playerId: number }) =>
    z.object({ playerId: z.number().int().positive() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { fetchPlayerBalance } = await import("./player-api.server");
    return fetchPlayerBalance(data.playerId);
  });

export const excludePlayer48h = createServerFn({ method: "POST" })
  .inputValidator((d: { playerId: number }) =>
    z.object({ playerId: z.number().int().positive() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { readKioskConfig } = await import("./kiosk-config.server");
    const cfg = readKioskConfig();
    const url = `http://${cfg.baseIP}:${cfg.writePort}/excludeperson`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ playerId: data.playerId, casinoId: cfg.casinoId }),
    });
    if (!res.ok) throw new Error(`Exclude API ${res.status}`);
    return { ok: true as const };
  });

export const blacklistPlayer = createServerFn({ method: "POST" })
  .inputValidator((d: { playerId: number; sendMail: boolean }) =>
    z
      .object({ playerId: z.number().int().positive(), sendMail: z.boolean() })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { readKioskConfig } = await import("./kiosk-config.server");
    const cfg = readKioskConfig();
    const url = `http://${cfg.baseIP}:${cfg.writePort}/blacklistperson`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        playerId: data.playerId,
        casinoId: cfg.casinoId,
        sendMail: data.sendMail,
      }),
    });
    if (!res.ok) throw new Error(`Blacklist API ${res.status}`);
    return { ok: true as const };
  });