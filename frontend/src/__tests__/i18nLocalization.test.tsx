import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "@/app/page";
import { InteractiveTutorialWizard } from "@/components/help/InteractiveTutorialWizard";
import { RedliningStudioWorkspace } from "@/components/workspace/RedliningStudioWorkspace";
import { LOCALE_STORAGE_KEY, useLocaleStore } from "@/i18n/useI18n";
import {
  DEMO_WORKSPACE_DATA,
  getLocalDocumentWorkspace,
  saveLocalDocumentWorkspace,
  triggerDocumentAnalysis,
} from "@/services/apiClient";
import type { DocumentWorkspaceDTO } from "@/services/contracts";
import { useWorkspaceStore } from "@/store/workspaceStore";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/",
}));

describe("Multilingual Internationalization (EN / ES / FR)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    useLocaleStore.getState().setLocale("en");
    useWorkspaceStore.getState().resetWorkspaceState();
    document.documentElement.lang = "en";
  });

  afterEach(() => {
    useLocaleStore.getState().setLocale("en");
    window.localStorage.clear();
    useWorkspaceStore.getState().resetWorkspaceState();
    document.documentElement.lang = "en";
    vi.restoreAllMocks();
  });

  it("defaults to English ('en') with EN active in LanguageSwitcher", async () => {
    await act(async () => {
      render(<DashboardPage />);
    });

    const switcher = screen.getByTestId("language-switcher");
    expect(switcher).toBeInTheDocument();

    const enBtn = screen.getByTestId("lang-option-en");
    expect(enBtn).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("lang-option-es")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.getByTestId("lang-option-fr")).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    expect(
      screen.getByText("Contract & RFP Intelligence Workspace")
    ).toBeInTheDocument();
    expect(screen.getByText("Configure Playbook")).toBeInTheDocument();
  });

  it("switches Dashboard, Studio, RedlineCard, and offline AI output to Spanish ('es')", async () => {
    let unmountDashboard: () => void = () => {};
    await act(async () => {
      const rendered = render(<DashboardPage />);
      unmountDashboard = rendered.unmount;
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("lang-option-es"));
    });

    expect(useLocaleStore.getState().locale).toBe("es");
    expect(document.documentElement.lang).toBe("es");
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("es");

    expect(
      screen.getByText("Centro de Inteligencia Contractual y RFP")
    ).toBeInTheDocument();
    expect(screen.getByText("Configurar Políticas")).toBeInTheDocument();
    expect(screen.getByText("Panel")).toBeInTheDocument();

    unmountDashboard();

    // Run offline AI analysis in Spanish and verify saved workspace
    const clonedWorkspace: DocumentWorkspaceDTO = {
      ...DEMO_WORKSPACE_DATA,
      document_id: "i18n-es-doc-1",
      clauses: DEMO_WORKSPACE_DATA.clauses.map((c) => ({
        ...c,
        document_id: "i18n-es-doc-1",
      })),
      redlines: [],
    };
    saveLocalDocumentWorkspace(clonedWorkspace);

    await act(async () => {
      await triggerDocumentAnalysis("i18n-es-doc-1", undefined, "balanced");
    });

    const savedSpanishWs = getLocalDocumentWorkspace("i18n-es-doc-1");
    expect(savedSpanishWs).not.toBeNull();
    expect(savedSpanishWs!.redlines[0].rationale).toContain(
      "[Postura Mutua Equilibrada]"
    );
    expect(savedSpanishWs!.redlines[0].rationale).toContain("Argumento:");

    await act(async () => {
      render(<RedliningStudioWorkspace initialWorkspace={savedSpanishWs!} />);
    });

    expect(screen.getByTestId("trigger-sse-audit-btn").textContent).toContain(
      "Analizar Contrato"
    );
    expect(screen.getByTestId("stance-option-strict").textContent).toBe(
      "Estricto"
    );
    expect(screen.getByTestId("stance-option-balanced").textContent).toBe(
      "Equilibrado"
    );
    expect(screen.getByTestId("stance-option-commercial").textContent).toBe(
      "Comercial"
    );

    const firstClause = savedSpanishWs!.clauses[0];
    const firstSuggestion = savedSpanishWs!.redlines[0];

    expect(
      screen.getByTestId(`apply-redline-btn-${firstClause.id}`).textContent
    ).toBe("Aplicar Cambio");
    expect(
      screen.getByTestId(`toggle-copilot-btn-${firstSuggestion.id}`).textContent
    ).toContain("Copiloto IA");
    expect(
      screen.getByTestId(`simulate-pushback-btn-${firstSuggestion.id}`)
        .textContent
    ).toContain("Simular Objeción");
    expect(
      screen.getByTestId(`redline-card-${firstClause.id}`).textContent
    ).toContain("Argumento de Negociación");
  });

  it("switches Studio, 5-Stage Tutorial Wizard, and offline AI output to French ('fr') and restores English ('en')", async () => {
    await act(async () => {
      render(<RedliningStudioWorkspace initialWorkspace={DEMO_WORKSPACE_DATA} />);
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId("lang-option-fr"));
    });

    expect(useLocaleStore.getState().locale).toBe("fr");
    expect(document.documentElement.lang).toBe("fr");

    expect(screen.getByTestId("trigger-sse-audit-btn").textContent).toContain(
      "Analyser le Contrat"
    );
    expect(screen.getByTestId("stance-option-balanced").textContent).toBe(
      "Équilibré"
    );

    const firstClause = DEMO_WORKSPACE_DATA.clauses[0];
    const firstSuggestion = DEMO_WORKSPACE_DATA.redlines[0];

    expect(
      screen.getByTestId(`apply-redline-btn-${firstClause.id}`).textContent
    ).toBe("Appliquer");
    expect(
      screen.getByTestId(`simulate-pushback-btn-${firstSuggestion.id}`)
        .textContent
    ).toContain("Simuler Réponse");

    // Verify French Tutorial Wizard
    await act(async () => {
      render(<InteractiveTutorialWizard />);
    });
    const wizard = screen.getByTestId("interactive-tutorial-wizard");
    expect(wizard.textContent).toContain(
      "Maîtrisez Tout le Flux de Révision en 2 Minutes"
    );
    expect(wizard.textContent).toContain("Étape 1 sur 5");
    expect(screen.getByTestId("tutorial-next-btn").textContent).toContain(
      "Étape Suivante"
    );

    // Offline French AI analysis
    const frenchDoc: DocumentWorkspaceDTO = {
      ...DEMO_WORKSPACE_DATA,
      document_id: "i18n-fr-doc-1",
      clauses: DEMO_WORKSPACE_DATA.clauses.map((c) => ({
        ...c,
        document_id: "i18n-fr-doc-1",
      })),
      redlines: [],
    };
    saveLocalDocumentWorkspace(frenchDoc);

    await act(async () => {
      await triggerDocumentAnalysis("i18n-fr-doc-1", undefined, "commercial");
    });

    const savedFrenchWs = getLocalDocumentWorkspace("i18n-fr-doc-1");
    expect(savedFrenchWs).not.toBeNull();
    expect(savedFrenchWs!.redlines[0].rationale).toContain(
      "[Posture Commerciale Rapide]"
    );
    expect(savedFrenchWs!.redlines[0].rationale).toContain("Argumentaire :");

    // Switch back to English cleanly
    await act(async () => {
      fireEvent.click(screen.getByTestId("lang-option-en"));
    });
    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByTestId("trigger-sse-audit-btn").textContent).toContain(
      "Analyze Contract"
    );
    expect(
      screen.getByTestId(`apply-redline-btn-${firstClause.id}`).textContent
    ).toBe("Apply Redline");
  });
});
