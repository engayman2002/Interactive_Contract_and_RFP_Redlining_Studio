"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthSession } from "@/services/authSession";

export const TopNavBar: React.FC = () => {
  const pathname = usePathname();
  const { session, connectionStatus, login, logout } = useAuthSession();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>("counsel@redlinestudio.local");
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
        err instanceof Error ? err.message : "Failed to log in to organization."
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const navLinks = [
    { label: "Dashboard", href: "/" },
    { label: "Company Playbook", href: "/playbooks" },
    { label: "Sample Studio", href: "/documents/demo" },
  ];

  return (
    <>
      <nav
        aria-label="Global Application Navigation"
        data-testid="top-nav-bar"
        className="flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 backdrop-blur-md"
      >
        <div className="flex items-center gap-8">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-md shadow-indigo-600/30">
              §
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white">
                REDLINE STUDIO
              </span>
              <span className="ml-2 rounded border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300">
                AI LEGALTECH
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white font-semibold"
                      : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right side status & account */}
        <div className="flex items-center gap-3">
          {/* Connection Status Badge */}
          <div
            data-testid="backend-connection-badge"
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              connectionStatus === "live"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connectionStatus === "live"
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-amber-400"
              }`}
            />
            <span>
              {connectionStatus === "live"
                ? "Live Backend Connected"
                : "Offline Demo Mode"}
            </span>
          </div>

          {/* Org & User Profile */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <button
              type="button"
              data-testid="account-org-button"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-850 px-2.5 py-1 text-left transition-colors hover:bg-slate-800"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs text-slate-200">
                ⚖️
              </div>
              <div className="hidden sm:block">
                <p className="text-[11px] font-semibold text-slate-200 leading-tight">
                  {session.orgName}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {session.userRole}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Workspace Authentication
                </h3>
                <p className="text-xs text-slate-400">
                  Sign in or switch organization tenant credentials.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-400">
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={passInput}
                  onChange={(e) => setPassInput(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {loginError ? (
                <div className="rounded border border-rose-500/30 bg-rose-950/40 px-3 py-1.5 text-xs text-rose-300">
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
                  className="text-xs text-slate-400 hover:text-rose-400"
                >
                  Clear Session
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(false)}
                    className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
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

