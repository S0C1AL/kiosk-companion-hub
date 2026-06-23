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
  const { setLangFromNationality, resetLanguageOverride } = useLanguage();
  const { cardNo } = useCardSession();

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
        resetLanguageOverride();
        setSessionCard(dec);
      }}
      onRemove={() => clearSession()}
    />
  );
}
