import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FileWarning, Loader2 } from "lucide-react";
import { KioskShell } from "@/components/kiosk/KioskShell";
import { useLanguage } from "@/components/kiosk/LanguageProvider";
import type { Lang } from "@/i18n";

export const Route = createFileRoute("/game-plan/$type")({
  parseParams: (params) => {
    if (params.type !== "technical" && params.type !== "live") throw notFound();
    return { type: params.type as "technical" | "live" };
  },
  head: () => ({ meta: [{ title: "Game Plan — Casino Kiosk" }] }),
  component: GamePlanViewer,
});

async function fetchPages(type: string, lang: Lang): Promise<string[]> {
  const res = await fetch(
    `/api/kiosk/game-plan-pages?type=${encodeURIComponent(type)}&lang=${encodeURIComponent(lang)}`,
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { pages?: string[] };
  return json.pages ?? [];
}

function GamePlanViewer() {
  const { t } = useTranslation();
  const { type } = Route.useParams();
  const { lang } = useLanguage();

  const primary = useQuery({
    queryKey: ["game-plan-pages", type, lang],
    queryFn: () => fetchPages(type, lang),
    staleTime: 5 * 60_000,
  });

  const needFallback = primary.data && primary.data.length === 0 && lang !== "de";
  const fallback = useQuery({
    queryKey: ["game-plan-pages", type, "de"],
    queryFn: () => fetchPages(type, "de"),
    enabled: !!needFallback,
    staleTime: 5 * 60_000,
  });

  const useLang: Lang =
    primary.data && primary.data.length > 0
      ? lang
      : fallback.data && fallback.data.length > 0
        ? "de"
        : lang;
  const pages =
    primary.data && primary.data.length > 0 ? primary.data : (fallback.data ?? []);
  const loading = primary.isLoading || (needFallback && fallback.isLoading);

  return (
    <KioskShell
      title={type === "technical" ? t("gamePlan.technical") : t("gamePlan.live")}
      idleMs={300_000}
    >
      <div
        className="relative h-[calc(100vh-220px)] w-full overflow-hidden rounded-3xl border border-white/10 bg-white"
        onContextMenu={(e) => e.preventDefault()}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center text-slate-700">
            <Loader2 className="size-10 animate-spin" />
          </div>
        ) : pages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-700">
            <FileWarning className="size-14 text-amber-500" />
            <p className="text-lg">{t("gamePlan.missingPdf")}</p>
          </div>
        ) : (
          <div
            className="h-full w-full overflow-y-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-3 p-3">
              {pages.map((p, i) => (
                <img
                  key={p}
                  src={`/game-plans-img/${type}.${useLang}/${p}`}
                  alt={`Page ${i + 1}`}
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                  className="w-full select-none"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </KioskShell>
  );
}