export type SupportedLocale = "en" | "es" | "fr";

export interface LocaleOption {
  code: SupportedLocale;
  label: string;
  nativeName: string;
}

export const SUPPORTED_LOCALES: LocaleOption[] = [
  { code: "en", label: "EN", nativeName: "English" },
  { code: "es", label: "ES", nativeName: "Español" },
  { code: "fr", label: "FR", nativeName: "Français" },
];

export interface LocalizedTutorialStage {
  index: number;
  id: string;
  shortTitle: string;
  title: string;
  subtitle: string;
  checklist: string[];
  visualPreview: {
    badge: string;
    promptOrInputLabel: string;
    promptOrInput: string;
    outputLabel: string;
    output: string;
  };
  proTip: string;
  ctaLabel: string;
  ctaHref: string;
}

export interface LocalizedLearningTrack {
  id: "ALL" | "onboarding" | "studio" | "ai-agents" | "ops";
  label: string;
  testId: string;
  description: string;
}

export interface TranslationDictionary {
  nav: {
    brandName: string;
    enterpriseTag: string;
    dashboard: string;
    sampleStudio: string;
    companyPlaybook: string;
    helpGuide: string;
    liveBackend: string;
    demoWorkspace: string;
    roleAdmin: string;
    authModalTitle: string;
    authModalSubtitle: string;
    emailLabel: string;
    passwordLabel: string;
    roleLabel: string;
    orgNameLabel: string;
    saveSignInBtn: string;
    resetDemoBtn: string;
  };
  dashboard: {
    heroEyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    configurePlaybook: string;
    userGuide: string;
    onboardingTitle: string;
    onboardingDesc: string;
    startTutorialBtn: string;
    launchGuidedDemoBtn: string;
    kpiAuditedLabel: string;
    kpiAuditedWord: string;
    kpiPlaybooksLabel: string;
    kpiPlaybooksSub: string;
    kpiRisksLabel: string;
    kpiRisksBadge: string;
    kpiSpeedLabel: string;
    kpiSpeedSub: string;
    showcaseBadge: string;
    showcaseTitle: string;
    showcaseDesc: string;
    showcaseRisksHeading: string;
    showcaseRisk1: string;
    showcaseRisk2: string;
    showcaseRisk3: string;
    launchSampleStudioBtn: string;
    tableTitle: string;
    tableSubtitle: string;
    recordSingular: string;
    recordPlural: string;
    loadingDocs: string;
    emptyTitle: string;
    emptyDesc: string;
    colDocTitle: string;
    colStatus: string;
    colClauses: string;
    colVersion: string;
    colDate: string;
    colWorkspace: string;
    clausesSuffix: string;
    openInStudioBtn: string;
  };
  upload: {
    maxSizeNote: string;
    dropTitle: string;
    dropSubtitle: string;
    browseFilesBtn: string;
    docTitleLabel: string;
    docTitlePlaceholder: string;
    readyToParse: string;
    uploadSubmitBtn: string;
    stageUploading: string;
    stageParsing: string;
    stageOpening: string;
    stageUploadingSub: string;
    stageParsingSub: string;
    stageOpeningSub: string;
    stepUpload: string;
    stepSegmentation: string;
    stepLaunch: string;
    unsupportedFileError: string;
  };
  studio: {
    backToDashboard: string;
    stanceStrict: string;
    stanceBalanced: string;
    stanceCommercial: string;
    stanceStrictTitle: string;
    stanceBalancedTitle: string;
    stanceCommercialTitle: string;
    analyzeContract: string;
    auditing: string;
    upload: string;
    trackChangesBtn: string;
    cleanBtn: string;
    playbooks: string;
    tutorial: string;
    help: string;
    exportedPrefix: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    showGuide: string;
    hideGuideTitle: string;
    conflictBadge: string;
    dismiss: string;
  };
  editor: {
    sheetEyebrow: string;
    revisionPrefix: string;
    agreementLabel: string;
    posturePrefix: string;
    provisionsSuffix: string;
    flaggedSuffix: string;
    verifiedStatus: string;
  };
  inspector: {
    title: string;
    stancePrefix: string;
    tabRedlines: string;
    tabRadar: string;
    tabTelemetry: string;
    tabAudit: string;
    streamingLabel: string;
    auditCompleteLabel: string;
    clausesUnit: string;
    filterAll: string;
    filterCritical: string;
    filterHigh: string;
    filterMedium: string;
    filterCompliant: string;
    emptyTitle: string;
    emptyDescPrefix: string;
    emptyDescSuffix: string;
    emptyAnalyzeBtn: string;
    emptyAuditingBtn: string;
    compliantSatisfies: string;
    noFilterMatches: string;
  };
  redlineCard: {
    clausePrefix: string;
    sectionPrefix: string;
    commentSingular: string;
    commentPlural: string;
    badgeVerified: string;
    badgeAutoRefined: string;
    badgeNeedsReview: string;
    talkingPointLabel: string;
    copyBtn: string;
    copiedBtn: string;
    proposedWordingLabel: string;
    hoverPreviewHint: string;
    cancelModify: string;
    saveModified: string;
    statusLabel: string;
    applyRedline: string;
    modify: string;
    reject: string;
    aiPowerTools: string;
    aiCopilotBtn: string;
    simulatePushbackBtn: string;
    simulatingBtn: string;
    criticGuardBtn: string;
    policyGrounded: string;
    policyReviewNeeded: string;
    hallucinationFree: string;
    hallucinationFlagged: string;
    obligationsPreserved: string;
    numberingAltered: string;
    verifyingBtn: string;
    reVerifyBtn: string;
  };
  radar: {
    title: string;
    subtitle: string;
    rescanBtn: string;
    scanBtn: string;
    scanningBtn: string;
    integrityScore: string;
    contradictions: string;
    brokenRefs: string;
    undefinedTerms: string;
    filterAllIssues: string;
    filterContradictions: string;
    filterBrokenRefs: string;
    filterUndefinedTerms: string;
    sourceClausePrefix: string;
    targetClausePrefix: string;
    recommendedResolution: string;
    noIssuesFilterTitle: string;
    noIssuesFilterDesc: string;
  };
  telemetry: {
    title: string;
    engineLabel: string;
    refreshBtn: string;
    purgeBtn: string;
    cacheHitRate: string;
    hitsLabel: string;
    totalLabel: string;
    cachedClausesSuffix: string;
    tokensUsedSaved: string;
    tokensSavedSuffix: string;
    avgLatency: string;
    cacheLatencySub: string;
    estSpend: string;
    avoidedSpend: string;
    savedPrefix: string;
    opBreakdownTitle: string;
    callsSuffix: string;
    recentEventsTitle: string;
    noEvents: string;
    cacheHitBadge: string;
    liveInferenceBadge: string;
  };
  audit: {
    title: string;
    eventsSuffix: string;
    empty: string;
  };
  comments: {
    discussionSuffix: string;
    commentSingular: string;
    commentPlural: string;
    collapseBtn: string;
    expandBtn: string;
    empty: string;
    placeholder: string;
    postBtn: string;
  };
  playbooks: {
    backToDashboard: string;
    title: string;
    subtitle: string;
    cancelBtn: string;
    addRuleBtn: string;
    formTitle: string;
    formHintPrefix: string;
    formHintLink: string;
    categoryLabel: string;
    categoryPlaceholder: string;
    standardLabel: string;
    standardPlaceholder: string;
    fallbackLabel: string;
    fallbackPlaceholder: string;
    triggersLabel: string;
    triggersPlaceholder: string;
    saveEmbedBtn: string;
    savingVectorsBtn: string;
    loadingRules: string;
    emptyTitle: string;
    emptyDesc: string;
    standardPosHeading: string;
    fallbackPosHeading: string;
    triggersHeading: string;
    vectorIndexed: string;
  };
  extractor: {
    badge: string;
    title: string;
    subtitle: string;
    modeText: string;
    modeFile: string;
    referenceLabel: string;
    loadSampleBtn: string;
    textPlaceholder: string;
    uploadTitle: string;
    uploadSubtitle: string;
    maxRulesLabel: string;
    autoSaveLabel: string;
    previewOnlyHint: string;
    extractingBtn: string;
    extractBtn: string;
    candidatesTitle: string;
    autoSavedStatus: string;
    previewStatus: string;
    confidenceSuffix: string;
    savedBtn: string;
    savingBtn: string;
    saveBtn: string;
  };
  help: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaDashboard: string;
    ctaPlaybooks: string;
    ctaSampleStudio: string;
    searchPlaceholder: string;
    clearBtn: string;
    tracksTitle: string;
    tracksSubtitle: string;
    guideModulesHeading: string;
    allTrackModules: string;
    proTipHeading: string;
    proTipBodyPrefix: string;
    helpGuidePill: string;
    proTipBodySuffix: string;
    noModulesMatchPrefix: string;
    noModulesMatchSuffix: string;
    tipPrefix: string;
    heatmapTitle: string;
    heatmapSubtitle: string;
    actionPrefix: string;
    templatesTitle: string;
    templatesSubtitle: string;
    copyTemplateBtn: string;
    copiedTemplateBtn: string;
    standardPosLabel: string;
    fallbackPosLabel: string;
    triggersLabel: string;
    whyItWorksLabel: string;
    exportTableTitle: string;
    exportTableSubtitle: string;
    colCapability: string;
    colTrackChanges: string;
    colClean: string;
    faqTitle: string;
    faqSubtitle: string;
    noFaqMatchPrefix: string;
    tutorialEyebrow: string;
    tutorialHeading: string;
    tutorialStepPrefix: string;
    tutorialOf: string;
    checklistHeading: string;
    previewHeading: string;
    proTipHeadingWiz: string;
    prevBtn: string;
    nextBtn: string;
    tracks: LocalizedLearningTrack[];
    tutorialStages: LocalizedTutorialStage[];
  };
  quickHelp: {
    title: string;
    subtitle: string;
    tutorialCtaPrompt: string;
    tutorialCtaBtn: string;
    tabWorkflow: string;
    tabCopilot: string;
    tabRadar: string;
    tabCritic: string;
    tabPushback: string;
    tabStance: string;
    tabHeatmap: string;
    tabExport: string;
    tabExtractor: string;
    tabTelemetry: string;
  };
}

export const TRANSLATIONS: Record<SupportedLocale, TranslationDictionary> = {
  en: {
    nav: {
      brandName: "Redline Studio",
      enterpriseTag: "ENTERPRISE",
      dashboard: "Dashboard",
      sampleStudio: "Sample Studio",
      companyPlaybook: "Company Playbook",
      helpGuide: "Help & Guide",
      liveBackend: "Live Backend",
      demoWorkspace: "Demo Workspace",
      roleAdmin: "Legal Counsel • Admin",
      authModalTitle: "Workspace Authentication",
      authModalSubtitle: "Sign in or switch organization tenant credentials.",
      emailLabel: "Corporate Email",
      passwordLabel: "Password",
      roleLabel: "Role",
      orgNameLabel: "Organization Name",
      saveSignInBtn: "Save & Sign In",
      resetDemoBtn: "Reset Demo",
    },
    dashboard: {
      heroEyebrow: "Enterprise Legal Operations",
      heroTitle: "Contract & RFP Intelligence Workspace",
      heroSubtitle:
        "Ingest counterparty agreements, benchmark clauses against your vector-indexed Company Playbook, and export executive-ready Microsoft Word Track Changes turns.",
      configurePlaybook: "Configure Playbook",
      userGuide: "User Guide",
      onboardingTitle: "New User? Start the 2-Minute Interactive Tutorial",
      onboardingDesc:
        "Walk through Golden Playbook extraction, Stance-tuned AI audits, Copilot prompting, Critic Guard verification, Pushback Simulation, and native Word Track Changes export step by step.",
      startTutorialBtn: "🎓 Start Interactive Tutorial",
      launchGuidedDemoBtn: "🚀 Launch Guided Sample Studio",
      kpiAuditedLabel: "Total Contracts Audited",
      kpiAuditedWord: "analyzed",
      kpiPlaybooksLabel: "Active Playbook Policies",
      kpiPlaybooksSub: "Hybrid Vector + BM25",
      kpiRisksLabel: "Critical Risks Identified",
      kpiRisksBadge: "Liability & AI Data",
      kpiSpeedLabel: "Avg. Clause Audit Speed",
      kpiSpeedSub: "20x concurrent stream",
      showcaseBadge: "Interactive Evaluation Showcase",
      showcaseTitle: "Master Cloud & Enterprise AI Agreement",
      showcaseDesc:
        "Explore a live pre-segmented enterprise agreement complete with Playbook deviations, inline word-level diffs, threaded comments, and OpenXML Word Track Changes export.",
      showcaseRisksHeading: "Flagged Counterparty Risks Inside",
      showcaseRisk1:
        "Critical: Asymmetric $500 vendor liability cap vs. uncapped customer exposure",
      showcaseRisk2:
        "Critical: Perpetual right to train public foundation AI models on Customer Data",
      showcaseRisk3:
        "High: Unilateral indemnification & missing SLA financial service credits",
      launchSampleStudioBtn: "Launch Sample Studio",
      tableTitle: "Recent Contracts & RFPs",
      tableSubtitle: "Agreements ingested in your organization workspace",
      recordSingular: "record",
      recordPlural: "records",
      loadingDocs: "Loading workspace agreements...",
      emptyTitle: "No contracts uploaded yet",
      emptyDesc:
        "Drop a .docx or .pdf above or launch the Sample Studio to start redlining.",
      colDocTitle: "Document Title",
      colStatus: "Status",
      colClauses: "Clauses",
      colVersion: "Version",
      colDate: "Ingested Date",
      colWorkspace: "Workspace",
      clausesSuffix: "clauses",
      openInStudioBtn: "Open in Studio",
    },
    upload: {
      maxSizeNote: "Up to 25 MB · Encrypted Ingestion",
      dropTitle: "Drop a third-party contract or RFP to begin review",
      dropSubtitle:
        "Automatically segments hierarchical clauses, preserves legal section numbering, and prepares provisions for Playbook benchmarking.",
      browseFilesBtn: "Browse Local Files",
      docTitleLabel: "Agreement Title",
      docTitlePlaceholder: "e.g. Master Cloud Services Agreement 2026",
      readyToParse: "Ready to parse",
      uploadSubmitBtn: "Upload & Open Studio",
      stageUploading: "1. Uploading contract to secure workspace...",
      stageParsing: "2. Parsing & segmenting hierarchical clauses...",
      stageOpening: "3. Opening Split-Screen Redlining Studio...",
      stageUploadingSub: "Validating OpenXML / PDF integrity and streaming bytes",
      stageParsingSub:
        "Preserving legal numbering (1.1, Article IV) and sub-clauses",
      stageOpeningSub: "Binding clauses to Playbook vector index",
      stepUpload: "Upload",
      stepSegmentation: "Clause Segmentation",
      stepLaunch: "Studio Launch",
      unsupportedFileError:
        "Unsupported file format. Please upload a .docx or .pdf contract.",
    },
    studio: {
      backToDashboard: "Dashboard",
      stanceStrict: "Strict",
      stanceBalanced: "Balanced",
      stanceCommercial: "Commercial",
      stanceStrictTitle:
        "Strict / Protective Posture: Zero-compromise standard playbook enforcement",
      stanceBalancedTitle:
        "Balanced / Mutual Posture (Default): Bilateral terms protecting core boundaries",
      stanceCommercialTitle:
        "Commercial / Fast-Close Posture: Pre-approved fallback positions for rapid deal velocity",
      analyzeContract: "Analyze Contract",
      auditing: "Auditing...",
      upload: "Upload",
      trackChangesBtn: "Track Changes (.docx)",
      cleanBtn: "Clean (.docx)",
      playbooks: "Playbooks",
      tutorial: "🎓 Tutorial",
      help: "? Quick Help",
      exportedPrefix: "Exported:",
      step1: "1. Upload / Select Contract",
      step2: "2. Stance & Audit",
      step3: "3. Review Clauses",
      step4: "4. Export Word (.docx)",
      showGuide: "Show 4-step workflow guide",
      hideGuideTitle: "Hide workflow steps",
      conflictBadge: "409 Conflict",
      dismiss: "Dismiss",
    },
    editor: {
      sheetEyebrow: "Confidential Legal Review Instrument",
      revisionPrefix: "Revision",
      agreementLabel: "Commercial Agreement",
      posturePrefix: "Posture:",
      provisionsSuffix: "Provisions",
      flaggedSuffix: "Flagged",
      verifiedStatus: "Verified",
    },
    inspector: {
      title: "AI Redline Inspector",
      stancePrefix: "Stance:",
      tabRedlines: "Redlines",
      tabRadar: "Radar",
      tabTelemetry: "⚡ AI Telemetry",
      tabAudit: "Audit Trail",
      streamingLabel: "Streaming LangChain Clause Evaluation...",
      auditCompleteLabel: "AI Playbook Audit Complete",
      clausesUnit: "clauses",
      filterAll: "All",
      filterCritical: "Critical",
      filterHigh: "High",
      filterMedium: "Medium",
      filterCompliant: "Compliant",
      emptyTitle: "Ready for Playbook Benchmarking",
      emptyDescPrefix: "This agreement contains",
      emptyDescSuffix:
        "segmented provisions. Run AI analysis to evaluate liability caps, indemnification, SLAs, and data governance against your Company Playbook.",
      emptyAnalyzeBtn: "Analyze Contract with AI",
      emptyAuditingBtn: "Auditing Clauses...",
      compliantSatisfies:
        "Satisfies company Playbook standards with zero unacceptable triggers.",
      noFilterMatches: "No clauses match the selected risk filter.",
    },
    redlineCard: {
      clausePrefix: "Clause",
      sectionPrefix: "Section",
      commentSingular: "Comment",
      commentPlural: "Comments",
      badgeVerified: "Verified",
      badgeAutoRefined: "Auto-Refined",
      badgeNeedsReview: "Review Needed",
      talkingPointLabel: "Negotiation Talking Point",
      copyBtn: "Copy",
      copiedBtn: "Copied",
      proposedWordingLabel: "Proposed Playbook Wording",
      hoverPreviewHint: "Hover Apply to preview inline diff",
      cancelModify: "Cancel",
      saveModified: "Save Modified Redline",
      statusLabel: "Status:",
      applyRedline: "Apply Redline",
      modify: "Modify",
      reject: "Reject",
      aiPowerTools: "AI Power Tools",
      aiCopilotBtn: "✨ AI Copilot",
      simulatePushbackBtn: "🎯 Simulate Pushback",
      simulatingBtn: "Simulating...",
      criticGuardBtn: "🛡️ Critic Guard",
      policyGrounded: "✓ Policy Grounded",
      policyReviewNeeded: "Policy Review Needed",
      hallucinationFree: "✓ Hallucination-Free",
      hallucinationFlagged: "Hallucination Flagged",
      obligationsPreserved: "✓ Obligations & Numbering Preserved",
      numberingAltered: "Numbering Altered",
      verifyingBtn: "Verifying...",
      reVerifyBtn: "Re-Verify with Critic",
    },
    radar: {
      title: "Cross-Clause Integrity & Contradiction Radar",
      subtitle:
        "Multi-clause graph analysis across obligations, section citations & terms",
      rescanBtn: "Re-Scan Integrity",
      scanBtn: "Scan Cross-Clause Integrity",
      scanningBtn: "Scanning Graph...",
      integrityScore: "Integrity Score",
      contradictions: "Contradictions",
      brokenRefs: "Broken Refs",
      undefinedTerms: "Undefined Terms",
      filterAllIssues: "All Issues",
      filterContradictions: "Contradictions",
      filterBrokenRefs: "Broken Refs",
      filterUndefinedTerms: "Undefined Terms",
      sourceClausePrefix: "Source: Clause",
      targetClausePrefix: "Conflicts with: Clause",
      recommendedResolution: "Recommended Resolution",
      noIssuesFilterTitle: "No Structural Issues Found",
      noIssuesFilterDesc:
        "No contradictions, dangling section citations, or undefined terms detected in this category.",
    },
    telemetry: {
      title: "AI Telemetry & FinOps Semantic Cache",
      engineLabel: "Engine:",
      refreshBtn: "↻ Refresh Telemetry",
      purgeBtn: "Purge Semantic Cache",
      cacheHitRate: "Semantic Cache Hit Rate",
      hitsLabel: "Hits",
      totalLabel: "Total",
      cachedClausesSuffix: "Cached Clauses",
      tokensUsedSaved: "Tokens Used & Saved",
      tokensSavedSuffix: "Tokens Saved",
      avgLatency: "Avg AI Latency",
      cacheLatencySub: "Sub-millisecond (<1ms) on SHA-256 semantic cache hits",
      estSpend: "Est. FinOps Spend",
      avoidedSpend: "Avoided Spend:",
      savedPrefix: "Saved",
      opBreakdownTitle: "Operation FinOps Breakdown",
      callsSuffix: "calls",
      recentEventsTitle: "Recent AI Invocations & Cache Stream",
      noEvents:
        "No AI operations recorded yet. Trigger a contract audit or AI action to stream FinOps telemetry.",
      cacheHitBadge: "⚡ CACHE HIT (<1ms)",
      liveInferenceBadge: "LIVE INFERENCE",
    },
    audit: {
      title: "Immutable Compliance Audit Trail",
      eventsSuffix: "events",
      empty: "No compliance audit events recorded yet.",
    },
    comments: {
      discussionSuffix: "Discussion",
      commentSingular: "comment",
      commentPlural: "comments",
      collapseBtn: "▲ Collapse",
      expandBtn: "▼ Expand",
      empty: "No review notes on this clause yet. Add a comment below.",
      placeholder: "Add an attorney review note on Clause",
      postBtn: "Post",
    },
    playbooks: {
      backToDashboard: "Back to Dashboard",
      title: "Company Playbook Rules Manager",
      subtitle:
        "Define corporate baseline standards, pre-approved fallback boundaries, and deal-breaker triggers. Every rule is automatically vector-indexed (1536-d cosine + BM25 lexical search) for real-time clause auditing.",
      cancelBtn: "Cancel",
      addRuleBtn: "Add New Playbook Rule",
      formTitle: "Create Corporate Playbook Policy",
      formHintPrefix: "Need inspiration? Browse copyable templates in the",
      formHintLink: "Help & Guide",
      categoryLabel: "Clause Category / Legal Subject",
      categoryPlaceholder:
        "e.g. Limitation of Liability, Indemnification, Data Privacy & AI...",
      standardLabel: "Standard Position (Preferred Corporate Baseline)",
      standardPlaceholder:
        "e.g. Mutual 12 months fees paid cap; mutual waiver of consequential damages...",
      fallbackLabel: "Fallback Position (Authorized Negotiating Floor)",
      fallbackPlaceholder:
        "e.g. Mutual 2x annual contract value super-cap for confidentiality and IP...",
      triggersLabel: "Unacceptable Triggers (Red-Flag Escalation Phrases)",
      triggersPlaceholder:
        "e.g. unlimited liability, uncapped liability, consequential damages, train public foundation models...",
      saveEmbedBtn: "Save Rule & Embed Vectors",
      savingVectorsBtn: "Generating Vectors...",
      loadingRules: "Loading corporate playbook knowledge base...",
      emptyTitle: "No playbook rules configured yet",
      emptyDesc:
        'Click "Add New Playbook Rule" above to define your corporate negotiation standards.',
      standardPosHeading: "Standard Position",
      fallbackPosHeading: "Fallback Position",
      triggersHeading: "Unacceptable Triggers",
      vectorIndexed: "1536-d Vector Indexed",
    },
    extractor: {
      badge: "AI Feature #6 — Golden Contract Auto-Extractor",
      title: "Generate Playbook Rules from a Golden Contract",
      subtitle:
        "Paste approved MSA clauses or upload a signed .docx / .pdf template. The AI distills standard positions, fallback boundaries, and counterparty red-flag triggers, then automatically embeds and indexes them.",
      modeText: "Paste Clauses",
      modeFile: "Upload DOCX/PDF",
      referenceLabel: "Approved Golden Contract / Template Clauses",
      loadSampleBtn: "Load Sample Golden MSA",
      textPlaceholder:
        "Paste standard contract sections (Limitation of Liability, Indemnification, SLA, Data Governance, Termination)...",
      uploadTitle: "Upload Golden Agreement (.docx or .pdf)",
      uploadSubtitle:
        "Extracts clean clauses and distills your approved Playbook policies automatically.",
      maxRulesLabel: "Max Rules:",
      autoSaveLabel: "Auto-save & index to Playbook (1536-d)",
      previewOnlyHint: "Preview Mode only — review before saving",
      extractingBtn: "Extracting Playbook Rules...",
      extractBtn: "✨ Auto-Extract Playbook Rules",
      candidatesTitle: "Extracted",
      autoSavedStatus: "Auto-Saved & Indexed",
      previewStatus: "Preview Mode",
      confidenceSuffix: "% confidence",
      savedBtn: "Saved to Playbook",
      savingBtn: "Saving...",
      saveBtn: "+ Save to Playbook",
    },
    help: {
      eyebrow: "Interactive User Guide & LegalTech Manual",
      title: "Master the Contract & RFP Redlining Studio",
      subtitle:
        "Practical guidance for legal counsel, contract managers, procurement leads, and technical reviewers on Playbook authoring, surgical redlining, and OpenXML Word exports.",
      ctaDashboard: "Go to Upload Dashboard",
      ctaPlaybooks: "Manage Company Playbook",
      ctaSampleStudio: "Launch Sample Studio",
      searchPlaceholder:
        "Search guide topics, Playbook templates, heatmap colors, Track Changes, or 409 conflicts...",
      clearBtn: "Clear",
      tracksTitle: "Structured Learning Tracks & Reference Library",
      tracksSubtitle: "Filter all 14 product modules by workflow focus area",
      guideModulesHeading: "Guide Modules",
      allTrackModules: "All Track Modules",
      proTipHeading: "Reviewer Pro-Tip",
      proTipBodyPrefix: "Inside the Redlining Studio, click",
      helpGuidePill: "Help Guide",
      proTipBodySuffix:
        "in the top toolbar to open a compact reference drawer without losing your active clause focus.",
      noModulesMatchPrefix: "No user guide modules matched",
      noModulesMatchSuffix: "Try clearing the search filter.",
      tipPrefix: "Tip:",
      heatmapTitle: "Visual Guide: Risk Heatmap Gutter & Surgical Inline Diffs",
      heatmapSubtitle:
        "Understand what each severity indicator in the left-hand Risk Map represents and how word-level redlines are previewed.",
      actionPrefix: "Action:",
      templatesTitle: "Copyable Company Playbook Rule Templates",
      templatesSubtitle:
        "Use these enterprise policy templates when adding rules in the Playbook Manager (/playbooks).",
      copyTemplateBtn: "Copy Template",
      copiedTemplateBtn: "Copied to Clipboard",
      standardPosLabel: "Standard Position:",
      fallbackPosLabel: "Fallback Position:",
      triggersLabel: "Unacceptable Triggers:",
      whyItWorksLabel: "Why it works:",
      exportTableTitle:
        "Word Export Modes: Track Changes (.docx) vs. Clean (.docx)",
      exportTableSubtitle:
        "Choose the right Microsoft Word export mode at the end of your review cycle.",
      colCapability: "Capability / Dimension",
      colTrackChanges: "Export Track Changes (.docx)",
      colClean: "Export Clean (.docx)",
      faqTitle: "Frequently Asked Questions (FAQ)",
      faqSubtitle:
        "Quick answers on workspace sessions, Playbook indexing, optimistic concurrency locks, and Word compatibility.",
      noFaqMatchPrefix: "No FAQ items matched",
      tutorialEyebrow: "Interactive 5-Stage Product Masterclass",
      tutorialHeading: "Learn the Entire Redlining Workflow in 2 Minutes",
      tutorialStepPrefix: "Step",
      tutorialOf: "of",
      checklistHeading: "What You Will Do",
      previewHeading: "Interactive Visual Preview",
      proTipHeadingWiz: "Pro Tip for Legal & Technical Teams:",
      prevBtn: "Previous Step",
      nextBtn: "Next Step",
      tracks: [
        {
          id: "ALL",
          label: "All Guides (14)",
          testId: "track-filter-all",
          description: "Complete 14-module platform reference library",
        },
        {
          id: "onboarding",
          label: "1. Getting Started & Playbooks",
          testId: "track-filter-onboarding",
          description: "Contract ingestion, manual rules & Golden Contract extraction",
        },
        {
          id: "studio",
          label: "2. Studio & Word Export",
          testId: "track-filter-studio",
          description: "Split-pane diff review, 409 locks & Track Changes .docx export",
        },
        {
          id: "ai-agents",
          label: "3. AI Agents & Negotiation",
          testId: "track-filter-ai-agents",
          description: "Stance postures, AI Copilot, Critic Guard, Radar & Pushback Sim",
        },
        {
          id: "ops",
          label: "4. Security, Vault & FinOps",
          testId: "track-filter-ops",
          description: "Model Switcher, AES-256 Vault, SHA-256 Cache & AI Telemetry",
        },
      ],
      tutorialStages: [
        {
          index: 0,
          id: "playbook-setup",
          shortTitle: "Playbook Setup",
          title: "Stage 1: Build or Auto-Extract Your Company Playbook",
          subtitle:
            "Establish corporate legal guardrails before auditing agreements, or import a signed Golden MSA in one click.",
          checklist: [
            "Open the Company Playbooks Manager (/playbooks) to inspect pre-seeded policies.",
            "Click 'Load Sample Golden MSA' (or upload a signed .docx/.pdf contract) in the AI Playbook Auto-Extractor.",
            "Click 'Auto-Extract Playbook Rules' to generate Standard Positions, Fallback Positions, Triggers, and 1536-d search vectors.",
          ],
          visualPreview: {
            badge: "Golden MSA -> Playbook Rule",
            promptOrInputLabel: "Golden Clause Input",
            promptOrInput:
              "1. Limitation of Liability. Neither party's aggregate liability shall exceed 12 months of fees paid...",
            outputLabel: "Auto-Extracted Structured Policy",
            output:
              "Category: Liability (97% confidence) | Triggers: 'unlimited liability, cap below $10,000' | 1536-d Vector Indexed",
          },
          proTip:
            "Legal Counsel and Technical Leads can uncheck 'Auto-save' to review candidates in safe Preview Mode before an ADMIN commits them organization-wide.",
          ctaLabel: "Try Playbook Extractor Live",
          ctaHref: "/playbooks",
        },
        {
          index: 1,
          id: "upload-and-engine",
          shortTitle: "Upload & AI Engine",
          title: "Stage 2: Upload Your Contract & Configure AI Engine",
          subtitle:
            "Ingest counterparty .docx or .pdf contracts while preserving legal numbering, and connect any Cloud or Local LLM dynamically.",
          checklist: [
            "Drag and drop a counterparty .docx or .pdf contract onto the Dashboard upload zone (or launch Sample Studio).",
            "Click the AI Engine badge in the top toolbar to open Settings, choose Gemini, Groq, OpenAI, Anthropic, or Ollama, and click 'Fetch Live Models'.",
            "Export your provider keys and model IDs into a passphrase-protected .rsvault.json encrypted vault for future sessions.",
          ],
          visualPreview: {
            badge: "Zero-Restart Provider Switcher",
            promptOrInputLabel: "Live Model Discovery & Vault",
            promptOrInput:
              "Provider: Gemini / Groq / Ollama -> Click 'Fetch Live Models' -> Run Connection Test (<200ms)",
            outputLabel: "AEAD Vault Artifact (.rsvault.json)",
            output:
              "AES-256-GCM + PBKDF2-HMAC-SHA256 (600k iterations) encrypted locally; raw API keys never appear in GET responses.",
          },
          proTip:
            "Wait until live connection testing turns emerald ('Verified') before auditing sensitive enterprise deals, and use your offline deterministic engine anytime for instant demos.",
          ctaLabel: "Open Upload Dashboard",
          ctaHref: "/",
        },
        {
          index: 2,
          id: "stance-and-audit",
          shortTitle: "Stance & Live Audit",
          title: "Stage 3: Choose Negotiation Stance & Run Live AI Audit",
          subtitle:
            "Calibrate redlining aggressiveness to the deal context and navigate flagged risks via the color-coded Risk Heatmap.",
          checklist: [
            "Pick Strict (zero-compromise standard), Balanced (reciprocal bilateral), or Commercial (fast-close fallback) in the Studio header.",
            "Click 'Analyze Contract with AI' to stream Playbook-grounded clause evaluations in real time via SSE.",
            "Use the left Risk Heatmap Gutter (Crimson = Critical, Amber = High, Sky = Medium, Emerald = Compliant) to jump straight to risky clauses.",
          ],
          visualPreview: {
            badge: "Negotiation Posture Selector",
            promptOrInputLabel: "Counterparty Clause ($500 Cap vs. 2x Fallback)",
            promptOrInput:
              "Vendor aggregate liability shall not exceed $500; Customer indemnity is uncapped.",
            outputLabel: "Stance-Differentiated Audit Output",
            output:
              "STRICT: CRITICAL — Enforce 12-month cap | COMMERCIAL: HIGH — Adopt pre-approved 2x fees cap for fast close.",
          },
          proTip:
            "Changing stance automatically keys a separate semantic cache entry so switching from Balanced to Commercial immediately generates fresh stance-tailored wording.",
          ctaLabel: "Launch Sample Studio",
          ctaHref: "/documents/demo",
        },
        {
          index: 3,
          id: "redlining-power-tools",
          shortTitle: "Clause Power Tools",
          title:
            "Stage 4: Master Clause Redlining (Inline Diff, AI Copilot, Critic Guard & Pushback Sim)",
          subtitle:
            "Preview word-level deletions/insertions, steer wording conversationally, verify hallucination gates, and rehearse opposing counsel pushback.",
          checklist: [
            "Hover over 'Apply Redline' on any RedlineCard to inspect live word-level strikethrough deletions and emerald insertions inside the document.",
            "Open '✨ AI Copilot' in the AI Power Tools bar to steer wording (e.g., 'Cap liability at $100,000') or review '🛡️ Critic Guard' verification gates.",
            "Click '🎯 Simulate Pushback' to forecast opposing counsel acceptance odds (0-100%), copy Round-2 rebuttals, or apply Fallback Compromise wording in 1 click.",
          ],
          visualPreview: {
            badge: "Progressive Disclosure AI Drawers",
            promptOrInputLabel: "✨ AI Copilot Prompt + Critic Guard",
            promptOrInput:
              "Prompt: 'Add 30-day written notice and cure period' -> Critic Gates: ✓ Policy Grounded | ✓ Hallucination-Free",
            outputLabel: "🎯 Counterparty Pushback Simulator",
            output:
              "Acceptance Likelihood: 78% (MODERATE) -> Round-2 Rebuttal Ready -> One-Click 'Use Compromise Wording'",
          },
          proTip:
            "Only one heavy AI drawer (Copilot or Pushback Simulator) opens at a time inside each RedlineCard, keeping your visual workspace clutter-free.",
          ctaLabel: "Practice Redlining in Studio",
          ctaHref: "/documents/demo",
        },
        {
          index: 4,
          id: "radar-finops-export",
          shortTitle: "Radar, FinOps & Export",
          title:
            "Stage 5: Run Cross-Clause Radar, Check FinOps Telemetry & Export to Word",
          subtitle:
            "Eliminate document-wide contradictions before signing, verify <1ms cache savings, and generate native Word Track Changes.",
          checklist: [
            "Switch the right Inspector to 'Radar' and click 'Scan Document Integrity' to catch conflicting liability caps, dangling section references, and undefined terms.",
            "Open '⚡ AI Telemetry' to inspect Cache Hit Rate %, Tokens Saved, Avoided USD Spend, and purge the SHA-256 cache if needed.",
            "Click 'Export Track Changes (.docx)' for opposing-counsel redline review (<w:ins>/<w:del>) or 'Export Clean (.docx)' for final signature.",
          ],
          visualPreview: {
            badge: "Integrity + FinOps + OpenXML",
            promptOrInputLabel: "Radar & SHA-256 Semantic Cache",
            promptOrInput:
              "Radar Score: 82/100 (1 broken Section 9.4 ref caught) | Re-Audit Hit Rate: 80.0% (<1ms latency)",
            outputLabel: "Native Word Export Output",
            output:
              "Exports clean final text or native OpenXML <w:ins>/<w:del> revisions plus threaded margin comments.",
          },
          proTip:
            "Open exported Track Changes files directly in Microsoft Word, Google Docs, or LibreOffice Writer—reviewers see your exact edits attributed cleanly.",
          ctaLabel: "Open Studio Radar & Export",
          ctaHref: "/documents/demo",
        },
      ],
    },
    quickHelp: {
      title: "Studio Quick-Reference Guide",
      subtitle:
        "Contextual cheat-sheet for AI redlining tools, FinOps cache, and Word exports",
      tutorialCtaPrompt:
        "Want a hands-on 5-stage walkthrough of all AI capabilities?",
      tutorialCtaBtn: "Launch Full Interactive Tutorial (/help)",
      tabWorkflow: "1. Workflow",
      tabCopilot: "2. ✨ AI Copilot",
      tabRadar: "3. 🎯 Radar",
      tabCritic: "4. 🛡️ Critic Guard",
      tabPushback: "5. 🎯 Pushback Sim",
      tabStance: "6. AI Stances",
      tabHeatmap: "7. Risk Heatmap",
      tabExport: "8. Export (.docx)",
      tabExtractor: "9. ✨ Golden Extractor",
      tabTelemetry: "10. ⚡ AI Telemetry",
    },
  },
  es: {
    nav: {
      brandName: "Redline Studio",
      enterpriseTag: "ENTERPRISE",
      dashboard: "Panel",
      sampleStudio: "Estudio Demo",
      companyPlaybook: "Políticas",
      helpGuide: "Ayuda y Guía",
      liveBackend: "Backend Activo",
      demoWorkspace: "Espacio Demo",
      roleAdmin: "Asesor Legal • Admin",
      authModalTitle: "Autenticación del Espacio",
      authModalSubtitle:
        "Inicia sesión o cambia las credenciales de tu organización.",
      emailLabel: "Correo Corporativo",
      passwordLabel: "Contraseña",
      roleLabel: "Rol",
      orgNameLabel: "Nombre de la Organización",
      saveSignInBtn: "Guardar e Iniciar",
      resetDemoBtn: "Restablecer Demo",
    },
    dashboard: {
      heroEyebrow: "Operaciones Legales Empresariales",
      heroTitle: "Centro de Inteligencia Contractual y RFP",
      heroSubtitle:
        "Ingesta contratos de contrapartes, audita cláusulas frente a tu Playbook indexado vectorialmente y exporta revisiones ejecutivas con Control de Cambios en Word.",
      configurePlaybook: "Configurar Políticas",
      userGuide: "Guía de Uso",
      onboardingTitle: "¿Nuevo Usuario? Inicia el Tutorial Interactivo de 2 Minutos",
      onboardingDesc:
        "Recorre paso a paso la extracción de contratos modelo, auditoría según postura, Copiloto IA, verificación Critic Guard, simulación de objeciones y exportación a Word.",
      startTutorialBtn: "🎓 Iniciar Tutorial Interactivo",
      launchGuidedDemoBtn: "🚀 Abrir Estudio Demo Guiado",
      kpiAuditedLabel: "Contratos Auditados",
      kpiAuditedWord: "analizados",
      kpiPlaybooksLabel: "Políticas Activas",
      kpiPlaybooksSub: "Vector Híbrido + BM25",
      kpiRisksLabel: "Riesgos Críticos Detectados",
      kpiRisksBadge: "Responsabilidad e IA",
      kpiSpeedLabel: "Velocidad Media por Cláusula",
      kpiSpeedSub: "Streaming paralelo 20x",
      showcaseBadge: "Demostración Interactiva",
      showcaseTitle: "Contrato Marco Cloud e IA Empresarial",
      showcaseDesc:
        "Explora un acuerdo segmentado en vivo con desviaciones del Playbook, comparativas palabra por palabra, comentarios y exportación OpenXML con Control de Cambios.",
      showcaseRisksHeading: "Riesgos Detectados de Contraparte",
      showcaseRisk1:
        "Crítico: Límite asimétrico de $500 del proveedor frente a responsabilidad ilimitada del cliente",
      showcaseRisk2:
        "Crítico: Derecho perpetuo para entrenar modelos públicos de IA con datos del cliente",
      showcaseRisk3:
        "Alto: Indemnidad unilateral y ausencia de créditos financieros por SLA",
      launchSampleStudioBtn: "Abrir Estudio Demo",
      tableTitle: "Contratos y RFPs Recientes",
      tableSubtitle: "Acuerdos ingresados en el espacio de tu organización",
      recordSingular: "registro",
      recordPlural: "registros",
      loadingDocs: "Cargando acuerdos del espacio de trabajo...",
      emptyTitle: "Aún no hay contratos cargados",
      emptyDesc:
        "Suelta un archivo .docx o .pdf arriba o abre el Estudio Demo para comenzar.",
      colDocTitle: "Título del Documento",
      colStatus: "Estado",
      colClauses: "Cláusulas",
      colVersion: "Versión",
      colDate: "Fecha de Ingreso",
      colWorkspace: "Espacio",
      clausesSuffix: "cláusulas",
      openInStudioBtn: "Abrir en Estudio",
    },
    upload: {
      maxSizeNote: "Hasta 25 MB · Ingesta Cifrada",
      dropTitle: "Suelta un contrato o RFP para iniciar la revisión",
      dropSubtitle:
        "Segmenta cláusulas jerárquicas automáticamente, conserva la numeración legal y prepara las disposiciones para el análisis frente al Playbook.",
      browseFilesBtn: "Examinar Archivos",
      docTitleLabel: "Título del Acuerdo",
      docTitlePlaceholder: "ej. Contrato Marco de Servicios Cloud 2026",
      readyToParse: "Listo para procesar",
      uploadSubmitBtn: "Subir y Abrir Estudio",
      stageUploading: "1. Subiendo contrato al espacio seguro...",
      stageParsing: "2. Analizando y segmentando cláusulas jerárquicas...",
      stageOpening: "3. Abriendo Estudio de Redacción Dual...",
      stageUploadingSub: "Validando integridad OpenXML / PDF",
      stageParsingSub: "Conservando numeración legal (1.1, Artículo IV)",
      stageOpeningSub: "Vinculando cláusulas al índice vectorial del Playbook",
      stepUpload: "Carga",
      stepSegmentation: "Segmentación",
      stepLaunch: "Inicio de Estudio",
      unsupportedFileError:
        "Formato no compatible. Por favor sube un archivo .docx o .pdf.",
    },
    studio: {
      backToDashboard: "Panel",
      stanceStrict: "Estricto",
      stanceBalanced: "Equilibrado",
      stanceCommercial: "Comercial",
      stanceStrictTitle:
        "Postura Estricta / Protectora: Aplicación sin concesiones del Playbook corporativo",
      stanceBalancedTitle:
        "Postura Equilibrada / Mutua: Términos bilaterales que protegen límites clave",
      stanceCommercialTitle:
        "Postura Comercial / Cierre Rápido: Posiciones alternativas preaprobadas",
      analyzeContract: "Analizar Contrato",
      auditing: "Auditando...",
      upload: "Subir",
      trackChangesBtn: "Control Cambios (.docx)",
      cleanBtn: "Copia Limpia (.docx)",
      playbooks: "Políticas",
      tutorial: "🎓 Tutorial",
      help: "? Ayuda",
      exportedPrefix: "Exportado:",
      step1: "1. Subir / Elegir Contrato",
      step2: "2. Postura y Auditoría",
      step3: "3. Revisar Cláusulas",
      step4: "4. Exportar Word (.docx)",
      showGuide: "Mostrar guía de 4 pasos",
      hideGuideTitle: "Ocultar pasos del flujo",
      conflictBadge: "Conflicto 409",
      dismiss: "Cerrar",
    },
    editor: {
      sheetEyebrow: "Instrumento Confidencial de Revisión Legal",
      revisionPrefix: "Revisión",
      agreementLabel: "Contrato Comercial",
      posturePrefix: "Postura:",
      provisionsSuffix: "Cláusulas",
      flaggedSuffix: "Observadas",
      verifiedStatus: "Verificado",
    },
    inspector: {
      title: "Inspector IA de Redacción",
      stancePrefix: "Postura:",
      tabRedlines: "Cambios",
      tabRadar: "Radar",
      tabTelemetry: "⚡ Telemetría IA",
      tabAudit: "Auditoría",
      streamingLabel: "Evaluando cláusulas con LangChain en tiempo real...",
      auditCompleteLabel: "Auditoría IA Completa",
      clausesUnit: "cláusulas",
      filterAll: "Todos",
      filterCritical: "Crítico",
      filterHigh: "Alto",
      filterMedium: "Medio",
      filterCompliant: "Conforme",
      emptyTitle: "Listo para Auditoría frente al Playbook",
      emptyDescPrefix: "Este contrato contiene",
      emptyDescSuffix:
        "disposiciones segmentadas. Ejecuta el análisis IA para evaluar límites de responsabilidad, indemnidades, SLA y gobierno de datos.",
      emptyAnalyzeBtn: "Analizar Contrato con IA",
      emptyAuditingBtn: "Auditando Cláusulas...",
      compliantSatisfies:
        "Cumple los estándares del Playbook corporativo sin activadores de riesgo.",
      noFilterMatches: "Ninguna cláusula coincide con el filtro seleccionado.",
    },
    redlineCard: {
      clausePrefix: "Cláusula",
      sectionPrefix: "Sección",
      commentSingular: "Comentario",
      commentPlural: "Comentarios",
      badgeVerified: "Verificado",
      badgeAutoRefined: "Auto-Refinado",
      badgeNeedsReview: "Requiere Revisión",
      talkingPointLabel: "Argumento de Negociación",
      copyBtn: "Copiar",
      copiedBtn: "Copiado",
      proposedWordingLabel: "Redacción Propuesta del Playbook",
      hoverPreviewHint: "Pasa sobre Aplicar para ver diferencia en el texto",
      cancelModify: "Cancelar",
      saveModified: "Guardar Modificación",
      statusLabel: "Estado:",
      applyRedline: "Aplicar Cambio",
      modify: "Modificar",
      reject: "Rechazar",
      aiPowerTools: "Herramientas IA",
      aiCopilotBtn: "✨ Copiloto IA",
      simulatePushbackBtn: "🎯 Simular Objeción",
      simulatingBtn: "Simulando...",
      criticGuardBtn: "🛡️ Guardián Crítico",
      policyGrounded: "✓ Basado en Política",
      policyReviewNeeded: "Revisar Política",
      hallucinationFree: "✓ Sin Alucinaciones",
      hallucinationFlagged: "Riesgo Detectado",
      obligationsPreserved: "✓ Numeración y Obligaciones Preservadas",
      numberingAltered: "Numeración Alterada",
      verifyingBtn: "Verificando...",
      reVerifyBtn: "Reverificar con Crítico",
    },
    radar: {
      title: "Radar de Integridad y Contradicciones Cruzadas",
      subtitle:
        "Análisis gráfico multicláusula sobre obligaciones, referencias y definiciones",
      rescanBtn: "Reescanear Integridad",
      scanBtn: "Escanear Integridad Cruzada",
      scanningBtn: "Escaneando Grafo...",
      integrityScore: "Índice de Integridad",
      contradictions: "Contradicciones",
      brokenRefs: "Refs. Rotas",
      undefinedTerms: "Términos Sin Definir",
      filterAllIssues: "Todos los Hallazgos",
      filterContradictions: "Contradicciones",
      filterBrokenRefs: "Refs. Rotas",
      filterUndefinedTerms: "Sin Definir",
      sourceClausePrefix: "Origen: Cláusula",
      targetClausePrefix: "Conflicto con: Cláusula",
      recommendedResolution: "Resolución Recomendada",
      noIssuesFilterTitle: "Sin Hallazgos Estructurales",
      noIssuesFilterDesc:
        "No se detectaron contradicciones, referencias rotas ni términos sin definir en esta categoría.",
    },
    telemetry: {
      title: "Telemetría IA y Caché Semántica FinOps",
      engineLabel: "Motor:",
      refreshBtn: "↻ Actualizar Telemetría",
      purgeBtn: "Purgar Caché Semántica",
      cacheHitRate: "Tasa de Acierto de Caché",
      hitsLabel: "Aciertos",
      totalLabel: "Total",
      cachedClausesSuffix: "Cláusulas en Caché",
      tokensUsedSaved: "Tokens Usados y Ahorrados",
      tokensSavedSuffix: "Tokens Ahorrados",
      avgLatency: "Latencia Media IA",
      cacheLatencySub:
        "Submilisegundo (<1ms) en aciertos de caché semántica SHA-256",
      estSpend: "Gasto FinOps Est.",
      avoidedSpend: "Gasto Evitado:",
      savedPrefix: "Ahorro",
      opBreakdownTitle: "Desglose por Operación",
      callsSuffix: "llamadas",
      recentEventsTitle: "Invocaciones Recientes y Caché",
      noEvents:
        "Aún no hay operaciones IA registradas. Inicia una auditoría para transmitir telemetría FinOps.",
      cacheHitBadge: "⚡ CACHÉ (<1ms)",
      liveInferenceBadge: "INFERENCIA EN VIVO",
    },
    audit: {
      title: "Registro Inmutable de Auditoría y Cumplimiento",
      eventsSuffix: "eventos",
      empty: "Aún no se registran eventos de cumplimiento.",
    },
    comments: {
      discussionSuffix: "Discusión",
      commentSingular: "comentario",
      commentPlural: "comentarios",
      collapseBtn: "▲ Contraer",
      expandBtn: "▼ Expandir",
      empty: "Sin notas de revisión todavía. Añade un comentario abajo.",
      placeholder: "Añadir nota legal sobre la Cláusula",
      postBtn: "Publicar",
    },
    playbooks: {
      backToDashboard: "Volver al Panel",
      title: "Gestor de Políticas del Playbook Corporativo",
      subtitle:
        "Define posiciones estándar corporativas, límites alternativos aprobados y cláusulas inaceptables. Cada regla se indexa vectorialmente (1536-d coseno + BM25) en tiempo real.",
      cancelBtn: "Cancelar",
      addRuleBtn: "Nueva Política de Playbook",
      formTitle: "Crear Política Corporativa de Playbook",
      formHintPrefix:
        "¿Necesitas inspiración? Explora plantillas copiables en",
      formHintLink: "Ayuda y Guía",
      categoryLabel: "Categoría de Cláusula / Materia Legal",
      categoryPlaceholder:
        "ej. Limitación de Responsabilidad, Indemnidad, Privacidad e IA...",
      standardLabel: "Posición Estándar (Línea Base Preferida)",
      standardPlaceholder:
        "ej. Límite mutuo de 12 meses de tarifas pagadas; exclusión mutua de daños indirectos...",
      fallbackLabel: "Posición Alternativa (Suelo de Negociación Autorizado)",
      fallbackPlaceholder:
        "ej. Super-límite mutuo de 2x anual para confidencialidad y propiedad intelectual...",
      triggersLabel: "Activadores Inaceptables (Frases de Alerta Roja)",
      triggersPlaceholder:
        "ej. responsabilidad ilimitada, sin límite, daños consecuentes, entrenar modelos públicos...",
      saveEmbedBtn: "Guardar Regla e Indexar Vectores",
      savingVectorsBtn: "Generando Vectores...",
      loadingRules: "Cargando base de políticas corporativas...",
      emptyTitle: "Aún no hay políticas configuradas",
      emptyDesc:
        'Haz clic en "Nueva Política de Playbook" arriba para definir estándares.',
      standardPosHeading: "Posición Estándar",
      fallbackPosHeading: "Posición Alternativa",
      triggersHeading: "Activadores Inaceptables",
      vectorIndexed: "Índice Vectorial 1536-d",
    },
    extractor: {
      badge: "Función IA #6 — Auto-Extractor de Contratos Modelo",
      title: "Generar Políticas desde un Contrato Modelo (Golden MSA)",
      subtitle:
        "Pega cláusulas aprobadas o sube una plantilla firmada .docx / .pdf. La IA extrae posiciones estándar, límites alternativos y alertas de riesgo, indexándolas al instante.",
      modeText: "Pegar Cláusulas",
      modeFile: "Subir DOCX/PDF",
      referenceLabel: "Cláusulas Aprobadas de Contrato Modelo",
      loadSampleBtn: "Cargar MSA Modelo de Muestra",
      textPlaceholder:
        "Pega secciones contractuales estándar (Responsabilidad, Indemnidad, SLA, Gobernanza IA, Terminación)...",
      uploadTitle: "Subir Contrato Modelo (.docx o .pdf)",
      uploadSubtitle:
        "Extrae cláusulas limpias y genera políticas del Playbook automáticamente.",
      maxRulesLabel: "Máx. Reglas:",
      autoSaveLabel: "Autoguardar e indexar en Playbook (1536-d)",
      previewOnlyHint: "Solo Vista Previa — revisa antes de guardar",
      extractingBtn: "Extrayendo Políticas...",
      extractBtn: "✨ Extraer Políticas Automáticamente",
      candidatesTitle: "Extraídas",
      autoSavedStatus: "Guardado e Indexado",
      previewStatus: "Vista Previa",
      confidenceSuffix: "% confianza",
      savedBtn: "Guardado en Playbook",
      savingBtn: "Guardando...",
      saveBtn: "+ Guardar en Playbook",
    },
    help: {
      eyebrow: "Guía Interactiva y Manual LegalTech",
      title: "Domina el Estudio de Redacción de Contratos y RFP",
      subtitle:
        "Guía práctica para asesoría jurídica, responsables de compras y líderes técnicos sobre creación de Playbooks, redacción asistida por IA y exportación a Word.",
      ctaDashboard: "Ir al Panel de Carga",
      ctaPlaybooks: "Gestionar Políticas",
      ctaSampleStudio: "Abrir Estudio Demo",
      searchPlaceholder:
        "Buscar temas, plantillas de Playbook, mapa de calor, Control de Cambios o conflictos 409...",
      clearBtn: "Limpiar",
      tracksTitle: "Rutas de Aprendizaje y Biblioteca de Referencia",
      tracksSubtitle:
        "Filtra los 14 módulos de la plataforma por área de trabajo",
      guideModulesHeading: "Módulos de la Guía",
      allTrackModules: "Todos los Módulos",
      proTipHeading: "Consejo de Revisión",
      proTipBodyPrefix: "Dentro del Estudio de Redacción, haz clic en",
      helpGuidePill: "Guía de Ayuda",
      proTipBodySuffix:
        "en la barra superior para abrir la referencia rápida sin perder la cláusula activa.",
      noModulesMatchPrefix: "Ningún módulo coincidió con",
      noModulesMatchSuffix: "Prueba limpiando el filtro de búsqueda.",
      tipPrefix: "Consejo:",
      heatmapTitle:
        "Guía Visual: Mapa de Calor de Riesgos y Comparativa en Línea",
      heatmapSubtitle:
        "Comprende qué representa cada nivel de riesgo en el margen izquierdo y cómo se previsualizan los cambios.",
      actionPrefix: "Acción:",
      templatesTitle: "Plantillas Copiables de Reglas de Playbook",
      templatesSubtitle:
        "Utiliza estas plantillas corporativas al crear reglas en el Gestor de Políticas (/playbooks).",
      copyTemplateBtn: "Copiar Plantilla",
      copiedTemplateBtn: "Copiado al Portapapeles",
      standardPosLabel: "Posición Estándar:",
      fallbackPosLabel: "Posición Alternativa:",
      triggersLabel: "Activadores Inaceptables:",
      whyItWorksLabel: "Por qué funciona:",
      exportTableTitle:
        "Modos de Exportación a Word: Control de Cambios (.docx) vs. Copia Limpia (.docx)",
      exportTableSubtitle:
        "Elige el formato correcto de Microsoft Word al finalizar tu revisión.",
      colCapability: "Capacidad / Dimensión",
      colTrackChanges: "Control de Cambios (.docx)",
      colClean: "Copia Limpia (.docx)",
      faqTitle: "Preguntas Frecuentes (FAQ)",
      faqSubtitle:
        "Respuestas rápidas sobre sesiones, indexación del Playbook, bloqueos optimistas y compatibilidad Word.",
      noFaqMatchPrefix: "Ninguna pregunta frecuente coincidió con",
      tutorialEyebrow: "Clase Magistral Interactiva de 5 Etapas",
      tutorialHeading: "Aprende Todo el Flujo de Redacción en 2 Minutos",
      tutorialStepPrefix: "Paso",
      tutorialOf: "de",
      checklistHeading: "Qué Vas a Hacer",
      previewHeading: "Vista Previa Interactiva",
      proTipHeadingWiz: "Consejo para Equipos Legales y Técnicos:",
      prevBtn: "Paso Anterior",
      nextBtn: "Siguiente Paso",
      tracks: [
        {
          id: "ALL",
          label: "Todas las Guías (14)",
          testId: "track-filter-all",
          description: "Biblioteca completa de 14 módulos de referencia",
        },
        {
          id: "onboarding",
          label: "1. Inicio y Políticas",
          testId: "track-filter-onboarding",
          description:
            "Ingesta de contratos, reglas y extractor de Contrato Modelo",
        },
        {
          id: "studio",
          label: "2. Estudio y Exportación Word",
          testId: "track-filter-studio",
          description:
            "Vista dual de cambios, control 409 y Control de Cambios .docx",
        },
        {
          id: "ai-agents",
          label: "3. Agentes IA y Negociación",
          testId: "track-filter-ai-agents",
          description:
            "Posturas, Copiloto IA, Critic Guard, Radar y Simulador de Objeciones",
        },
        {
          id: "ops",
          label: "4. Seguridad, Bóveda y FinOps",
          testId: "track-filter-ops",
          description:
            "Selector de Modelos, Bóveda AES-256, Caché SHA-256 y Telemetría",
        },
      ],
      tutorialStages: [
        {
          index: 0,
          id: "playbook-setup",
          shortTitle: "Configurar Playbook",
          title: "Etapa 1: Construye o Auto-Extrae tu Playbook Corporativo",
          subtitle:
            "Establece los límites legales de tu empresa antes de auditar acuerdos o importa un MSA firmado en un clic.",
          checklist: [
            "Abre el Gestor de Políticas (/playbooks) para revisar las reglas preconfiguradas.",
            "Haz clic en 'Cargar MSA Modelo' (o sube un .docx/.pdf firmado) en el Auto-Extractor.",
            "Pulsa 'Extraer Políticas Automáticamente' para generar Posiciones Estándar, Alternativas y vectores 1536-d.",
          ],
          visualPreview: {
            badge: "MSA Modelo -> Política",
            promptOrInputLabel: "Cláusula Modelo de Entrada",
            promptOrInput:
              "1. Limitación de Responsabilidad. La responsabilidad agregada de ninguna parte excederá 12 meses de tarifas...",
            outputLabel: "Política Estructurada Extraída",
            output:
              "Categoría: Responsabilidad (97% confianza) | Índice Vectorial 1536-d",
          },
          proTip:
            "Los revisores pueden desactivar 'Autoguardar' para inspeccionar candidatos en Vista Previa antes de confirmarlos.",
          ctaLabel: "Probar Extractor en Vivo",
          ctaHref: "/playbooks",
        },
        {
          index: 1,
          id: "upload-and-engine",
          shortTitle: "Carga y Motor IA",
          title: "Etapa 2: Sube tu Contrato y Configura el Motor IA",
          subtitle:
            "Ingesta contratos .docx o .pdf preservando numeración y conecta cualquier LLM en la nube o local en tiempo real.",
          checklist: [
            "Arrastra un contrato .docx o .pdf en el Panel Principal o abre el Estudio Demo.",
            "Pulsa la insignia de Motor IA en la barra superior, elige Gemini, Groq, OpenAI, Claude u Ollama y haz clic en 'Fetch Live Models'.",
            "Exporta tus claves a una bóveda cifrada .rsvault.json protegida por frase secreta.",
          ],
          visualPreview: {
            badge: "Cambio en Caliente Sin Reinicio",
            promptOrInputLabel: "Descubrimiento y Bóveda",
            promptOrInput:
              "Proveedor: Gemini / Groq / Ollama -> Test de Conexión (<200ms)",
            outputLabel: "Archivo Bóveda AEAD (.rsvault.json)",
            output:
              "AES-256-GCM + PBKDF2-HMAC-SHA256 (600k iteraciones) cifrado localmente.",
          },
          proTip:
            "Verifica la conexión en verde antes de auditar contratos confidenciales o utiliza el motor determinista sin conexión.",
          ctaLabel: "Ir al Panel de Carga",
          ctaHref: "/",
        },
        {
          index: 2,
          id: "stance-and-audit",
          shortTitle: "Postura y Auditoría",
          title: "Etapa 3: Selecciona Postura de Negociación y Audita con IA",
          subtitle:
            "Calibra el nivel de exigencia según la operación y navega los riesgos con el Mapa de Calor.",
          checklist: [
            "Elige Estricto (sin concesiones), Equilibrado (reciprocidad bilateral) o Comercial (cierre rápido) en la cabecera del Estudio.",
            "Haz clic en 'Analizar Contrato' para recibir evaluaciones por cláusula en streaming SSE.",
            "Usa la barra de riesgo izquierda (Carmesí = Crítico, Ámbar = Alto, Verde = Conforme) para saltar directo al riesgo.",
          ],
          visualPreview: {
            badge: "Selector de Postura IA",
            promptOrInputLabel: "Cláusula de Contraparte ($500 vs. 2x)",
            promptOrInput:
              "La responsabilidad del proveedor no excederá $500; la indemnidad del cliente es ilimitada.",
            outputLabel: "Resultado Diferenciado por Postura",
            output:
              "ESTRICTO: CRÍTICO — Exigir tope de 12 meses | COMERCIAL: ALTO — Adoptar límite alternativo 2x.",
          },
          proTip:
            "Cada postura genera una clave independiente en caché semántica para recalcular redacciones al instante.",
          ctaLabel: "Abrir Estudio Demo",
          ctaHref: "/documents/demo",
        },
        {
          index: 3,
          id: "redlining-power-tools",
          shortTitle: "Herramientas Cláusula",
          title:
            "Etapa 4: Domina la Redacción (Diffs, Copiloto IA, Critic Guard y Objeciones)",
          subtitle:
            "Previsualiza cambios palabra a palabra, refina con lenguaje natural y anticipa objeciones de contraparte.",
          checklist: [
            "Coloca el cursor sobre 'Aplicar Cambio' para previsualizar inserciones y tachados en línea.",
            "Abre '✨ Copiloto IA' para ajustar límites o revisa los controles anti-alucinación en '🛡️ Guardián Crítico'.",
            "Haz clic en '🎯 Simular Objeción' para estimar aceptación (0-100%) y aplicar redacción intermedia.",
          ],
          visualPreview: {
            badge: "Paneles Progresivos IA",
            promptOrInputLabel: "✨ Copiloto IA + Guardián Crítico",
            promptOrInput:
              "Instrucción: 'Añadir preaviso de 30 días' -> ✓ Basado en Política | ✓ Sin Alucinaciones",
            outputLabel: "🎯 Simulador de Contraparte",
            output:
              "Probabilidad de Aceptación: 78% (MODERADA) -> Réplica Ronda 2 Lista.",
          },
          proTip:
            "Solo se expande un panel avanzado a la vez dentro de cada tarjeta para mantener el espacio ordenado.",
          ctaLabel: "Practicar en el Estudio",
          ctaHref: "/documents/demo",
        },
        {
          index: 4,
          id: "radar-finops-export",
          shortTitle: "Radar, FinOps y Word",
          title:
            "Etapa 5: Ejecuta Radar Cruzado, Revisa Telemetría FinOps y Exporta Word",
          subtitle:
            "Elimina contradicciones internas antes de firmar y genera documentos con Control de Cambios nativo.",
          checklist: [
            "Abre la pestaña 'Radar' en el Inspector y escanea contradicciones numéricas o referencias rotas.",
            "Consulta '⚡ Telemetría IA' para medir la tasa de acierto de caché SHA-256 (<1ms) y ahorro de costes.",
            "Descarga 'Control Cambios (.docx)' para revisión legal o 'Copia Limpia (.docx)' para firma.",
          ],
          visualPreview: {
            badge: "Integridad + FinOps + OpenXML",
            promptOrInputLabel: "Radar y Caché Semántica SHA-256",
            promptOrInput:
              "Integridad: 82/100 | Re-auditoría en Caché: 80.0% (<1ms)",
            outputLabel: "Exportación Nativa Word",
            output:
              "Genera texto final limpio o revisiones OpenXML <w:ins>/<w:del> y comentarios al margen.",
          },
          proTip:
            "Abre los archivos exportados en Microsoft Word, Google Docs o LibreOffice Writer con atribución completa.",
          ctaLabel: "Abrir Radar y Exportar",
          ctaHref: "/documents/demo",
        },
      ],
    },
    quickHelp: {
      title: "Guía Rápida del Estudio",
      subtitle:
        "Referencia contextual de herramientas IA, caché FinOps y exportación Word",
      tutorialCtaPrompt:
        "¿Quieres un recorrido práctico de 5 etapas por todas las funciones IA?",
      tutorialCtaBtn: "Abrir Tutorial Completo (/help)",
      tabWorkflow: "1. Flujo",
      tabCopilot: "2. ✨ Copiloto IA",
      tabRadar: "3. 🎯 Radar",
      tabCritic: "4. 🛡️ Guardián Crítico",
      tabPushback: "5. 🎯 Objeciones",
      tabStance: "6. Posturas IA",
      tabHeatmap: "7. Mapa de Calor",
      tabExport: "8. Exportar (.docx)",
      tabExtractor: "9. ✨ Extractor",
      tabTelemetry: "10. ⚡ Telemetría IA",
    },
  },
  fr: {
    nav: {
      brandName: "Redline Studio",
      enterpriseTag: "ENTERPRISE",
      dashboard: "Tableau de bord",
      sampleStudio: "Studio Démo",
      companyPlaybook: "Playbooks",
      helpGuide: "Aide & Guide",
      liveBackend: "Backend Actif",
      demoWorkspace: "Espace Démo",
      roleAdmin: "Juriste • Admin",
      authModalTitle: "Authentification de l'Espace",
      authModalSubtitle:
        "Connectez-vous ou changez les identifiants de votre organisation.",
      emailLabel: "E-mail Professionnel",
      passwordLabel: "Mot de passe",
      roleLabel: "Rôle",
      orgNameLabel: "Nom de l'Organisation",
      saveSignInBtn: "Enregistrer et Connexion",
      resetDemoBtn: "Réinitialiser Démo",
    },
    dashboard: {
      heroEyebrow: "Opérations Juridiques d'Entreprise",
      heroTitle: "Espace d'Intelligence Contractuelle & RFP",
      heroSubtitle:
        "Importez les contrats tiers, comparez chaque clause à votre Playbook indexé vectoriellement et exportez des révisions Word prêtes pour négociation.",
      configurePlaybook: "Configurer le Playbook",
      userGuide: "Guide Utilisateur",
      onboardingTitle:
        "Nouveau ? Lancez le Tutoriel Interactif en 2 Minutes",
      onboardingDesc:
        "Découvrez étape par étape l'extraction de contrats modèles, l'audit selon la posture, le Copilote IA, Critic Guard, la simulation de contre-arguments et l'export Word.",
      startTutorialBtn: "🎓 Lancer le Tutoriel Interactif",
      launchGuidedDemoBtn: "🚀 Ouvrir le Studio Démo Guidé",
      kpiAuditedLabel: "Contrats Audités",
      kpiAuditedWord: "analysés",
      kpiPlaybooksLabel: "Règles du Playbook",
      kpiPlaybooksSub: "Vecteur Hybride + BM25",
      kpiRisksLabel: "Risques Critiques Identifiés",
      kpiRisksBadge: "Responsabilité & IA",
      kpiSpeedLabel: "Vitesse Moy. d'Audit",
      kpiSpeedSub: "Flux parallèle 20x",
      showcaseBadge: "Démonstration Interactive",
      showcaseTitle: "Contrat-Cadre Cloud & IA d'Entreprise",
      showcaseDesc:
        "Explorez un accord pré-segmenté en direct avec écarts Playbook, diffs mot à mot en ligne, commentaires et export OpenXML avec suivi des modifications.",
      showcaseRisksHeading: "Risques Contrepartie Signalés",
      showcaseRisk1:
        "Critique : Plafond asymétrique de 500 $ côté fournisseur contre exposition illimitée du client",
      showcaseRisk2:
        "Critique : Droit perpétuel d'entraîner des modèles d'IA publics sur les données client",
      showcaseRisk3:
        "Élevé : Indemnisation unilatérale et absence de crédits SLA financiers",
      launchSampleStudioBtn: "Lancer le Studio Démo",
      tableTitle: "Contrats & RFP Récents",
      tableSubtitle: "Accords importés dans votre espace organisationnel",
      recordSingular: "dossier",
      recordPlural: "dossiers",
      loadingDocs: "Chargement des contrats...",
      emptyTitle: "Aucun contrat importé",
      emptyDesc:
        "Déposez un fichier .docx ou .pdf ci-dessus ou lancez le Studio Démo pour réviser.",
      colDocTitle: "Titre du Document",
      colStatus: "Statut",
      colClauses: "Clauses",
      colVersion: "Version",
      colDate: "Date d'Import",
      colWorkspace: "Espace",
      clausesSuffix: "clauses",
      openInStudioBtn: "Ouvrir dans Studio",
    },
    upload: {
      maxSizeNote: "Jusqu'à 25 Mo · Ingestion Chiffrée",
      dropTitle: "Déposez un contrat ou RFP pour démarrer la révision",
      dropSubtitle:
        "Segmente automatiquement les clauses hiérarchiques, préserve la numérotation juridique et prépare l'analyse face au Playbook.",
      browseFilesBtn: "Parcourir les Fichiers",
      docTitleLabel: "Titre de l'Accord",
      docTitlePlaceholder: "ex. Contrat-Cadre Services Cloud 2026",
      readyToParse: "Prêt à analyser",
      uploadSubmitBtn: "Importer & Ouvrir Studio",
      stageUploading: "1. Envoi du contrat vers l'espace sécurisé...",
      stageParsing: "2. Segmentation hiérarchique des clauses...",
      stageOpening: "3. Ouverture du Studio Double Écran...",
      stageUploadingSub: "Validation OpenXML / PDF et transfert sécurisé",
      stageParsingSub:
        "Préservation de la numérotation légale (1.1, Article IV)",
      stageOpeningSub: "Liaison des clauses à l'index vectoriel Playbook",
      stepUpload: "Import",
      stepSegmentation: "Segmentation",
      stepLaunch: "Ouverture Studio",
      unsupportedFileError:
        "Format non pris en charge. Veuillez importer un fichier .docx ou .pdf.",
    },
    studio: {
      backToDashboard: "Tableau",
      stanceStrict: "Strict",
      stanceBalanced: "Équilibré",
      stanceCommercial: "Commercial",
      stanceStrictTitle:
        "Posture Stricte / Protectrice : Application sans concession du Playbook",
      stanceBalancedTitle:
        "Posture Équilibrée / Réciproque : Termes bilatéraux protégeant les limites clés",
      stanceCommercialTitle:
        "Posture Commerciale / Vélocité : Positions de repli préapprouvées",
      analyzeContract: "Analyser le Contrat",
      auditing: "Audit en cours...",
      upload: "Importer",
      trackChangesBtn: "Suivi Modifs (.docx)",
      cleanBtn: "Copie Propre (.docx)",
      playbooks: "Playbooks",
      tutorial: "🎓 Tutoriel",
      help: "? Aide",
      exportedPrefix: "Exporté :",
      step1: "1. Importer / Choisir Contrat",
      step2: "2. Posture & Audit",
      step3: "3. Réviser Clauses",
      step4: "4. Export Word (.docx)",
      showGuide: "Afficher le guide en 4 étapes",
      hideGuideTitle: "Masquer les étapes",
      conflictBadge: "Conflit 409",
      dismiss: "Fermer",
    },
    editor: {
      sheetEyebrow: "Instrument Confidentiel de Révision Juridique",
      revisionPrefix: "Révision",
      agreementLabel: "Contrat Commercial",
      posturePrefix: "Posture :",
      provisionsSuffix: "Clauses",
      flaggedSuffix: "Signalées",
      verifiedStatus: "Vérifié",
    },
    inspector: {
      title: "Inspecteur IA de Révision",
      stancePrefix: "Posture :",
      tabRedlines: "Révisions",
      tabRadar: "Radar",
      tabTelemetry: "⚡ Télémétrie IA",
      tabAudit: "Journal",
      streamingLabel: "Évaluation LangChain des clauses en direct...",
      auditCompleteLabel: "Audit Playbook IA Terminé",
      clausesUnit: "clauses",
      filterAll: "Tout",
      filterCritical: "Critique",
      filterHigh: "Élevé",
      filterMedium: "Moyen",
      filterCompliant: "Conforme",
      emptyTitle: "Prêt pour l'Audit Playbook",
      emptyDescPrefix: "Cet accord contient",
      emptyDescSuffix:
        "clauses segmentées. Lancez l'analyse IA pour évaluer plafonds de responsabilité, indemnisations, SLA et gouvernance des données.",
      emptyAnalyzeBtn: "Analyser avec l'IA",
      emptyAuditingBtn: "Audit des Clauses...",
      compliantSatisfies:
        "Conforme aux exigences du Playbook sans élément bloquant.",
      noFilterMatches: "Aucune clause ne correspond au filtre sélectionné.",
    },
    redlineCard: {
      clausePrefix: "Clause",
      sectionPrefix: "Article",
      commentSingular: "Commentaire",
      commentPlural: "Commentaires",
      badgeVerified: "Vérifié",
      badgeAutoRefined: "Auto-Affiné",
      badgeNeedsReview: "Révision Requise",
      talkingPointLabel: "Argumentaire de Négociation",
      copyBtn: "Copier",
      copiedBtn: "Copié",
      proposedWordingLabel: "Rédaction Playbook Proposée",
      hoverPreviewHint: "Survolez Appliquer pour prévisualiser le diff",
      cancelModify: "Annuler",
      saveModified: "Enregistrer",
      statusLabel: "Statut :",
      applyRedline: "Appliquer",
      modify: "Modifier",
      reject: "Rejeter",
      aiPowerTools: "Outils IA Avancés",
      aiCopilotBtn: "✨ Copilote IA",
      simulatePushbackBtn: "🎯 Simuler Réponse",
      simulatingBtn: "Simulation...",
      criticGuardBtn: "🛡️ Garde Critique",
      policyGrounded: "✓ Conforme Politique",
      policyReviewNeeded: "Revue Requise",
      hallucinationFree: "✓ Sans Hallucination",
      hallucinationFlagged: "Risque Signalé",
      obligationsPreserved: "✓ Obligations & Numérotation Préservées",
      numberingAltered: "Numérotation Modifiée",
      verifyingBtn: "Vérification...",
      reVerifyBtn: "Revérifier avec Critique",
    },
    radar: {
      title: "Radar d'Intégrité & Contradictions Inter-Clauses",
      subtitle:
        "Analyse graphique multi-clauses des obligations, renvois et définitions",
      rescanBtn: "Relancer l'Analyse",
      scanBtn: "Scanner l'Intégrité",
      scanningBtn: "Analyse en cours...",
      integrityScore: "Score d'Intégrité",
      contradictions: "Contradictions",
      brokenRefs: "Renvois Cassés",
      undefinedTerms: "Termes Non Définis",
      filterAllIssues: "Tous les Points",
      filterContradictions: "Contradictions",
      filterBrokenRefs: "Renvois Cassés",
      filterUndefinedTerms: "Non Définis",
      sourceClausePrefix: "Source : Clause",
      targetClausePrefix: "Conflit avec : Clause",
      recommendedResolution: "Résolution Recommandée",
      noIssuesFilterTitle: "Aucune Anomalie Structurelle",
      noIssuesFilterDesc:
        "Aucune contradiction, référence manquante ni terme non défini détecté dans cette catégorie.",
    },
    telemetry: {
      title: "Télémétrie IA & Cache Sémantique FinOps",
      engineLabel: "Moteur :",
      refreshBtn: "↻ Actualiser",
      purgeBtn: "Purger le Cache Sémantique",
      cacheHitRate: "Taux de Succès Cache",
      hitsLabel: "Succès",
      totalLabel: "Total",
      cachedClausesSuffix: "Clauses en Cache",
      tokensUsedSaved: "Jetons Utilisés & Économisés",
      tokensSavedSuffix: "Jetons Économisés",
      avgLatency: "Latence Moy. IA",
      cacheLatencySub:
        "Sous la milliseconde (<1ms) sur hit cache sémantique SHA-256",
      estSpend: "Coût FinOps Est.",
      avoidedSpend: "Dépense Évitée :",
      savedPrefix: "Économie",
      opBreakdownTitle: "Répartition par Opération",
      callsSuffix: "appels",
      recentEventsTitle: "Appels IA Récents & Flux Cache",
      noEvents:
        "Aucune opération IA enregistrée. Lancez un audit pour suivre la télémétrie FinOps.",
      cacheHitBadge: "⚡ CACHE (<1ms)",
      liveInferenceBadge: "INFÉRENCE DIRECTE",
    },
    audit: {
      title: "Journal Immuable de Conformité",
      eventsSuffix: "événements",
      empty: "Aucun événement d'audit enregistré pour le moment.",
    },
    comments: {
      discussionSuffix: "Discussion",
      commentSingular: "commentaire",
      commentPlural: "commentaires",
      collapseBtn: "▲ Réduire",
      expandBtn: "▼ Déplier",
      empty: "Aucune note juridique sur cette clause. Ajoutez un commentaire ci-dessous.",
      placeholder: "Ajouter une note juridique sur la Clause",
      postBtn: "Publier",
    },
    playbooks: {
      backToDashboard: "Retour au Tableau",
      title: "Gestionnaire des Règles du Playbook",
      subtitle:
        "Définissez vos standards juridiques, positions de repli autorisées et clauses bloquantes. Chaque règle est indexée vectoriellement (cosinus 1536-d + BM25) en temps réel.",
      cancelBtn: "Annuler",
      addRuleBtn: "Nouvelle Règle Playbook",
      formTitle: "Créer une Politique d'Entreprise",
      formHintPrefix:
        "Besoin d'exemples ? Parcourez les modèles copiables dans",
      formHintLink: "Aide & Guide",
      categoryLabel: "Catégorie de Clause / Domaine Juridique",
      categoryPlaceholder:
        "ex. Limitation de Responsabilité, Indemnisation, Données & IA...",
      standardLabel: "Position Standard (Référence Corporative)",
      standardPlaceholder:
        "ex. Plafond réciproque à 12 mois d'honoraires ; renonciation mutuelle aux dommages indirects...",
      fallbackLabel: "Position de Repli (Plancher de Négociation)",
      fallbackPlaceholder:
        "ex. Super-plafond réciproque à 2x annuel pour confidentialité et PI...",
      triggersLabel: "Déclencheurs Bloquants (Alertes Rouges)",
      triggersPlaceholder:
        "ex. responsabilité illimitée, sans plafond, entraîner modèles publics...",
      saveEmbedBtn: "Enregistrer & Indexer Vecteurs",
      savingVectorsBtn: "Indexation en cours...",
      loadingRules: "Chargement du référentiel Playbook...",
      emptyTitle: "Aucune règle configurée",
      emptyDesc:
        'Cliquez sur "Nouvelle Règle Playbook" ci-dessus pour définir vos standards.',
      standardPosHeading: "Position Standard",
      fallbackPosHeading: "Position de Repli",
      triggersHeading: "Déclencheurs Bloquants",
      vectorIndexed: "Indexé Vecteur 1536-d",
    },
    extractor: {
      badge: "Fonction IA #6 — Extracteur de Contrat Modèle",
      title: "Générer des Règles depuis un Contrat Modèle (Golden MSA)",
      subtitle:
        "Collez des clauses approuvées ou importez un modèle signé .docx / .pdf. L'IA extrait positions standard, replis et alertes rouges puis les indexe automatiquement.",
      modeText: "Coller Clauses",
      modeFile: "Importer DOCX/PDF",
      referenceLabel: "Clauses Approuvées du Contrat Modèle",
      loadSampleBtn: "Charger MSA Modèle Exemple",
      textPlaceholder:
        "Collez des clauses contractuelles approuvées (Responsabilité, Indemnisation, SLA, Gouvernance IA, Résiliation)...",
      uploadTitle: "Importer Contrat Modèle (.docx ou .pdf)",
      uploadSubtitle:
        "Extrait automatiquement les clauses clés et génère vos règles Playbook.",
      maxRulesLabel: "Max Règles :",
      autoSaveLabel: "Enregistrement & indexation auto (1536-d)",
      previewOnlyHint: "Mode Aperçu uniquement — vérifier avant d'enregistrer",
      extractingBtn: "Extraction des Règles...",
      extractBtn: "✨ Extraire les Règles automatiquement",
      candidatesTitle: "Extraites",
      autoSavedStatus: "Enregistré & Indexé",
      previewStatus: "Mode Aperçu",
      confidenceSuffix: "% confiance",
      savedBtn: "Enregistré dans Playbook",
      savingBtn: "Enregistrement...",
      saveBtn: "+ Ajouter au Playbook",
    },
    help: {
      eyebrow: "Guide Interactif & Manuel LegalTech",
      title: "Maîtrisez le Studio de Révision de Contrats & RFP",
      subtitle:
        "Guide pratique pour directions juridiques, acheteurs et responsables techniques sur la rédaction de Playbooks, le redlining IA et l'export Word.",
      ctaDashboard: "Aller au Tableau d'Import",
      ctaPlaybooks: "Gérer le Playbook",
      ctaSampleStudio: "Lancer le Studio Démo",
      searchPlaceholder:
        "Rechercher modules, modèles Playbook, carte des risques, Suivi des modifications ou conflits 409...",
      clearBtn: "Effacer",
      tracksTitle: "Parcours d'Apprentissage & Bibliothèque de Référence",
      tracksSubtitle:
        "Filtrez les 14 modules de la plateforme par domaine d'action",
      guideModulesHeading: "Modules du Guide",
      allTrackModules: "Tous les Modules",
      proTipHeading: "Astuce Juriste",
      proTipBodyPrefix: "Dans le Studio de Révision, cliquez sur",
      helpGuidePill: "Guide d'Aide",
      proTipBodySuffix:
        "dans la barre supérieure pour consulter le mémo sans quitter la clause sélectionnée.",
      noModulesMatchPrefix: "Aucun module ne correspond à",
      noModulesMatchSuffix: "Essayez d'effacer le filtre de recherche.",
      tipPrefix: "Astuce :",
      heatmapTitle:
        "Guide Visuel : Carte des Risques & Comparatifs en Ligne",
      heatmapSubtitle:
        "Comprenez la signification de chaque indicateur dans la gouttière gauche et la prévisualisation mot à mot.",
      actionPrefix: "Action :",
      templatesTitle: "Modèles Copiables de Règles Playbook",
      templatesSubtitle:
        "Utilisez ces modèles d'entreprise lors de l'ajout de règles dans le Gestionnaire Playbook (/playbooks).",
      copyTemplateBtn: "Copier le Modèle",
      copiedTemplateBtn: "Copié !",
      standardPosLabel: "Position Standard :",
      fallbackPosLabel: "Position de Repli :",
      triggersLabel: "Déclencheurs Bloquants :",
      whyItWorksLabel: "Pourquoi ça fonctionne :",
      exportTableTitle:
        "Modes d'Export Word : Suivi des Modifications (.docx) vs. Copie Propre (.docx)",
      exportTableSubtitle:
        "Choisissez le format Microsoft Word adapté à la fin du cycle de révision.",
      colCapability: "Capacité / Critère",
      colTrackChanges: "Suivi Modifications (.docx)",
      colClean: "Copie Propre (.docx)",
      faqTitle: "Questions Fréquentes (FAQ)",
      faqSubtitle:
        "Réponses rapides sur les sessions, l'indexation Playbook, les verrous optimistes 409 et la compatibilité Word.",
      noFaqMatchPrefix: "Aucune question ne correspond à",
      tutorialEyebrow: "Masterclass Interactive en 5 Étapes",
      tutorialHeading: "Maîtrisez Tout le Flux de Révision en 2 Minutes",
      tutorialStepPrefix: "Étape",
      tutorialOf: "sur",
      checklistHeading: "Ce Que Vous Allez Faire",
      previewHeading: "Aperçu Visuel Interactif",
      proTipHeadingWiz: "Conseil pour Équipes Juridiques & Techniques :",
      prevBtn: "Étape Précédente",
      nextBtn: "Étape Suivante",
      tracks: [
        {
          id: "ALL",
          label: "Tous les Guides (14)",
          testId: "track-filter-all",
          description: "Bibliothèque complète de 14 modules de référence",
        },
        {
          id: "onboarding",
          label: "1. Démarrage & Playbooks",
          testId: "track-filter-onboarding",
          description:
            "Import de contrats, règles et Extracteur de Contrat Modèle",
        },
        {
          id: "studio",
          label: "2. Studio & Export Word",
          testId: "track-filter-studio",
          description:
            "Révision double panneau, conflits 409 et Suivi Word .docx",
        },
        {
          id: "ai-agents",
          label: "3. Agents IA & Négociation",
          testId: "track-filter-ai-agents",
          description:
            "Postures, Copilote IA, Garde Critique, Radar et Contre-arguments",
        },
        {
          id: "ops",
          label: "4. Sécurité, Coffre & FinOps",
          testId: "track-filter-ops",
          description:
            "Sélecteur LLM, Coffre AES-256, Cache SHA-256 et Télémétrie IA",
        },
      ],
      tutorialStages: [
        {
          index: 0,
          id: "playbook-setup",
          shortTitle: "Playbook Initial",
          title: "Étape 1 : Construisez ou Extrayez Votre Playbook",
          subtitle:
            "Définissez vos garde-fous juridiques avant l'audit ou importez un contrat modèle signé en un clic.",
          checklist: [
            "Ouvrez le Gestionnaire Playbook (/playbooks) pour consulter les règles pré-indexées.",
            "Cliquez sur 'Charger MSA Modèle Exemple' (ou importez un .docx/.pdf signé) dans l'Auto-Extracteur.",
            "Cliquez sur 'Extraire les Règles automatiquement' pour générer Positions Standard, Repli et vecteurs 1536-d.",
          ],
          visualPreview: {
            badge: "MSA Modèle -> Règle Playbook",
            promptOrInputLabel: "Clause Modèle Source",
            promptOrInput:
              "1. Limitation de Responsabilité. La responsabilité cumulée de chaque partie ne dépassera pas 12 mois d'honoraires...",
            outputLabel: "Règle Structurée Extraite",
            output:
              "Catégorie : Responsabilité (97% confiance) | Indexée Vecteur 1536-d",
          },
          proTip:
            "Désactivez l'enregistrement automatique pour relire les règles en Mode Aperçu avant validation par un Admin.",
          ctaLabel: "Tester l'Extracteur en Direct",
          ctaHref: "/playbooks",
        },
        {
          index: 1,
          id: "upload-and-engine",
          shortTitle: "Import & Moteur IA",
          title: "Étape 2 : Importez le Contrat & Configurez le Moteur IA",
          subtitle:
            "Segmentez des contrats .docx/.pdf tout en préservant la numérotation et connectez tout LLM Cloud ou Local.",
          checklist: [
            "Déposez un contrat tiers .docx ou .pdf sur le Tableau de bord (ou lancez le Studio Démo).",
            "Cliquez sur le badge Moteur IA pour choisir Gemini, Groq, OpenAI, Claude ou Ollama et actualiser les modèles en direct.",
            "Exportez vos clés et modèles dans un coffre chiffré .rsvault.json protégé par phrase secrète.",
          ],
          visualPreview: {
            badge: "Changement à Chaud Sans Redémarrage",
            promptOrInputLabel: "Découverte & Coffre",
            promptOrInput:
              "Fournisseur : Gemini / Groq / Ollama -> Test de Connexion (<200ms)",
            outputLabel: "Coffre Chiffré (.rsvault.json)",
            output:
              "AES-256-GCM + PBKDF2-HMAC-SHA256 (600k itérations) chiffré localement.",
          },
          proTip:
            "Validez toujours le test de connexion au vert avant d'auditer des accords sensibles.",
          ctaLabel: "Ouvrir le Tableau d'Import",
          ctaHref: "/",
        },
        {
          index: 2,
          id: "stance-and-audit",
          shortTitle: "Posture & Audit",
          title:
            "Étape 3 : Choisissez la Posture & Lancez l'Audit IA en Direct",
          subtitle:
            "Ajustez l'agressivité juridique au contexte commercial et repérez les zones critiques via la carte des risques.",
          checklist: [
            "Sélectionnez Strict (zéro compromis), Équilibré (réciproque) ou Commercial (vélocité) dans l'en-tête.",
            "Cliquez sur 'Analyser le Contrat' pour diffuser l'audit SSE clause par clause.",
            "Utilisez la gouttière gauche (Carmin = Critique, Ambre = Élevé, Émeraude = Conforme) pour naviguer.",
          ],
          visualPreview: {
            badge: "Sélecteur de Posture IA",
            promptOrInputLabel: "Clause Adverse (Plafond 500 $ vs. 2x)",
            promptOrInput:
              "La responsabilité du fournisseur est limitée à 500 $ ; l'indemnisation du client est illimitée.",
            outputLabel: "Audit Différencié par Posture",
            output:
              "STRICT : CRITIQUE — Plafond 12 mois requis | COMMERCIAL : ÉLEVÉ — Repli approuvé à 2x.",
          },
          proTip:
            "Chaque posture possède sa propre clé dans le cache sémantique pour recalculer instantanément.",
          ctaLabel: "Lancer le Studio Démo",
          ctaHref: "/documents/demo",
        },
        {
          index: 3,
          id: "redlining-power-tools",
          shortTitle: "Outils de Clause",
          title:
            "Étape 4 : Maîtrisez le Redlining (Diffs, Copilote IA, Garde Critique & Simulation)",
          subtitle:
            "Prévisualisez les suppressions/ajouts mot à mot, guidez l'IA en langage naturel et anticipez les objections.",
          checklist: [
            "Survolez 'Appliquer' sur toute carte pour voir les suppressions barrées et ajouts en vert directement dans le contrat.",
            "Ouvrez '✨ Copilote IA' pour ajuster le texte ou contrôlez les garanties anti-hallucination dans '🛡️ Garde Critique'.",
            "Cliquez sur '🎯 Simuler Réponse' pour estimer l'acceptation (0-100%) et insérer une clause de compromis.",
          ],
          visualPreview: {
            badge: "Tiroirs IA Progressifs",
            promptOrInputLabel: "✨ Copilote IA + Garde Critique",
            promptOrInput:
              "Instruction : 'Ajouter un préavis de 30 jours' -> ✓ Conforme Politique | ✓ Sans Hallucination",
            outputLabel: "🎯 Simulateur Contrepartie",
            output:
              "Probabilité d'Acceptation : 78% (MODÉRÉE) -> Argumentaire Tour 2 prêt.",
          },
          proTip:
            "Un seul tiroir IA lourd s'ouvre à la fois par carte afin de préserver la lisibilité de l'inspecteur.",
          ctaLabel: "Pratiquer dans le Studio",
          ctaHref: "/documents/demo",
        },
        {
          index: 4,
          id: "radar-finops-export",
          shortTitle: "Radar, FinOps & Word",
          title:
            "Étape 5 : Radar Inter-Clauses, Télémétrie FinOps & Export Word",
          subtitle:
            "Éliminez les contradictions globales avant signature et exportez un fichier Word natif avec suivi des modifications.",
          checklist: [
            "Passez sur l'onglet 'Radar' pour détecter plafonds contradictoires, renvois cassés et termes non définis.",
            "Consultez '⚡ Télémétrie IA' pour suivre le taux de succès cache SHA-256 (<1ms) et les économies FinOps.",
            "Cliquez sur 'Suivi Modifs (.docx)' (<w:ins>/<w:del>) pour négociation ou 'Copie Propre (.docx)' pour signature.",
          ],
          visualPreview: {
            badge: "Intégrité + FinOps + OpenXML",
            promptOrInputLabel: "Radar & Cache Sémantique SHA-256",
            promptOrInput:
              "Score Radar : 82/100 | Taux Cache Re-Audit : 80.0% (<1ms)",
            outputLabel: "Export Word Natif",
            output:
              "Génère un texte propre ou des révisions OpenXML complètes avec commentaires en marge.",
          },
          proTip:
            "Ouvrez directement le fichier exporté dans Microsoft Word, Google Docs ou LibreOffice Writer.",
          ctaLabel: "Ouvrir Radar & Export Studio",
          ctaHref: "/documents/demo",
        },
      ],
    },
    quickHelp: {
      title: "Mémo Rapide du Studio",
      subtitle:
        "Aide-mémoire contextuel pour outils IA, cache FinOps et exports Word",
      tutorialCtaPrompt:
        "Envie d'un parcours pratique en 5 étapes de toutes les fonctions IA ?",
      tutorialCtaBtn: "Lancer le Tutoriel Complet (/help)",
      tabWorkflow: "1. Flux",
      tabCopilot: "2. ✨ Copilote IA",
      tabRadar: "3. 🎯 Radar",
      tabCritic: "4. 🛡️ Garde Critique",
      tabPushback: "5. 🎯 Réponses",
      tabStance: "6. Postures IA",
      tabHeatmap: "7. Carte Risques",
      tabExport: "8. Export (.docx)",
      tabExtractor: "9. ✨ Extracteur",
      tabTelemetry: "10. ⚡ Télémétrie IA",
    },
  },
};

