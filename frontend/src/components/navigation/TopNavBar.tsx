"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, Scale, ShieldCheck, X } from "lucide-react";
import {
  AISettingsModal,
  formatActiveAIBadge,
} from "@/components/workspace/AISettingsModal";
import { fetchAISettings } from "@/services/apiClient";
import { useAuthSession } from "@/services/authSession";
import { useI18n } from "@/i18n/useI18n";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export const TopNavBar: React.FC = () => {
  const pathname = usePathname();
  const { t } = useI18n();
  const { session, connectionStatus, login, logout } = useAuthSession();
  const activeLLMProvider = useWorkspaceStore(
    (state) => state.activeLLMProvider
  );
  const activeLLMModel = useWorkspaceStore((state) => state.activeLLMModel);
  const setActiveAIEngine = useWorkspaceStore(
    (state) => state.setActiveAIEngine
  );

  const [isAISettingsOpen, setIsAISettingsOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>(
    "counsel@redlinestudio.local"
  );
  const [passInput, setPassInput] = useState<string>("RedlineStudio2026!");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  useEffect(() => {
    if (!session.token) {
      return;
    }
    void fetchAISettings(session.token).then((settings) => {
      setActiveAIEngine({
        llmProvider: settings.llm_provider,
        llmModel: settings.llm_model_name,
        embeddingProvider: settings.embedding_provider,
        embeddingModel: settings.embedding_model_name,
      });
    });
  }, [session.token, setActiveAIEngine]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await login(emailInput, passInput);
      setIsLoginModalOpen(false);
    } catch (err) {
      setLoginError(
        err instanceof Error
          ? err.message
          : "Failed to log in to organization."
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const navLinks = [
    { label: t.nav.dashboard, href: "/" },
    { label: t.nav.sampleStudio, href: "/documents/demo" },
    { label: t.nav.companyPlaybook, href: "/playbooks" },
    { label: t.nav.helpGuide, href: "/help" },
  ];

  const formattedRole =
    session.userRole === "ADMIN"
      ? t.nav.roleAdmin
      : session.userRole.replace(/_/g, " ");

  return (
    <>
      <nav
        aria-label="Global Application Navigation"
        data-testid="top-nav-bar"
        className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/85 px-6 backdrop-blur-xl transition-colors dark:border-slate-800/80 dark:bg-[#070B14]/85"
      >
        {/* Left: Brand Identity */}
        <div className="flex shrink-0 items-center gap-6">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 whitespace-nowrap transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-600/25 ring-1 ring-inset ring-white/20">
              <Scale className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap text-[14px] font-semibold tracking-tight text-slate-900 dark:text-white">
                {t.nav.brandName}
              </span>
              <span className="hidden shrink-0 whitespace-nowrap rounded-md border border-indigo-200/80 bg-indigo-50/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 sm:inline-block">
                {t.nav.enterpriseTag}
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Unified Navigation Pill Track */}
        <div className="hidden shrink-0 items-center gap-1 rounded-xl border border-slate-200/60 bg-slate-100/80 p-1 dark:border-slate-800/80 dark:bg-slate-900/90 md:flex">
          {navLinks.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-white font-semibold text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Right: Uniform h-8 Precision Controls */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Active AI Engine Switcher Pill */}
          <button
            type="button"
            data-testid="open-ai-settings-btn"
            onClick={() => setIsAISettingsOpen(true)}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-indigo-200/90 bg-indigo-50/70 px-2.5 text-[11px] font-semibold text-indigo-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-100/80 dark:border-indigo-500/30 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-900/50"
          >
            <Cpu className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap font-mono">
              {formatActiveAIBadge(activeLLMProvider, activeLLMModel)}
            </span>
          </button>

          {/* Connection Status Badge */}
          <div
            data-testid="backend-connection-badge"
            className={`inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 text-[11px] font-medium ${
              connectionStatus === "live"
                ? "border-emerald-200/90 bg-emerald-50/80 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-slate-200/90 bg-slate-100/80 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                connectionStatus === "live"
                  ? "animate-pulse bg-emerald-500 dark:bg-emerald-400"
                  : "bg-indigo-500 dark:bg-indigo-400"
              }`}
            />
            <span className="whitespace-nowrap">
              {connectionStatus === "live"
                ? t.nav.liveBackend
                : t.nav.demoWorkspace}
            </span>
          </div>

          {/* Language Switcher & Theme Toggle */}
          <LanguageSwitcher />
          <ThemeToggle />

          {/* Executive Role Badge */}
          <div className="flex shrink-0 items-center border-s border-slate-200/80 ps-2 dark:border-slate-800">
            <button
              type="button"
              data-testid="account-org-button"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-slate-200/90 bg-white px-2.5 text-start shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <ShieldCheck className="h-3 w-3" aria-hidden="true" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-semibold leading-none text-slate-900 dark:text-slate-100">
                  {formattedRole}
                </p>
                <p className="mt-0.5 max-w-[130px] truncate text-[10px] leading-none text-slate-500 dark:text-slate-400">
                  {session.orgName}
                </p>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* AI Engine & Model Switcher Modal */}
      {isAISettingsOpen ? (
        <AISettingsModal
          isOpen={isAISettingsOpen}
          onClose={() => setIsAISettingsOpen(false)}
          token={session.token}
          userRole={session.userRole}
        />
      ) : null}

      {/* Account / Login Modal */}
      {isLoginModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Account Session Modal"
          data-testid="account-login-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-black/70"
        >
          <div className="surface-card w-full max-w-md rounded-2xl p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200/80 pb-3.5 dark:border-slate-800">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  {t.nav.authModalTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t.nav.authModalSubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t.nav.emailLabel}
                </label>
                <input
                  type="email"
                  dir="ltr"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  {t.nav.passwordLabel}
                </label>
                <input
                  type="password"
                  dir="ltr"
                  required
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>

              {loginError ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                  {loginError}
                </div>
              ) : null}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsLoginModalOpen(false);
                  }}
                  className="text-xs font-medium text-slate-500 transition-colors hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                >
                  Clear Session
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {isLoggingIn ? "Authenticating..." : "Sign In"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};
