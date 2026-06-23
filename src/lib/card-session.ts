import { useSyncExternalStore } from "react";

interface CardSession {
  cardNo: number | null;
  verified: boolean;
}

let state: CardSession = { cardNo: null, verified: false };
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setSessionCard(cardNo: number) {
  if (state.cardNo === cardNo) return;
  state = { cardNo, verified: false };
  emit();
}

export function markSessionVerified() {
  if (state.cardNo === null || state.verified) return;
  state = { ...state, verified: true };
  emit();
}

export function clearSession() {
  if (state.cardNo === null && !state.verified) return;
  state = { cardNo: null, verified: false };
  emit();
}

export function useCardSession(): CardSession {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}