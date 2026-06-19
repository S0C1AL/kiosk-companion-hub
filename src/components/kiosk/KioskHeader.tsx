import { Link, useRouter } from "@tanstack/react-router";
import { Home } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function KioskHeader({ showHome = true }: { showHome?: boolean }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const d = new Date();
      setNow(
        d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
      );
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  const isHome = router.state.location.pathname === "/";

  return (
    <header className="flex items-center justify-between gap-4 px-8 py-5">
      <div className="flex items-center gap-3">
        {showHome && !isHome && (
          <Link
            to="/"
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-base font-medium text-white/90 backdrop-blur transition hover:bg-white/10"
          >
            <Home className="size-5" />
            <span>{t("common.home")}</span>
          </Link>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-xl text-white/70" suppressHydrationWarning>
          {now}
        </span>
        <LanguageSwitcher />
      </div>
    </header>
  );
}