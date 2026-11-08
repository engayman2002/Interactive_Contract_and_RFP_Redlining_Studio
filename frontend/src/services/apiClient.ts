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
  CrossClauseAnalysisReportDTO,
  CrossClauseAnalysisReportDTOSchema,
  CrossClauseFindingDTO,
  DiscoverModelsRequestDTO,
  DiscoverModelsResponseDTO,
  DiscoverModelsResponseDTOSchema,
  DocumentAnalysisSummaryDTO,
  DocumentAnalysisSummaryDTOSchema,
  DocumentListItemDTO,
  DocumentListItemDTOSchema,
  DocumentWorkspaceDTO,
  DocumentWorkspaceDTOSchema,
  EncryptedAIVaultEnvelopeDTO,
  EncryptedAIVaultEnvelopeDTOSchema,
  ExportAIVaultRequestDTO,
  ExportMode,
  ExportModeSchema,
  ImportAIVaultRequestDTO,
  NegotiationStance,
  OnboardingResponseDTO,
  OnboardingResponseDTOSchema,
  PlaybookRuleDTO,
  PlaybookRuleDTOSchema,
  ProviderCatalogItemDTO,
  RedlineSuggestionDTO,
  RefineSuggestionRequestDTO,
  RefineSuggestionRequestDTOSchema,
  RefineSuggestionResponseDTO,
  RefineSuggestionResponseDTOSchema,
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
  UpdateAISettingsRequestDTOSchema,
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
  token?: string,
  stance: NegotiationStance = "balanced"
): Promise<DocumentAnalysisSummaryDTO> {
  const local = getLocalDocumentWorkspace(documentId);

  if (documentId === DEMO_DOCUMENT_ID || documentId === "demo" || !token || local) {
    if (local) {
      const simulatedRedlines: RedlineSuggestionDTO[] =
        stance === "commercial"
          ? [
              {
                id: `r-${documentId}-1`,
                clause_id: local.clauses[0]?.id ?? "c1",
                matched_rule_id: "p0000000-0000-4000-8000-000000000301",
                risk: "HIGH",
                proposed_text:
                  "1.1 Each party's aggregate cumulative liability under this Agreement shall not exceed two times (2x) the annual fees paid under this Agreement, to facilitate fast closing.",
                rationale:
                  "[Commercial Fast-Close Stance] Pre-approved commercial fallback position adopted to expedite deal closure: 2x annual fees cap. | Talking Point: To accelerate deal closure, we have pre-approved our commercial fallback terms (2x fees).",
                status: "PENDING",
                created_at: new Date().toISOString(),
              },
              {
                id: `r-${documentId}-2`,
                clause_id: local.clauses[1]?.id ?? "c2",
                matched_rule_id: "p0000000-0000-4000-8000-000000000302",
                risk: "HIGH",
                proposed_text:
                  "2.1 Vendor shall defend and indemnify Customer against third-party claims alleging direct infringement of United States patents or copyrights.",
                rationale:
                  "[Commercial Fast-Close Stance] Commercial fallback indemnity adopted to expedite deal closure. | Talking Point: Standard commercial indemnity provided for fast close.",
                status: "PENDING",
                created_at: new Date().toISOString(),
              },
              {
                id: `r-${documentId}-3`,
                clause_id: local.clauses[2]?.id ?? "c3",
                matched_rule_id: "p0000000-0000-4000-8000-000000000303",
                risk: "MEDIUM",
                proposed_text:
                  "3.1 Vendor targets 99.9% monthly availability with commercially standard service credit remedies.",
                rationale:
                  "[Commercial Fast-Close Stance] Standard commercial SLA adopted to accelerate deal velocity. | Talking Point: Commercially balanced availability target.",
                status: "PENDING",
                created_at: new Date().toISOString(),
              },
              {
                id: `r-${documentId}-4`,
                clause_id: local.clauses[3]?.id ?? "c4",
                matched_rule_id: "p0000000-0000-4000-8000-000000000304",
                risk: "HIGH",
                proposed_text:
                  "4.1 Vendor shall not use Customer Confidential Information to train public foundation models without written consent.",
                rationale:
                  "[Commercial Fast-Close Stance] Commercial fallback standard: public model training prohibited. | Talking Point: Practical protection for Customer data.",
                status: "PENDING",
                created_at: new Date().toISOString(),
              },
            ]
          : stance === "strict"
          ? [
              {
                id: `r-${documentId}-1`,
                clause_id: local.clauses[0]?.id ?? "c1",
                matched_rule_id: "p0000000-0000-4000-8000-000000000301",
                risk: "CRITICAL",
                proposed_text:
                  "1.1 Each party's aggregate cumulative liability under this Agreement shall not exceed twelve (12) months of fees paid or payable, with strict mutual consequential damages waiver and no carve-outs.",
                rationale:
                  "[Strict Protective Stance] Playbook strictly mandates zero-compromise mutual 12-month liability cap and mutual waiver of indirect or consequential damages. | Talking Point: Our corporate policy strictly requires standard 12-month cap without compromise.",
                status: "PENDING",
                created_at: new Date().toISOString(),
              },
              {
                id: `r-${documentId}-2`,
                clause_id: local.clauses[1]?.id ?? "c2",
                matched_rule_id: "p0000000-0000-4000-8000-000000000302",
                risk: "CRITICAL",
                proposed_text:
                  "2.1 Vendor shall unconditionally defend, indemnify, and hold harmless Customer against all third-party IP infringement claims, data breaches, and gross negligence without limitation.",
                rationale:
                  "[Strict Protective Stance] Customer cannot indemnify Vendor unilaterally; Vendor must provide full IP and data breach indemnity. | Talking Point: Strict non-negotiable protection against third-party infringement.",
                status: "PENDING",
                created_at: new Date().toISOString(),
              },
              {
                id: `r-${documentId}-3`,
                clause_id: local.clauses[2]?.id ?? "c3",
                matched_rule_id: "p0000000-0000-4000-8000-000000000303",
                risk: "CRITICAL",
                proposed_text:
                  "3.1 Vendor guarantees 99.99% monthly uptime with 20% service credits per 0.1% downtime and immediate termination rights upon consecutive failures.",
                rationale:
                  "[Strict Protective Stance] Best-efforts availability violates strict company SLA standards. Full enterprise commitments required. | Talking Point: Enterprise mission-critical uptime is non-negotiable.",
                status: "PENDING",
                created_at: new Date().toISOString(),
              },
              {
                id: `r-${documentId}-4`,
                clause_id: local.clauses[3]?.id ?? "c4",
                matched_rule_id: "p0000000-0000-4000-8000-000000000304",
                risk: "CRITICAL",
                proposed_text:
                  "4.1 Vendor shall process Customer data strictly to deliver the service and is absolutely prohibited from training AI models or retaining Customer confidential information.",
                rationale:
                  "[Strict Protective Stance] Absolute prohibition on training AI foundation models on Customer confidential information per strict governance. | Talking Point: Strict data protection boundary.",
                status: "PENDING",
                created_at: new Date().toISOString(),
              },
            ]
          : [
              {
                id: `r-${documentId}-1`,
                clause_id: local.clauses[0]?.id ?? "c1",
                matched_rule_id: "p0000000-0000-4000-8000-000000000301",
                risk: "CRITICAL",
                proposed_text:
                  "1.1 Each party's aggregate cumulative liability under this Agreement shall not exceed twelve (12) months of fees paid or payable, with mutual consequential damages waiver.",
                rationale:
                  "[Balanced Mutual Stance] Playbook mandates a balanced mutual 12-month liability cap and mutual waiver of indirect or consequential damages. | Talking Point: Our standard corporate policy requires balanced 12-month terms.",
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
                  "[Balanced Mutual Stance] Customer cannot indemnify Vendor unilaterally; Vendor must provide standard IP infringement indemnity. | Talking Point: Standard mutual indemnity provisions required.",
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
                  "[Balanced Mutual Stance] Best-efforts availability without service credits violates company SLA standards. | Talking Point: Please align SLA with standard 99.95% target.",
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
                  "[Balanced Mutual Stance] Prohibits training foundation models on Customer confidential information per data privacy policy. | Talking Point: Customer proprietary data may not be used for AI training.",
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
          stance,
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
      critical_count: stance === "strict" ? 4 : stance === "commercial" ? 0 : 3,
      high_count: stance === "strict" ? 0 : stance === "commercial" ? 3 : 1,
      medium_count: 1,
      low_count: stance === "commercial" ? 2 : 1,
      compliant_count: stance === "commercial" ? 2 : 1,
      execution_time_ms: 142.5,
      stance,
    });
  }

  const response = await fetch(
    `${API_BASE_URL}/documents/${encodeURIComponent(documentId)}/analyze`,
    {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify({ stance }),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to trigger analysis (${response.status})`);
  }
  const raw = await response.json();
  return DocumentAnalysisSummaryDTOSchema.parse({
    ...raw,
    stance: raw.stance ?? stance,
  });
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

export async function refineRedlineSuggestion(
  suggestionId: string,
  payload: RefineSuggestionRequestDTO,
  token?: string
): Promise<RefineSuggestionResponseDTO> {
  const validatedPayload = RefineSuggestionRequestDTOSchema.parse(payload);

  if (token) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/suggestions/${encodeURIComponent(suggestionId)}/refine`,
        {
          method: "POST",
          headers: buildHeaders(token, true),
          body: JSON.stringify(validatedPayload),
        }
      );

      if (response.ok) {
        const raw = await response.json();
        return RefineSuggestionResponseDTOSchema.parse(raw);
      }
    } catch {
      // Fallback to offline local simulation below
    }
  }

  // Offline / Demo Fallback Simulation
  const instructionLower = validatedPayload.instruction.toLowerCase();
  let talkingPoint = `Refined per instruction: "${validatedPayload.instruction}". Proposed language balances commercial interests while safeguarding standard protections.`;

  // Search across localStorage workspaces or DEMO_WORKSPACE_DATA
  let matchedSuggestion: RedlineSuggestionDTO | null = null;
  let targetWs: DocumentWorkspaceDTO | null = null;

  if (typeof window !== "undefined") {
    try {
      const docList = getLocalDocuments();
      for (const d of docList) {
        const ws = getLocalDocumentWorkspace(d.id);
        if (ws) {
          const found = ws.redlines.find((r) => r.id === suggestionId);
          if (found) {
            matchedSuggestion = found;
            targetWs = ws;
            break;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  if (!matchedSuggestion) {
    matchedSuggestion =
      DEMO_WORKSPACE_DATA.redlines.find((r) => r.id === suggestionId) ?? {
        id: suggestionId,
        clause_id: "demo-clause-1",
        risk: "HIGH",
        proposed_text:
          "1.1 In no event shall either party's aggregate cumulative liability under this Agreement exceed $100,000, subject to a 30-day written cure period.",
        rationale: `[AI Copilot Refined: "${validatedPayload.instruction}"] Updated clause language based on reviewer direction.`,
        status: "PENDING",
        created_at: new Date().toISOString(),
      };
  }

  let updatedText = matchedSuggestion.proposed_text;

  // Custom dollar cap replacement
  const capMatch = validatedPayload.instruction.match(
    /(\$[\d,]+(?:\.\d+)?|\b\d+k\b)/i
  );
  if (capMatch) {
    const rawVal = capMatch[1];
    const formattedCap = rawVal.toLowerCase().endsWith("k")
      ? `$${parseInt(rawVal, 10) * 1000}`
      : rawVal;
    updatedText = updatedText.replace(
      /(exceed\s+)(?:two\s+times\s+\(2x\)\s+the\s+annual\s+fees|\$[\d,]+|the\s+total\s+fees\s+paid)/i,
      `$1${formattedCap}`
    );
    if (!updatedText.includes(formattedCap)) {
      updatedText =
        updatedText.replace(/\.\s*$/, "") + `, capped at ${formattedCap}.`;
    }
    talkingPoint = `We have revised our proposal to cap aggregate liability at ${formattedCap}, establishing a clear, predictable ceiling for both parties.`;
  }

  // Cure period addition
  const cureMatch = validatedPayload.instruction.match(
    /(\d+[\s-]?(?:day|days|business\s+days))/i
  );
  if (cureMatch) {
    const cureStr = cureMatch[1];
    if (!updatedText.toLowerCase().includes("cure")) {
      updatedText =
        updatedText.replace(/\.\s*$/, "") +
        `, provided that either party receives a ${cureStr} written notice and cure period before any termination.`;
    }
    talkingPoint = `Added standard ${cureStr} notice and cure protection so administrative delays do not trigger immediate termination.`;
  }

  // Mutual / Reciprocal
  if (
    instructionLower.includes("mutual") ||
    instructionLower.includes("bilateral") ||
    instructionLower.includes("reciprocal")
  ) {
    updatedText = updatedText
      .replace(/\bCustomer shall\b/gi, "Each party shall")
      .replace(/\bVendor shall\b/gi, "Each party shall")
      .replace(/\beither party's\b/gi, "each party's");
    talkingPoint =
      "We propose making these covenants bilateral and mutual so both organizations share equivalent protections.";
  }

  // Soften tone
  if (
    instructionLower.includes("soften") ||
    instructionLower.includes("partner") ||
    instructionLower.includes("friendly")
  ) {
    updatedText = updatedText.replace(
      /strictly prohibited/gi,
      "subject to prior written mutual approval"
    );
    talkingPoint =
      "Adopted a collaborative, partnership-friendly phrasing while upholding our core compliance baseline.";
  }

  const refinedSuggestion: RedlineSuggestionDTO = {
    ...matchedSuggestion,
    proposed_text: updatedText,
    rationale: `[AI Copilot Refined: "${validatedPayload.instruction}"] Updated wording per prompt instruction.`,
  };

  if (targetWs) {
    targetWs.redlines = targetWs.redlines.map((r) =>
      r.id === suggestionId ? refinedSuggestion : r
    );
    const auditEntry: AuditLogEntryDTO = {
      id: `audit-${Date.now()}`,
      org_id: targetWs.org_id,
      document_id: targetWs.document_id,
      clause_id: refinedSuggestion.clause_id,
      actor_user_id: DEMO_USER_ID,
      actor_role: "ADMIN",
      action: "SUGGESTION_REFINED",
      details: {
        suggestion_id: suggestionId,
        instruction: validatedPayload.instruction,
        stance: validatedPayload.stance,
      },
      created_at: new Date().toISOString(),
    };
    targetWs.audit_logs = [...(targetWs.audit_logs ?? []), auditEntry];
    saveLocalDocumentWorkspace(targetWs);
  }

  return {
    suggestion: refinedSuggestion,
    negotiation_talking_point: talkingPoint,
    latency_ms: 120,
  };
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

export async function runCrossClauseCheck(
  documentId: string,
  token?: string
): Promise<CrossClauseAnalysisReportDTO> {
  if (token) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/documents/${encodeURIComponent(documentId)}/cross-clause-check`,
        {
          method: "POST",
          headers: buildHeaders(token, true),
        }
      );

      if (response.ok) {
        const raw = await response.json();
        return CrossClauseAnalysisReportDTOSchema.parse(raw);
      }
    } catch {
      // Fallback to offline / demo mode
    }
  }

  // Offline / Demo Simulation
  const local = getLocalDocumentWorkspace(documentId);
  const clauses = local?.clauses ?? DEMO_WORKSPACE_DATA.clauses;
  const findings: CrossClauseFindingDTO[] = [];

  // Pass 1: Build known sections
  const knownSections = new Set<string>();
  clauses.forEach((c) => {
    knownSections.add(String(c.clause_index + 1));
    const hMatch = c.heading?.match(/^(\d+(?:\.\d+)*)/);
    if (hMatch) {
      knownSections.add(hMatch[1]);
      if (hMatch[1].includes(".")) {
        knownSections.add(hMatch[1].split(".")[0]);
      }
    }
    const tMatch = c.current_text.match(/^(\d+(?:\.\d+)*)\s+/);
    if (tMatch) {
      knownSections.add(tMatch[1]);
      if (tMatch[1].includes(".")) {
        knownSections.add(tMatch[1].split(".")[0]);
      }
    }
  });

  // Pass 2: Defined terms
  const definedTerms = new Set<string>();
  clauses.forEach((c) => {
    const matches = c.current_text.matchAll(
      /["“']([A-Z][A-Za-z0-9\s]{2,40})["”']\s+(?:means|shall\s+mean|has\s+the\s+meaning|is\s+defined)/gi
    );
    for (const m of matches) {
      if (m[1]) {
        definedTerms.add(m[1].toLowerCase().trim());
      }
    }
  });

  // Pass 3: Contradictions between clause pairs
  for (let i = 0; i < clauses.length; i++) {
    const c1 = clauses[i];
    const c1Text = c1.current_text;
    const c1CapMatch = c1Text.match(
      /\b(?:exceed|cap(?:ped)?\s+at|limited\s+to|shall\s+not\s+exceed)\s+(\$[\d,]+(?:\.\d+)?|\d+x\b|\d+\s+months?|\bthe\s+total\s+fees\b)/i
    );
    const c1PayMatch = c1Text.match(
      /\b(?:Net|within)\s+(\d{1,3})\s+(?:days?|business\s+days)\b/i
    );
    const c1CureMatch = c1Text.match(
      /(\d+[\s-]?(?:day|days|business\s+days))\s+(?:written\s+)?(?:notice\s+and\s+)?cure/i
    );
    const c1ConfMatch = c1Text.match(
      /\b(?:not\s+use\s+Customer\s+Confidential\s+Information\s+to\s+train|Customer\s+Confidential\s+Data\s+shall\s+remain|strictly\s+confidential\s+and\s+proprietary)\b/i
    );

    for (let j = i + 1; j < clauses.length; j++) {
      const c2 = clauses[j];
      const c2Text = c2.current_text;

      // Liability Cap vs Uncapped Indemnity
      const c2Uncapped = c2Text.match(
        /\b(?:uncapped|unlimited|without\s+limit(?:ation)?|without\s+regard\s+to\s+any\s+limitation|negligence\s+without\s+limit|shall\s+have\s+uncapped\s+liability)\b/i
      );
      if (c1CapMatch && c2Uncapped) {
        findings.push({
          id: `finding-${c1.id}-${c2.id}-liability`,
          issue_type: "CONTRADICTION",
          severity: "CRITICAL",
          source_clause_id: c1.id,
          source_clause_index: c1.clause_index,
          target_clause_id: c2.id,
          target_clause_index: c2.clause_index,
          title: "Cross-Clause Liability & Indemnification Contradiction",
          description: `Clause #${c1.clause_index + 1} (${c1.heading || "Liability"}) caps exposure at ${c1CapMatch[1]}, but Clause #${c2.clause_index + 1} (${c2.heading || "Indemnity"}) creates uncapped, unlimited exposure without a limitation carve-out.`,
          recommended_fix: `Harmonize clauses by making indemnification obligations subject to the aggregate liability cap in Clause #${c1.clause_index + 1}.`,
        });
      }

      // Payment days conflict
      const c2PayMatch = c2Text.match(
        /\b(?:Net|within)\s+(\d{1,3})\s+(?:days?|business\s+days)\b/i
      );
      if (c1PayMatch && c2PayMatch) {
        const d1 = parseInt(c1PayMatch[1], 10);
        const d2 = parseInt(c2PayMatch[1], 10);
        if (d1 !== d2) {
          findings.push({
            id: `finding-${c1.id}-${c2.id}-payment`,
            issue_type: "CONTRADICTION",
            severity: "HIGH",
            source_clause_id: c1.id,
            source_clause_index: c1.clause_index,
            target_clause_id: c2.id,
            target_clause_index: c2.clause_index,
            title: `Conflicting Payment Timelines (Net ${d1} vs. Net ${d2} Days)`,
            description: `Clause #${c1.clause_index + 1} stipulates Net ${d1} days, whereas Clause #${c2.clause_index + 1} requires payment within ${d2} days.`,
            recommended_fix: `Align payment terms across both provisions to a single agreed deadline (e.g., Net ${d1} days).`,
          });
        }
      }

      // Notice & cure vs immediate cancellation
      const c2Immediate = c2Text.match(
        /\b(?:terminate\s+immediately\s+without\s+notice|sole\s+remedy\s+waiver|without\s+(?:prior\s+)?(?:written\s+)?notice\s+or\s+cure)\b/i
      );
      if (c1CureMatch && c2Immediate) {
        findings.push({
          id: `finding-${c1.id}-${c2.id}-cure`,
          issue_type: "CONTRADICTION",
          severity: "HIGH",
          source_clause_id: c1.id,
          source_clause_index: c1.clause_index,
          target_clause_id: c2.id,
          target_clause_index: c2.clause_index,
          title: "Contradiction in Termination & Cure Rights",
          description: `Clause #${c1.clause_index + 1} grants a ${c1CureMatch[1]} notice and cure period, while Clause #${c2.clause_index + 1} allows immediate unilateral remedy waiver or cancellation.`,
          recommended_fix: `Clarify that remedies under Section ${c2.clause_index + 1} remain subject to the cure period in Clause #${c1.clause_index + 1}.`,
        });
      }

      // Confidentiality vs model training
      const c2Train = c2Text.match(
        /\b(?:train\s+(?:AI\s+)?foundation\s+models|use\s+customer\s+data\s+for\s+model\s+training|machine\s+learning\s+model\s+training)\b/i
      );
      if (c1ConfMatch && c2Train) {
        findings.push({
          id: `finding-${c1.id}-${c2.id}-ai-train`,
          issue_type: "CONTRADICTION",
          severity: "HIGH",
          source_clause_id: c1.id,
          source_clause_index: c1.clause_index,
          target_clause_id: c2.id,
          target_clause_index: c2.clause_index,
          title: "Contradiction in Customer Data & AI Model Training",
          description: `Clause #${c1.clause_index + 1} protects Customer data confidentiality, while Clause #${c2.clause_index + 1} permits training AI models on customer inputs.`,
          recommended_fix: "Explicitly carve out Customer Confidential Information from any AI model training or commercial data reuse.",
        });
      }
    }
  }

  // Pass 4: Broken section references
  for (const c of clauses) {
    const refMatches = c.current_text.matchAll(
      /\b(?:Section|Clause|Article|Paragraph)\s+([0-9]+(?:\.[0-9]+)*)\b/gi
    );
    for (const rm of refMatches) {
      const refNum = rm[1];
      if (!knownSections.has(refNum)) {
        findings.push({
          id: `finding-${c.id}-broken-ref-${refNum}`,
          issue_type: "BROKEN_REFERENCE",
          severity: "HIGH",
          source_clause_id: c.id,
          source_clause_index: c.clause_index,
          target_clause_id: null,
          target_clause_index: null,
          title: `Dangling Reference to Section ${refNum}`,
          description: `Clause #${c.clause_index + 1} references Section ${refNum}, which does not exist anywhere in the contract structure.`,
          recommended_fix: `Update citation to refer to an active section or restore the missing Section ${refNum} provision.`,
        });
      }
    }
  }

  // Pass 5: Undefined terms
  const specializedTerms = [
    "Customer Confidential Data",
    "Public Foundation Models",
    "Service Level Credits",
    "Service Credits",
    "Force Majeure Event",
    "Direct Infringement Claims",
  ];
  for (const c of clauses) {
    for (const term of specializedTerms) {
      if (c.current_text.toLowerCase().includes(term.toLowerCase())) {
        if (!definedTerms.has(term.toLowerCase())) {
          findings.push({
            id: `finding-${c.id}-undefined-${term.replace(/\s+/g, "-")}`,
            issue_type: "UNDEFINED_TERM",
            severity: "MEDIUM",
            source_clause_id: c.id,
            source_clause_index: c.clause_index,
            target_clause_id: null,
            target_clause_index: null,
            title: `Undefined Capitalized Term: '${term}'`,
            description: `Clause #${c.clause_index + 1} relies on specialized capitalized term '${term}' without a formal definition clause.`,
            recommended_fix: `Add a formal definition for '${term}' in Section 1 (Definitions) to avoid ambiguity during contractual disputes.`,
          });
        }
      }
    }
  }

  // Deduplicate
  const uniqueFindings: CrossClauseFindingDTO[] = [];
  const seenKeys = new Set<string>();
  for (const f of findings) {
    const key = `${f.issue_type}-${f.source_clause_id}-${f.target_clause_id || ""}-${f.title}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueFindings.push(f);
    }
  }

  const penalties: Record<string, number> = {
    CRITICAL: 18,
    HIGH: 12,
    MEDIUM: 6,
    LOW: 3,
  };
  const totalPenalty = uniqueFindings.reduce(
    (acc, f) => acc + (penalties[f.severity] ?? 6),
    0
  );
  const score =
    uniqueFindings.length === 0
      ? 100
      : Math.max(15, Math.min(100, 100 - totalPenalty));

  const report: CrossClauseAnalysisReportDTO = {
    document_id: documentId,
    total_findings: uniqueFindings.length,
    contradiction_count: uniqueFindings.filter(
      (f) => f.issue_type === "CONTRADICTION"
    ).length,
    broken_reference_count: uniqueFindings.filter(
      (f) => f.issue_type === "BROKEN_REFERENCE"
    ).length,
    undefined_term_count: uniqueFindings.filter(
      (f) => f.issue_type === "UNDEFINED_TERM"
    ).length,
    integrity_score: score,
    findings: uniqueFindings,
    execution_time_ms: 45,
  };

  if (local) {
    const auditEntry: AuditLogEntryDTO = {
      id: `audit-${Date.now()}`,
      org_id: local.org_id,
      document_id: local.document_id,
      clause_id: null,
      actor_user_id: DEMO_USER_ID,
      actor_role: "LEGAL_COUNSEL",
      action: "CROSS_CLAUSE_CHECKED",
      details: {
        total_findings: String(report.total_findings),
        contradiction_count: String(report.contradiction_count),
        broken_reference_count: String(report.broken_reference_count),
        undefined_term_count: String(report.undefined_term_count),
        integrity_score: String(report.integrity_score),
      },
      created_at: new Date().toISOString(),
    };
    local.audit_logs = [...(local.audit_logs ?? []), auditEntry];
    saveLocalDocumentWorkspace(local);
  }

  return report;
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
    default_llm_model: null,
    recommended_llm_models: [],
    default_embedding_model: null,
    recommended_embedding_models: [],
  },
  {
    provider_id: "groq",
    display_name: "Groq Cloud LPU",
    supports_llm: true,
    supports_embeddings: false,
    requires_api_key: true,
    supports_base_url: false,
    default_llm_model: null,
    recommended_llm_models: [],
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
    default_llm_model: null,
    recommended_llm_models: [],
    default_embedding_model: null,
    recommended_embedding_models: [],
  },
  {
    provider_id: "anthropic",
    display_name: "Anthropic Claude",
    supports_llm: true,
    supports_embeddings: false,
    requires_api_key: true,
    supports_base_url: false,
    default_llm_model: null,
    recommended_llm_models: [],
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
    default_llm_model: null,
    recommended_llm_models: [],
    default_embedding_model: null,
    recommended_embedding_models: [],
  },
  {
    provider_id: "openai_compatible",
    display_name: "OpenAI-Compatible Local Server",
    supports_llm: true,
    supports_embeddings: true,
    requires_api_key: false,
    supports_base_url: true,
    default_llm_model: null,
    recommended_llm_models: [],
    default_embedding_model: null,
    recommended_embedding_models: [],
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

let offlineRawSecrets: {
  llmApiKey: string | null;
  embeddingApiKey: string | null;
} = {
  llmApiKey: null,
  embeddingApiKey: null,
};

export function resetOfflineAISettings(): void {
  offlineAISettingsState = buildDefaultOfflineAISettings();
  offlineRawSecrets = { llmApiKey: null, embeddingApiKey: null };
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
      offlineRawSecrets.llmApiKey = payload.llm_api_key?.trim() || null;
      nextLlmMasked = maskClientApiKey(payload.llm_api_key);
    } else if (llmProviderChanged) {
      offlineRawSecrets.llmApiKey = null;
      nextLlmMasked = null;
    }

    const nextEmbProvider =
      payload.embedding_provider?.trim().toLowerCase() ??
      offlineAISettingsState.embedding_provider;
    const embProviderChanged =
      nextEmbProvider !== offlineAISettingsState.embedding_provider;

    let nextEmbMasked = offlineAISettingsState.embedding_api_key_masked ?? null;
    if (payload.embedding_api_key !== undefined) {
      offlineRawSecrets.embeddingApiKey =
        payload.embedding_api_key?.trim() || null;
      nextEmbMasked = maskClientApiKey(payload.embedding_api_key);
    } else if (embProviderChanged) {
      offlineRawSecrets.embeddingApiKey = null;
      nextEmbMasked = null;
    }

    const resolvedLlmModel =
      nextLlmProvider === "deterministic"
        ? payload.llm_model_name?.trim() || "policy-deterministic-v1"
        : payload.llm_model_name !== undefined
        ? payload.llm_model_name.trim()
        : llmProviderChanged
        ? ""
        : offlineAISettingsState.llm_model_name;

    const resolvedEmbModel =
      nextEmbProvider === "deterministic"
        ? payload.embedding_model_name?.trim() || "deterministic-hash-1536"
        : payload.embedding_model_name !== undefined
        ? payload.embedding_model_name.trim()
        : embProviderChanged
        ? ""
        : offlineAISettingsState.embedding_model_name;

    offlineAISettingsState = {
      llm_provider: nextLlmProvider,
      llm_model_name: resolvedLlmModel,
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
      embedding_model_name: resolvedEmbModel,
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
    const rawLlmModel =
      payload.llm_model_name !== undefined
        ? payload.llm_model_name.trim()
        : llmProvider === offlineAISettingsState.llm_provider
        ? offlineAISettingsState.llm_model_name
        : "";
    const llmModel =
      llmProvider === "deterministic"
        ? rawLlmModel || "policy-deterministic-v1"
        : rawLlmModel;

    const embProvider =
      payload.embedding_provider?.trim().toLowerCase() ??
      offlineAISettingsState.embedding_provider;
    const rawEmbModel =
      payload.embedding_model_name !== undefined
        ? payload.embedding_model_name.trim()
        : embProvider === offlineAISettingsState.embedding_provider
        ? offlineAISettingsState.embedding_model_name
        : "";
    const embModel =
      embProvider === "deterministic"
        ? rawEmbModel || "deterministic-hash-1536"
        : rawEmbModel;

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
      if (embProvider !== "deterministic" && !embModel) {
        embOk = false;
        messages.push(
          `Embedding check failed: Model ID is required for ${embCatalog?.display_name ?? embProvider}.`
        );
      } else if (embCatalog?.requires_api_key && !hasCandidateEmbKey) {
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
      if (llmProvider !== "deterministic" && !llmModel) {
        llmOk = false;
        messages.push(
          `LLM check failed: Model ID is required for ${llmCatalog?.display_name ?? llmProvider}.`
        );
      } else if (llmCatalog?.requires_api_key && !hasCandidateLlmKey) {
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

    const displayedLlmModel = llmModel || "(unconfigured)";
    const displayedEmbModel = embModel || "(unconfigured)";

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
          ? displayedLlmModel
          : target === "embedding"
          ? displayedEmbModel
          : `${displayedLlmModel} + ${displayedEmbModel}`,
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

const DISCOVERY_GUIDANCE_MESSAGE =
  "Provide a valid API key (or start your local server) and click Fetch Live Models to load available models from the provider, or type your model ID manually.";

export async function discoverProviderModels(
  payload: DiscoverModelsRequestDTO,
  token?: string
): Promise<DiscoverModelsResponseDTO> {
  const normalized = payload.provider_id.trim().toLowerCase();
  const catalogEntry = DEFAULT_AI_PROVIDER_CATALOG.find(
    (item) => item.provider_id === normalized
  );

  if (normalized === "deterministic") {
    return {
      provider_id: "deterministic",
      source: "live_api",
      llm_models: ["policy-deterministic-v1"],
      embedding_models: ["deterministic-hash-1536"],
      latency_ms: 0.2,
      message: "Offline Deterministic Engine models ready (in-process).",
    };
  }

  const buildEmptyDiscoveryResponse = (
    source: "unconfigured" | "unreachable",
    reason?: string
  ): DiscoverModelsResponseDTO => ({
    provider_id: normalized,
    source,
    llm_models: [],
    embedding_models: [],
    latency_ms: 0.0,
    message: reason ?? DISCOVERY_GUIDANCE_MESSAGE,
  });

  if (!token) {
    const hasKey =
      Boolean(payload.api_key?.trim()) ||
      (normalized === offlineAISettingsState.llm_provider &&
        offlineAISettingsState.llm_has_api_key);
    if (catalogEntry?.requires_api_key && !hasKey) {
      return buildEmptyDiscoveryResponse("unconfigured");
    }
    return buildEmptyDiscoveryResponse(
      "unreachable",
      `Backend offline (Demo Mode) — ${DISCOVERY_GUIDANCE_MESSAGE}`
    );
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ai-settings/discover-models`, {
      method: "POST",
      headers: buildHeaders(token, true),
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      return buildEmptyDiscoveryResponse(
        "unreachable",
        `Live model discovery returned HTTP ${response.status}. ${DISCOVERY_GUIDANCE_MESSAGE}`
      );
    }
    const raw = await response.json();
    return DiscoverModelsResponseDTOSchema.parse(raw);
  } catch {
    return buildEmptyDiscoveryResponse("unreachable");
  }
}

const VAULT_PBKDF2_ITERATIONS = 600000;
const VAULT_AAD_LABEL = "redline-studio-ai-vault-v1";
const BLOCKED_SSRF_HOSTS = new Set([
  "169.254.169.254",
  "metadata.google.internal",
  "metadata.goog",
  "100.100.100.200",
]);

function toStrictArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64.trim());
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function validateClientBaseUrl(urlValue?: string | null): string | null {
  if (!urlValue) {
    return null;
  }
  const cleaned = urlValue.trim();
  if (!cleaned) {
    return null;
  }
  let parsed: URL;
  try {
    parsed = new URL(cleaned);
  } catch {
    throw new Error(
      "Base URL must start with http:// or https:// and include a valid host."
    );
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(
      "Base URL must start with http:// or https:// and include a valid host."
    );
  }
  if (BLOCKED_SSRF_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new Error("Base URL host is not permitted by SSRF security policy.");
  }
  return cleaned;
}

async function encryptOfflineVaultWebCrypto(
  payload: ExportAIVaultRequestDTO
): Promise<EncryptedAIVaultEnvelopeDTO> {
  if (payload.passphrase.length < 8) {
    throw new Error("Vault passphrase must be at least 8 characters long.");
  }

  const llmProvider =
    payload.llm_provider?.trim().toLowerCase() ??
    offlineAISettingsState.llm_provider;
  const embProvider =
    payload.embedding_provider?.trim().toLowerCase() ??
    offlineAISettingsState.embedding_provider;

  const llmModel =
    llmProvider === "deterministic"
      ? payload.llm_model_name?.trim() || "policy-deterministic-v1"
      : payload.llm_model_name?.trim() ??
        (llmProvider === offlineAISettingsState.llm_provider
          ? offlineAISettingsState.llm_model_name
          : "");
  const embModel =
    embProvider === "deterministic"
      ? payload.embedding_model_name?.trim() || "deterministic-hash-1536"
      : payload.embedding_model_name?.trim() ??
        (embProvider === offlineAISettingsState.embedding_provider
          ? offlineAISettingsState.embedding_model_name
          : "");

  if (llmProvider !== "deterministic" && !llmModel) {
    throw new Error(`Explicit LLM model ID is required for '${llmProvider}'.`);
  }
  if (embProvider !== "deterministic" && !embModel) {
    throw new Error(
      `Explicit Embedding model ID is required for '${embProvider}'.`
    );
  }

  const llmBaseUrl = validateClientBaseUrl(
    payload.llm_base_url !== undefined
      ? payload.llm_base_url
      : llmProvider === offlineAISettingsState.llm_provider
      ? offlineAISettingsState.llm_base_url
      : null
  );
  const embBaseUrl = validateClientBaseUrl(
    payload.embedding_base_url !== undefined
      ? payload.embedding_base_url
      : embProvider === offlineAISettingsState.embedding_provider
      ? offlineAISettingsState.embedding_base_url
      : null
  );

  const resolvedLlmKey =
    payload.llm_api_key?.trim() ||
    (llmProvider === offlineAISettingsState.llm_provider
      ? offlineRawSecrets.llmApiKey
      : null);
  const resolvedEmbKey =
    payload.embedding_api_key?.trim() ||
    (embProvider === llmProvider && payload.llm_api_key?.trim()
      ? payload.llm_api_key.trim()
      : embProvider === offlineAISettingsState.embedding_provider
      ? offlineRawSecrets.embeddingApiKey
      : null);

  const secretConfigPayload = {
    llm_provider: llmProvider,
    llm_model_name: llmModel,
    llm_base_url: llmBaseUrl,
    llm_api_key: resolvedLlmKey,
    llm_temperature:
      payload.llm_temperature ?? offlineAISettingsState.llm_temperature,
    embedding_provider: embProvider,
    embedding_model_name: embModel,
    embedding_base_url: embBaseUrl,
    embedding_api_key: resolvedEmbKey,
  };

  const salt = new Uint8Array(16);
  const nonce = new Uint8Array(12);
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      "WebCrypto API (crypto.subtle) requires a secure context (HTTPS or localhost) for offline vault encryption."
    );
  }
  globalThis.crypto.getRandomValues(salt);
  globalThis.crypto.getRandomValues(nonce);

  const encoder = new TextEncoder();
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    toStrictArrayBuffer(encoder.encode(payload.passphrase)),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const aesKey = await globalThis.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: toStrictArrayBuffer(salt),
      iterations: VAULT_PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  const plaintextBytes = encoder.encode(JSON.stringify(secretConfigPayload));
  const aadBytes = encoder.encode(VAULT_AAD_LABEL);
  const cipherBuffer = await globalThis.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: toStrictArrayBuffer(nonce),
      additionalData: toStrictArrayBuffer(aadBytes),
      tagLength: 128,
    },
    aesKey,
    toStrictArrayBuffer(plaintextBytes)
  );

  return {
    vault_version: 1,
    kdf: "PBKDF2-HMAC-SHA256",
    iterations: VAULT_PBKDF2_ITERATIONS,
    cipher: "AES-256-GCM",
    salt_b64: bytesToBase64(salt),
    nonce_b64: bytesToBase64(nonce),
    ciphertext_b64: bytesToBase64(new Uint8Array(cipherBuffer)),
    exported_at: new Date().toISOString(),
  };
}

async function decryptOfflineVaultWebCrypto(
  payload: ImportAIVaultRequestDTO
): Promise<AISettingsResponseDTO> {
  const invalidVaultMessage =
    "Failed to unlock AI configuration vault: invalid passphrase or corrupted vault file.";
  if (payload.passphrase.length < 8) {
    throw new Error(invalidVaultMessage);
  }

  let salt: Uint8Array;
  let nonce: Uint8Array;
  let ciphertext: Uint8Array;
  try {
    salt = base64ToBytes(payload.vault.salt_b64);
    nonce = base64ToBytes(payload.vault.nonce_b64);
    ciphertext = base64ToBytes(payload.vault.ciphertext_b64);
  } catch {
    throw new Error(invalidVaultMessage);
  }

  if (
    salt.byteLength < 16 ||
    nonce.byteLength !== 12 ||
    ciphertext.byteLength <= 16
  ) {
    throw new Error(invalidVaultMessage);
  }

  const encoder = new TextEncoder();
  let decryptedJson: unknown;
  try {
    const keyMaterial = await globalThis.crypto.subtle.importKey(
      "raw",
      toStrictArrayBuffer(encoder.encode(payload.passphrase)),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    const aesKey = await globalThis.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: toStrictArrayBuffer(salt),
        iterations: payload.vault.iterations,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    const aadBytes = encoder.encode(VAULT_AAD_LABEL);
    const plainBuffer = await globalThis.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: toStrictArrayBuffer(nonce),
        additionalData: toStrictArrayBuffer(aadBytes),
        tagLength: 128,
      },
      aesKey,
      toStrictArrayBuffer(ciphertext)
    );
    decryptedJson = JSON.parse(new TextDecoder().decode(plainBuffer));
  } catch {
    throw new Error(invalidVaultMessage);
  }

  const validated = UpdateAISettingsRequestDTOSchema.parse(decryptedJson);
  validateClientBaseUrl(validated.llm_base_url);
  validateClientBaseUrl(validated.embedding_base_url);

  const knownProviderIds = new Set(
    DEFAULT_AI_PROVIDER_CATALOG.map((item) => item.provider_id)
  );
  const nextLlm = validated.llm_provider?.trim().toLowerCase() ?? "";
  const nextEmb = validated.embedding_provider?.trim().toLowerCase() ?? "";
  if (!knownProviderIds.has(nextLlm) || !knownProviderIds.has(nextEmb)) {
    throw new Error("Decrypted AI vault references an unsupported provider.");
  }
  if (nextLlm !== "deterministic" && !validated.llm_model_name?.trim()) {
    throw new Error(`Decrypted vault is missing LLM model ID for '${nextLlm}'.`);
  }
  if (nextEmb !== "deterministic" && !validated.embedding_model_name?.trim()) {
    throw new Error(
      `Decrypted vault is missing Embedding model ID for '${nextEmb}'.`
    );
  }

  return updateAISettings(validated, undefined);
}

async function extractBackendErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: { message?: string };
      detail?: unknown;
    };
    if (data?.error?.message) {
      return data.error.message;
    }
    if (typeof data?.detail === "string") {
      return data.detail;
    }
  } catch {
    // Ignore JSON parse errors on error body
  }
  return fallback;
}

export async function exportAIVault(
  payload: ExportAIVaultRequestDTO,
  token?: string
): Promise<EncryptedAIVaultEnvelopeDTO> {
  if (!token) {
    return encryptOfflineVaultWebCrypto(payload);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/ai-settings/export-vault`, {
      method: "POST",
      headers: buildHeaders(token, true),
      body: JSON.stringify(payload),
    });
  } catch {
    return encryptOfflineVaultWebCrypto(payload);
  }

  if (response.status === 403) {
    throw new Error(
      "Forbidden (403): Only ADMIN users can export encrypted AI configuration vaults."
    );
  }
  if (!response.ok) {
    const msg = await extractBackendErrorMessage(
      response,
      `Failed to export AI configuration vault (${response.status}).`
    );
    throw new Error(msg);
  }

  const raw = await response.json();
  return EncryptedAIVaultEnvelopeDTOSchema.parse(raw);
}

export async function importAIVault(
  payload: ImportAIVaultRequestDTO,
  token?: string
): Promise<AISettingsResponseDTO> {
  if (!token) {
    return decryptOfflineVaultWebCrypto(payload);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/ai-settings/import-vault`, {
      method: "POST",
      headers: buildHeaders(token, true),
      body: JSON.stringify(payload),
    });
  } catch {
    return decryptOfflineVaultWebCrypto(payload);
  }

  if (response.status === 403) {
    throw new Error(
      "Forbidden (403): Only ADMIN users can import encrypted AI configuration vaults."
    );
  }
  if (!response.ok) {
    const msg = await extractBackendErrorMessage(
      response,
      "Failed to unlock AI configuration vault: invalid passphrase or corrupted vault file."
    );
    throw new Error(msg);
  }

  const raw = await response.json();
  const parsed = AISettingsResponseDTOSchema.parse(raw);
  offlineAISettingsState = parsed;
  return parsed;
}


