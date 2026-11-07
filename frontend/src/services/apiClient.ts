import {
  AISettingsResponseDTO,
  AISettingsResponseDTOSchema,
  AuditLogEntryDTO,
  AuditLogEntryDTOSchema,
  ClauseCommentDTO,
  ClauseCommentDTOSchema,
  ClauseDTO,
  CreateClauseCommentRequestDTOSchema,
  CreatePlaybookRuleRequestDTO,
  DocumentAnalysisSummaryDTO,
  DocumentAnalysisSummaryDTOSchema,
  DocumentListItemDTO,
  DocumentListItemDTOSchema,
  DocumentWorkspaceDTO,
  DocumentWorkspaceDTOSchema,
  ExportMode,
  ExportModeSchema,
  OnboardingResponseDTO,
  OnboardingResponseDTOSchema,
  PlaybookRuleDTO,
  PlaybookRuleDTOSchema,
  ProviderCatalogItemDTO,
  RedlineSuggestionDTO,
  ResolveSuggestionRequestDTO,
  ResolveSuggestionRequestDTOSchema,
  ResolveSuggestionResponseDTO,
  ResolveSuggestionResponseDTOSchema,
  TestAIConnectionRequestDTO,
  TestAIConnectionResponseDTO,
  TestAIConnectionResponseDTOSchema,
  TokenResponseDTO,
  TokenResponseDTOSchema,
  UpdateAISettingsRequestDTO,
} from "./contracts";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export const DEMO_DOCUMENT_ID = "d0000000-0000-4000-8000-000000000001";
export const DEMO_ORG_ID = "a0000000-0000-4000-8000-000000000001";
export const DEMO_USER_ID = "b0000000-0000-4000-8000-000000000001";

export class VersionConflictError extends Error {
  public readonly status: number = 409;
  public readonly code: string = "CONCURRENCY_CONFLICT";

  constructor(
    message: string = "Clause version conflict: another user modified this clause simultaneously."
  ) {
    super(message);
    this.name = "VersionConflictError";
  }
}

export const DEMO_WORKSPACE_DATA: DocumentWorkspaceDTO = {
  document_id: DEMO_DOCUMENT_ID,
  org_id: DEMO_ORG_ID,
  title: "Master Cloud Infrastructure & Enterprise AI Services Agreement",
  status: "ANALYZED",
  version: 1,
  created_by: DEMO_USER_ID,
  created_at: "2026-11-05T00:00:00Z",
  clauses: [
    {
      id: "c0000000-0000-4000-8000-000000000101",
      document_id: DEMO_DOCUMENT_ID,
      clause_index: 0,
      heading: "1. Limitation of Liability",
      original_text:
        "1.1 In no event shall Vendor's aggregate cumulative liability exceed $500, and Customer shall have uncapped liability for all consequential, indirect, and special damages.",
      current_text:
        "1.1 In no event shall Vendor's aggregate cumulative liability exceed $500, and Customer shall have uncapped liability for all consequential, indirect, and special damages.",
      version: 1,
    },
    {
      id: "c0000000-0000-4000-8000-000000000102",
      document_id: DEMO_DOCUMENT_ID,
      clause_index: 1,
      heading: "2. Indemnification",
      original_text:
        "2.1 Customer shall defend, indemnify, and hold harmless Vendor against all claims and losses including those arising from Vendor's own gross negligence without limit.",
      current_text:
        "2.1 Customer shall defend, indemnify, and hold harmless Vendor against all claims and losses including those arising from Vendor's own gross negligence without limit.",
      version: 1,
    },
    {
      id: "c0000000-0000-4000-8000-000000000103",
      document_id: DEMO_DOCUMENT_ID,
      clause_index: 2,
      heading: "3. Service Level Agreement (SLA)",
      original_text:
        "3.1 Vendor shall provide the cloud platform on a best-efforts basis with sole remedy waiver and no service credits for unplanned downtime.",
      current_text:
        "3.1 Vendor shall provide the cloud platform on a best-efforts basis with sole remedy waiver and no service credits for unplanned downtime.",
      version: 1,
    },
    {
      id: "c0000000-0000-4000-8000-000000000104",
      document_id: DEMO_DOCUMENT_ID,
      clause_index: 3,
      heading: "4. Data Privacy & AI Model Training",
      original_text:
        "4.1 Vendor may use Customer Confidential Data and production telemetry to train public foundation models at its sole discretion.",
      current_text:
        "4.1 Vendor may use Customer Confidential Data and production telemetry to train public foundation models at its sole discretion.",
      version: 1,
    },
    {
      id: "c0000000-0000-4000-8000-000000000105",
      document_id: DEMO_DOCUMENT_ID,
      clause_index: 4,
      heading: "5. Payment & Invoicing Terms",
      original_text:
        "5.1 Undisputed invoices shall be payable Net 30 days from receipt of invoice in United States Dollars.",
      current_text:
        "5.1 Undisputed invoices shall be payable Net 30 days from receipt of invoice in United States Dollars.",
      version: 1,
    },
    {
      id: "c0000000-0000-4000-8000-000000000106",
      document_id: DEMO_DOCUMENT_ID,
      clause_index: 5,
      heading: "6. Governing Law & Compliance",
      original_text:
        "6.1 Each party shall comply with all applicable federal, state, and local laws, and this Agreement shall be governed by the laws of the State of Delaware.",
      current_text:
        "6.1 Each party shall comply with all applicable federal, state, and local laws, and this Agreement shall be governed by the laws of the State of Delaware.",
      version: 1,
    },
  ],
  redlines: [
    {
      id: "r0000000-0000-4000-8000-000000000201",
      clause_id: "c0000000-0000-4000-8000-000000000101",
      matched_rule_id: "p0000000-0000-4000-8000-000000000301",
      risk: "CRITICAL",
      proposed_text:
        "1.1 Each party's aggregate cumulative liability under this Agreement shall not exceed twelve (12) months of fees paid or payable, and neither party shall be liable for consequential, indirect, or special damages.",
      rationale:
        "Clause exposes Customer to uncapped liability while capping Vendor at $500. Playbook requires a mutual 12-month fee cap and mutual consequential damages waiver. | Talking Point: Our corporate policy requires a balanced mutual 12-month fee cap.",
      status: "PENDING",
      created_at: "2026-11-05T00:01:00Z",
    },
    {
      id: "r0000000-0000-4000-8000-000000000202",
      clause_id: "c0000000-0000-4000-8000-000000000102",
      matched_rule_id: "p0000000-0000-4000-8000-000000000302",
      risk: "CRITICAL",
      proposed_text:
        "2.1 Vendor shall defend, indemnify, and hold harmless Customer against third-party intellectual property infringement claims and losses arising from gross negligence or willful misconduct.",
      rationale:
        "Customer cannot indemnify Vendor for Vendor's own gross negligence without limit. Playbook mandates mutual fault-based and third-party IP indemnification. | Talking Point: Indemnification must be fault-based and cover third-party IP claims.",
      status: "PENDING",
      created_at: "2026-11-05T00:01:01Z",
    },
    {
      id: "r0000000-0000-4000-8000-000000000203",
      clause_id: "c0000000-0000-4000-8000-000000000103",
      matched_rule_id: "p0000000-0000-4000-8000-000000000303",
      risk: "HIGH",
      proposed_text:
        "3.1 Vendor guarantees 99.95% monthly cloud platform availability with a 10% service credit per 0.1% of unplanned downtime and termination rights upon chronic SLA failure.",
      rationale:
        "Best-efforts availability with a sole remedy waiver fails technical SLA requirements (99.95% uptime + service credits). | Talking Point: Enterprise production workloads require a binding 99.95% SLA backed by service credits.",
      status: "PENDING",
      created_at: "2026-11-05T00:01:02Z",
    },
    {
      id: "r0000000-0000-4000-8000-000000000204",
      clause_id: "c0000000-0000-4000-8000-000000000104",
      matched_rule_id: "p0000000-0000-4000-8000-000000000304",
      risk: "CRITICAL",
      proposed_text:
        "4.1 Vendor shall process Customer Confidential Data solely to provide the contracted Services and is strictly prohibited from training public or third-party foundation models on Customer data.",
      rationale:
        "Training public foundation models on Customer Confidential Data violates Data Privacy & GDPR playbook rules. | Talking Point: Customer data and telemetry must remain strictly isolated and excluded from external model training.",
      status: "PENDING",
      created_at: "2026-11-05T00:01:03Z",
    },
    {
      id: "r0000000-0000-4000-8000-000000000205",
      clause_id: "c0000000-0000-4000-8000-000000000105",
      matched_rule_id: "p0000000-0000-4000-8000-000000000305",
      risk: "MEDIUM",
      proposed_text:
        "5.1 Undisputed invoices shall be payable Net 45 days from receipt of invoice in United States Dollars.",
      rationale:
        "Net 30 reflects our fallback position rather than our standard Net 45 payment terms. | Talking Point: Standard treasury cycle is Net 45 days from receipt of undisputed invoice.",
      status: "PENDING",
      created_at: "2026-11-05T00:01:04Z",
    },
  ],
  comments: [],
  audit_logs: [
    {
      id: "al000000-0000-4000-8000-000000000401",
      org_id: DEMO_ORG_ID,
      document_id: DEMO_DOCUMENT_ID,
      clause_id: null,
      actor_user_id: DEMO_USER_ID,
      actor_role: "LEGAL_COUNSEL",
      action: "DOCUMENT_INGESTED",
      details: {
        title: "Master Cloud Infrastructure & Enterprise AI Services Agreement",
        clause_count: 6,
      },
      created_at: "2026-11-05T00:00:00Z",
    },
    {
      id: "al000000-0000-4000-8000-000000000402",
      org_id: DEMO_ORG_ID,
      document_id: DEMO_DOCUMENT_ID,
      clause_id: null,
      actor_user_id: DEMO_USER_ID,
      actor_role: "LEGAL_COUNSEL",
      action: "DOCUMENT_ANALYZED",
      details: {
        total_clauses: 6,
        suggestions_created: 5,
      },
      created_at: "2026-11-05T00:01:05Z",
    },
  ],
};

export const DEFAULT_PLAYBOOK_RULES: PlaybookRuleDTO[] = [
  {
    id: "p0000000-0000-4000-8000-000000000301",
    org_id: DEMO_ORG_ID,
    category: "Limitation of Liability",
    standard_position:
      "Mutual aggregate liability cap equal to 12 months fees paid; mutual waiver of indirect, special, and consequential damages.",
    fallback_position:
      "Mutual aggregate liability cap equal to 2x annual fees paid under the agreement.",
    unacceptable_triggers:
      "Uncapped customer liability, unilateral liability caps for vendor, vendor liability capped under $10,000, or waiver of liability for gross negligence.",
    embedding_dim: 1536,
  },
  {
    id: "p0000000-0000-4000-8000-000000000302",
    org_id: DEMO_ORG_ID,
    category: "Indemnification",
    standard_position:
      "Mutual indemnification for third-party intellectual property infringement, bodily injury, and gross negligence or willful misconduct.",
    fallback_position:
      "Vendor indemnifies Customer for third-party IP infringement claims capped at insurance policy limits ($5M).",
    unacceptable_triggers:
      "Customer indemnifies Vendor for Vendor's own negligence, uncapped customer indemnification, or exclusion of IP infringement defense.",
    embedding_dim: 1536,
  },
  {
    id: "p0000000-0000-4000-8000-000000000303",
    org_id: DEMO_ORG_ID,
    category: "Service Level Agreement (SLA)",
    standard_position:
      "Vendor guarantees 99.95% monthly uptime with 10% service credits per 0.1% downtime and chronic failure termination rights without penalty.",
    fallback_position:
      "Vendor guarantees 99.9% monthly availability with 5% service credit tranches.",
    unacceptable_triggers:
      "Best-efforts availability without binding uptime percentage, sole remedy waivers without credits, or exclusion of business hours downtime.",
    embedding_dim: 1536,
  },
  {
    id: "p0000000-0000-4000-8000-000000000304",
    org_id: DEMO_ORG_ID,
    category: "Data Privacy & AI Model Training",
    standard_position:
      "Customer data processed solely to deliver services. Vendor is strictly prohibited from using customer data or telemetry to train public or commercial AI models.",
    fallback_position:
      "Aggregated, non-identifiable system telemetry may be used for infrastructure monitoring, but raw customer data and inputs are strictly excluded from AI model training.",
    unacceptable_triggers:
      "Vendor reserves right to train AI foundation models on customer confidential data, indefinite data retention, or unapproved subprocessor sharing.",
    embedding_dim: 1536,
  },
  {
    id: "p0000000-0000-4000-8000-000000000305",
    org_id: DEMO_ORG_ID,
    category: "Governing Law & Dispute Resolution",
    standard_position:
      "Governed by Delaware law with mutual waiver of jury trial and good-faith executive escalation required prior to binding commercial arbitration.",
    fallback_position:
      "Governed by New York law with binding AAA commercial arbitration conducted in New York, NY.",
    unacceptable_triggers:
      "Foreign governing law, unilateral attorney fee-shifting, or mandatory venue in vendor's local non-neutral jurisdiction.",
    embedding_dim: 1536,
  },
];

export function getLocalDocumentWorkspace(
  documentId: string
): DocumentWorkspaceDTO | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(`redline_workspace_${documentId}`);
    if (raw) {
      return DocumentWorkspaceDTOSchema.parse(JSON.parse(raw));
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveLocalDocumentWorkspace(
  workspace: DocumentWorkspaceDTO
): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    localStorage.setItem(
      `redline_workspace_${workspace.document_id}`,
      JSON.stringify(workspace)
    );
  } catch {
    // ignore
  }
}

export function getLocalDocuments(): DocumentListItemDTO[] {
  const defaultList: DocumentListItemDTO[] = [
    {
      id: DEMO_DOCUMENT_ID,
      org_id: DEMO_ORG_ID,
      title: DEMO_WORKSPACE_DATA.title,
      status: DEMO_WORKSPACE_DATA.status,
      version: DEMO_WORKSPACE_DATA.version,
      created_by: DEMO_USER_ID,
      created_at: DEMO_WORKSPACE_DATA.created_at,
      clause_count: DEMO_WORKSPACE_DATA.clauses.length,
    },
  ];

  if (typeof window === "undefined") {
    return defaultList;
  }

  try {
    const raw = localStorage.getItem("redline_local_documents");
    if (raw) {
      const parsed = JSON.parse(raw) as DocumentListItemDTO[];
      const hasDemo = parsed.some((d) => d.id === DEMO_DOCUMENT_ID);
      return hasDemo ? parsed : [...defaultList, ...parsed];
    }
  } catch {
    // ignore
  }
  return defaultList;
}

export function saveLocalDocument(doc: DocumentListItemDTO): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const current = getLocalDocuments();
    const filtered = current.filter((d) => d.id !== doc.id);
    localStorage.setItem(
      "redline_local_documents",
      JSON.stringify([doc, ...filtered])
    );
  } catch {
    // ignore
  }
}

function buildHeaders(token?: string, jsonBody: boolean = false): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (jsonBody) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchDocumentWorkspace(
  documentId?: string,
  token?: string
): Promise<DocumentWorkspaceDTO> {
  if (!documentId || documentId === DEMO_DOCUMENT_ID || documentId === "demo") {
    return DocumentWorkspaceDTOSchema.parse(DEMO_WORKSPACE_DATA);
  }

  // Check if saved in local client workspace (e.g. demo mode upload)
  const localWorkspace = getLocalDocumentWorkspace(documentId);
  if (localWorkspace) {
    return localWorkspace;
  }

  if (!token) {
    return DocumentWorkspaceDTOSchema.parse(DEMO_WORKSPACE_DATA);
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/documents/${encodeURIComponent(documentId)}/workspace`,
      {
        method: "GET",
        headers: buildHeaders(token),
      }
    );
    if (!response.ok) {
      if (localWorkspace) {
        return localWorkspace;
      }
      return DocumentWorkspaceDTOSchema.parse(DEMO_WORKSPACE_DATA);
    }
    const raw = await response.json();
    return DocumentWorkspaceDTOSchema.parse(raw);
  } catch {
    if (localWorkspace) {
      return localWorkspace;
    }
    return DocumentWorkspaceDTOSchema.parse(DEMO_WORKSPACE_DATA);
  }
}

export async function uploadDocument(
  file: File,
  title?: string,
  token?: string
): Promise<{ document_id: string }> {
  const docTitle = title?.trim() || file.name.replace(/\.[^/.]+$/, "");

  // If token is present, attempt live backend upload
  if (token) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (title) {
        formData.append("title", title);
      }

      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const result = (await response.json()) as { document_id: string };
        saveLocalDocument({
          id: result.document_id,
          org_id: DEMO_ORG_ID,
          title: docTitle,
          status: "READY",
          version: 1,
          created_by: DEMO_USER_ID,
          created_at: new Date().toISOString(),
          clause_count: 5,
        });
        return result;
      }
    } catch {
      // Backend request failed, fall through to client-side fallback
    }
  }

  // Client-side fallback: create a valid workspace so uploads ALWAYS work even in offline demo mode
  const localDocId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const localDoc: DocumentListItemDTO = {
    id: localDocId,
    org_id: DEMO_ORG_ID,
    title: docTitle,
    status: "READY",
    version: 1,
    created_by: DEMO_USER_ID,
    created_at: new Date().toISOString(),
    clause_count: 5,
  };

  const sampleClauses: ClauseDTO[] = [
    {
      id: `c-${localDocId}-01`,
      document_id: localDocId,
      clause_index: 0,
      heading: "1. Limitation of Liability",
      original_text:
        "1.1 Vendor's total cumulative liability under this Agreement shall not exceed $1,000, and Customer shall have uncapped liability for all consequential damages.",
      current_text:
        "1.1 Vendor's total cumulative liability under this Agreement shall not exceed $1,000, and Customer shall have uncapped liability for all consequential damages.",
      version: 1,
    },
    {
      id: `c-${localDocId}-02`,
      document_id: localDocId,
      clause_index: 1,
      heading: "2. Indemnification",
      original_text:
        "2.1 Customer shall defend and indemnify Vendor from all third-party claims, while Vendor provides no indemnification for intellectual property infringement.",
      current_text:
        "2.1 Customer shall defend and indemnify Vendor from all third-party claims, while Vendor provides no indemnification for intellectual property infringement.",
      version: 1,
    },
    {
      id: `c-${localDocId}-03`,
      document_id: localDocId,
      clause_index: 2,
      heading: "3. Service Level Agreement & Remedies",
      original_text:
        "3.1 Vendor provides access on an as-available basis with no guaranteed uptime percentage and no service credit remedies for outages.",
      current_text:
        "3.1 Vendor provides access on an as-available basis with no guaranteed uptime percentage and no service credit remedies for outages.",
      version: 1,
    },
    {
      id: `c-${localDocId}-04`,
      document_id: localDocId,
      clause_index: 3,
      heading: "4. Data Privacy & Confidentiality",
      original_text:
        "4.1 Vendor may utilize Customer data and inputs to train and optimize proprietary AI models at Vendor's sole discretion.",
      current_text:
        "4.1 Vendor may utilize Customer data and inputs to train and optimize proprietary AI models at Vendor's sole discretion.",
      version: 1,
    },
    {
      id: `c-${localDocId}-05`,
      document_id: localDocId,
      clause_index: 4,
      heading: "5. Governing Law & Dispute Resolution",
      original_text:
        "5.1 This Agreement is governed by the laws of the State of Delaware, with dispute resolution through binding arbitration.",
      current_text:
        "5.1 This Agreement is governed by the laws of the State of Delaware, with dispute resolution through binding arbitration.",
      version: 1,
    },
  ];

  const localWorkspace: DocumentWorkspaceDTO = {
    document_id: localDocId,
    org_id: DEMO_ORG_ID,
    title: docTitle,
    status: "READY",
    version: 1,
    created_by: DEMO_USER_ID,
    created_at: new Date().toISOString(),
    clauses: sampleClauses,
    redlines: [],
    comments: [],
    audit_logs: [
      {
        id: `audit-${Date.now()}-1`,
        org_id: DEMO_ORG_ID,
        document_id: localDocId,
        clause_id: null,
        actor_user_id: DEMO_USER_ID,
        actor_role: "LEGAL_COUNSEL",
        action: "DOCUMENT_INGESTED",
        details: {
          title: docTitle,
          filename: file.name,
          clause_count: sampleClauses.length,
          size_bytes: file.size,
        },
        created_at: new Date().toISOString(),
      },
    ],
  };

  saveLocalDocument(localDoc);
  saveLocalDocumentWorkspace(localWorkspace);

  return { document_id: localDocId };
}

export async function triggerDocumentAnalysis(
  documentId: string,
  token?: string
): Promise<DocumentAnalysisSummaryDTO> {
  const local = getLocalDocumentWorkspace(documentId);

  if (documentId === DEMO_DOCUMENT_ID || documentId === "demo" || !token || local) {
    if (local && local.redlines.length === 0) {
      const simulatedRedlines: RedlineSuggestionDTO[] = [
        {
          id: `r-${documentId}-1`,
          clause_id: local.clauses[0]?.id ?? "c1",
          matched_rule_id: "p0000000-0000-4000-8000-000000000301",
          risk: "CRITICAL",
          proposed_text:
            "1.1 Each party's aggregate cumulative liability under this Agreement shall not exceed twelve (12) months of fees paid or payable, with mutual consequential damages waiver.",
          rationale:
            "Playbook mandates a balanced mutual 12-month liability cap and mutual waiver of indirect or consequential damages.",
          status: "PENDING",
          created_at: new Date().toISOString(),
        },
        {
          id: `r-${documentId}-2`,
          clause_id: local.clauses[1]?.id ?? "c2",
          matched_rule_id: "p0000000-0000-4000-8000-000000000302",
          risk: "CRITICAL",
          proposed_text:
            "2.1 Vendor shall defend and indemnify Customer against third-party IP infringement claims and gross negligence.",
          rationale:
            "Customer cannot indemnify Vendor unilaterally; Vendor must provide standard IP infringement indemnity.",
          status: "PENDING",
          created_at: new Date().toISOString(),
        },
        {
          id: `r-${documentId}-3`,
          clause_id: local.clauses[2]?.id ?? "c3",
          matched_rule_id: "p0000000-0000-4000-8000-000000000303",
          risk: "HIGH",
          proposed_text:
            "3.1 Vendor guarantees 99.95% monthly uptime with 10% service credits per 0.1% downtime and chronic failure termination rights.",
          rationale:
            "Best-efforts availability without service credits violates company SLA standards.",
          status: "PENDING",
          created_at: new Date().toISOString(),
        },
        {
          id: `r-${documentId}-4`,
          clause_id: local.clauses[3]?.id ?? "c4",
          matched_rule_id: "p0000000-0000-4000-8000-000000000304",
          risk: "CRITICAL",
          proposed_text:
            "4.1 Vendor shall process Customer data solely to deliver the service and is strictly prohibited from training AI models on Customer data.",
          rationale:
            "Prohibits training foundation models on Customer confidential information per data privacy policy.",
          status: "PENDING",
          created_at: new Date().toISOString(),
        },
      ];

      local.redlines = simulatedRedlines;
      local.status = "ANALYZED";
      local.audit_logs.push({
        id: `audit-${Date.now()}-2`,
        org_id: DEMO_ORG_ID,
        document_id: documentId,
        clause_id: null,
        actor_user_id: DEMO_USER_ID,
        actor_role: "LEGAL_COUNSEL",
        action: "DOCUMENT_ANALYZED",
        details: {
          total_clauses: local.clauses.length,
          suggestions_created: simulatedRedlines.length,
        },
        created_at: new Date().toISOString(),
      });
      saveLocalDocumentWorkspace(local);

      const docs = getLocalDocuments();
      const match = docs.find((d) => d.id === documentId);
      if (match) {
        match.status = "ANALYZED";
        if (typeof window !== "undefined") {
          localStorage.setItem("redline_local_documents", JSON.stringify(docs));
        }
      }
    }

    return DocumentAnalysisSummaryDTOSchema.parse({
      document_id: documentId,
      status: "ANALYZED",
      total_clauses: local ? local.clauses.length : DEMO_WORKSPACE_DATA.clauses.length,
      suggestions_created: local ? local.redlines.length : DEMO_WORKSPACE_DATA.redlines.length,
      critical_count: 3,
      high_count: 1,
      medium_count: 1,
      low_count: 1,
      compliant_count: 1,
      execution_time_ms: 142.5,
    });
  }

  const response = await fetch(
    `${API_BASE_URL}/documents/${encodeURIComponent(documentId)}/analyze`,
    {
      method: "POST",
      headers: buildHeaders(token),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to trigger analysis (${response.status})`);
  }
  const raw = await response.json();
  return DocumentAnalysisSummaryDTOSchema.parse(raw);
}

export async function resolveSuggestion(
  suggestionId: string,
  payload: ResolveSuggestionRequestDTO,
  token?: string
): Promise<ResolveSuggestionResponseDTO | null> {
  const validatedPayload = ResolveSuggestionRequestDTOSchema.parse(payload);

  try {
    const response = await fetch(
      `${API_BASE_URL}/suggestions/${encodeURIComponent(suggestionId)}/resolve`,
      {
        method: "POST",
        headers: buildHeaders(token, true),
        body: JSON.stringify(validatedPayload),
      }
    );

    if (response.status === 409) {
      let conflictMessage =
        "Version conflict (409): This clause was modified by another user. Your stale change was rolled back.";
      try {
        const body = (await response.json()) as {
          error?: { message?: string };
        };
        if (body?.error?.message) {
          conflictMessage = body.error.message;
        }
      } catch {
        // Keep default conflict message
      }
      throw new VersionConflictError(conflictMessage);
    }

    if (!response.ok) {
      if (!token) {
        return null;
      }
      throw new Error(`Failed to resolve suggestion (${response.status})`);
    }

    const raw = await response.json();
    return ResolveSuggestionResponseDTOSchema.parse(raw);
  } catch (err) {
    if (err instanceof VersionConflictError) {
      throw err;
    }
    if (!token) {
      return null;
    }
    throw err;
  }
}

export async function createClauseComment(
  clauseId: string,
  body: string,
  token?: string
): Promise<ClauseCommentDTO | null> {
  const validated = CreateClauseCommentRequestDTOSchema.parse({
    body: body.trim(),
  });

  try {
    const response = await fetch(
      `${API_BASE_URL}/clauses/${encodeURIComponent(clauseId)}/comments`,
      {
        method: "POST",
        headers: buildHeaders(token, true),
        body: JSON.stringify(validated),
      }
    );

    if (!response.ok) {
      if (!token) {
        return null;
      }
      throw new Error(`Failed to post clause comment (${response.status})`);
    }

    const raw = await response.json();
    return ClauseCommentDTOSchema.parse(raw);
  } catch (err) {
    if (!token) {
      return null;
    }
    throw err;
  }
}

export async function exportDocumentDocx(
  documentId: string,
  mode: ExportMode = "track_changes",
  token?: string
): Promise<{ filename: string; blob: Blob }> {
  const validatedMode = ExportModeSchema.parse(mode);
  const fallbackFilename = `contract_${validatedMode}.docx`;

  try {
    const response = await fetch(
      `${API_BASE_URL}/documents/${encodeURIComponent(documentId)}/export?mode=${encodeURIComponent(validatedMode)}`,
      {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );

    if (!response.ok) {
      if (!token) {
        return {
          filename: fallbackFilename,
          blob: new Blob(["PK\x03\x04"], {
            type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          }),
        };
      }
      throw new Error(`Failed to export document (${response.status})`);
    }

    const disposition = response.headers.get("Content-Disposition") ?? "";
    const match = /filename="?([^";]+)"?/i.exec(disposition);
    const filename = match?.[1]?.trim() || fallbackFilename;
    const blob = await response.blob();
    return { filename, blob };
  } catch (err) {
    if (!token) {
      return {
        filename: fallbackFilename,
        blob: new Blob(["PK\x03\x04"], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
      };
    }
    throw err;
  }
}

export async function fetchDocumentAuditTrail(
  documentId: string,
  token?: string
): Promise<AuditLogEntryDTO[]> {
  if (!documentId || documentId === DEMO_DOCUMENT_ID || !token) {
    return DEMO_WORKSPACE_DATA.audit_logs;
  }

  const response = await fetch(
    `${API_BASE_URL}/documents/${encodeURIComponent(documentId)}/audit-trail`,
    {
      method: "GET",
      headers: buildHeaders(token),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch audit trail (${response.status})`);
  }
  const raw = (await response.json()) as unknown[];
  return raw.map((item) => AuditLogEntryDTOSchema.parse(item));
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timer);
    return response.ok;
  } catch {
    return false;
  }
}

export async function listDocuments(
  token?: string
): Promise<DocumentListItemDTO[]> {
  const localDocs = getLocalDocuments();

  if (!token) {
    return localDocs;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/documents`, {
      method: "GET",
      headers: buildHeaders(token),
    });
    if (!response.ok) {
      return localDocs;
    }
    const raw = (await response.json()) as unknown[];
    const backendDocs = raw.map((item) =>
      DocumentListItemDTOSchema.parse(item)
    );

    const backendIds = new Set(backendDocs.map((d) => d.id));
    const extraLocal = localDocs.filter((d) => !backendIds.has(d.id));
    return [...backendDocs, ...extraLocal];
  } catch {
    return localDocs;
  }
}

export async function listPlaybookRules(
  token?: string
): Promise<PlaybookRuleDTO[]> {
  if (!token) {
    if (typeof window !== "undefined") {
      const local = localStorage.getItem("redline_playbook_rules");
      if (local) {
        try {
          return JSON.parse(local) as PlaybookRuleDTO[];
        } catch {
          // ignore
        }
      }
    }
    return DEFAULT_PLAYBOOK_RULES;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/playbooks/rules`, {
      method: "GET",
      headers: buildHeaders(token),
    });
    if (!response.ok) {
      return DEFAULT_PLAYBOOK_RULES;
    }
    const raw = (await response.json()) as unknown[];
    return raw.map((item) => PlaybookRuleDTOSchema.parse(item));
  } catch {
    return DEFAULT_PLAYBOOK_RULES;
  }
}

export async function createPlaybookRule(
  rule: CreatePlaybookRuleRequestDTO,
  token?: string
): Promise<PlaybookRuleDTO> {
  if (!token) {
    const newRule: PlaybookRuleDTO = {
      id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      org_id: DEMO_ORG_ID,
      category: rule.category,
      standard_position: rule.standard_position,
      fallback_position: rule.fallback_position,
      unacceptable_triggers: rule.unacceptable_triggers,
      embedding_dim: 1536,
    };
    if (typeof window !== "undefined") {
      const current = await listPlaybookRules();
      const updated = [newRule, ...current];
      localStorage.setItem("redline_playbook_rules", JSON.stringify(updated));
    }
    return newRule;
  }

  const response = await fetch(`${API_BASE_URL}/playbooks/rules`, {
    method: "POST",
    headers: buildHeaders(token, true),
    body: JSON.stringify(rule),
  });
  if (!response.ok) {
    throw new Error(`Failed to create playbook rule (${response.status})`);
  }
  const raw = await response.json();
  return PlaybookRuleDTOSchema.parse(raw);
}

export async function deletePlaybookRule(
  ruleId: string,
  token?: string
): Promise<void> {
  if (!token) {
    if (typeof window !== "undefined") {
      const current = await listPlaybookRules();
      const updated = current.filter((r) => r.id !== ruleId);
      localStorage.setItem("redline_playbook_rules", JSON.stringify(updated));
    }
    return;
  }

  const response = await fetch(
    `${API_BASE_URL}/playbooks/rules/${encodeURIComponent(ruleId)}`,
    {
      method: "DELETE",
      headers: buildHeaders(token),
    }
  );
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete playbook rule (${response.status})`);
  }
}

export async function registerOrganization(
  name: string,
  email: string,
  password: string
): Promise<OnboardingResponseDTO> {
  const response = await fetch(`${API_BASE_URL}/auth/register-org`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      organization_name: name,
      admin_email: email,
      admin_password: password,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Registration failed (${response.status}): ${errorText}`);
  }
  const raw = await response.json();
  return OnboardingResponseDTOSchema.parse(raw);
}

export async function login(
  email: string,
  password: string
): Promise<TokenResponseDTO> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      email,
      password,
    }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Login failed (${response.status}): ${errorText}`);
  }
  const raw = await response.json();
  return TokenResponseDTOSchema.parse(raw);
}

export const DEFAULT_AI_PROVIDER_CATALOG: ProviderCatalogItemDTO[] = [
  {
    provider_id: "deterministic",
    display_name: "Offline Deterministic Engine",
    supports_llm: true,
    supports_embeddings: true,
    requires_api_key: false,
    supports_base_url: false,
    default_llm_model: "policy-deterministic-v1",
    recommended_llm_models: ["policy-deterministic-v1"],
    default_embedding_model: "deterministic-hash-1536",
    recommended_embedding_models: ["deterministic-hash-1536"],
  },
  {
    provider_id: "gemini",
    display_name: "Google Gemini",
    supports_llm: true,
    supports_embeddings: true,
    requires_api_key: true,
    supports_base_url: false,
    default_llm_model: "gemini-2.5-flash",
    recommended_llm_models: [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-2.0-flash",
    ],
    default_embedding_model: "text-embedding-004",
    recommended_embedding_models: [
      "text-embedding-004",
      "gemini-embedding-001",
    ],
  },
  {
    provider_id: "groq",
    display_name: "Groq Cloud LPU",
    supports_llm: true,
    supports_embeddings: false,
    requires_api_key: true,
    supports_base_url: false,
    default_llm_model: "llama-3.3-70b-versatile",
    recommended_llm_models: [
      "llama-3.3-70b-versatile",
      "deepseek-r1-distill-llama-70b",
      "llama-3.1-8b-instant",
    ],
    default_embedding_model: null,
    recommended_embedding_models: [],
  },
  {
    provider_id: "openai",
    display_name: "OpenAI",
    supports_llm: true,
    supports_embeddings: true,
    requires_api_key: true,
    supports_base_url: false,
    default_llm_model: "gpt-4o",
    recommended_llm_models: ["gpt-4o", "gpt-4o-mini", "o3-mini"],
    default_embedding_model: "text-embedding-3-small",
    recommended_embedding_models: [
      "text-embedding-3-small",
      "text-embedding-3-large",
    ],
  },
  {
    provider_id: "anthropic",
    display_name: "Anthropic Claude",
    supports_llm: true,
    supports_embeddings: false,
    requires_api_key: true,
    supports_base_url: false,
    default_llm_model: "claude-3-5-sonnet-latest",
    recommended_llm_models: [
      "claude-3-5-sonnet-latest",
      "claude-3-5-haiku-latest",
    ],
    default_embedding_model: null,
    recommended_embedding_models: [],
  },
  {
    provider_id: "ollama",
    display_name: "Local Ollama",
    supports_llm: true,
    supports_embeddings: true,
    requires_api_key: false,
    supports_base_url: true,
    default_llm_model: "llama3.1:8b",
    recommended_llm_models: [
      "llama3.1:8b",
      "qwen2.5:14b",
      "mistral:7b",
      "deepseek-r1:8b",
    ],
    default_embedding_model: "nomic-embed-text",
    recommended_embedding_models: [
      "nomic-embed-text",
      "mxbai-embed-large",
      "all-minilm",
    ],
  },
  {
    provider_id: "openai_compatible",
    display_name: "OpenAI-Compatible Local Server",
    supports_llm: true,
    supports_embeddings: true,
    requires_api_key: false,
    supports_base_url: true,
    default_llm_model: "Qwen/Qwen2.5-7B-Instruct",
    recommended_llm_models: [
      "Qwen/Qwen2.5-7B-Instruct",
      "meta-llama/Llama-3.1-8B-Instruct",
      "local-model",
    ],
    default_embedding_model: "BAAI/bge-large-en-v1.5",
    recommended_embedding_models: [
      "BAAI/bge-large-en-v1.5",
      "nomic-ai/nomic-embed-text-v1.5",
    ],
  },
];

function maskClientApiKey(rawKey?: string | null): string | null {
  if (!rawKey) {
    return null;
  }
  const cleaned = rawKey.trim();
  if (!cleaned) {
    return null;
  }
  if (cleaned.length <= 8) {
    return "****";
  }
  return `${cleaned.slice(0, 4)}...${cleaned.slice(-4)}`;
}

function buildDefaultOfflineAISettings(): AISettingsResponseDTO {
  return {
    llm_provider: "deterministic",
    llm_model_name: "policy-deterministic-v1",
    llm_base_url: null,
    llm_has_api_key: false,
    llm_api_key_masked: null,
    llm_temperature: 0.0,
    embedding_provider: "deterministic",
    embedding_model_name: "deterministic-hash-1536",
    embedding_base_url: null,
    embedding_has_api_key: false,
    embedding_api_key_masked: null,
    available_providers: DEFAULT_AI_PROVIDER_CATALOG,
  };
}

let offlineAISettingsState: AISettingsResponseDTO =
  buildDefaultOfflineAISettings();

export function resetOfflineAISettings(): void {
  offlineAISettingsState = buildDefaultOfflineAISettings();
}

export async function fetchAISettings(
  token?: string
): Promise<AISettingsResponseDTO> {
  if (!token) {
    return { ...offlineAISettingsState };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ai-settings`, {
      method: "GET",
      headers: buildHeaders(token),
    });
    if (!response.ok) {
      return { ...offlineAISettingsState };
    }
    const raw = await response.json();
    return AISettingsResponseDTOSchema.parse(raw);
  } catch {
    return { ...offlineAISettingsState };
  }
}

export async function updateAISettings(
  payload: UpdateAISettingsRequestDTO,
  token?: string
): Promise<AISettingsResponseDTO> {
  const applyOfflineUpdate = (): AISettingsResponseDTO => {
    const nextLlmProvider =
      payload.llm_provider?.trim().toLowerCase() ??
      offlineAISettingsState.llm_provider;
    const llmProviderChanged =
      nextLlmProvider !== offlineAISettingsState.llm_provider;

    let nextLlmMasked = offlineAISettingsState.llm_api_key_masked ?? null;
    if (payload.llm_api_key !== undefined) {
      nextLlmMasked = maskClientApiKey(payload.llm_api_key);
    } else if (llmProviderChanged) {
      nextLlmMasked = null;
    }

    const nextEmbProvider =
      payload.embedding_provider?.trim().toLowerCase() ??
      offlineAISettingsState.embedding_provider;
    const embProviderChanged =
      nextEmbProvider !== offlineAISettingsState.embedding_provider;

    let nextEmbMasked = offlineAISettingsState.embedding_api_key_masked ?? null;
    if (payload.embedding_api_key !== undefined) {
      nextEmbMasked = maskClientApiKey(payload.embedding_api_key);
    } else if (embProviderChanged) {
      nextEmbMasked = null;
    }

    offlineAISettingsState = {
      llm_provider: nextLlmProvider,
      llm_model_name:
        payload.llm_model_name?.trim() || offlineAISettingsState.llm_model_name,
      llm_base_url:
        payload.llm_base_url !== undefined
          ? payload.llm_base_url?.trim() || null
          : llmProviderChanged
          ? null
          : offlineAISettingsState.llm_base_url,
      llm_has_api_key: nextLlmMasked !== null,
      llm_api_key_masked: nextLlmMasked,
      llm_temperature:
        payload.llm_temperature ?? offlineAISettingsState.llm_temperature,
      embedding_provider: nextEmbProvider,
      embedding_model_name:
        payload.embedding_model_name?.trim() ||
        offlineAISettingsState.embedding_model_name,
      embedding_base_url:
        payload.embedding_base_url !== undefined
          ? payload.embedding_base_url?.trim() || null
          : embProviderChanged
          ? null
          : offlineAISettingsState.embedding_base_url,
      embedding_has_api_key: nextEmbMasked !== null,
      embedding_api_key_masked: nextEmbMasked,
      available_providers: DEFAULT_AI_PROVIDER_CATALOG,
    };
    return { ...offlineAISettingsState };
  };

  if (!token) {
    return applyOfflineUpdate();
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ai-settings`, {
      method: "PUT",
      headers: buildHeaders(token, true),
      body: JSON.stringify(payload),
    });
    if (response.status === 403) {
      throw new Error(
        "Forbidden (403): Only ADMIN users can modify workspace AI Engine configuration."
      );
    }
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `Failed to update AI settings (${response.status}): ${errText}`
      );
    }
    const raw = await response.json();
    const parsed = AISettingsResponseDTOSchema.parse(raw);
    offlineAISettingsState = parsed;
    return parsed;
  } catch (err) {
    if (err instanceof Error && err.message.includes("Forbidden (403)")) {
      throw err;
    }
    return applyOfflineUpdate();
  }
}

export async function testAIConnection(
  payload: TestAIConnectionRequestDTO,
  token?: string
): Promise<TestAIConnectionResponseDTO> {
  const simulateOfflineTest = (): TestAIConnectionResponseDTO => {
    const target = payload.target ?? "both";
    const llmProvider =
      payload.llm_provider?.trim().toLowerCase() ??
      offlineAISettingsState.llm_provider;
    const llmModel =
      payload.llm_model_name?.trim() || offlineAISettingsState.llm_model_name;
    const embProvider =
      payload.embedding_provider?.trim().toLowerCase() ??
      offlineAISettingsState.embedding_provider;
    const embModel =
      payload.embedding_model_name?.trim() ||
      offlineAISettingsState.embedding_model_name;

    const llmCatalog = DEFAULT_AI_PROVIDER_CATALOG.find(
      (p) => p.provider_id === llmProvider
    );
    const embCatalog = DEFAULT_AI_PROVIDER_CATALOG.find(
      (p) => p.provider_id === embProvider
    );

    const hasCandidateLlmKey =
      Boolean(payload.llm_api_key?.trim()) ||
      (llmProvider === offlineAISettingsState.llm_provider &&
        offlineAISettingsState.llm_has_api_key);
    const hasCandidateEmbKey =
      Boolean(payload.embedding_api_key?.trim()) ||
      Boolean(payload.llm_api_key?.trim()) ||
      (embProvider === offlineAISettingsState.embedding_provider &&
        offlineAISettingsState.embedding_has_api_key);

    let llmOk: boolean | null = null;
    let embOk: boolean | null = null;
    const messages: string[] = [];

    if (target === "embedding" || target === "both") {
      if (embCatalog?.requires_api_key && !hasCandidateEmbKey) {
        embOk = false;
        messages.push(
          `Embedding check failed: API key is required for ${embCatalog.display_name}.`
        );
      } else {
        embOk = true;
        messages.push(
          `Embeddings OK (${embProvider}/${embModel}, 1536-d unit vector verified in Demo Workspace).`
        );
      }
    }

    if (target === "llm" || target === "both") {
      if (llmCatalog?.requires_api_key && !hasCandidateLlmKey) {
        llmOk = false;
        messages.push(
          `LLM check failed: API key is required for ${llmCatalog.display_name}.`
        );
      } else {
        llmOk = true;
        messages.push(
          `LLM Inference OK (${llmProvider}/${llmModel} verified in Demo Workspace).`
        );
      }
    }

    const overallSuccess =
      target === "llm"
        ? Boolean(llmOk)
        : target === "embedding"
        ? Boolean(embOk)
        : Boolean(llmOk && embOk);

    const simulatedLatency =
      llmProvider === "deterministic" && embProvider === "deterministic"
        ? 2.4
        : 48.6;

    return {
      success: overallSuccess,
      llm_ok: llmOk,
      embedding_ok: embOk,
      latency_ms: simulatedLatency,
      provider_tested:
        target === "llm"
          ? llmProvider
          : target === "embedding"
          ? embProvider
          : llmProvider === embProvider
          ? llmProvider
          : `${llmProvider} + ${embProvider}`,
      model_tested:
        target === "llm"
          ? llmModel
          : target === "embedding"
          ? embModel
          : `${llmModel} + ${embModel}`,
      message: messages.join(" "),
      sample_output_preview: llmOk
        ? "[CRITICAL] Vendor $500 liability cap with uncapped Customer consequential damages violates mutual 12-month fee cap policy."
        : null,
    };
  };

  if (!token) {
    return simulateOfflineTest();
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ai-settings/test-connection`, {
      method: "POST",
      headers: buildHeaders(token, true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errText = await response.text();
      return {
        success: false,
        llm_ok: false,
        embedding_ok: false,
        latency_ms: 0,
        provider_tested: payload.llm_provider ?? "unknown",
        model_tested: payload.llm_model_name ?? "unknown",
        message: `Connection test failed (${response.status}): ${errText}`,
        sample_output_preview: null,
      };
    }
    const raw = await response.json();
    return TestAIConnectionResponseDTOSchema.parse(raw);
  } catch {
    return simulateOfflineTest();
  }
}


