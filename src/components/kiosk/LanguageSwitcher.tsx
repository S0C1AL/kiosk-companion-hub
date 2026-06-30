import { Globe } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import type { Lang } from "@/i18n";
import { cn } from "@/lib/utils";

const OPTIONS: { code: Lang; label: string; flag: string }[] = [
  { code: "cz", label: "CZ", flag: "🇨🇿" },
  { code: "en", label: "EN", flag: "🇬🇧" },
  { code: "de", label: "DE", flag: "🇩🇪" },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 p-1.5">
      <Globe className="ml-2 size-5 text-white/60" />
      {OPTIONS.map((opt) => (
        <button
          key={opt.code}
          type="button"
          onClick={() => setLang(opt.code)}
          className={cn(
            "flex items-center gap-2 rounded-xl px-4 py-2 text-base font-semibold",
            lang === opt.code
              ? "bg-white text-slate-900 shadow"
              : "text-white/80",
          )}
        >
          <span aria-hidden className="text-xl leading-none">
            {opt.flag}
          </span>
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}