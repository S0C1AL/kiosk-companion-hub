import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import cz from "./cz.json";
import en from "./en.json";
import de from "./de.json";

export type Lang = "cz" | "en" | "de";

export const LANGS: Lang[] = ["cz", "en", "de"];

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      cz: { translation: cz },
      en: { translation: en },
      de: { translation: de },
    },
    lng: "de",
    fallbackLng: "de",
    interpolation: { escapeValue: false },
  });
}

export function nationalityToLang(nationality: string | undefined | null): Lang {
  const n = (nationality ?? "").toUpperCase();
  if (n === "CZE" || n === "SVK") return "cz";
  if (n === "DEU" || n === "AUT") return "de";
  return "en";
}

export default i18n;