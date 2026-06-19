import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { BookOpen, ShieldAlert, User, Sparkles } from "lucide-react";
import { KioskHeader } from "@/components/kiosk/KioskHeader";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Casino Kiosk" },
      { name: "description", content: "Self-service casino kiosk" },
    ],
  }),
  component: Home,
});

function Home() {
  const { t } = useTranslation();
  const tiles = [
    {
      to: "/game-plan" as const,
      title: t("home.tiles.gamePlan"),
      desc: t("home.tiles.gamePlanDesc"),
      icon: BookOpen,
      gradient: "from-sky-500 to-indigo-600",
    },
    {
      to: "/panic-button" as const,
      title: t("home.tiles.panicButton"),
      desc: t("home.tiles.panicButtonDesc"),
      icon: ShieldAlert,
      gradient: "from-rose-500 to-red-600",
    },
    {
      to: "/player-info" as const,
      title: t("home.tiles.playerInfo"),
      desc: t("home.tiles.playerInfoDesc"),
      icon: User,
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      to: null,
      title: t("home.tiles.comingSoon"),
      desc: t("home.tiles.comingSoonDesc"),
      icon: Sparkles,
      gradient: "from-slate-600 to-slate-700",
      disabled: true,
    },
  ];
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <KioskHeader showHome={false} />
      <main className="flex flex-1 flex-col items-center justify-center px-8 pb-10">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold tracking-tight">{t("home.title")}</h1>
          <p className="mt-3 text-xl text-white/60">{t("home.subtitle")}</p>
        </div>
        <div className="grid w-full max-w-5xl grid-cols-2 gap-6">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            const inner = (
              <div
                className={cn(
                  "group relative flex h-64 flex-col justify-between overflow-hidden rounded-3xl p-8 shadow-xl ring-1 ring-white/10 transition",
                  "bg-gradient-to-br",
                  tile.gradient,
                  tile.disabled
                    ? "opacity-50"
                    : "hover:scale-[1.02] active:scale-[0.99]",
                )}
              >
                <Icon className="size-14" />
                <div>
                  <div className="text-3xl font-semibold">{tile.title}</div>
                  <div className="mt-2 text-base text-white/80">{tile.desc}</div>
                </div>
              </div>
            );
            if (tile.disabled || !tile.to) {
              return (
                <div key={tile.title} aria-disabled>
                  {inner}
                </div>
              );
            }
            return (
              <Link key={tile.title} to={tile.to} className="block">
                {inner}
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}