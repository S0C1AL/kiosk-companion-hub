import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Cpu, Dices } from "lucide-react";
import { KioskShell } from "@/components/kiosk/KioskShell";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/game-plan/")({
  head: () => ({ meta: [{ title: "Game Plan — Casino Kiosk" }] }),
  component: GamePlanIndex,
});

function GamePlanIndex() {
  const { t } = useTranslation();
  const tiles = [
    {
      type: "technical" as const,
      title: t("gamePlan.technical"),
      desc: t("gamePlan.technicalDesc"),
      icon: Cpu,
      gradient: "from-sky-500 to-indigo-600",
    },
    {
      type: "live" as const,
      title: t("gamePlan.live"),
      desc: t("gamePlan.liveDesc"),
      icon: Dices,
      gradient: "from-amber-500 to-orange-600",
    },
  ];
  return (
    <KioskShell title={t("gamePlan.title")}>
      <div className="mx-auto grid w-full max-w-4xl grid-cols-2 gap-6">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.type}
              to="/game-plan/$type"
              params={{ type: tile.type }}
              className={cn(
                "flex h-64 flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br p-8 shadow-xl ring-1 ring-white/10 transition hover:scale-[1.02] active:scale-[0.99]",
                tile.gradient,
              )}
            >
              <Icon className="size-14" />
              <div>
                <div className="text-3xl font-semibold">{tile.title}</div>
                <div className="mt-2 text-base text-white/80">{tile.desc}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </KioskShell>
  );
}