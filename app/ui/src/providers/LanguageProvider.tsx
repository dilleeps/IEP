import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { logger } from "@/lib/logger";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";
import type { Translations } from "@/i18n/types";

export type Language = "en" | "es";

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LANGUAGE_STORAGE_KEY = "askiep.language";

const translations: Record<Language, Translations> = { en, es };

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

function getStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === "en" || stored === "es") {
      return stored;
    }
  } catch (error) {
    logger.warn("Failed to read language from localStorage", { error });
  }
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getStoredLanguage);

  const t = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
    logger.debug("Language applied to document", { language });
  }, [language]);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      logger.info("Language preference saved", { language: newLang });
    } catch (error) {
      logger.warn("Failed to save language to localStorage", { error });
    }
  }, []);

  const value: LanguageContextValue = {
    language,
    setLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
