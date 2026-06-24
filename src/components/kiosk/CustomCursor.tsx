import { useEffect, useRef, useState } from "react";

const SIZE = 40;

export function CustomCursor() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);
  const fadeTimer = useRef<number | null>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (ref.current) {
        ref.current.style.transform = `translate(${e.clientX - SIZE / 2}px, ${e.clientY - SIZE / 2}px) scale(${pressedRef.current ? 1.6 : 1})`;
      }
      setVisible(true);
      if (e.pointerType === "touch") {
        if (fadeTimer.current) window.clearTimeout(fadeTimer.current);
        fadeTimer.current = window.setTimeout(() => setVisible(false), 400);
      }
    };
    const down = (e: PointerEvent) => {
      pressedRef.current = true;
      setPressed(true);
      if (ref.current) {
        ref.current.style.transform = `translate(${e.clientX - SIZE / 2}px, ${e.clientY - SIZE / 2}px) scale(1.6)`;
      }
      setVisible(true);
    };
    const up = () => {
      pressedRef.current = false;
      setPressed(false);
    };
    const leave = () => setVisible(false);

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.removeEventListener("pointerleave", leave);
      if (fadeTimer.current) window.clearTimeout(fadeTimer.current);
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
        opacity: visible ? (pressed ? 0.55 : 0.75) : 0,
        boxShadow: "0 0 18px 2px var(--color-accent), 0 0 0 2px rgba(255,255,255,0.6) inset",
        pointerEvents: "none",
        zIndex: 9999,
        transition: "transform 120ms ease-out, opacity 200ms ease-out",
        willChange: "transform, opacity",
      }}
    />
  );
}

const pressedRef = { current: false };