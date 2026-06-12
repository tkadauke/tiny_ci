import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import de from "@/locales/de.json";
import en from "@/locales/en.json";

export const supportedLocales = ["en", "de"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export function normalizeLocale(locale: string | null | undefined): SupportedLocale {
  return locale === "de" ? "de" : "en";
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
      prefix: "%{",
      suffix: "}",
    },
    returnNull: false,
  });
}

export default i18n;
