import { useEffect, useRef } from "react";

const SIZE = 40;
const SWIPE_THRESHOLD = 8;
const FADE_DELAY = 400;

// Render-free cursor: all updates go straight to the DOM via refs, so pointer
// activity never triggers a React re-render (critical on the Pi where any
// extra work-per-tap shows up as input lag).
export function CustomCursor() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let pressed = false;
    let x = 0;
    let y = 0;
    let rafQueued = false;
    let fadeTimer: number | null = null;
    let touchStart: { x: number; y: number } | null = null;

    const setOpacity = (v: number) => {
      el.style.opacity = String(v);
    };

    const flush = () => {
      rafQueued = false;
      el.style.transform = `translate3d(${x - SIZE / 2}px, ${y - SIZE / 2}px, 0) scale(${pressed ? 1.6 : 1})`;
    };
    const schedule = () => {
      if (!rafQueued) {
        rafQueued = true;
        requestAnimationFrame(flush);
      }
    };

    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      schedule();
      if (e.pointerType === "mouse") {
        setOpacity(pressed ? 0.55 : 0.75);
      } else if (pressed && touchStart) {
        const dx = e.clientX - touchStart.x;
        const dy = e.clientY - touchStart.y;
        if (Math.hypot(dx, dy) > SWIPE_THRESHOLD) setOpacity(0);
      }
    };

    const down = (e: PointerEvent) => {
      pressed = true;
      x = e.clientX;
      y = e.clientY;
      if (e.pointerType === "touch") touchStart = { x, y };
      if (fadeTimer !== null) {
        window.clearTimeout(fadeTimer);
        fadeTimer = null;
      }
      setOpacity(0.55);
      schedule();
    };

    const up = () => {
      pressed = false;
      touchStart = null;
      if (fadeTimer !== null) window.clearTimeout(fadeTimer);
      fadeTimer = window.setTimeout(() => setOpacity(0), FADE_DELAY);
      schedule();
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointercancel", up, { passive: true });

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (fadeTimer !== null) window.clearTimeout(fadeTimer);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: SIZE,
        height: SIZE,
        borderRadius: "9999px",
        backgroundColor: "var(--color-accent)",
        opacity: 0,
        boxShadow: "0 0 18px 2px var(--color-accent), 0 0 0 2px rgba(255,255,255,0.6) inset",
        pointerEvents: "none",
        zIndex: 9999,
        transition: "opacity 200ms ease-out",
        willChange: "transform, opacity",
      }}
    />
  );
}
