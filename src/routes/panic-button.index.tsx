import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { Clock, ShieldX, CheckCircle2, Loader2, X } from "lucide-react";
import { KioskShell } from "@/components/kiosk/KioskShell";
import { CardGate } from "@/components/kiosk/CardGate";
import { HowToPanel } from "@/components/kiosk/HowToPanel";
import { blacklistPlayer, excludePlayer48h } from "@/lib/player.functions";
import { formatPlayerName, type PlayerInfo } from "@/lib/player-types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/panic-button/")({
  head: () => ({ meta: [{ title: "Self-Exclusion — Casino Kiosk" }] }),
  component: PanicPage,
});

function PanicPage() {
  const { t } = useTranslation();
  return (
    <KioskShell title={t("panic.title")} actions={<HowToPanel contentKey="panic.howTo" />}>
      <CardGate>{(player) => <PanicInner player={player} />}</CardGate>
    </KioskShell>
  );
}

function PanicInner({ player }: { player: PlayerInfo }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pending, setPending] = useState<null | "48" | "perm">(null);
  const [sendMail, setSendMail] = useState(false);
  const [done, setDone] = useState(false);
  const [excluded48, setExcluded48] = useState(false);

  const m48 = useMutation({
    mutationFn: () => excludePlayer48h({ data: { playerId: player.playerId } }),
    onSuccess: () => {
      setPending(null);
      setExcluded48(true);
    },
  });
  const mPerm = useMutation({
    mutationFn: () =>
      blacklistPlayer({ data: { playerId: player.playerId, sendMail } }),
    onSuccess: () => {
      setDone(true);
      setPending(null);
      setTimeout(() => navigate({ to: "/" }), 3_000);
    },
  });

  if (done) {
    return (
      <div className="flex w-full flex-col items-center gap-6 py-20 text-center">
        <CheckCircle2 className="size-20 text-emerald-400" />
        <p className="text-2xl font-semibold text-white">{t("panic.success")}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <PlayerSummaryCard player={player} />
      {excluded48 && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 p-4 text-emerald-100">
          <CheckCircle2 className="size-7 shrink-0" />
          <p className="text-lg font-medium">{t("panic.exclude48Success")}</p>
        </div>
      )}
      <div className="flex flex-col gap-4">
        <ActionCard
          icon={Clock}
          gradient="from-amber-500 to-orange-600"
          title={t("panic.exclude48")}
          desc={t("panic.exclude48Desc")}
          onClick={() => setPending("48")}
          disabled={excluded48}
          badge={excluded48 ? t("panic.exclude48Active") : undefined}
        />
        <ActionCard
          icon={ShieldX}
          gradient="from-rose-500 to-red-700"
          title={t("panic.excludePerm")}
          desc={t("panic.excludePermDesc")}
          onClick={() => setPending("perm")}
        />
      </div>
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="mb-3 text-base uppercase tracking-wider text-white/50">
          {t("panic.responsibleGamingTitle")}
        </h2>
        <p className="whitespace-pre-line text-lg leading-relaxed text-white/75">
          {t("panic.responsibleGaming")}
        </p>
      </section>

      {pending && (
        <ConfirmModal
          title={
            pending === "48"
              ? t("panic.confirm48Title")
              : t("panic.confirmPermTitle")
          }
          body={t("panic.confirmText")}
          danger
          loading={m48.isPending || mPerm.isPending}
          extra={
            pending === "perm" && (
              <label className="mt-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 p-4 text-white">
                <input
                  type="checkbox"
                  checked={sendMail}
                  onChange={(e) => setSendMail(e.target.checked)}
                  className="size-6 accent-emerald-500"
                />
                <span className="text-lg">{t("panic.sendMail")}</span>
              </label>
            )
          }
          onCancel={() => setPending(null)}
          onConfirm={() => {
            if (pending === "48") m48.mutate();
            else mPerm.mutate();
          }}
        />
      )}
    </div>
  );
}

function PlayerSummaryCard({ player }: { player: PlayerInfo }) {
  const { t } = useTranslation();
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-8">
      <div className="mb-5 text-base uppercase tracking-wider text-white/50">
        {t("panic.summary")}
      </div>
      <div className="space-y-4 text-lg text-white">
        <Field label={t("playerInfo.name")} value={formatPlayerName(player)} />
        <Field
          label={t("playerInfo.dob")}
          value={new Date(player.dateOfBirth).toLocaleDateString()}
        />
        <Field label="ID" value={String(player.playerId)} />
        <Field label={t("playerInfo.cardLevel")} value={player.cardLevelName} />
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/5 pb-2 last:border-0">
      <span className="text-white/60">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  gradient,
  title,
  desc,
  onClick,
  disabled,
  badge,
}: {
  icon: typeof Clock;
  gradient: string;
  title: string;
  desc: string;
  onClick: () => void;
  disabled?: boolean;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-start gap-6 rounded-3xl bg-gradient-to-br p-8 text-left shadow-xl ring-1 ring-white/10",
        gradient,
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <Icon className="size-16 shrink-0" />
      <div className="flex-1">
        <div className="text-3xl font-semibold">{title}</div>
        <div className="mt-2 text-xl text-white/85">{desc}</div>
        {badge && (
          <div className="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
            {badge}
          </div>
        )}
      </div>
    </button>
  );
}

function ConfirmModal({
  title,
  body,
  extra,
  danger,
  loading,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  extra?: React.ReactNode;
  danger?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
      <div className="relative w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900 p-8 text-white shadow-2xl">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Close"
          disabled={loading}
        >
          <X className="size-6" />
        </button>
        <h3 className="text-2xl font-semibold">{title}</h3>
        <p className="mt-3 text-lg text-white/80">{body}</p>
        {extra}
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-2xl bg-white/10 px-6 py-4 text-lg font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-4 text-lg font-semibold text-white transition disabled:opacity-50",
              danger ? "bg-red-600 hover:bg-red-500" : "bg-emerald-600 hover:bg-emerald-500",
            )}
          >
            {loading && <Loader2 className="size-5 animate-spin" />}
            {t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}