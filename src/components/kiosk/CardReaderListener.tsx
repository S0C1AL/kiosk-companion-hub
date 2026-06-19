import { useEffect } from "react";

/**
 * Listens for ACR122 keyboard-wedge input.
 * Buffers hex characters until Enter, converts hex -> decimal,
 * and calls onCard(decimal).
 *
 * Reader format assumed: uppercase or lowercase hex chars + Enter.
 * Example: "293A6C3B\n" -> 691694651
 */
export function CardReaderListener({ onCard }: { onCard: (cardDecimal: number) => void }) {
  useEffect(() => {
    let buffer = "";
    let lastKeyTs = 0;
    const handler = (e: KeyboardEvent) => {
      const now = performance.now();
      // Reset buffer if more than 500ms between keystrokes (manual typing safeguard)
      if (now - lastKeyTs > 500) buffer = "";
      lastKeyTs = now;

      if (e.key === "Enter") {
        const hex = buffer.trim();
        buffer = "";
        if (hex.length >= 6 && /^[0-9A-Fa-f]+$/.test(hex)) {
          const dec = parseInt(hex, 16);
          if (Number.isFinite(dec) && dec > 0) {
            e.preventDefault();
            onCard(dec);
          }
        }
        return;
      }
      if (e.key.length === 1 && /[0-9A-Fa-f]/.test(e.key)) {
        buffer += e.key;
        if (buffer.length > 32) buffer = buffer.slice(-32);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCard]);

  return null;
}