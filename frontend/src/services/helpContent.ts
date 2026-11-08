/**
 * Structured In-App Help Center, Playbook Best-Practices Templates,
 * Risk Heatmap Legend, Export Mode Comparisons, and FAQ Knowledge Base.
 */

export interface HelpModuleStep {
  title: string;
  description: string;
  tip?: string;
}

export interface HelpGuideModule {
  id: string;
  number: number;
  title: string;
  badge: string;
  summary: string;
  keywords: string[];
  steps: HelpModuleStep[];
}

export interface PlaybookRuleTemplate {
  id: string;
  title: string;
  category: string;
  standard_position: string;
  fallback_position: string;
  unacceptable_triggers: string;
  why_it_works: string;
}

export interface HeatmapLegendItem {
  level: "CRITICAL" | "HIGH" | "MEDIUM / LOW" | "COMPLIANT";
  colorName: string;
  badgeClass: string;
  dotClass: string;
  meaning: string;
  recommendedAction: string;
}

export interface ExportComparisonItem {
  feature: string;
  trackChanges: string;
  cleanCopy: string;
}

export interface HelpFaqItem {
  id: string;
  question: string;
  answer: string;
  category: "workflow" | "playbook" | "collaboration" | "export";
  keywords: string[];
}

export const HELP_GUIDE_MODULES: HelpGuideModule[] = [
  {
    id: "quick-start",
    number: 1,
    title: "Quick Start: The 4-Step Contract Review Workflow",
    badge: "Getting Started",
    summary:
      "Go from raw third-party contract or RFP to a fully redlined, policy-compliant Microsoft Word document in four structured steps.",
    keywords: [
      "quick start",
      "workflow",
      "4-step",
      "getting started",
      "upload",
      "analyze",
      "playbook",
      "export",
    ],
    steps: [
      {
        title: "Step 1: Define or Review Your Company Playbook (/playbooks)",
        description:
          "Before auditing a contract, verify your corporate negotiation standards in the Company Playbook Manager. Every rule stores your Standard Position, Fallback Position, and Unacceptable Red-Flag Triggers.",
        tip: "Out of the box, your workspace comes pre-seeded with 5 enterprise legal policies (Limitation of Liability, Indemnification, SLA, Data Privacy, and Governing Law).",
      },
      {
        title: "Step 2: Upload Your Contract or RFP on the Dashboard (/)",
        description:
          "Drag and drop any .docx or .pdf agreement (up to 25MB) into the Upload Hub on the Dashboard. The structural parser extracts every clause while preserving legal numbering (e.g., 1.1, Article IV).",
      },
      {
        title: "Step 3: Click 'Analyze Contract with AI' in the Studio",
        description:
          "Inside the Split-Screen Redlining Studio, click 'Analyze Contract with AI'. The hybrid vector + lexical retriever matches each clause against your Playbook and streams surgical redlines in real time via Server-Sent Events (SSE).",
      },
      {
        title: "Step 4: Preview Diffs, Resolve Redlines & Export to Word (.docx)",
        description:
          "Hover over 'Apply Redline' to preview word-level deletions and insertions directly inside the contract canvas. Accept, Modify, or Reject each suggestion, collaborate via threaded comments, and export as Native Word Track Changes (.docx) or a Clean execution copy.",
      },
    ],
  },
  {
    id: "uploading-contracts",
    number: 2,
    title: "Uploading Contracts & RFPs (.docx & .pdf)",
    badge: "Ingestion & Parsing",
    summary:
      "Learn how the structural ingestion pipeline preserves section numbering, groups dependent sub-clauses, and secures uploaded documents.",
    keywords: [
      "upload",
      "docx",
      "pdf",
      "parser",
      "clause",
      "numbering",
      "ingestion",
      "25mb",
      "file",
    ],
    steps: [
      {
        title: "Preserving Legal Section Numbering & Hierarchy",
        description:
          "The state-machine clause segmenter recognizes hierarchical numbering patterns (1., 1.1, 1.1.1, Article I, Section 2) and automatically binds dependent sub-clauses ((a), (b), (i), (ii)) to their parent provision so legal context is never fragmented.",
      },
      {
        title: "Automatic Header/Footer Stripping & Security Hardening",
        description:
          "For PDF agreements, repeating page headers, footers, and Bates numbering are stripped automatically. For Word (.docx) archives, the parser validates magic bytes and guards against Zip-Slip and XML External Entity (XXE) vulnerabilities.",
      },
      {
        title: "In-Studio Quick Upload (+ Upload New File)",
        description:
          "Working inside the studio and need to switch to a newly received counterparty turn? Click '+ Upload New File' in the top studio bar to ingest and jump straight into the new agreement without returning to the Dashboard.",
      },
    ],
  },
  {
    id: "writing-playbook-rules",
    number: 3,
    title: "Writing High-Impact Company Playbook Rules (/playbooks)",
    badge: "Playbook Engineering",
    summary:
      "Configure precision corporate standards so the Hybrid Vector + BM25 engine retrieves the exact governing policy for every contract clause.",
    keywords: [
      "playbook",
      "rules",
      "standard position",
      "fallback position",
      "unacceptable triggers",
      "vector",
      "bm25",
      "hybrid",
      "policy",
    ],
    steps: [
      {
        title: "How Hybrid Vector + Keyword Retrieval Works",
        description:
          "When evaluating a contract clause, the engine combines 1536-dimensional vector semantic similarity (70% weight) with BM25 lexical keyword matching (30% weight) to select the top 3 governing Playbook rules in under 150ms.",
      },
      {
        title: "Category & Standard Position (Your Baseline Requirement)",
        description:
          "Use clear legal categories (e.g., Limitation of Liability, Indemnification, Data Privacy & AI Training, IP Ownership). Write the Standard Position as concrete, affirmative contract language that represents your ideal baseline.",
      },
      {
        title: "Fallback Position (Pre-Approved Compromise Language)",
        description:
          "Specify the exact fallback wording counsel is authorized to accept when a counterparty rejects your Standard Position (e.g., a 2x annual contract value super-cap instead of a 12-month fee cap).",
      },
      {
        title: "Unacceptable Triggers (Red-Flag Escalation Phrases)",
        description:
          "List comma-separated phrases that must immediately trigger a CRITICAL or HIGH risk alert if detected in counterparty paper—such as 'unlimited liability', 'sole discretion', 'consequential damages', or 'train public foundation models'.",
      },
    ],
  },
  {
    id: "mastering-studio",
    number: 4,
    title: "Mastering the Split-Screen Redlining Studio (/documents/[id])",
    badge: "Interactive Workspace",
    summary:
      "Navigate clauses at 60 FPS with bidirectional focus sync, Risk Heatmap gutter pins, live inline word diffs, and one-click resolution.",
    keywords: [
      "studio",
      "split-screen",
      "heatmap",
      "crimson",
      "amber",
      "emerald",
      "inline diff",
      "apply redline",
      "modify",
      "reject",
      "talking point",
    ],
    steps: [
      {
        title: "Bidirectional Clause & Inspector Synchronization",
        description:
          "Clicking any clause in the left-hand contract editor immediately highlights and scrolls to its corresponding AI Risk Card in the right-hand inspector within 16ms—and clicking any card in the inspector scrolls the contract canvas to that clause.",
      },
      {
        title: "Live Inline Word-Diff Preview on Hover",
        description:
          "Hover your cursor over the 'Apply Redline' button on any AI suggestion card. The left-hand contract clause instantaneously renders a surgical word-level diff: deleted counterparty words appear in crimson strikethrough and inserted playbook words appear in emerald highlight.",
      },
      {
        title: "One-Click Resolution: Apply Redline, Modify, or Reject",
        description:
          "Click 'Apply Redline' to accept the AI rewrite immediately, 'Modify' to open an inline editor and customize the proposed clause wording before applying, or 'Reject' to dismiss the suggestion and retain original counterparty text.",
      },
      {
        title: "Negotiation Talking Points for Opposing Counsel",
        description:
          "Every AI card includes both a Playbook Policy Rationale (for internal stakeholders) and a ready-to-send Negotiation Talking Point crafted for external communication with opposing counsel.",
      },
    ],
  },
  {
    id: "collaboration-concurrency-audit",
    number: 5,
    title: "Team Collaboration, Version Protection & Audit Trail",
    badge: "Governance & Concurrency",
    summary:
      "Collaborate across Legal, Procurement, and Technical Leads with threaded discussions, optimistic locking, and an immutable audit log.",
    keywords: [
      "collaboration",
      "comments",
      "thread",
      "version",
      "concurrency",
      "409 conflict",
      "audit trail",
      "rbac",
      "roles",
    ],
    steps: [
      {
        title: "Collapsible Threaded Clause Discussions",
        description:
          "Each clause has a dedicated discussion drawer at the bottom of the AI Inspector. Team members (Admin, Legal Counsel, Technical Lead, Viewer) can post contextual review notes that stay bound to that specific provision.",
      },
      {
        title: "Optimistic Concurrency Control & Version Badges (v1 -> v2)",
        description:
          "Every clause displays its live version number (v1, v2, v3). When you accept or modify a redline, the studio sends the expected_clause_version. If a colleague edited the same clause milliseconds earlier, the backend returns a 409 Conflict and safely rolls back the stale edit.",
      },
      {
        title: "Immutable Compliance Audit Trail",
        description:
          "Switch from 'AI Redlines' to the 'Audit Trail' tab in the right-hand inspector to view a chronological, tamper-evident log of every document ingestion, AI analysis, redline resolution, comment, and Word export.",
      },
    ],
  },
  {
    id: "exporting-word-docx",
    number: 6,
    title: "Exporting to Microsoft Word (Track Changes vs. Clean .docx)",
    badge: "OpenXML Export",
    summary:
      "Generate native OpenXML .docx files with official Microsoft Word Track Changes markup (<w:ins> and <w:del>) or clean execution copies.",
    keywords: [
      "export",
      "word",
      "docx",
      "track changes",
      "clean",
      "openxml",
      "w:ins",
      "w:del",
      "microsoft word",
      "libreoffice",
    ],
    steps: [
      {
        title: "Export Track Changes (.docx) for Counterparty Negotiation",
        description:
          "Generates a native OpenXML Word document containing authentic <w:del> (strikethrough deletions) and <w:ins> (underlined insertions) revision markup with author metadata, timestamps, AI rationales, and reviewer comments. Open it in Microsoft Word or LibreOffice Writer to review changes natively.",
      },
      {
        title: "Export Clean (.docx) for Final Signature",
        description:
          "Generates a polished, finalized Word document where all ACCEPTED and MODIFIED clauses are seamlessly merged into the body text with zero revision markup—ready for executive signature.",
      },
    ],
  },
  {
    id: "ai-engine-switcher",
    number: 7,
    title: "Dynamic AI Provider & Model Switcher (Cloud & Local LLMs)",
    badge: "Zero-Restart AI Switcher",
    summary:
      "Configure, test live connectivity, and hot-swap LLM Inference and 1536-d Vector Embedding providers directly from the header pill without restarting containers.",
    keywords: [
      "ai settings",
      "provider",
      "gemini",
      "groq",
      "openai",
      "anthropic",
      "ollama",
      "vllm",
      "deterministic",
      "api key",
      "test connection",
      "embeddings",
      "vault",
      "rsvault",
      "aes-256-gcm",
      "backup",
      "passphrase",
    ],
    steps: [
      {
        title: "Open the AI Engine Switcher from Any Header",
        description:
          "Click the active 'AI: ...' pill button in the top navigation bar or inside the Redlining Studio toolbar to inspect active LLM and Vector Embedding engines.",
      },
      {
        title: "Configure Models via Live API Discovery or Manual Entry",
        description:
          "Select any provider—Offline Deterministic Engine, Google Gemini, Groq Cloud LPU, OpenAI, Anthropic Claude, Local Ollama (localhost:11434), or an OpenAI-Compatible vLLM/LM Studio endpoint. To stay 100% future-proof as vendors release new models, external providers carry zero hardcoded model lists: click 'Fetch Live Models' to query the provider's live /models or /api/tags endpoint, or type any exact model ID manually.",
      },
      {
        title: "Run Live Connection Diagnostics Before Saving",
        description:
          "Click 'Test Connection' to verify 1536-dimensional vector adaptation, structured clause auditing, and round-trip latency in milliseconds before clicking 'Save & Activate Engine' (Admin role required for saving).",
      },
      {
        title: "Back Up & Restore API Keys via the Encrypted Configuration Vault (.rsvault.json)",
        description:
          "Because runtime API keys are held strictly in memory and never stored in plaintext on disk, use the 'Encrypted Configuration Vault' section inside the modal: enter a passphrase (min 8 characters) and click 'Export Encrypted Vault (.rsvault.json)' to download a PBKDF2-HMAC-SHA256 (600,000 iterations) + AES-256-GCM encrypted bundle. In future sessions, select your .rsvault.json file, enter your passphrase, and click 'Unlock & Restore Vault' to activate all providers, Model IDs, and API keys in one click.",
      },
    ],
  },
  {
    id: "negotiation-stance-selector",
    number: 8,
    title: "AI Negotiation Stance Selector (Strict vs. Balanced vs. Commercial)",
    badge: "Negotiation Posture",
    summary:
      "Dynamically adapt AI redline aggressiveness to match your transaction posture: Strict (zero-compromise standard enforcement), Balanced (reciprocal mutual terms), or Commercial (pre-approved fallback positions for rapid deal velocity).",
    keywords: [
      "negotiation stance",
      "stance",
      "strict",
      "balanced",
      "commercial",
      "fast close",
      "posture",
      "fallback position",
      "standard position",
      "velocity",
      "risk appetite",
    ],
    steps: [
      {
        title: "Strict Posture: Zero-Compromise Legal Governance",
        description:
          "Strict stance strictly enforces your organization's standard position across every clause with zero compromise. Any borderline language or deviation is escalated to CRITICAL/HIGH risk, rationales are tagged [Strict Protective Stance], and talking points provide firm, non-negotiable legal justifications. Ideal for mission-critical vendor agreements, high-liability infrastructure, and core proprietary IP contracts.",
        tip: "Use Strict mode when your company has strong bargaining power or when counterparty paper poses unacceptable downside risks.",
      },
      {
        title: "Balanced Posture: Fair Bilateral Standards (Default)",
        description:
          "Balanced stance converts one-sided counterparty obligations into fair, reciprocal ('Each party...') commitments while defending core company policy boundaries. Rationales are tagged [Balanced Mutual Stance], and talking points offer commercially reasonable compromises aligned with industry norms.",
        tip: "Recommended for 80% of routine commercial transactions, vendor contracts, and mutual business agreements.",
      },
      {
        title: "Commercial Posture: Fast-Close Deal Velocity",
        description:
          "Commercial stance prioritizes closing deals rapidly. The AI automatically selects pre-approved fallback positions from your Playbook (e.g., 2x annual fee cap instead of a 12-month cap) to eliminate protracted redline ping-pong. Rationales are tagged [Commercial Fast-Close Stance], and talking points provide pragmatic business explanations.",
        tip: "Perfect for high-volume, low-dollar transactions, expedited sales quarter-ends, and low-risk counterparty paper.",
      },
      {
        title: "Switching Stance in the Studio Header",
        description:
          "Before clicking 'Analyze Contract with AI', toggle between Strict, Balanced, and Commercial directly on the segmented pill selector beside the audit button. You can re-run the audit anytime with a different stance to view how proposed redlines and risk classifications adapt in real time.",
      },
    ],
  },
  {
    id: "inline-clause-ai-copilot",
    number: 9,
    title: "Inline Clause AI Copilot & Custom Prompting",
    badge: "AI Copilot",
    summary:
      "Steer the AI redline engine on individual clauses using natural language prompt instructions or one-click preset directive chips to customize liability caps, cure periods, mutuality, and legal tone.",
    keywords: [
      "copilot",
      "clause copilot",
      "custom prompt",
      "instruction",
      "prompting",
      "liability cap",
      "cure period",
      "mutual",
      "soften tone",
      "refine",
      "talking point",
    ],
    steps: [
      {
        title: "Open the Inline AI Copilot Drawer",
        description:
          "On any redline card in the right-hand Inspector, click the '✨ AI Copilot' button in the card action bar. The copilot drawer expands to reveal preset quick-directive chips and an editable prompt instruction input.",
        tip: "AI Copilot works seamlessly with both local deterministic analysis and active external LLMs (Gemini, Groq, OpenAI, Anthropic, Ollama).",
      },
      {
        title: "One-Click Quick Directive Chips",
        description:
          "Choose from pre-engineered prompt chips for standard negotiation maneuvers: 'Make Strictly Mutual' (converts unilateral covenants into bilateral commitments), 'Cap Liability at $100,000' (establishes an explicit monetary ceiling), 'Add 30-Day Cure Period' (inserts default notice and cure provisions), or 'Soften Tone for Partner' (rephrases strict prohibitions into mutual approval workflows).",
      },
      {
        title: "Free-Form Natural-Language Prompting",
        description:
          "Type any custom instruction directly into the prompt box (e.g., 'Cap aggregate liability at $250,000 and exclude incidental damages', 'Require SOC 2 Type II audit report within 14 days', 'Ensure 60 days advance written notice for auto-renewal'). Click 'Refine with AI' to re-evaluate the clause.",
        tip: "The copilot updates the proposed text, generates updated rationale tags [AI Copilot Refined: \"...\"], and crafts fresh executive negotiation talking points.",
      },
      {
        title: "Audit Trail & Concurrency Integration",
        description:
          "Every copilot refinement is recorded as an immutable SUGGESTION_REFINED event in the document compliance audit trail, logging the exact instruction, timestamp, and user ID. The updated wording immediately refreshes the split-screen word-level diff preview.",
      },
    ],
  },
  {
    id: "cross-clause-radar",
    number: 10,
    title: "Cross-Clause Contradiction & Reference Radar",
    badge: "Document Integrity",
    summary:
      "Detect multi-clause logical contradictions, broken section cross-references, and undefined capitalized legal terms across your entire agreement, complete with a 0-100% Document Integrity Score and bilateral clause navigation.",
    keywords: [
      "cross-clause",
      "radar",
      "contradiction",
      "broken reference",
      "undefined term",
      "integrity score",
      "cross-clause check",
      "section reference",
      "liability conflict",
    ],
    steps: [
      {
        title: "The Limitations of Paragraph-by-Paragraph Review",
        description:
          "Standard redlining tools evaluate individual clauses in isolation against policy rules. However, sophisticated contract defects span multiple clauses—such as Clause #1 capping liability at $500 while Clause #8 specifies uncapped indemnification, or Clause #3 granting 30 days notice to cure while Clause #12 permits immediate termination without notice.",
        tip: "Cross-Clause Radar evaluates the full clause graph to catch discrepancies that slip past single-clause checks.",
      },
      {
        title: "The 3 Critical Defect Categories",
        description:
          "The Radar categorizes document-wide defects into three distinct issue types: 1) CONTRADICTION: Conflicting liabilities, payment schedules (Net 30 vs Net 15), or conflicting AI model training vs exclusivity covenants; 2) BROKEN_REFERENCE: Cross-citations to non-existent sections (e.g., 'pursuant to Section 99.4' in an 8-section contract); 3) UNDEFINED_TERM: Capitalized, specialized legal terms used in operative obligations without an explicit definition.",
      },
      {
        title: "Document Integrity Score (0-100%)",
        description:
          "The Radar assigns a dynamic Document Integrity Score ranging from 0% to 100%. Perfectly harmonized agreements score 100%. Each detected issue applies a weighted deduction based on severity (Critical: -18 pts, High: -12 pts, Medium: -6 pts, Low: -3 pts), clamped to a minimum of 15%. Resolving conflicts and re-scanning drives the score back toward 100%.",
      },
      {
        title: "Bilateral Clause Navigation & One-Click Jumping",
        description:
          "Every finding card displays interactive clause navigation buttons: 'Source: Clause #X' and 'Conflicts with: Clause #Y'. Clicking either button instantly scrolls the TipTap rich-text editor to that clause and highlights it in both the document outline and editor canvas.",
      },
      {
        title: "Immutable Compliance Logging",
        description:
          "Executing a Cross-Clause Check logs an immutable CROSS_CLAUSE_CHECKED event to the document audit trail, detailing the initiator, total issues identified, and the resulting integrity score for SOC 2 compliance.",
      },
    ],
  },
];

export const RISK_HEATMAP_LEGEND: HeatmapLegendItem[] = [
  {
    level: "CRITICAL",
    colorName: "Crimson",
    badgeClass:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300",
    dotClass: "bg-rose-500 border-rose-600/30 dark:border-rose-400",
    meaning:
      "Severe policy violation or uncapped legal/financial exposure (e.g., unlimited liability, unilateral IP assignment, or training public AI models on confidential data).",
    recommendedAction:
      "Requires immediate redlining via 'Apply Redline' or custom 'Modify' before contract approval.",
  },
  {
    level: "HIGH",
    colorName: "Amber",
    badgeClass:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
    dotClass: "bg-amber-500 border-amber-600/30 dark:border-amber-400",
    meaning:
      "Material deviation from company standard position (e.g., one-sided indemnification, missing service credits, or non-standard governing venue).",
    recommendedAction:
      "Apply standard Playbook wording or negotiate using the pre-approved Fallback Position.",
  },
  {
    level: "MEDIUM / LOW",
    colorName: "Sky Blue",
    badgeClass:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-500/10 dark:text-sky-300",
    dotClass: "bg-sky-500 border-sky-600/30 dark:bg-sky-400 dark:border-sky-300",
    meaning:
      "Minor commercial deviation, ambiguous phrasing, or advisory note that benefits from clarifying language.",
    recommendedAction:
      "Review advisory rationale and optionally apply clarifying edits or leave a team comment.",
  },
  {
    level: "COMPLIANT",
    colorName: "Emerald",
    badgeClass:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
    dotClass: "bg-emerald-500 border-emerald-600/30 dark:border-emerald-400",
    meaning:
      "Clause satisfies corporate Playbook requirements with zero unacceptable triggers, or its redline has been resolved (ACCEPTED / MODIFIED).",
    recommendedAction: "No further action required; ready for export.",
  },
];

export const PLAYBOOK_RULE_TEMPLATES: PlaybookRuleTemplate[] = [
  {
    id: "tpl-lol",
    title: "Mutual Limitation of Liability & Consequential Damages Waiver",
    category: "Limitation of Liability",
    standard_position:
      "Each party's total aggregate cumulative liability arising out of or relating to this Agreement shall not exceed twelve (12) months of fees paid or payable immediately preceding the claim, and neither party shall be liable for indirect, incidental, special, or consequential damages.",
    fallback_position:
      "Mutual super-cap at two times (2x) annual contract value for data privacy, confidentiality, and IP indemnification obligations.",
    unacceptable_triggers:
      "unlimited liability, uncapped liability, consequential damages, Lost profits, exceed $500",
    why_it_works:
      "Catches asymmetric vendor caps (such as '$500 cap') and uncapped consequential damages exposure immediately as CRITICAL risk.",
  },
  {
    id: "tpl-ai-privacy",
    title: "Data Privacy, Enterprise Confidentiality & AI Model Training Ban",
    category: "Data Privacy & AI Governance",
    standard_position:
      "Customer retains all right, title, and interest in Customer Data. Provider shall process Customer Data solely to deliver the contracted Services, shall never use Customer Data to train, fine-tune, or improve public or multi-tenant foundation AI models, and shall notify Customer within forty-eight (48) hours of any confirmed security breach.",
    fallback_position:
      "Seventy-two (72) hour security breach notification window aligned with GDPR Article 33; anonymized telemetry permitted solely for infrastructure performance monitoring.",
    unacceptable_triggers:
      "train foundation models, train public models, perpetual license to customer data, irrevocable license, no breach notice",
    why_it_works:
      "Protects proprietary enterprise data and RFP trade secrets from being ingested into external AI models.",
  },
  {
    id: "tpl-sla",
    title: "Enterprise Uptime SLA & Financial Service Credits",
    category: "Service Level Agreement (SLA)",
    standard_position:
      "Provider warrants at least 99.9% monthly platform uptime availability, backed by automatic financial service credits of 10% of monthly fees per 0.5% availability drop below threshold, and a right to terminate for cause with a pro-rata refund if uptime falls below 99.0% in any two consecutive months.",
    fallback_position:
      "99.5% monthly uptime commitment with 5% service credit per 0.5% shortfall and termination right after three consecutive months of breach.",
    unacceptable_triggers:
      "as-is, without warranty, sole discretion, no service credits, non-refundable",
    why_it_works:
      "Flags 'as-is' disclaimers and missing remedies in SaaS and cloud infrastructure agreements.",
  },
];

export const EXPORT_MODE_COMPARISON: ExportComparisonItem[] = [
  {
    feature: "Primary Use Case",
    trackChanges:
      "Sending redlined turn back to opposing counsel or internal legal review.",
    cleanCopy:
      "Final execution copy ready for DocuSign / wet-ink signature.",
  },
  {
    feature: "OpenXML Revision Markup",
    trackChanges:
      "Embeds native <w:del> (strikethrough) and <w:ins> (underline) tags.",
    cleanCopy:
      "Merges all accepted/modified clauses cleanly with zero revision markup.",
  },
  {
    feature: "Reviewer Comments & AI Rationales",
    trackChanges:
      "Includes anchored Word comments (<w:commentRangeStart/>) with rationales.",
    cleanCopy: "Strips internal comments for a clean external document.",
  },
  {
    feature: "Rejected / Pending Suggestions",
    trackChanges:
      "Preserves original counterparty clause text without modification.",
    cleanCopy:
      "Preserves original counterparty clause text without modification.",
  },
];

export const HELP_FAQ_ITEMS: HelpFaqItem[] = [
  {
    id: "faq-offline-demo",
    question:
      "What is the difference between 'Live Backend Connected' and 'Offline Demo Mode'?",
    answer:
      "When the FastAPI backend is running, the top navigation badge shows 'Live Backend Connected' and automatically provisions an authenticated organization session. If the backend server is unreachable, the app seamlessly enters 'Offline Demo Mode' using browser storage so you can still upload files, manage Playbook rules, run simulated SSE audits, and test every studio feature without interruption.",
    category: "workflow",
    keywords: ["offline", "demo", "live backend", "connection", "status", "badge"],
  },
  {
    id: "faq-inline-diff",
    question: "How do I preview exact word changes before accepting an AI redline?",
    answer:
      "In the right-hand AI Inspector, move your mouse cursor over the 'Apply Redline' button on any suggestion card. While hovering, look at the corresponding clause in the left-hand contract editor: removed words appear in red strikethrough and added words appear in green highlight.",
    category: "workflow",
    keywords: ["hover", "inline diff", "preview", "apply redline", "strikethrough"],
  },
  {
    id: "faq-conflict-409",
    question: "What happens if two reviewers edit the same clause at the same time?",
    answer:
      "Every clause is protected by Optimistic Concurrency Control using version numbers (v1, v2, etc.). If another reviewer resolves or modifies a clause while you are viewing an older version, the server rejects the stale update with a 409 Conflict, rolls back the local state safely, and displays a red alert banner prompting you to refresh.",
    category: "collaboration",
    keywords: ["409", "conflict", "concurrency", "version", "v1", "v2", "rollback"],
  },
  {
    id: "faq-custom-playbook",
    question: "Do new Playbook rules take effect immediately for contract analysis?",
    answer:
      "Yes. As soon as you add a rule in the Playbook Manager (/playbooks), the backend generates its 1536-dimensional vector embedding and indexes its lexical keywords. Clicking 'Analyze Contract with AI' in the studio immediately evaluates clauses against your updated rules.",
    category: "playbook",
    keywords: ["playbook", "rules", "embedding", "vector", "immediate", "analyze"],
  },
  {
    id: "faq-word-compatibility",
    question:
      "Are exported Track Changes (.docx) files compatible with Microsoft Word and Google Docs?",
    answer:
      "Yes. The exporter builds a spec-compliant ECMA-376 OpenXML .docx package using native <w:ins> and <w:del> revision runs. When opened in Microsoft Word, LibreOffice Writer, or Google Docs, every insertion and deletion can be accepted or rejected using standard Word review tools.",
    category: "export",
    keywords: [
      "export",
      "microsoft word",
      "google docs",
      "libreoffice",
      "track changes",
      "docx",
    ],
  },
  {
    id: "faq-ai-engine-switcher",
    question:
      "Can I switch between Google Gemini, Groq, OpenAI, or Local Ollama without restarting Docker?",
    answer:
      "Yes. Click the 'AI: ...' badge in the top navigation bar or Studio toolbar to open the AI Engine Switcher. Select a provider preset, enter your API key (masked server-side and never returned in plaintext) or local Ollama/vLLM Base URL, click 'Fetch Live Models' to dynamically query the provider's live model catalog (or type any custom fine-tuned/HuggingFace model ID directly), run 'Test Connection' to verify latency and 1536-d vector embeddings, and click 'Save & Activate Engine' to switch immediately.",
    category: "workflow",
    keywords: [
      "ai switcher",
      "gemini",
      "ollama",
      "groq",
      "openai",
      "anthropic",
      "api key",
      "test connection",
      "fetch live models",
      "custom model",
      "hot swap",
    ],
  },
  {
    id: "faq-ai-config-vault",
    question:
      "How do I save my AI API keys and Model IDs across sessions without storing plaintext secrets on disk?",
    answer:
      "Inside the AI Engine Switcher modal, scroll to 'Encrypted Configuration Vault (Backup & Restore API Keys)'. Enter a strong passphrase (minimum 8 characters) and click 'Export Encrypted Vault (.rsvault.json)'. Your active/typed LLM & Embedding providers, Model IDs, Base URLs, Temperature, and API keys are encrypted using PBKDF2-HMAC-SHA256 (600,000 iterations, random 16-byte salt) and AES-256-GCM authenticated encryption—never plaintext. Whenever you restart the server or open a new session, upload your .rsvault.json file, enter your passphrase, and click 'Unlock & Restore Vault' to decrypt, validate, and activate your full AI configuration in one click.",
    category: "workflow",
    keywords: [
      "vault",
      "rsvault",
      "passphrase",
      "encrypt",
      "decrypt",
      "aes-256-gcm",
      "pbkdf2",
      "backup",
      "restore",
      "api key",
    ],
  },
  {
    id: "faq-negotiation-stance",
    question:
      "How does changing the AI Negotiation Stance (Strict vs. Balanced vs. Commercial) alter redlines?",
    answer:
      "The Negotiation Stance directly controls which Playbook position is proposed and how risks are framed. 'Strict' insists on your company's standard position with zero compromise, escalates borderline clauses, and generates firm talking points. 'Balanced' (default) proposes mutual bilateral language. 'Commercial' automatically selects your pre-approved fallback position (e.g. 2x annual fee cap instead of 12-month cap), marks acceptable fallback clauses as low risk, and frames talking points to facilitate rapid closing.",
    category: "workflow",
    keywords: [
      "stance",
      "negotiation stance",
      "strict",
      "balanced",
      "commercial",
      "fast close",
      "fallback",
      "standard position",
    ],
  },
  {
    id: "faq-when-to-use-commercial",
    question:
      "When should I select the 'Commercial' Fast-Close stance instead of 'Balanced' or 'Strict'?",
    answer:
      "Select 'Commercial' stance when deal velocity is paramount—such as end-of-quarter enterprise sales, low-dollar vendor agreements, non-critical SaaS renewals, or when counterparty paper is already close to your pre-approved fallback limits. It minimizes friction and redlines by accepting pre-approved compromises immediately.",
    category: "workflow",
    keywords: [
      "commercial",
      "fast close",
      "velocity",
      "sales",
      "quarter end",
      "fallback",
      "stance",
    ],
  },
  {
    id: "faq-inline-clause-copilot",
    question:
      "How do I use the Inline Clause AI Copilot to customize redlines on specific clauses?",
    answer:
      "Click the '✨ AI Copilot' button on any redline card in the Inspector panel. You can click one of four quick-directive chips ('Make Strictly Mutual', 'Cap Liability at $100,000', 'Add 30-Day Cure Period', 'Soften Tone for Partner') or type any natural-language prompt instruction. Click 'Refine with AI' to regenerate the proposed language and negotiation talking points in seconds.",
    category: "workflow",
    keywords: [
      "copilot",
      "clause copilot",
      "custom prompt",
      "instruction",
      "liability cap",
      "cure period",
      "mutual",
      "refine",
    ],
  },
  {
    id: "faq-copilot-audit-trail",
    question:
      "Does using the Inline Clause AI Copilot get tracked in the compliance audit trail?",
    answer:
      "Yes. Every copilot refinement triggers an immutable SUGGESTION_REFINED audit trail event recorded in the database, preserving the exact prompt instruction, actor role and ID, timestamp, and resulting redline version for SOC 2 and legal audit compliance.",
    category: "collaboration",
    keywords: [
      "audit trail",
      "compliance",
      "copilot",
      "suggestion_refined",
      "tracking",
      "immutable",
    ],
  },
  {
    id: "faq-cross-clause-radar",
    question:
      "What is the Cross-Clause Integrity Radar and how does it detect contradictions?",
    answer:
      "The Cross-Clause Radar evaluates the full contract graph to detect multi-clause structural issues that escape paragraph-level analysis: CONTRADICTION (e.g. liability caps vs uncapped indemnity or conflicting Net 30/Net 15 payment terms), BROKEN_REFERENCE (citations to non-existent sections like 'Section 99.4'), and UNDEFINED_TERM (unanchored capitalized obligations). It computes a 0-100% Document Integrity Score and provides interactive jump buttons to navigate between conflicting clauses.",
    category: "workflow",
    keywords: [
      "cross-clause",
      "radar",
      "contradiction",
      "integrity score",
      "broken reference",
      "undefined term",
      "liability conflict",
    ],
  },
  {
    id: "faq-integrity-score-calculation",
    question:
      "How is the Document Integrity Score calculated and improved?",
    answer:
      "The Document Integrity Score starts at 100% for an internally consistent contract and deducts weighted penalties for each finding: Critical deductions (-18 pts), High-severity deductions (-12 pts), Medium deductions (-6 pts), and Low deductions (-3 pts), clamped to a minimum of 15%. As you accept suggested redlines or harmonize conflicting provisions and re-run the scan, the score increases back toward 100%.",
    category: "workflow",
    keywords: [
      "integrity score",
      "scoring",
      "penalty",
      "resolution",
      "cross-clause",
      "radar",
      "harmonization",
    ],
  },
];

