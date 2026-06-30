import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HelpCircle, X } from "lucide-react";

export function HowToPanel({ contentKey }: { contentKey: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const text = t(contentKey);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-base font-medium text-white/90"
      >
        <HelpCircle className="size-5" />
        {t("common.howTo")}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-xl rounded-3xl border border-white/15 bg-slate-900 p-8 text-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="size-6" />
            </button>
            <h3 className="mb-4 text-2xl font-semibold">{t("common.howTo")}</h3>
            <p className="whitespace-pre-line text-lg leading-relaxed text-white/80">
              {text}
            </p>
          </div>
        </div>
      )}
    </>
  );
}