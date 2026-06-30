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

const PDF_VIEWER_HIDEBARS = "#toolbar=0&navpanes=0&scrollbar=1";

function GamePlanViewer() {
  const { t } = useTranslation();
  const { type } = Route.useParams();
  const { lang } = useLanguage();
  const [errored, setErrored] = useState(false);

  const url = pdfUrl(type, lang) + PDF_VIEWER_HIDEBARS;
  const fallbackUrl = pdfUrl(type, "de") + PDF_VIEWER_HIDEBARS;

  return (
    <KioskShell
      title={type === "technical" ? t("gamePlan.technical") : t("gamePlan.live")}
      idleMs={300_000}
    >
      <div
        className="relative h-[calc(100vh-220px)] w-full overflow-hidden rounded-3xl border border-white/10 bg-white"
        onContextMenu={(e) => e.preventDefault()}
      >
        {errored ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-700">
            <FileWarning className="size-14 text-amber-500" />
            <p className="text-lg">{t("gamePlan.missingPdf")}</p>
          </div>
        ) : (
          <iframe
            src={url}
            title="PDF"
            className="h-full w-full border-0"
            onError={() => setErrored(true)}
          />
        )}
      </div>
    </KioskShell>
  );
}