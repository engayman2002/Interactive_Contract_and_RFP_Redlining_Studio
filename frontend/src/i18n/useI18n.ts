"use client";

import { useEffect } from "react";
import { create } from "zustand";
import {
  SUPPORTED_LOCALES,
  TRANSLATIONS,
  type SupportedLocale,
  type TranslationDictionary,
} from "./translations";

export const LOCALE_STORAGE_KEY = "redline_studio_locale";

export function isRtlLocale(locale: SupportedLocale): boolean {
  return locale === "ar";
}

function isSupportedLocale(value: unknown): value is SupportedLocale {
  return (
    value === "en" || value === "es" || value === "fr" || value === "ar"
  );
}

function applyDocumentLocaleAttributes(locale: SupportedLocale): void {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtlLocale(locale) ? "rtl" : "ltr";
  }
}

export interface LocaleStoreState {
  locale: SupportedLocale;
  hasHydrated: boolean;
  setLocale: (next: SupportedLocale) => void;
  hydrateFromStorage: () => void;
}

export const useLocaleStore = create<LocaleStoreState>((set, get) => ({
  locale: "en",
  hasHydrated: false,

  setLocale: (next) => {
    if (!isSupportedLocale(next)) {
      return;
    }
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
      } catch {
        // Ignore storage restrictions
      }
    }
    applyDocumentLocaleAttributes(next);
    set({ locale: next, hasHydrated: true });
  },

  hydrateFromStorage: () => {
    if (get().hasHydrated) {
      return;
    }
    let resolved: SupportedLocale = "en";
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
        if (isSupportedLocale(stored)) {
          resolved = stored;
        }
      } catch {
        // Ignore storage restrictions
      }
    }
    applyDocumentLocaleAttributes(resolved);
    set({ locale: resolved, hasHydrated: true });
  },
}));

export function getActiveLocale(): SupportedLocale {
  return useLocaleStore.getState().locale;
}

export function useI18n(): {
  locale: SupportedLocale;
  setLocale: (next: SupportedLocale) => void;
  t: TranslationDictionary;
  locales: typeof SUPPORTED_LOCALES;
  isRtl: boolean;
  dir: "ltr" | "rtl";
} {
  const locale = useLocaleStore((s) => s.locale);
  const setLocale = useLocaleStore((s) => s.setLocale);
  const hydrateFromStorage = useLocaleStore((s) => s.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const isRtl = isRtlLocale(locale);

  return {
    locale,
    setLocale,
    t: TRANSLATIONS[locale],
    locales: SUPPORTED_LOCALES,
    isRtl,
    dir: isRtl ? "rtl" : "ltr",
  };
}

