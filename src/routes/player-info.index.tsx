import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { KioskShell } from "@/components/kiosk/KioskShell";
import { CardGate } from "@/components/kiosk/CardGate";
import { HowToPanel } from "@/components/kiosk/HowToPanel";
import { getPlayerBalance, getKioskClientConfig } from "@/lib/player.functions";
import { useState } from "react";
import {
  currencyCodeToLabel,
  formatPlayerName,
  type PlayerInfo,
} from "@/lib/player-types";

export const Route = createFileRoute("/player-info/")({
  head: () => ({ meta: [{ title: "Player Info — Casino Kiosk" }] }),
  component: PlayerInfoPage,
});

function PlayerInfoPage() {
  const { t } = useTranslation();
  return (
    <KioskShell
      title={t("playerInfo.title")}
      actions={<HowToPanel contentKey="playerInfo.howTo" />}
    >
      <CardGate>{(player) => <PlayerInner player={player} />}</CardGate>
    </KioskShell>
  );
}

function PlayerInner({ player }: { player: PlayerInfo }) {
  const { t, i18n } = useTranslation();
  const balanceQuery = useQuery({
    queryKey: ["balance", player.playerId],
    queryFn: () => getPlayerBalance({ data: { playerId: player.playerId } }),
    staleTime: 15_000,
  });
  const cfgQuery = useQuery({
    queryKey: ["kiosk-config"],
    queryFn: () => getKioskClientConfig(),
    staleTime: 5 * 60_000,
  });
  const [imgError, setImgError] = useState(false);

  const levelColor =
    cfgQuery.data?.levelColors?.[player.cardLevelName] ||
    player.primaryLevelColour ||
    "#475569";

  const currency = balanceQuery.data
    ? currencyCodeToLabel(balanceQuery.data.currency)
    : "";

  const fmt = (cents: number) =>
    new Intl.NumberFormat(i18n.language, {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 2,
    }).format((cents ?? 0) / 100);

  const fmtPoints = (cents: number) =>
    new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 2 }).format(
      (cents ?? 0) / 100,
    );

  const dob = new Date(player.dateOfBirth).toLocaleDateString(i18n.language);
  const lastVisit = player.lastVisit
    ? new Date(player.lastVisit).toLocaleString(i18n.language)
    : "—";

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-white/10 bg-white/10 p-8">
        <h2 className="mb-6 text-base uppercase tracking-wider text-white/50">
          {t("playerInfo.personal")}
        </h2>
        <div className="mb-8 flex items-center gap-5">
          <div
            className="grid size-32 shrink-0 place-items-center overflow-hidden rounded-2xl text-4xl font-bold text-white"
            style={{
              boxShadow: `0 0 0 4px ${levelColor}`,
              backgroundColor: levelColor,
            }}
          >
            {!imgError ? (
              <img
                src={`/api/kiosk/player-image/${player.playerId}`}
                alt=""
                className="size-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span>{formatPlayerName(player).slice(0, 1)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-3xl font-semibold text-white">
              {formatPlayerName(player)}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-base text-white/70">
              <span
                className="inline-block rounded-lg px-3 py-1 text-sm font-semibold text-white"
                style={{ backgroundColor: levelColor }}
              >
                {player.cardLevelName}
              </span>
              <span>ID {player.playerId}</span>
            </div>
          </div>
        </div>
        <dl className="space-y-4 text-lg text-white">
          <Row label={t("playerInfo.dob")} value={dob} />
          <Row label={t("playerInfo.email")} value={player.email || "—"} />
          <Row label={t("playerInfo.phone")} value={player.cellPhoneNo || player.phoneNo || "—"} />
          <Row
            label={t("playerInfo.address")}
            value={[player.street, player.city, player.postCode, player.country]
              .filter(Boolean)
              .join(", ") || "—"}
          />
          <Row label={t("playerInfo.lastVisit")} value={lastVisit} />
          <Row
            label={t("playerInfo.visitsWeek")}
            value={String(player.visitsGDLastWeek ?? player.visitsLastWeek ?? 0)}
          />
          <Row
            label={t("playerInfo.visitsMonth")}
            value={String(player.visitsGDLastMonth ?? player.visitsLastMonth ?? 0)}
          />
          <Row
            label={t("playerInfo.visitsYear")}
            value={String(player.visitsGDLastYear ?? player.visitsLastYear ?? 0)}
          />
        </dl>
      </section>

      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-700/40 to-teal-700/40 p-8">
        <h2 className="mb-6 text-base uppercase tracking-wider text-white/60">
          {t("playerInfo.balance")}
        </h2>
        {balanceQuery.isLoading && (
          <div className="flex items-center gap-2 text-white">
            <Loader2 className="size-5 animate-spin" /> {t("common.loading")}
          </div>
        )}
        {balanceQuery.data && (
          <div className="space-y-5">
            <BalanceRow
              label={t("playerInfo.cardCash")}
              value={fmt(balanceQuery.data.cardCash)}
              big
            />
            <BalanceRow
              label={t("playerInfo.cardNonCash")}
              value={fmt(balanceQuery.data.cardNonCash)}
            />
            <BalanceRow
              label={t("playerInfo.cardPoints")}
              value={fmtPoints(balanceQuery.data.cardPoints)}
            />
            <div className="pt-2 text-sm text-white/60">
              {currency} · Card #{balanceQuery.data.cardNumber}
            </div>
          </div>
        )}
        {balanceQuery.isError && (
          <p className="text-white/80">{t("common.error")}</p>
        )}
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="mb-3 text-base uppercase tracking-wider text-white/50">
          {t("playerInfo.tierTitle")}
        </h2>
        <p className="whitespace-pre-line text-lg leading-relaxed text-white/75">
          {t("playerInfo.tierInfo")}
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 pb-3 last:border-0">
      <dt className="text-white/60">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function BalanceRow({
  label,
  value,
  big,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-3 last:border-0">
      <span className="text-lg text-white/80">{label}</span>
      <span className={big ? "text-5xl font-bold text-white" : "text-3xl font-semibold text-white"}>
        {value}
      </span>
    </div>
  );
}