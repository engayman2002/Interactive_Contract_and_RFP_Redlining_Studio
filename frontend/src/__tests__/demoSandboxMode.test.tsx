import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/page";
import PlaybooksPage from "@/app/playbooks/page";
import { TopNavBar } from "@/components/navigation/TopNavBar";
import { RedliningStudioWorkspace } from "@/components/workspace/RedliningStudioWorkspace";
import { useLocaleStore } from "@/i18n/useI18n";
import {
  DEMO_WORKSPACE_DATA,
  REAL_PLAYBOOK_STORAGE_KEY,
  createPlaybookRule,
  getLocalPlaybookStorageKey,
  listDocuments,
  listPlaybookRules,
  saveLocalDocument,
} from "@/services/apiClient";
import { useWorkspaceStore } from "@/store/workspaceStore";

const mockPush = vi.fn();
let mockPathname = "/";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
  }),
  usePathname: () => mockPathname,
}));

describe("Clean Real Workspace vs. Isolated Demo Sandbox Mode", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    mockPush.mockReset();
    mockPathname = "/";
    useLocaleStore.getState().setLocale("en");
    useWorkspaceStore.getState().resetWorkspaceState();
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
  });

  afterEach(() => {
    useWorkspaceStore.getState().resetWorkspaceState();
    useLocaleStore.getState().setLocale("en");
    window.localStorage.clear();
    window.sessionStorage.clear();
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
    vi.restoreAllMocks();
  });

  it("renders Clean Real Workspace Mode with 0 documents and clean empty state on Dashboard when demo mode is off", async () => {
    await act(async () => {
      useWorkspaceStore.getState().setDemoMode(false);
    });

    await act(async () => {
      render(<DashboardPage />);
    });

    expect(screen.getByTestId("clean-workspace-empty-state")).toBeInTheDocument();
    expect(
      screen.getByText("Your Real Legal Workspace Is Clean & Ready")
    ).toBeInTheDocument();
    expect(screen.getByTestId("enter-demo-from-empty-btn")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-demo-mode-btn")).toBeInTheDocument();
    expect(screen.queryByTestId("demo-sandbox-banner")).toBeNull();
    expect(screen.getByTestId("backend-connection-badge")).toHaveTextContent(
      "Local Workspace"
    );

    const realDocs = await listDocuments();
    expect(realDocs).toHaveLength(0);
  });

  it("renders Clean Real Playbooks empty state with 0 rules when demo mode is off", async () => {
    await act(async () => {
      useWorkspaceStore.getState().setDemoMode(false);
    });

    await act(async () => {
      render(<PlaybooksPage />);
    });

    expect(screen.getByTestId("clean-playbooks-empty-state")).toBeInTheDocument();
    expect(screen.getByTestId("load-demo-playbooks-btn")).toBeInTheDocument();
    expect(screen.queryByTestId("playbook-rules-grid")).toBeNull();

    const rules = await listPlaybookRules();
    expect(rules).toHaveLength(0);
    expect(getLocalPlaybookStorageKey()).toBe(REAL_PLAYBOOK_STORAGE_KEY);
  });

  it("enters and exits isolated Demo Sandbox Mode from Navbar and Dashboard without leaking data into real storage", async () => {
    await act(async () => {
      useWorkspaceStore.getState().setDemoMode(false);
    });

    await act(async () => {
      render(<DashboardPage />);
    });

    // Save a real uploaded document in Real Workspace Mode
    saveLocalDocument({
      id: "real-nda-001",
      org_id: "real-org-001",
      title: "Acme_Real_NDA.docx",
      status: "READY",
      version: 1,
      clause_count: 4,
      created_by: "user-001",
      created_at: "2026-11-11T00:00:00Z",
    });

    // Enter Demo Sandbox via Navbar toggle
    await act(async () => {
      fireEvent.click(screen.getByTestId("toggle-demo-mode-btn"));
    });

    expect(useWorkspaceStore.getState().isDemoMode).toBe(true);
    expect(mockPush).toHaveBeenCalledWith("/documents/demo");
    expect(screen.getByTestId("demo-sandbox-banner")).toBeInTheDocument();
    expect(screen.getByTestId("exit-demo-mode-btn")).toBeInTheDocument();
    expect(screen.getByTestId("backend-connection-badge")).toHaveTextContent(
      "Demo Workspace"
    );
    expect(getLocalPlaybookStorageKey()).toBe("redline_playbook_rules");

    // Demo document should appear in demo list, completely isolated from real document
    const demoDocs = await listDocuments();
    expect(
      demoDocs.some((d) => d.id === DEMO_WORKSPACE_DATA.document_id)
    ).toBe(true);
    expect(demoDocs.some((d) => d.id === "real-nda-001")).toBe(false);

    // Exit Demo Sandbox via Banner button on /documents/demo route
    mockPathname = "/documents/demo";
    await act(async () => {
      fireEvent.click(screen.getByTestId("exit-demo-sandbox-btn"));
    });

    expect(useWorkspaceStore.getState().isDemoMode).toBe(false);
    expect(screen.queryByTestId("demo-sandbox-banner")).toBeNull();
    expect(screen.getByTestId("toggle-demo-mode-btn")).toBeInTheDocument();

    // Real document remains intact after exiting Demo Sandbox
    const restoredRealDocs = await listDocuments();
    expect(restoredRealDocs).toHaveLength(1);
    expect(restoredRealDocs[0].id).toBe("real-nda-001");
  });

  it("isolates real playbook rules from demo playbook rules", async () => {
    await act(async () => {
      useWorkspaceStore.getState().setDemoMode(false);
    });

    await createPlaybookRule({
      category: "Custom Governing Law",
      standard_position: "Delaware",
      fallback_position: "New York",
      unacceptable_triggers: "mandatory arbitration overseas",
    });

    const realRulesBeforeDemo = await listPlaybookRules();
    expect(realRulesBeforeDemo).toHaveLength(1);
    expect(realRulesBeforeDemo[0].category).toBe("Custom Governing Law");

    await act(async () => {
      useWorkspaceStore.getState().setDemoMode(true);
    });

    const demoRules = await listPlaybookRules();
    expect(demoRules.length).toBeGreaterThanOrEqual(3);
    expect(demoRules.some((r) => r.category === "Custom Governing Law")).toBe(
      false
    );

    await act(async () => {
      useWorkspaceStore.getState().setDemoMode(false);
    });

    const realRulesAfterDemo = await listPlaybookRules();
    expect(realRulesAfterDemo).toHaveLength(1);
    expect(realRulesAfterDemo[0].category).toBe("Custom Governing Law");
  });

  it("renders demo-sandbox-banner inside RedliningStudioWorkspace when viewing /documents/demo and exits cleanly", async () => {
    await act(async () => {
      useWorkspaceStore.getState().setDemoMode(false);
    });

    await act(async () => {
      render(<RedliningStudioWorkspace documentId="demo" />);
    });

    expect(useWorkspaceStore.getState().isDemoMode).toBe(true);
    expect(screen.getByTestId("demo-sandbox-banner")).toBeInTheDocument();
    expect(screen.getByTestId("exit-demo-sandbox-btn")).toBeInTheDocument();
    expect(screen.getByTestId("exit-demo-mode-btn")).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(screen.getByTestId("exit-demo-sandbox-btn"));
    });

    expect(useWorkspaceStore.getState().isDemoMode).toBe(false);
  });

  it("localizes Demo Sandbox UI and clean empty states in Arabic RTL and Spanish", async () => {
    await act(async () => {
      useWorkspaceStore.getState().setDemoMode(false);
      useLocaleStore.getState().setLocale("ar");
    });

    await act(async () => {
      render(<DashboardPage />);
    });

    expect(document.documentElement.dir).toBe("rtl");
    expect(document.documentElement.lang).toBe("ar");
    expect(
      screen.getByText("مساحة العمل القانونية الحقيقية نظيفة وجاهزة")
    ).toBeInTheDocument();
    expect(screen.getByTestId("toggle-demo-mode-btn")).toHaveTextContent(
      "بيئة العرض التجريبي"
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("enter-demo-from-empty-btn"));
    });

    expect(screen.getByTestId("demo-sandbox-banner")).toHaveTextContent(
      "وضع العرض التجريبي نشط"
    );
    expect(screen.getByTestId("exit-demo-sandbox-btn")).toHaveTextContent(
      "الخروج من الوضع التجريبي"
    );

    await act(async () => {
      useLocaleStore.getState().setLocale("es");
    });

    expect(document.documentElement.dir).toBe("ltr");
    expect(screen.getByTestId("demo-sandbox-banner")).toHaveTextContent(
      "Sandbox Demo Activo"
    );
    expect(screen.getByTestId("exit-demo-sandbox-btn")).toHaveTextContent(
      "Salir del Modo Demo"
    );
  });

  it("supports TopNavBar exit-demo-mode-btn when pathname is /documents/demo", async () => {
    mockPathname = "/documents/demo";
    await act(async () => {
      useWorkspaceStore.getState().setDemoMode(true);
    });

    await act(async () => {
      render(<TopNavBar />);
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("exit-demo-mode-btn"));
    });

    expect(useWorkspaceStore.getState().isDemoMode).toBe(false);
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
