"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = "" }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      data-testid="theme-toggle-btn"
      onClick={toggleTheme}
      aria-label={
        theme === "light"
          ? "Switch to Refined Slate Dark Mode"
          : "Switch to Executive Light Mode"
      }
      title={
        theme === "light"
          ? "Switch to Dark Mode"
          : "Switch to Executive Light Mode"
      }
      className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white ${className}`}
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
      )}
    </button>
  );
};

