import type { PlayerBalance, PlayerInfo } from "./player-types";

async function getConfig() {
  const { readKioskConfig } = await import("./kiosk-config.server");
  return readKioskConfig();
}

export function pickFirst<T>(json: unknown): T | null {
  if (json == null) return null;
  if (Array.isArray(json)) return json.length > 0 ? (json[0] as T) : null;
  if (typeof json === "object") {
    const obj = json as Record<string, unknown>;
    for (const key of ["data", "result", "results", "items", "rows", "value"]) {
      if (key in obj) {
        const inner = pickFirst<T>(obj[key]);
        if (inner) return inner;
      }
    }
    return obj as T;
  }
  return null;
}

export function pickPlayer(json: unknown): PlayerInfo | null {
  const p = pickFirst<PlayerInfo>(json);
  if (!p) return null;
  return (p as { playerId?: unknown }).playerId ? p : null;
}

export async function fetchPlayerInfoRaw(cardNo: number): Promise<unknown> {
  const cfg = await getConfig();
  const url = `http://${cfg.baseIP}:${cfg.readPort}/api/player/info?cardNo=${cardNo}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Player API ${res.status}`);
  return res.json() as Promise<unknown>;
}

export async function fetchPlayerInfo(cardNo: number): Promise<PlayerInfo | null> {
  const json = await fetchPlayerInfoRaw(cardNo);
  const player = pickPlayer(json);
  if (!player) {
    console.warn(
      "[getPlayerInfo] unrecognised shape:",
      JSON.stringify(json).slice(0, 500),
    );
  }
  return player;
}

export async function fetchPlayerBalance(playerId: number): Promise<PlayerBalance | null> {
  const cfg = await getConfig();
  const url = `http://${cfg.baseIP}:${cfg.readPort}/api/player/balance?playerId=${playerId}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Balance API ${res.status}`);
  return pickFirst<PlayerBalance>((await res.json()) as unknown);
}