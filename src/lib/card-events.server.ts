import { EventEmitter } from "node:events";

export type CardEvent =
  | { type: "insert"; uid: string; cardNo: number; at: number }
  | { type: "remove"; at: number };

type G = typeof globalThis & { __kioskCardBus?: EventEmitter; __kioskLastEvent?: CardEvent | null };
const g = globalThis as G;

export const cardBus: EventEmitter = (g.__kioskCardBus ??= new EventEmitter());
cardBus.setMaxListeners(50);

export function publishCardEvent(ev: CardEvent) {
  g.__kioskLastEvent = ev;
  cardBus.emit("event", ev);
}

export function getLastCardEvent(): CardEvent | null {
  return g.__kioskLastEvent ?? null;
}

export function hexToDecimal(hex: string): number {
  const clean = hex.replace(/[^0-9A-Fa-f]/g, "");
  if (!clean) return 0;
  return parseInt(clean, 16);
}