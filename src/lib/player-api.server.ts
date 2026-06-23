import type { PlayerBalance, PlayerInfo } from "./player-types";

async function getConfig() {
  const { readKioskConfig } = await import("./kiosk-config.server");
  return readKioskConfig();
}

function normalizeBaseHost(baseIP: string): string {
  const trimmed = baseIP.trim();
  if (!trimmed) return "127.0.0.1";

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    return new URL(withProtocol).hostname;
  } catch {
    return trimmed.replace(/^https?:\/\//i, "").replace(/^\/\//, "").split("/")[0].split(":")[0];
  }
}

function playerApiUrl(path: string, params: Record<string, string | number>): string {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );
  return `${path}?${query.toString()}`;
}

export async function getPlayerInfoUrl(cardNo: number): Promise<string> {
  const cfg = await getConfig();
  const host = normalizeBaseHost(cfg.baseIP);
  return `http://${host}:${cfg.readPort}${playerApiUrl("/api/player/info", { cardNo })}`;
}

export async function getPlayerBalanceUrl(playerId: number): Promise<string> {
  const cfg = await getConfig();
  const host = normalizeBaseHost(cfg.baseIP);
  return `http://${host}:${cfg.readPort}${playerApiUrl("/api/player/balance", { playerId })}`;
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
  const url = await getPlayerInfoUrl(cardNo);
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
  const url = await getPlayerBalanceUrl(playerId);
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Balance API ${res.status}`);
  return pickFirst<PlayerBalance>((await res.json()) as unknown);
}