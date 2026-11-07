import { useEffect, useState } from "react";
import {
  DEFAULT_PLAYBOOK_RULES,
  checkBackendHealth,
  createPlaybookRule,
  listPlaybookRules,
  login as apiLogin,
  registerOrganization as apiRegisterOrg,
} from "./apiClient";

export type ConnectionStatus = "live" | "demo_fallback";

export interface WorkspaceSession {
  token?: string;
  connectionStatus: ConnectionStatus;
  orgName: string;
  userEmail: string;
  userRole: string;
}

const STORAGE_KEY_TOKEN = "redline_session_token";
const STORAGE_KEY_ORG = "redline_session_org";
const STORAGE_KEY_EMAIL = "redline_session_email";
const STORAGE_KEY_ROLE = "redline_session_role";

const DEFAULT_DEMO_SESSION: WorkspaceSession = {
  token: undefined,
  connectionStatus: "demo_fallback",
  orgName: "Global Commercial Legal (Demo)",
  userEmail: "counsel@company.demo",
  userRole: "LEGAL_COUNSEL",
};

let currentSession: WorkspaceSession = DEFAULT_DEMO_SESSION;
const listeners = new Set<(session: WorkspaceSession) => void>();

function notifySessionChange(session: WorkspaceSession) {
  currentSession = session;
  for (const listener of listeners) {
    listener(session);
  }
}

/**
 * Ensures an active workspace session exists.
 * If backend is reachable and no token is in localStorage,
 * automatically registers or logs in with default corporate credentials
 * and ensures standard playbook rules are populated.
 */
export async function ensureWorkspaceSession(): Promise<WorkspaceSession> {
  if (typeof window === "undefined") {
    return DEFAULT_DEMO_SESSION;
  }

  const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
  const storedOrg = localStorage.getItem(STORAGE_KEY_ORG);
  const storedEmail = localStorage.getItem(STORAGE_KEY_EMAIL);
  const storedRole = localStorage.getItem(STORAGE_KEY_ROLE);

  const isBackendLive = await checkBackendHealth();

  if (!isBackendLive) {
    const offlineSession: WorkspaceSession = {
      token: undefined,
      connectionStatus: "demo_fallback",
      orgName: storedOrg || DEFAULT_DEMO_SESSION.orgName,
      userEmail: storedEmail || DEFAULT_DEMO_SESSION.userEmail,
      userRole: storedRole || DEFAULT_DEMO_SESSION.userRole,
    };
    notifySessionChange(offlineSession);
    return offlineSession;
  }

  // Backend is live: if we have a stored token, verify it with a quick API call
  if (storedToken) {
    try {
      await listPlaybookRules(storedToken);
      const activeSession: WorkspaceSession = {
        token: storedToken,
        connectionStatus: "live",
        orgName: storedOrg || "Redline Global Technologies",
        userEmail: storedEmail || "counsel@redlinestudio.local",
        userRole: storedRole || "ADMIN",
      };
      notifySessionChange(activeSession);
      return activeSession;
    } catch {
      // Stored token is invalid or expired, continue to bootstrap below
      localStorage.removeItem(STORAGE_KEY_TOKEN);
    }
  }

  // Live backend bootstrapping: register default org or login
  const defaultOrgName = "Redline Global Technologies";
  const defaultEmail = "counsel@redlinestudio.local";
  const defaultPassword = "RedlineStudio2026!";

  let activeToken: string | undefined;

  try {
    const onboarding = await apiRegisterOrg(
      defaultOrgName,
      defaultEmail,
      defaultPassword
    );
    activeToken = onboarding.access_token;
  } catch {
    // If org or email already registered, log in
    try {
      const loginResp = await apiLogin(defaultEmail, defaultPassword);
      activeToken = loginResp.access_token;
    } catch {
      // If login also fails, fallback gracefully to demo mode
    }
  }

  if (activeToken) {
    localStorage.setItem(STORAGE_KEY_TOKEN, activeToken);
    localStorage.setItem(STORAGE_KEY_ORG, defaultOrgName);
    localStorage.setItem(STORAGE_KEY_EMAIL, defaultEmail);
    localStorage.setItem(STORAGE_KEY_ROLE, "ADMIN");

    // Seed default playbook rules if org playbook is empty
    try {
      const rules = await listPlaybookRules(activeToken);
      if (rules.length === 0) {
        for (const rule of DEFAULT_PLAYBOOK_RULES) {
          await createPlaybookRule(
            {
              category: rule.category,
              standard_position: rule.standard_position,
              fallback_position: rule.fallback_position,
              unacceptable_triggers: rule.unacceptable_triggers,
            },
            activeToken
          );
        }
      }
    } catch {
      // Non-fatal if seeding has minor issue
    }

    const liveSession: WorkspaceSession = {
      token: activeToken,
      connectionStatus: "live",
      orgName: defaultOrgName,
      userEmail: defaultEmail,
      userRole: "ADMIN",
    };
    notifySessionChange(liveSession);
    return liveSession;
  }

  const fallbackSession: WorkspaceSession = {
    token: undefined,
    connectionStatus: "demo_fallback",
    orgName: DEFAULT_DEMO_SESSION.orgName,
    userEmail: DEFAULT_DEMO_SESSION.userEmail,
    userRole: DEFAULT_DEMO_SESSION.userRole,
  };
  notifySessionChange(fallbackSession);
  return fallbackSession;
}

export function getStoredSession(): WorkspaceSession {
  return currentSession;
}

export async function loginWithCredentials(
  email: string,
  pass: string
): Promise<WorkspaceSession> {
  const resp = await apiLogin(email, pass);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY_TOKEN, resp.access_token);
    localStorage.setItem(STORAGE_KEY_EMAIL, email);
    localStorage.setItem(STORAGE_KEY_ROLE, resp.user?.role ?? "ADMIN");
  }

  const updated: WorkspaceSession = {
    token: resp.access_token,
    connectionStatus: "live",
    orgName: "Redline Global Technologies",
    userEmail: email,
    userRole: resp.user?.role ?? "ADMIN",
  };
  notifySessionChange(updated);
  return updated;
}

export function logoutSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_ORG);
    localStorage.removeItem(STORAGE_KEY_EMAIL);
    localStorage.removeItem(STORAGE_KEY_ROLE);
  }
  notifySessionChange(DEFAULT_DEMO_SESSION);
}

/**
 * React hook to observe session status, connection mode, and account details.
 */
export function useAuthSession() {
  const [session, setSession] = useState<WorkspaceSession>(currentSession);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const listener = (s: WorkspaceSession) => {
      if (isMounted) {
        setSession(s);
      }
    };
    listeners.add(listener);

    void ensureWorkspaceSession().then((res) => {
      if (isMounted) {
        setSession(res);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      listeners.delete(listener);
    };
  }, []);

  return {
    session,
    token: session.token,
    connectionStatus: session.connectionStatus,
    isLoading,
    refreshSession: ensureWorkspaceSession,
    login: loginWithCredentials,
    logout: logoutSession,
  };
}

