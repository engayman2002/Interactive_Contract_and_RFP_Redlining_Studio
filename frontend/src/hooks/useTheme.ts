"use client";

import { useCallback, useEffect, useState } from "react";

export type AppTheme = "light" | "dark";

const THEME_STORAGE_KEY = "redline_studio_theme";
const THEME_CHANGE_EVENT = "redline-theme-change";

function readStoredTheme(): AppTheme {
  if (typeof window === "undefined") {
    return "light";
  }
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      return stored;
    }
  } catch {
    // Ignore storage read restrictions
  }
  return "light";
}

function applyDocumentTheme(theme: AppTheme): void {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<AppTheme>("light");

  useEffect(() => {
    const initial = readStoredTheme();
    setThemeState(initial);
    applyDocumentTheme(initial);

    const handleSync = (event: Event) => {
      const custom = event as CustomEvent<AppTheme>;
      if (custom.detail === "light" || custom.detail === "dark") {
        setThemeState(custom.detail);
        applyDocumentTheme(custom.detail);
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleSync);
    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleSync);
    };
  }, []);

  const setTheme = useCallback((nextTheme: AppTheme) => {
    setThemeState(nextTheme);
    applyDocumentTheme(nextTheme);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {
        // Ignore storage write restrictions
      }
      window.dispatchEvent(
        new CustomEvent<AppTheme>(THEME_CHANGE_EVENT, { detail: nextTheme })
      );
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === "dark",
  };
}

