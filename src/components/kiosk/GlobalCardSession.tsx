import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CardReaderListener } from "./CardReaderListener";
import { useLanguage } from "./LanguageProvider";
import { nationalityToLang } from "@/i18n";
import { getPlayerInfo } from "@/lib/player.functions";
import {
  clearSession,
  setSessionCard,
  useCardSession,
} from "@/lib/card-session";
import { LANGS } from "@/i18n";

/**
 * Warm the HTTP cache for all game-plan PDFs once at boot. The handler sets
 * `cache-control: public, max-age=300`, so subsequent <object data=...>
 * loads in the viewer come from cache and render instantly.
 */
function usePrefetchGamePlans() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const types: Array<"technical" | "live"> = ["technical", "live"];
    const urls = types.flatMap((t) => LANGS.map((l) => `/game-plans/${t}.${l}.pdf`));
    // Defer so it doesn't fight the initial render.
    const idle = (cb: () => void) =>
      (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
        .requestIdleCallback?.(cb) ?? window.setTimeout(cb, 1500);
    idle(() => {
      for (const url of urls) {
        // HEAD would skip the body; we need the body in the disk cache.
        fetch(url, { method: "GET", cache: "force-cache" }).catch(() => {});
      }
    });
  }, []);
}

/**
 * Global card session manager mounted at the app root.
 *
 * - Card insert: stores cardNo (resetting any previous player's session) and
 *   clears manual language override so nationality drives language.
 * - Card remove: clears the session everywhere, regardless of current route.
 * - Also fetches player info on insert so we can auto-detect language even
 *   before the user opens Self-Exclusion / Player Info.
 */
export function GlobalCardSession() {
  const { setLangFromNationality } = useLanguage();
  const { cardNo } = useCardSession();
  usePrefetchGamePlans();

  const query = useQuery({
    queryKey: ["player", cardNo],
    queryFn: () => getPlayerInfo({ data: { cardNo: cardNo! } }),
    enabled: cardNo !== null,
    retry: false,
    staleTime: 30_000,
  });

  useEffect(() => {
    const nat = query.data?.document?.[0]?.idDocNationality;
    if (nat) setLangFromNationality(nationalityToLang(nat));
  }, [query.data, setLangFromNationality]);

  return (
    <CardReaderListener
      onCard={(dec) => {
        setSessionCard(dec);
      }}
      onRemove={() => {
        // Drop any manual language pick when the card leaves, so the next
        // card starts fresh with nationality-based auto-detection.
        resetOverrideViaStorage();
        clearSession();
      }}
    />
  );
}

function resetOverrideViaStorage() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("kiosk-lang-override");
  }
}
