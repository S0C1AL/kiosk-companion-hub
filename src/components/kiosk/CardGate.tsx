import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, CreditCard, AlertCircle } from "lucide-react";
import { getPlayerInfo } from "@/lib/player.functions";
import type { PlayerInfo } from "@/lib/player-types";
import { CardReaderListener } from "./CardReaderListener";
import { OnScreenKeypad } from "./OnScreenKeypad";
import { useLanguage } from "./LanguageProvider";
import { nationalityToLang } from "@/i18n";
import {
  clearSession,
  markSessionVerified,
  setSessionCard,
  useCardSession,
} from "@/lib/card-session";
import { cn } from "@/lib/utils";

interface Props {
  children: (player: PlayerInfo) => ReactNode;
}

function formatDobDisplay(digits: string): string {
  const d = digits.slice(0, 8);
  let out = "";
  for (let i = 0; i < d.length; i++) {
    if (i === 2 || i === 4) out += ".";
    out += d[i];
  }
  return out;
}

function dobInputMatches(digits: string, isoDate: string): boolean {
  if (digits.length !== 8) return false;
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  const iso = isoDate.slice(0, 10);
  const target = `${yyyy}-${mm}-${dd}`;
  return iso === target;
}

export function CardGate({ children }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setLangFromNationality } = useLanguage();
  const session = useCardSession();
  const cardNo = session.cardNo;
  const [dobDigits, setDobDigits] = useState("");
  const [tries, setTries] = useState(0);
  const [shake, setShake] = useState(false);
  const verified = session.verified;

  const query = useQuery({
    queryKey: ["player", cardNo],
    queryFn: () => getPlayerInfo({ data: { cardNo: cardNo! } }),
    enabled: cardNo !== null,
    retry: false,
    staleTime: 30_000,
  });

  const player = query.data ?? null;

  // Auto-detect language from card nationality
  useEffect(() => {
    if (player?.document?.[0]?.idDocNationality) {
      setLangFromNationality(nationalityToLang(player.document[0].idDocNationality));
    }
  }, [player, setLangFromNationality]);

  // Eject on too many tries
  useEffect(() => {
    if (tries >= 3) {
      const tm = setTimeout(() => navigate({ to: "/" }), 2500);
      return () => clearTimeout(tm);
    }
  }, [tries, navigate]);

  const handleVerify = () => {
    if (!player) return;
    if (dobInputMatches(dobDigits, player.dateOfBirth)) {
      markSessionVerified();
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      setTries((n) => n + 1);
      setDobDigits("");
    }
  };

  const endSession = () => {
    clearSession();
    setDobDigits("");
    setTries(0);
    // Always send the user back to the home screen on card removal.
    navigate({ to: "/" });
  };

  if (verified && player) {
    return (
      <>
        <CardReaderListener onCard={() => {}} onRemove={endSession} />
        {children(player)}
      </>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center px-6 py-10 text-center">
      <CardReaderListener
        onCard={(dec) => {
          if (cardNo === null) setSessionCard(dec);
        }}
        onRemove={endSession}
      />

      {cardNo === null && (
        <div className="flex flex-col items-center gap-6">
          <div className="grid size-40 place-items-center rounded-full bg-white/10 ring-1 ring-white/15">
            <CreditCard className="size-20 text-white" />
          </div>
          <h2 className="text-4xl font-semibold text-white">{t("card.insertTitle")}</h2>
          <p className="max-w-md text-lg text-white/70">{t("card.insertSubtitle")}</p>
        </div>
      )}

      {cardNo !== null && query.isLoading && (
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="size-12 animate-spin" />
          <p className="text-xl">{t("card.reading")}</p>
        </div>
      )}

      {cardNo !== null && (query.isError || (!query.isLoading && !player)) && (
        <div className="flex flex-col items-center gap-4 text-white">
          <AlertCircle className="size-14 text-amber-400" />
          <p className="text-xl">{t("card.notFound")}</p>
          <button
            type="button"
            onClick={() => {
              clearSession();
              setDobDigits("");
            }}
            className="rounded-2xl bg-white px-6 py-3 text-lg font-semibold text-slate-900 transition hover:bg-white/90"
          >
            {t("card.scanAgain")}
          </button>
        </div>
      )}

      {player && !verified && tries < 3 && (
        <div className="flex flex-col items-center gap-6">
          <div>
            <h2 className="text-3xl font-semibold text-white">{t("dob.title")}</h2>
            <p className="mt-2 text-lg text-white/70">{t("dob.subtitle")}</p>
          </div>
          <div
            className={cn(
              "rounded-2xl border border-white/15 bg-white/10 px-8 py-5 text-4xl font-mono tracking-widest text-white",
              shake && "animate-pulse border-red-400",
            )}
          >
            {dobDigits.length === 0 ? (
              <span className="text-white/30">{t("dob.format")}</span>
            ) : (
              formatDobDisplay(dobDigits.padEnd(8, "_")).replace(/_/g, "·")
            )}
          </div>
          {tries > 0 && (
            <p className="text-red-300">{t("dob.wrong", { tries })}</p>
          )}
          <OnScreenKeypad
            onKey={(k) => {
              if (k === ".") return;
              if (dobDigits.length < 8) setDobDigits((d) => d + k);
            }}
            onBackspace={() => setDobDigits((d) => d.slice(0, -1))}
          />
          <button
            type="button"
            disabled={dobDigits.length !== 8}
            onClick={handleVerify}
            className="rounded-2xl bg-emerald-500 px-10 py-4 text-xl font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("dob.verify")}
          </button>
        </div>
      )}

      {tries >= 3 && (
        <div className="flex flex-col items-center gap-4 text-white">
          <AlertCircle className="size-14 text-red-400" />
          <p className="text-xl">{t("dob.tooManyTries")}</p>
        </div>
      )}
    </div>
  );
}