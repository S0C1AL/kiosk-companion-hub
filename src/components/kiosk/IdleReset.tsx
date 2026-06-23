import { useEffect, useRef } from "react";
import { useNavigate, useRouter } from "@tanstack/react-router";

const DEFAULT_IDLE_MS = 60_000;

export function IdleReset({ timeoutMs = DEFAULT_IDLE_MS }: { timeoutMs?: number } = {}) {
  const navigate = useNavigate();
  const router = useRouter();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const reset = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        if (router.state.location.pathname !== "/") {
          navigate({ to: "/" });
        }
      }, timeoutMs);
    };
    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "touchstart",
      "mousemove",
    ];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [navigate, router, timeoutMs]);

  return null;
}