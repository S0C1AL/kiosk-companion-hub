import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import i18n, { LANGS, type Lang } from "@/i18n";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  setLangFromNationality: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "kiosk-lang-override";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("de");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && LANGS.includes(stored as Lang)) {
      setLangState(stored as Lang);
      void i18n.changeLanguage(stored);
    } else {
      void i18n.changeLanguage("de");
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    void i18n.changeLanguage(l);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, l);
    }
  }, []);

  const setLangFromNationality = useCallback((l: Lang) => {
    // Only auto-set when there's no manual override yet
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) return;
    }
    setLangState(l);
    void i18n.changeLanguage(l);
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, setLangFromNationality }),
    [lang, setLang, setLangFromNationality],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}