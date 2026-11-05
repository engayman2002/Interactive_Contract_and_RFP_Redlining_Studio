import {
  DocumentAnalysisSummaryDTO,
  DocumentAnalysisSummaryDTOSchema,
  DocumentWorkspaceDTO,
  DocumentWorkspaceDTOSchema,
} from "./contracts";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export const DEMO_DOCUMENT_ID = "d0000000-0000-4000-8000-000000000001";
export const DEMO_ORG_ID = "a0000000-0000-4000-8000-000000000001";

export const DEMO_WORKSPACE_DATA: DocumentWorkspaceDTO = {
  document_id: DEMO_DOCUMENT_ID,
  org_id: DEMO_ORG_ID,
  title: "Master Cloud Infrastructure & Enterprise AI Services Agreement",
  status: "ANALYZED",
  version: 1,
  created_by: "b0000000-0000-4000-8000-000000000001",
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
};

function buildHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchDocumentWorkspace(
  documentId?: string,
  token?: string
): Promise<DocumentWorkspaceDTO> {
  if (!documentId || documentId === DEMO_DOCUMENT_ID || !token) {
    return DocumentWorkspaceDTOSchema.parse(DEMO_WORKSPACE_DATA);
  }

  const response = await fetch(
    `${API_BASE_URL}/documents/${encodeURIComponent(documentId)}/workspace`,
    {
      method: "GET",
      headers: buildHeaders(token),
    }
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch workspace (${response.status})`);
  }
  const raw = await response.json();
  return DocumentWorkspaceDTOSchema.parse(raw);
}

export async function uploadDocument(
  file: File,
  title?: string,
  token?: string
): Promise<{ document_id: string }> {
  const formData = new FormData();
  formData.append("file", file);
  if (title) {
    formData.append("title", title);
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/documents/upload`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`Failed to upload document (${response.status})`);
  }
  return (await response.json()) as { document_id: string };
}

export async function triggerDocumentAnalysis(
  documentId: string,
  token?: string
): Promise<DocumentAnalysisSummaryDTO> {
  if (documentId === DEMO_DOCUMENT_ID || !token) {
    return DocumentAnalysisSummaryDTOSchema.parse({
      document_id: DEMO_DOCUMENT_ID,
      status: "ANALYZED",
      total_clauses: DEMO_WORKSPACE_DATA.clauses.length,
      suggestions_created: DEMO_WORKSPACE_DATA.redlines.length,
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

