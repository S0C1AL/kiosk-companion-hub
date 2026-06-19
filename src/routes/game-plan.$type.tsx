import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileWarning } from "lucide-react";
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

function pdfUrl(type: "technical" | "live", lang: Lang): string {
  return `/game-plans/${type}.${lang}.pdf`;
}

function GamePlanViewer() {
  const { t } = useTranslation();
  const { type } = Route.useParams();
  const { lang } = useLanguage();
  const [errored, setErrored] = useState(false);

  const url = pdfUrl(type, lang);
  const fallbackUrl = pdfUrl(type, "de");

  return (
    <KioskShell
      title={type === "technical" ? t("gamePlan.technical") : t("gamePlan.live")}
    >
      <div className="mx-auto h-[calc(100vh-220px)] w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white">
        {errored ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-700">
            <FileWarning className="size-14 text-amber-500" />
            <p className="text-lg">{t("gamePlan.missingPdf")}</p>
          </div>
        ) : (
          <object
            data={url}
            type="application/pdf"
            className="h-full w-full"
            onError={() => setErrored(true)}
          >
            <iframe
              src={fallbackUrl}
              title="PDF"
              className="h-full w-full"
              onError={() => setErrored(true)}
            />
          </object>
        )}
      </div>
    </KioskShell>
  );
}