import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type {
  KioskClientConfig,
  PlayerBalance,
  PlayerInfo,
} from "./player-types";

async function getConfig() {
  const { readKioskConfig } = await import("./kiosk-config.server");
  return readKioskConfig();
}

export const getKioskClientConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<KioskClientConfig> => {
    const cfg = await getConfig();
    return { casinoId: cfg.casinoId };
  },
);

export const getPlayerInfo = createServerFn({ method: "GET" })
  .inputValidator((d: { cardNo: number }) =>
    z.object({ cardNo: z.number().int().positive() }).parse(d),
  )
  .handler(async ({ data }): Promise<PlayerInfo | null> => {
    const cfg = await getConfig();
    const url = `http://${cfg.baseIP}:${cfg.readPort}/api/player/info?cardNo=${data.cardNo}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`Player API ${res.status}`);
    }
    const json = (await res.json()) as unknown;
    const player = pickPlayer(json);
    if (!player) console.warn("[getPlayerInfo] unrecognised shape:", JSON.stringify(json).slice(0, 500));
    return player;
  });

export const getPlayerBalance = createServerFn({ method: "GET" })
  .inputValidator((d: { playerId: number }) =>
    z.object({ playerId: z.number().int().positive() }).parse(d),
  )
  .handler(async ({ data }): Promise<PlayerBalance | null> => {
    const cfg = await getConfig();
    const url = `http://${cfg.baseIP}:${cfg.readPort}/api/player/balance?playerId=${data.playerId}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) {
      throw new Error(`Balance API ${res.status}`);
    }
    const json = (await res.json()) as unknown;
    return pickFirst<PlayerBalance>(json);
  });

export const excludePlayer48h = createServerFn({ method: "POST" })
  .inputValidator((d: { playerId: number }) =>
    z.object({ playerId: z.number().int().positive() }).parse(d),
  )
  .handler(async ({ data }) => {
    const cfg = await getConfig();
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
    const cfg = await getConfig();
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