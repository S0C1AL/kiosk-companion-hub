import { useEffect, useRef } from "react";
import { useCardSession } from "@/lib/card-session";

/**
 * Listens for card insert/remove events streamed by the kiosk PC/SC bridge
 * (see scripts/kiosk-card-bridge.py) over Server-Sent Events at
 * /api/card/stream. The bridge POSTs to /api/public/card-event whenever a
 * card is presented or removed at the ACR122 reader.
 */
export function CardReaderListener({
  onCard,
  onRemove,
}: {
  onCard: (cardDecimal: number) => void;
  onRemove?: () => void;
}) {
  const { cardNo } = useCardSession();
  const hadCardOnMount = cardNo !== null;
  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return;
    // If a card was already in the session when this listener mounted (e.g. the
    // user navigated between kiosk pages with the card still inserted), treat
    // it as already-seen so a subsequent remove event actually fires onRemove.
    let sawInsert = hadCardOnMount;
    const es = new EventSource("/api/card/stream");
    es.onmessage = (msg) => {
      try {
        const ev = JSON.parse(msg.data) as
          | { type: "insert"; cardNo: number }
          | { type: "remove" };
        if (ev.type === "insert" && Number.isFinite(ev.cardNo) && ev.cardNo > 0) {
          sawInsert = true;
          onCard(ev.cardNo);
        } else if (ev.type === "remove" && sawInsert) {
          sawInsert = false;
          onRemove?.();
        }
      } catch {
        /* ignore malformed event */
      }
    };
    return () => es.close();
  }, [onCard, onRemove, hadCardOnMount]);

  return null;
}