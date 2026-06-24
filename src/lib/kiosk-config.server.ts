import fs from "node:fs";

export interface KioskConfig {
  baseIP: string;
  casinoId: string;
  readPort: number;
  writePort: number;
  levelColors: Record<string, string>;
}

const DEFAULTS: KioskConfig = {
  baseIP: "127.0.0.1",
  casinoId: "DEMO",
  readPort: 2012,
  writePort: 5074,
  levelColors: {
    Blue: "#0000FF",
    Gold: "#FABB00",
    Platinum: "#D9D9D9",
  },
};

const CONFIG_PATHS = [
  process.env.KIOSK_CONFIG_PATH,
  "/boot/kiosk-config.json",
  "/boot/firmware/kiosk-config.json",
  "/etc/kiosk/config.json",
].filter(Boolean) as string[];

let cached: KioskConfig | null = null;

export function readKioskConfig(): KioskConfig {
  if (cached) return cached;
  for (const p of CONFIG_PATHS) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, "utf-8");
        const parsed = JSON.parse(raw) as Partial<KioskConfig>;
        cached = {
          ...DEFAULTS,
          ...parsed,
          levelColors: { ...DEFAULTS.levelColors, ...(parsed.levelColors ?? {}) },
        };
        return cached;
      }
    } catch (err) {
      console.warn(`[kiosk-config] failed to read ${p}:`, err);
    }
  }
  // Fallback to env vars
  cached = {
    baseIP: process.env.KIOSK_BASE_IP ?? DEFAULTS.baseIP,
    casinoId: process.env.KIOSK_CASINO_ID ?? DEFAULTS.casinoId,
    readPort: Number(process.env.KIOSK_READ_PORT ?? DEFAULTS.readPort),
    writePort: Number(process.env.KIOSK_WRITE_PORT ?? DEFAULTS.writePort),
  };
  return cached;
}