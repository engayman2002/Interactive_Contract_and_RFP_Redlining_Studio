"use client";

import React from "react";
import { useI18n } from "@/i18n/useI18n";

export interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  compact = false,
  className = "",
}) => {
  const { locale, setLocale, locales } = useI18n();

  return (
    <div
      role="group"
      aria-label="Interface Language"
      data-testid="language-switcher"
      dir="ltr"
      className={`inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-lg border border-slate-200/80 bg-slate-100/90 px-1 dark:border-slate-800 dark:bg-slate-900/90 ${
        compact ? "h-7" : "h-8"
      } ${className}`}
    >
      {locales.map((item) => {
        const isActive = locale === item.code;
        return (
          <button
            key={item.code}
            type="button"
            data-testid={`lang-option-${item.code}`}
            title={item.nativeName}
            aria-label={item.nativeName}
            aria-pressed={isActive}
            onClick={() => setLocale(item.code)}
            className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md px-1.5 font-mono text-[10px] font-semibold tracking-wider transition-all ${
              compact ? "h-5" : "h-6"
            } ${
              isActive
                ? "bg-white text-indigo-700 shadow-sm dark:bg-slate-800 dark:text-indigo-300"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

