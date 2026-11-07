"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, ShieldCheck, X } from "lucide-react";
import { useAuthSession } from "@/services/authSession";
import { ThemeToggle } from "./ThemeToggle";

export const TopNavBar: React.FC = () => {
  const pathname = usePathname();
  const { session, connectionStatus, login, logout } = useAuthSession();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>(
    "counsel@redlinestudio.local"
  );
  const [passInput, setPassInput] = useState<string>("RedlineStudio2026!");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

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
    { label: "Dashboard", href: "/" },
    { label: "Sample Studio", href: "/documents/demo" },
    { label: "Company Playbook", href: "/playbooks" },
    { label: "Help & Guide", href: "/help" },
  ];

  const formattedRole =
    session.userRole === "ADMIN"
      ? "Legal Counsel • Admin"
      : session.userRole.replace(/_/g, " ");

  return (
    <>
      <nav
        aria-label="Global Application Navigation"
        data-testid="top-nav-bar"
        className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/85 px-6 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-900/85"
      >
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="group flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 p-2 text-white shadow-sm shadow-indigo-600/20">
              <Scale className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-white">
                Redline Studio
              </span>
              <span className="hidden rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 sm:inline-block">
                ENTERPRISE LEGAL AI
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Segmented Pill Navigation */}
        <div className="hidden items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-950/70 md:flex">
          {navLinks.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
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

        {/* Right: Workspace Status & Controls */}
        <div className="flex items-center gap-2.5">
          {/* Connection Status Badge */}
          <div
            data-testid="backend-connection-badge"
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              connectionStatus === "live"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connectionStatus === "live"
                  ? "animate-pulse bg-emerald-500 dark:bg-emerald-400"
                  : "bg-indigo-500 dark:bg-indigo-400"
              }`}
            />
            <span>
              {connectionStatus === "live" ? "Live Backend" : "Demo Workspace"}
            </span>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Executive Role Badge */}
          <div className="flex items-center border-l border-slate-200 pl-2.5 dark:border-slate-800">
            <button
              type="button"
              data-testid="account-org-button"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-3 py-1.5 text-left shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-semibold leading-tight text-slate-900 dark:text-slate-100">
                  {formattedRole}
                </p>
                <p className="max-w-[140px] truncate text-[10px] leading-tight text-slate-500 dark:text-slate-400">
                  {session.orgName}
                </p>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Account / Login Modal */}
      {isLoginModalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Account Session Modal"
          data-testid="account-login-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-black/70"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between border-b border-slate-200/80 pb-3.5 dark:border-slate-800">
              <div>
                <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Workspace Authentication
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sign in or switch organization tenant credentials.
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
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <input
                  type="password"
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
