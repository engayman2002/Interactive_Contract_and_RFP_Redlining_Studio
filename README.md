# Interactive Contract & RFP Redlining Studio

> **Engineering Manual, Operations Guide & Developer Customization Handbook (`v0.1.0-alpha` / `v0.2.0-beta`)**

The **Interactive Contract & RFP Redlining Studio** is an enterprise-grade, multi-tenant **LegalTech & B2B SaaS platform** purpose-built for corporate legal counsel, procurement teams, and technical proposal leads. Instead of forcing reviewers to copy-paste sensitive contracts into generic chat interfaces, the Studio provides an **AI-native, split-screen interactive workspace** that ingests complex third-party contracts and RFPs (`.docx` and `.pdf`), segments them into structured semantic clauses, benchmarks every provision concurrently against a vector-indexed **Company Playbook** (`pgvector` + BM25 hybrid retrieval), streams real-time **LangChain LCEL** surgical redlines via Server-Sent Events (SSE), and exports reviewed agreements back into **Native Microsoft Word OpenXML Track Changes (`.docx`)** (`<w:ins>` and `<w:del>`) alongside an immutable compliance audit trail.

---

## Table of Contents

1. [Executive Summary & System Architecture](#1-executive-summary--system-architecture)
2. [Hardware & Software Specifications (System Requirements)](#2-hardware--software-specifications-system-requirements)
3. [Complete Step-by-Step Execution Guide (All 3 Modes)](#3-complete-step-by-step-execution-guide-all-3-modes)
4. [Exhaustive Environment Variables Reference](#4-exhaustive-environment-variables-reference)
5. [Developer Customization & Extension Manual (How to Modify the Project)](#5-developer-customization--extension-manual-how-to-modify-the-project)
6. [Complete API Manual & End-to-End `curl` Walkthrough](#6-complete-api-manual--end-to-end-curl-walkthrough)
7. [Quality Gates, Testing & Troubleshooting Guide](#7-quality-gates-testing--troubleshooting-guide)

---

## 1. Executive Summary & System Architecture

### 1.1 Product Vision & Architectural Pillars

- **Clause-Level Structural Intelligence:** Preserves legal section numbering (`1.1`, `Article IV`, `(a)`), nested headings, and cross-references during `.docx` and `.pdf` ingestion while stripping repeating page headers/footers and guarding against Zip-Slip and XML External Entity (XXE) attacks.
- **Hybrid Vector + Lexical Playbook Retrieval:** Combines 1536-dimensional `pgvector` cosine similarity (`0.7` weight) with BM25 lexical & legal-stem overlap (`0.3` weight) to retrieve the top 3 governing corporate policy rules per clause in `<150ms`.
- **Deterministic LangChain LCEL Auditing & Real-Time SSE:** Evaluates up to 20 clauses concurrently (`asyncio.Semaphore(20)`) at `temperature = 0.0`, validating every LLM response against the strict [`RedlineOutput`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/ai/redline_chain.py#L31-L44) schema with automatic JSON repair/retry and streaming live progress events over W3C Server-Sent Events (`text/event-stream`).
- **Bidirectional Split-Screen Editor & Surgical Word Diffs:** Binds each PostgreSQL `document_clauses` row to a custom TipTap/ProseMirror [`ClauseNodeExtension`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/editor/ClauseNodeExtension.ts#L23-L84) (`div[data-clause-id]`) paired with a visual [`RiskHeatmapGutter`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/editor/RiskHeatmapGutter.tsx#L44-L92) and hover-activated [`InlineDiffPreview`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/diff/InlineDiffPreview.tsx#L12-L72).
- **Optimistic Concurrency & Multi-Tenant RBAC:** Enforces `org_id` isolation on every repository query, 4-tier RBAC (`ADMIN`, `LEGAL_COUNSEL`, `TECHNICAL_LEAD`, `VIEWER`), and `expected_clause_version` optimistic locking that automatically rejects stale concurrent edits with `409 Conflict` and rolls back client state.
- **Native Microsoft Word OpenXML Track-Changes Export:** Reconstructs valid `.docx` archives embedding native `<w:del>` (`<w:delText>`) and `<w:ins>` (`<w:t>`) revision tags with `w:author` and ISO-8601 `w:date` attributes, `<w:commentRangeStart/>`/`<w:commentRangeEnd/>` anchors, AI rationales, and reviewer comments.

### 1.2 End-to-End Architecture & Data Flow Diagram

```mermaid
flowchart TD
    subgraph Client["Next.js 15 App Router + TipTap Split-Screen Studio (Port 3000)"]
        UploadUI["Document Upload & Workspace Header"]
        Editor["Left Pane: TipTap ClauseNode Editor + RiskHeatmapGutter + InlineDiffPreview"]
        Inspector["Right Pane: AiInspectorPanel + RedlineCard + ClauseCommentThread + AuditTrailPanel"]
        Store["Zustand WorkspaceStore (Optimistic Updates & 409 Rollback)"]
    end

    subgraph Edge["Nginx TLS 1.3 Reverse Proxy (Port 443) & FastAPI Middleware"]
        Nginx["Nginx TLS 1.3 + Unbuffered SSE (/api/v1/documents/*/stream)"]
        Middleware["CorrelationAndSecurityMiddleware + SlidingWindowRateLimitMiddleware (429)"]
        RBAC["JwtTokenService (HS256) + RbacGuardService (Tenant & Role Guard)"]
    end

    subgraph Ingestion["Phase 2: Structural Ingestion Pipeline"]
        Parser["CompositeDocumentParser (DocxDocumentParser + PdfDocumentParser)"]
        Segmenter["SemanticClauseSegmenter (State-Machine Clause Splitter)"]
        Storage["LocalS3CompatibleStorageAdapter (Tenant-Isolated Object Storage)"]
    end

    subgraph AIEngine["Phase 3 & 4: Playbook Hybrid Retrieval & LangChain LCEL Engine"]
        Embedder["DeterministicHashEmbeddingAdapter / OpenAI 1536-d Embedder"]
        Retriever["HybridPlaybookRetriever (0.7 * Cosine + 0.3 * BM25 Top-3 Rules)"]
        Auditor["LangChainClauseAuditor (LCEL Prompt -> LLM -> RedlineOutput Parser)"]
        Worker["BatchDocumentAuditWorker / Celery Async Worker (Semaphore=20)"]
    end

    subgraph Persistence["PostgreSQL 16 + pgvector & Redis 7"]
        PG[("PostgreSQL 16 + pgvector\norganizations | users | documents\ndocument_clauses | playbook_rules\nredline_suggestions | clause_comments | audit_logs")]
        Redis[("Redis 7\nCelery Broker & Result Backend")]
    end

    subgraph Exporter["Phase 7: Native Word OpenXML Exporter"]
        DocxExp["NativeWordDocxExporter\ntrack_changes (<w:ins>/<w:del>) & clean (.docx)"]
    end

    UploadUI -->|"POST /api/v1/documents/upload"| Nginx --> Middleware --> RBAC
    RBAC --> Parser --> Segmenter --> PG
    Parser --> Storage
    UploadUI -->|"POST /api/v1/documents/{id}/analyze\nGET /api/v1/documents/{id}/stream (SSE)"| Nginx
    Nginx --> Worker --> Retriever
    Embedder --> Retriever
    PG <-->|"vector(1536) + BM25"| Retriever
    Retriever --> Auditor -->|"Persist RedlineSuggestion & AuditLogEntry"| PG
    Worker <--> Redis
    Auditor -.->|"Real-Time SSE Events (clause_audited / completed)"| Inspector
    Editor <-->|"Bidirectional data-clause-id Sync"| Store <--> Inspector
    Inspector -->|"POST /api/v1/suggestions/{id}/resolve (expected_clause_version)"| RBAC --> PG
    Inspector -->|"POST /api/v1/clauses/{id}/comments"| RBAC --> PG
    UploadUI -->|"GET /api/v1/documents/{id}/export?mode=track_changes|clean"| DocxExp --> UploadUI
```

### 1.3 Monorepo Directory Structure & Package Responsibilities

The repository enforces **Clean Architecture (Hexagonal / Ports & Adapters)** with strict inward-only dependency rules (`Presentation -> Application -> Domain <- Infrastructure`), verified on every test run via AST inspection in [`test_architecture_and_domain.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/tests/unit/test_architecture_and_domain.py#L50-L72):

```text
Interactive_Contract_and_RFP_Redlining_Studio/
├── DOCS.md                                         # Architectural Blueprint & Phase Specifications
├── README.md                                       # Engineering Manual, Operations & Customization Guide
├── docker-compose.yml                              # Local Dev Infrastructure (PostgreSQL 16 pgvector + Redis 7)
├── docker-compose.prod.yml                         # Production Docker Compose / Swarm Stack with Secret Mounts
├── .env.example                                    # Local Development Environment Variable Template
├── .env.production.example                         # Production Beta Environment & Secret Mount Template
├── deploy/
│   ├── nginx/
│   │   └── nginx.conf                              # Production Nginx TLS 1.3 + Zero-Buffering SSE Reverse Proxy
│   └── k8s/
│       ├── 00-namespace-and-config.yaml            # Kubernetes Namespace, ConfigMap & Secret Manifests
│       ├── 01-postgres-and-redis.yaml              # PostgreSQL 16 (pgvector) & Redis 7 StatefulSets + PVCs
│       ├── 02-backend-and-worker.yaml              # Non-Root FastAPI Deployment + Celery Worker Deployment
│       └── 03-frontend-and-nginx.yaml              # Non-Root Next.js 15 Deployment + TLS/SSE Ingress
├── backend/
│   ├── Dockerfile                                  # Multi-Stage Python 3.12 Production Image (uid 10001)
│   ├── pyproject.toml                              # Dependencies, Pytest, Ruff, and Mypy (--strict) Config
│   ├── alembic.ini                                 # Async SQLAlchemy / Alembic Migration Configuration
│   ├── src/
│   │   ├── main.py                                 # FastAPI App Factory, CORS, Security & Rate-Limit Wiring
│   │   ├── domain/                                 # Pure Enterprise Business Rules (Zero External Imports)
│   │   │   ├── entities/
│   │   │   │   ├── __init__.py                     # Organization, User, PlaybookRule, Document, DocumentClause,
│   │   │   │   │                                   # RedlineSuggestion, ClauseComment
│   │   │   │   ├── parsed_clause.py                # RawDocumentBlock, ParsedClauseCandidate, DocumentWithClauses
│   │   │   │   ├── playbook_search.py              # PlaybookSearchQuery, MatchedPlaybookRule
│   │   │   │   ├── redline_analysis.py             # ClauseAuditInput, ClauseAuditResult, AuditProgressEvent
│   │   │   │   └── audit_and_export.py             # AuditLogEntry, ExportedDocumentArtifact
│   │   │   ├── enums/
│   │   │   │   └── __init__.py                     # UserRole, DocumentStatus, RiskLevel, SuggestionStatus,
│   │   │   │                                       # ExportMode, AuditAction
│   │   │   ├── exceptions/
│   │   │   │   ├── __init__.py                     # DomainError, UnauthorizedError, ForbiddenRoleError,
│   │   │   │   │                                   # TenantIsolationError, ConcurrencyConflictError
│   │   │   │   ├── ingestion_exceptions.py         # UnsupportedDocumentFormatError, InvalidDocumentFormatError,
│   │   │   │   │                                   # EmptyDocumentError, DocumentTooLargeError
│   │   │   │   ├── playbook_exceptions.py          # PlaybookRuleNotFoundError, InvalidPlaybookRuleError,
│   │   │   │   │                                   # EmbeddingGenerationError
│   │   │   │   ├── ai_exceptions.py                # ClauseAnalysisError, StructuredOutputValidationError
│   │   │   │   └── collaboration_exceptions.py     # SuggestionNotFoundError, ClauseNotFoundError,
│   │   │   │                                       # InvalidResolutionError
│   │   │   └── ports/
│   │   │       ├── __init__.py                     # OrganizationRepositoryPort, UserRepositoryPort,
│   │   │       │                                   # DocumentRepositoryPort, UnitOfWorkPort
│   │   │       ├── ingestion_ports.py              # DocumentParserPort, ClauseSegmenterPort, FileStoragePort
│   │   │       ├── playbook_ports.py               # EmbeddingGeneratorPort, PlaybookRepositoryPort,
│   │   │       │                                   # PlaybookRetrieverPort
│   │   │       ├── ai_ports.py                     # ClauseAuditorPort, RedlineRepositoryPort
│   │   │       ├── collaboration_ports.py          # CommentRepositoryPort
│   │   │       └── export_and_audit_ports.py       # DocxExporterPort, AuditLogRepositoryPort
│   │   ├── application/                            # Application Orchestration, DTOs & Security Services
│   │   │   ├── dtos/
│   │   │   │   ├── __init__.py                     # ImmutableDTO, Auth/User/Org/Document Foundation DTOs
│   │   │   │   ├── ingestion_dtos.py               # IngestDocumentCommand, ClauseResponseDTO,
│   │   │   │   │                                   # DocumentUploadResponseDTO, DocumentWorkspaceResponseDTO
│   │   │   │   ├── playbook_dtos.py                # Create/UpdatePlaybookRuleDTO, PlaybookSearchRequest/ResponseDTO
│   │   │   │   ├── redline_dtos.py                 # RedlineSuggestionResponseDTO, DocumentAnalysisSummaryDTO
│   │   │   │   ├── collaboration_dtos.py           # ResolveSuggestionRequest/ResponseDTO, ClauseCommentResponseDTO
│   │   │   │   └── export_and_audit_dtos.py        # AuditLogEntryResponseDTO
│   │   │   ├── services/
│   │   │   │   └── __init__.py                     # PasswordService (bcrypt), JwtTokenService (HS256),
│   │   │   │                                       # RbacGuardService, RBACAction, ROLE_PERMISSION_MATRIX
│   │   │   └── use_cases/
│   │   │       ├── __init__.py                     # Onboarding, Auth, User & Document Foundation Use Cases
│   │   │       ├── ingest_document.py              # UploadAndIngestDocumentUseCase, GetDocumentWorkspaceUseCase
│   │   │       ├── manage_playbook.py              # Create/List/Get/Update/Delete/SearchPlaybookRulesUseCase
│   │   │       ├── analyze_document.py             # AnalyzeDocumentClausesUseCase, StreamDocumentAnalysisUseCase
│   │   │       ├── collaboration.py                # ResolveRedlineSuggestionUseCase, Create/ListClauseCommentsUseCase
│   │   │       └── export_and_audit.py             # ExportDocumentUseCase, ListDocumentAuditLogsUseCase
│   │   ├── infrastructure/                         # Concrete External Adapters
│   │   │   ├── config.py                           # Pydantic Settings & Multi-Tiered Secret File Resolution
│   │   │   ├── db/
│   │   │   │   ├── base.py                         # SQLAlchemy 2.0 DeclarativeBase
│   │   │   │   ├── models.py                       # ORM Models (organizations, users, documents, document_clauses,
│   │   │   │   │                                   # playbook_rules, redline_suggestions, clause_comments, audit_logs)
│   │   │   │   ├── session.py                      # AsyncEngine & AsyncSession Factory
│   │   │   │   ├── repositories/                   # Tenant-Isolated Repositories & SqlAlchemyUnitOfWork
│   │   │   │   └── migrations/                     # Alembic Async Environment & Schema Revisions (0001, 0002)
│   │   │   ├── parsers/
│   │   │   │   ├── docx_parser.py                  # DocxDocumentParser (Zip-Slip & XXE Hardened)
│   │   │   │   ├── pdf_parser.py                   # PdfDocumentParser (Header/Footer Stripping)
│   │   │   │   ├── composite_parser.py             # CompositeDocumentParser (MIME & Magic-Byte Router)
│   │   │   │   ├── clause_segmenter.py             # SemanticClauseSegmenter (State-Machine Splitter)
│   │   │   │   ├── storage.py                      # LocalS3CompatibleStorageAdapter (Path-Traversal Hardened)
│   │   │   │   └── docx_exporter.py                # NativeWordDocxExporter (<w:ins>, <w:del>, Clean Mode)
│   │   │   ├── vector/
│   │   │   │   ├── embedding_service.py            # DeterministicHashEmbeddingAdapter (1536-d Unit Vectors)
│   │   │   │   ├── hybrid_retriever.py             # HybridPlaybookRetriever (Cosine + BM25 Lexical Scorer)
│   │   │   │   └── provider_registry.py            # EmbeddingProviderRegistry, Dimension Adapter, OpenAI/Ollama Adapters
│   │   │   └── ai/
│   │   │       ├── redline_chain.py                # RedlineOutput, SYSTEM_PROMPT, LangChainClauseAuditor
│   │   │       ├── provider_registry.py            # LLMProviderRegistry (Deterministic, Groq, OpenAI, Anthropic, Ollama, vLLM)
│   │   │       ├── batch_worker.py                 # BatchDocumentAuditWorker (Bounded Semaphore=20)
│   │   │       └── celery_app.py                   # Celery Worker App & audit_document_celery_task
│   │   └── presentation/                           # Delivery & HTTP Layer
│   │       ├── api/v1/
│   │       │   ├── __init__.py                     # /health, /auth/*, /users/* Routers
│   │       │   ├── documents.py                    # /documents/upload, /workspace, /analyze, /stream, /export, /audit-trail
│   │       │   ├── playbooks.py                    # /playbooks/rules CRUD & /playbooks/search
│   │       │   └── collaboration.py                # /suggestions/{id}/resolve & /clauses/{id}/comments
│   │       ├── dependencies/
│   │       │   └── __init__.py                     # FastAPI Dependency Providers & require_roles() Factory
│   │       └── middleware/
│   │           ├── __init__.py                     # CorrelationAndSecurityMiddleware & Global Exception Handlers
│   │           └── rate_limiter.py                 # SlidingWindowRateLimitMiddleware (429 + Retry-After)
│   └── tests/
│       ├── conftest.py                             # Isolated In-Memory Async SQLite + Temp Storage Test Fixtures
│       ├── unit/                                   # 7 Unit Test Suites (Domain, Security, Parsers, Vector, AI, Plugins, DOCX)
│       └── integration/                            # 6 Full-Stack Multi-Tenant API Integration Test Suites
└── frontend/
    ├── Dockerfile                                  # Multi-Stage Node 22 Alpine Standalone Production Image (uid 10001)
    ├── package.json                                # Next.js 15.1.6, React 18.3, TipTap 2.10, Zustand 5, Zod, Vitest
    ├── next.config.ts                              # Next.js Configuration (reactStrictMode + standalone output)
    ├── playwright.config.ts                        # Playwright E2E Runner Configuration
    ├── e2e/
    │   ├── playwright-shim.ts                      # Strict TypeScript Playwright Harness Types
    │   └── redliningStudio.spec.ts                 # End-to-End Redlining Studio Lifecycle E2E Spec
    └── src/
        ├── app/
        │   ├── page.tsx                            # / — Contract Dashboard & Drag-and-Drop .docx/.pdf Upload Hub
        │   ├── playbooks/page.tsx                  # /playbooks — Company Playbook Rules Manager (CRUD & Triggers)
        │   ├── documents/[id]/page.tsx             # /documents/[id] — Split-Screen Interactive Redlining Studio
        │   └── help/page.tsx                       # /help — Interactive In-App Help Center, Playbook Templates & FAQ
        ├── components/
        │   ├── navigation/
        │   │   ├── TopNavBar.tsx                   # Sticky Enterprise Header, Segmented Nav, Status & Auth Modal
        │   │   └── ThemeToggle.tsx                 # Persistent Dual-Theme Toggle (Executive Light / Slate Dark)
        │   ├── workspace/
        │   │   ├── RedliningStudioWorkspace.tsx    # Resizable Split-Screen Container, Export Controls & 409 Banner
        │   │   ├── ContractUploadDropzone.tsx      # Drag-and-Drop .docx/.pdf Dropzone with Multi-Stage Progress
        │   │   ├── UploadModal.tsx                 # In-Studio Quick File Upload Modal
        │   │   └── QuickHelpModal.tsx              # In-Studio Contextual Quick-Help & Risk Heatmap Reference Drawer
        │   ├── editor/
        │   │   ├── ClauseNodeExtension.ts          # Custom ProseMirror Node with persistent data-clause-id
        │   │   ├── ContractEditorCanvas.tsx        # Elevated Legal Document Sheet + Bidirectional Scroll/Focus Sync
        │   │   └── RiskHeatmapGutter.tsx           # Vertical Risk Navigator Rail (Rose, Amber, Sky, Emerald)
        │   ├── diff/
        │   │   ├── wordDiff.ts                     # LCS Word-Level Diff Algorithm (equal, delete, insert)
        │   │   └── InlineDiffPreview.tsx           # Live Surgical Redline Preview Overlay
        │   └── inspector/
        │       ├── AiInspectorPanel.tsx            # Right-Hand Inspector, Risk Pill Filters & Segmented Tab Switcher
        │       ├── RedlineCard.tsx                 # Executive Suggestion Card (Talking Point Copy, Apply, Modify, Reject)
        │       ├── ClauseCommentThread.tsx         # Collapsible Per-Clause Threaded Discussion Panel
        │       └── AuditTrailPanel.tsx             # Chronological Immutable Compliance Audit Trail Viewer
        ├── hooks/
        │   ├── useDocumentStream.ts                # Real-Time SSE Client Hook with Demo Stream Simulation
        │   └── useTheme.ts                         # Dual-Theme State Hook (Executive Light Default + Slate Dark)
        ├── services/
        │   ├── contracts.ts                        # Strict Zod Schemas & TypeScript DTO Types
        │   ├── apiClient.ts                        # Typed Fetch Client, 409 VersionConflictError & Offline Storage
        │   ├── authSession.ts                      # Seamless Workspace Session Bootstrapper & Default Playbook Seeder
        │   └── helpContent.ts                      # Structured User Guide Modules, Playbook Templates & FAQ Library
        ├── store/
        │   └── workspaceStore.ts                   # Zustand Store (Bidirectional Sync, Optimistic Edits & Rollback)
        └── __tests__/                              # 6 Vitest + React Testing Library Test Suites (20 Tests)
```

### 1.4 Frontend User Journey, Multi-Page Routes & Automatic Session Bootstrapper

End-users (legal counsel, contract managers, procurement leads, and technical leads) interact strictly through four purpose-built web routes:

| Route | Component | Core Capabilities & User Workflow |
| :--- | :--- | :--- |
| **`/`** | [`DashboardPage`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/app/page.tsx) | **Contract Dashboard & Upload Hub:** Drag-and-drop `.docx` or `.pdf` agreements up to 25MB via [`ContractUploadDropzone`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/workspace/ContractUploadDropzone.tsx) with multi-stage ingestion progress (`Uploading file` -> `Parsing & segmenting clauses` -> `Opening Redlining Studio`), sample contract quick-launch CTA, and a **My Documents** table displaying status (`READY` / `ANALYZED`), version, and clause counts. |
| **`/playbooks`** | [`PlaybooksPage`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/app/playbooks/page.tsx) | **Company Playbook Rules Manager:** Create, inspect, and delete corporate negotiation rules (`Category`, `Standard Position`, `Fallback Position`, and `Unacceptable Red-Flag Triggers`). Pre-seeded with 5 enterprise baseline rules (Limitation of Liability, Indemnification, SLA, Data Privacy, Governing Law). |
| **`/documents/[id]`** | [`RedliningStudioWorkspace`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/workspace/RedliningStudioWorkspace.tsx) | **Split-Screen Interactive Redlining Studio:** Left-hand [`RiskHeatmapGutter`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/editor/RiskHeatmapGutter.tsx) + TipTap [`ContractEditorCanvas`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/editor/ContractEditorCanvas.tsx) paired with right-hand [`AiInspectorPanel`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/inspector/AiInspectorPanel.tsx), one-click **Analyze Contract with AI**, hover inline word diffs, collapsible [`ClauseCommentThread`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/inspector/ClauseCommentThread.tsx), in-studio [`UploadModal`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/workspace/UploadModal.tsx), contextual [`QuickHelpModal`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/workspace/QuickHelpModal.tsx), and native `.docx` exports. |
| **`/help`** | [`HelpCenterPage`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/app/help/page.tsx) | **Interactive In-App Help Center & User Manual:** Instant keyword search across 6 structured guide modules, visual Risk Heatmap & Inline Diff legend, 3 one-click copyable Playbook Rule Templates, Track Changes vs. Clean `.docx` comparison table, and an interactive FAQ accordion. |

- **Seamless Session Bootstrapper ([`authSession.ts`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/services/authSession.ts)):**
  - On first load, `ensureWorkspaceSession()` checks backend availability (`/api/v1/health`).
  - When the FastAPI backend is reachable (`connectionStatus = "live"`), it automatically registers or logs into a default organization workspace and seeds standard Playbook rules if none exist—allowing immediate `.docx`/`.pdf` uploads and AI redlining without manual `curl` token setup.
  - When running without a backend (`connectionStatus = "demo_fallback"`), it transparently falls back to client-side workspace persistence so every route, upload, playbook rule, and simulated SSE audit works offline out of the box.

---

## 2. Hardware & Software Specifications (System Requirements)

### 2.1 Software Prerequisites

| Component | Required Version | Purpose & Verification Command |
| :--- | :--- | :--- |
| **Operating System** | Linux (Ubuntu 22.04+/Fedora 39+), macOS 14+, or Windows 11 with **WSL2** | Host runtime environment (`uname -a`) |
| **Python** | **Python 3.12+** (`>=3.12`) | Backend FastAPI, SQLAlchemy 2.0 Async, LangChain, Celery (`python3 --version`) |
| **Node.js & npm** | **Node.js 20 LTS or 22 LTS** (`v22.x` recommended) | Frontend Next.js 15 App Router, TipTap, Vitest (`node --version && npm --version`) |
| **Docker & Compose** | **Docker Engine 24.0+** & **Docker Compose v2.20+** | Containerized PostgreSQL 16 (`pgvector`), Redis 7, Nginx (`docker compose version`) |
| **PostgreSQL** | **PostgreSQL 16** with `pgvector` (`pgvector/pgvector:pg16`) | Relational persistence + `vector(1536)` HNSW cosine indexing |
| **Redis** | **Redis 7.2+** (`redis:7-alpine`) | Celery task broker, result backend, and distributed coordination |

### 2.2 Hardware Specifications

| Tier | CPU Cores | Memory (RAM) | Disk Storage | Network & Concurrency Capacity |
| :--- | :--- | :--- | :--- | :--- |
| **Minimum Local Development** | 2 vCPU (x86_64 or ARM64) | 4 GB RAM | 10 GB free SSD | Single developer; 20-clause concurrent local audits in `<1s` (deterministic mode) |
| **Recommended Local Development** | 4+ vCPU | 8 GB+ RAM | 25 GB NVMe SSD | Full Docker stack + IDE + concurrent Vitest/Pytest + local LLM API calls |
| **Production Beta Server (Single Node / Swarm)** | 8 vCPU | 16 GB ECC RAM | 100 GB NVMe SSD (RAID-1) | 4 Uvicorn workers + 4 Celery workers; up to 100 concurrent SSE streams |
| **Enterprise Production Cluster (Kubernetes)** | 16+ vCPU across nodes | 32–64 GB RAM | 500 GB NVMe PVC (`ReadWriteOnce`) | Multi-replica horizontal scaling; 500+ concurrent contract reviews & high-throughput `pgvector` HNSW queries |

### 2.3 External AI / LLM API Requirements (100% Offline Default vs. Cloud LLMs)

- **Zero-Cost Offline / CI Mode (Default Out-of-the-Box):**
  - By default, `LLM_PROVIDER=deterministic` in [`backend/src/infrastructure/config.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/config.py#L121).
  - Clause auditing uses [`PolicyAwareDeterministicChatModel`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/ai/redline_chain.py#L249-L441) and playbook vector indexing uses [`DeterministicHashEmbeddingAdapter`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/embedding_service.py#L265-L349) (1536-dimensional L2-normalized semantic feature-hashing with legal concept cluster projections).
  - **No external API keys, internet access, or GPU hardware are required** to run the entire application, upload contracts, run live SSE audits, resolve redlines, or execute the test suites.
- **Production Cloud LLM & Embedding Providers (Optional / Production):**
  - **Groq Cloud API (`GROQ_API_KEY`):** Used when `LLM_PROVIDER=groq` with `LLM_MODEL_NAME=llama-3.3-70b-versatile` at `LLM_TEMPERATURE=0.0` for ultra-low-latency structured legal clause evaluation.
  - **OpenAI API (`OPENAI_API_KEY`):** Used when wiring `OpenAIEmbeddings(model="text-embedding-3-small", dimensions=1536)` or `ChatOpenAI(model="gpt-4o", temperature=0.0)`.

---

## 3. Complete Step-by-Step Execution Guide (All 3 Modes)

### Mode A: Local Hybrid Development (Docker for DB/Redis + Native Python venv & Next.js Dev Server)

This is the recommended workflow for day-to-day engineering and debugging.

#### Step 1: Start PostgreSQL 16 (`pgvector`) & Redis 7 in Docker

```bash
cd /home/ayman/Interactive_Contract_and_RFP_Redlining_Studio

# Create a local .env file if not already present
cp .env.example .env 2>/dev/null || cat << 'EOF' > .env
POSTGRES_USER=redline_app
POSTGRES_PASSWORD=redline_dev_pass
POSTGRES_DB=redlining_studio
POSTGRES_PORT=5432
REDIS_PORT=6379
DATABASE_URL=postgresql+asyncpg://redline_app:redline_dev_pass@127.0.0.1:5432/redlining_studio
REDIS_URL=redis://127.0.0.1:6379/0
CELERY_BROKER_URL=redis://127.0.0.1:6379/0
EOF

# Start PostgreSQL 16 (with pgvector) and Redis 7
docker compose up -d

# Confirm both containers report (healthy)
docker compose ps
```

#### Step 2: Set Up the Python 3.12 Backend, Run Migrations & Start FastAPI

```bash
cd /home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend

# Create and activate Python 3.12 virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install backend package + development dependencies (pytest, ruff, mypy, aiosqlite)
pip install --upgrade pip
pip install -e ".[dev]"

# Apply Alembic database migrations (creates pgvector extension + all 8 tables)
alembic upgrade head

# Start FastAPI server on http://127.0.0.1:8000 with hot-reload
uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Backend Health Check:** `http://127.0.0.1:8000/api/v1/health`
- **Interactive Swagger UI (OpenAPI):** `http://127.0.0.1:8000/api/v1/docs`

#### Step 3: (Optional) Start the Background Celery Worker

In local development, `CELERY_TASK_ALWAYS_EAGER=True` by default so tasks can also execute inline without a separate worker process. To run a dedicated Celery worker against Redis:

```bash
cd /home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend
source .venv/bin/activate
celery -A src.infrastructure.ai.celery_app:celery_app worker --loglevel=info --concurrency=4
```

#### Step 4: Start the Next.js 15 Split-Screen Frontend Studio

Open a new terminal window:

```bash
cd /home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend

# Install Node.js dependencies
npm install

# Start the Next.js 15 development server bound to 127.0.0.1:3000
npm run dev -- -H 127.0.0.1 -p 3000
```

Open **`http://127.0.0.1:3000`** in your browser to use the interactive Split-Screen Redlining Studio.

---

### Mode B: Full Local Containerized Stack

To build and run the entire stack (PostgreSQL, Redis, FastAPI Backend, Celery Worker, Next.js 15 Frontend, and Nginx Reverse Proxy) in local Docker containers:

```bash
cd /home/ayman/Interactive_Contract_and_RFP_Redlining_Studio

# 1. Create local secret files and self-signed TLS certificate for local container testing
mkdir -p deploy/secrets deploy/nginx/certs
openssl rand -hex 32 > deploy/secrets/jwt_secret_key.txt
echo "deterministic-local-mode" > deploy/secrets/groq_api_key.txt
echo "deterministic-local-mode" > deploy/secrets/openai_api_key.txt
echo "redline_dev_pass" > deploy/secrets/postgres_password.txt
chmod 600 deploy/secrets/*.txt

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout deploy/nginx/certs/privkey.pem \
  -out deploy/nginx/certs/fullchain.pem \
  -subj "/CN=localhost"

# 2. Launch the full containerized stack
DATABASE_URL="postgresql+asyncpg://redline_app:redline_dev_pass@postgres:5432/redlining_studio" \
LLM_PROVIDER="deterministic" \
CORS_ALLOWED_ORIGINS='["https://localhost","http://localhost:3000"]' \
docker compose -f docker-compose.prod.yml up -d --build

# 3. Apply database migrations inside the running backend container
docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
```

---

### Mode C: Production Beta Deployment (Docker Swarm / Kubernetes + Nginx TLS 1.3 & Unbuffered SSE)

#### 1. Idempotently Bootstrap Secrets & TLS Certificates

Use the provided production bootstrap script to initialize directories, generate cryptographically random secrets with `0644` permissions (readable by non-root container `UID 10001`), and provision a self-signed TLS certificate if absent:

```bash
cd /home/ayman/Interactive_Contract_and_RFP_Redlining_Studio

# 1. Run the idempotent bootstrap script
bash deploy/scripts/bootstrap-prod-local.sh

# 2. (Optional) Inject real AI provider API keys into deploy/secrets/
# echo "gsk_YOUR_REAL_KEY" > deploy/secrets/groq_api_key.txt
# echo "sk-YOUR_REAL_KEY" > deploy/secrets/openai_api_key.txt
# echo "sk-ant-YOUR_REAL_KEY" > deploy/secrets/anthropic_api_key.txt
# echo "YOUR_GEMINI_KEY" > deploy/secrets/gemini_api_key.txt
# chmod 644 deploy/secrets/*.txt

# 3. For custom domains, replace self-signed certs in deploy/nginx/certs/ with your Let's Encrypt / CA certs:
# deploy/nginx/certs/fullchain.pem
# deploy/nginx/certs/privkey.pem
```

#### 2. Option 1 — Deploy via Docker Compose Production / Docker Swarm

```bash
# 1. Build production images and start the stack (always use --env-file rather than 'source .env'):
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build

# 2. Apply database migrations inside the running backend container:
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend alembic upgrade head

# 3. Verify service health and HTTPS endpoint:
curl -k -fsS https://127.0.0.1/api/v1/health

# OR deploy to a Docker Swarm cluster (with rolling updates):
docker stack deploy -c docker-compose.prod.yml redlining-studio
```

#### 3. Option 2 — Deploy to a Kubernetes Cluster (`deploy/k8s/`)

```bash
# 1. Create namespace, ConfigMap, and Secret (edit 00-namespace-and-config.yaml or create secret via kubectl)
kubectl apply -f deploy/k8s/00-namespace-and-config.yaml

# 2. Provision PostgreSQL 16 (pgvector) and Redis 7 StatefulSets with PersistentVolumeClaims
kubectl apply -f deploy/k8s/01-postgres-and-redis.yaml
kubectl -n redlining-studio rollout status statefulset/redlining-postgres
kubectl -n redlining-studio rollout status statefulset/redlining-redis

# 3. Deploy FastAPI Backend (with /run/secrets volume mounts) and Celery Workers
kubectl apply -f deploy/k8s/02-backend-and-worker.yaml
kubectl -n redlining-studio rollout status deployment/redlining-backend

# 4. Run Alembic database migrations on the Kubernetes cluster
kubectl -n redlining-studio exec deploy/redlining-backend -- alembic upgrade head

# 5. Deploy Next.js 15 Frontend and Nginx TLS/SSE Ingress
kubectl apply -f deploy/k8s/03-frontend-and-nginx.yaml
```

---

## 4. Exhaustive Environment Variables Reference

All backend configuration variables are defined and validated via Pydantic Settings in [`backend/src/infrastructure/config.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/config.py#L64-L155). Secret variables automatically support Docker Swarm and Kubernetes file mounts via the `*_FILE` suffix (`JWT_SECRET_KEY_FILE`, `GROQ_API_KEY_FILE`, `OPENAI_API_KEY_FILE`).

### 4.1 Backend Environment Variables (`backend/src/infrastructure/config.py`)

| Variable Name | Secret File Equivalent (`*_FILE`) | Default Value | Required in Prod? | Description |
| :--- | :--- | :--- | :--- | :--- |
| `APP_ENV` | — | `"development"` | **Yes** (`"production"`) | Runtime environment (`"development"`, `"testing"`, or `"production"`). When `"production"`, ephemeral JWT secrets are forbidden. |
| `APP_NAME` | — | `"Interactive Contract & RFP Redlining Studio"` | No | OpenAPI application title and service identifier. |
| `API_V1_PREFIX` | — | `"/api/v1"` | No | URL prefix for all v1 REST and SSE routes, Swagger UI (`/api/v1/docs`), and OpenAPI schema. |
| `HOST` | — | `"127.0.0.1"` | No (`"0.0.0.0"` in container) | Bind address for Uvicorn. Defaults to `127.0.0.1` for local security. |
| `PORT` | — | `8000` | No | TCP port for the FastAPI HTTP server. |
| `DATABASE_URL` | — | `"postgresql+asyncpg://redline_app:redline_dev_pass@127.0.0.1:5432/redlining_studio"` | **Yes** | Async SQLAlchemy connection string. Use `?ssl=verify-full` in production for mTLS/TLS encryption in transit. |
| `REDIS_URL` | — | `"redis://127.0.0.1:6379/0"` | **Yes** | Redis connection URL for caching and coordination. |
| `JWT_SECRET_KEY` | `JWT_SECRET_KEY_FILE` (`/run/secrets/jwt_secret_key`) | CSPRNG ephemeral hex in dev; **errors in prod if unset** | **Yes** | Symmetric signing key (`>=16` chars, 32-byte hex recommended) for `HS256` JWT access tokens. |
| `JWT_ALGORITHM` | — | `"HS256"` | No | Strictly allow-listed JWT signing algorithm (`"none"` is explicitly rejected). |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | — | `30` (`5`–`1440`) | No | Access token lifetime in minutes before re-authentication is required. |
| `CORS_ALLOWED_ORIGINS` | — | `["http://localhost:3000", "http://127.0.0.1:3000"]` | **Yes** | JSON array of allowed origins. Wildcard `"*"` is strictly rejected by validator [`validate_no_wildcard_origins`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/config.py#L142-L149). |
| `MAX_UPLOAD_SIZE_MB` | — | `25` (`1`–`100`) | No | Maximum allowed `.docx` or `.pdf` upload payload size in megabytes (`max_upload_size_bytes`). |
| `ALLOWED_UPLOAD_EXTENSIONS` | — | `(".docx", ".pdf")` | No | Allow-listed contract file extensions. |
| `ALLOWED_UPLOAD_MIME_TYPES` | — | `("application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/pdf", "application/octet-stream")` | No | Allow-listed MIME types for document ingestion. |
| `STORAGE_ROOT_PATH` | — | `Path("/tmp/redlining_studio_storage")` | **Yes** (`/var/lib/redlining_studio/storage`) | Filesystem root directory (outside web root) where tenant-isolated raw uploads are stored (`{org_id}/{document_id}/...`). |
| `EMBEDDING_PROVIDER` | — | `"deterministic"` | No (`"openai"`, `"gemini"`, `"ollama"`, or `"openai_compatible"`) | Selects the playbook vector embedding adapter registered in [`EmbeddingProviderRegistry`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/provider_registry.py#L315-L373). |
| `EMBEDDING_MODEL_NAME` | — | `"text-embedding-3-small"` | No | Target embedding model identifier (e.g., `"text-embedding-3-small"`, `"text-embedding-004"`, `"nomic-embed-text"`, `"mxbai-embed-large"`, `"bge-m3"`). |
| `EMBEDDING_BASE_URL` | — | `None` | No | Optional custom base URL for local or self-hosted embedding servers (e.g., `"http://localhost:11434"` for Ollama, `"https://generativelanguage.googleapis.com/v1beta"` for Gemini, or `"http://localhost:8080/v1"` for vLLM/TEI/LM Studio). |
| `EMBEDDING_API_KEY` | `EMBEDDING_API_KEY_FILE` (`/run/secrets/embedding_api_key`) | `None` | Optional | Unified API key for the active embedding provider (falls back to `OPENAI_API_KEY` or `GEMINI_API_KEY`). |
| `EMBEDDING_TIMEOUT_SECONDS` | — | `30.0` (`1.0`–`300.0`) | No | HTTP request timeout in seconds for external/local embedding calls. |
| `EMBEDDING_DIMENSION` | — | `1536` (`128`–`4096`) | No | Vector dimensionality matching the PostgreSQL `vector(1536)` column on `playbook_rules`. |
| `PLAYBOOK_DEFAULT_TOP_K` | — | `3` (`1`–`50`) | No | Number of top-ranked playbook rules retrieved per clause during hybrid search and AI auditing. |
| `HYBRID_VECTOR_WEIGHT` | — | `0.7` (`0.0`–`1.0`) | No | Weight applied to dense vector cosine similarity in [`HybridPlaybookRetriever`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/hybrid_retriever.py#L34-L48). |
| `HYBRID_KEYWORD_WEIGHT` | — | `0.3` (`0.0`–`1.0`) | No | Weight applied to normalized BM25 + lexical overlap score in [`HybridPlaybookRetriever`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/hybrid_retriever.py#L34-L48). |
| `OPENAI_API_KEY` | `OPENAI_API_KEY_FILE` (`/run/secrets/openai_api_key`) | `None` | Optional (Required if using OpenAI embeddings/LLM) | API key for OpenAI `text-embedding-3-small` or `gpt-4o`. |
| `LLM_PROVIDER` | — | `"deterministic"` | No (`"groq"`, `"openai"`, `"anthropic"`, `"gemini"`, `"ollama"`, or `"openai_compatible"`) | Selects the clause auditing engine registered in [`LLMProviderRegistry`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/ai/provider_registry.py#L365-L429). |
| `LLM_MODEL_NAME` | — | `"llama-3.3-70b-versatile"` | No | Model identifier passed to the active LLM provider (e.g., `"llama-3.3-70b-versatile"`, `"gpt-4o-mini"`, `"claude-3-5-sonnet-latest"`, `"gemini-2.5-flash"`, `"llama3.1:8b"`, `"qwen2.5:14b"`). |
| `LLM_BASE_URL` | — | `None` | No | Optional base URL override for local or custom LLM servers (e.g., `"http://localhost:11434"` for Ollama, `"http://localhost:8000/v1"` for vLLM, `"https://generativelanguage.googleapis.com/v1beta"` for Gemini). |
| `LLM_API_KEY` | `LLM_API_KEY_FILE` (`/run/secrets/llm_api_key`) | `None` | Optional | Unified API key for the active LLM provider (automatically falls back to `GROQ_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GEMINI_API_KEY`). |
| `GROQ_API_KEY` | `GROQ_API_KEY_FILE` (`/run/secrets/groq_api_key`) | `None` | Optional (Required when `LLM_PROVIDER=groq`) | API key for Groq Cloud inference (`llama-3.3-70b-versatile`). |
| `ANTHROPIC_API_KEY` | `ANTHROPIC_API_KEY_FILE` (`/run/secrets/anthropic_api_key`) | `None` | Optional (Required when `LLM_PROVIDER=anthropic`) | API key for Anthropic Claude inference (`claude-3-5-sonnet-latest`). |
| `GEMINI_API_KEY` | `GEMINI_API_KEY_FILE` (`/run/secrets/gemini_api_key`) | `None` | Optional (Required when using Gemini LLM/embeddings) | API key for Google Gemini Generative Language API (`gemini-2.5-flash`, `text-embedding-004`). |
| `LLM_TEMPERATURE` | — | `0.0` (`0.0`–`1.0`) | No | Sampling temperature. Must remain `0.0` for deterministic legal redlining. |
| `LLM_TIMEOUT_SECONDS` | — | `60.0` (`1.0`–`600.0`) | No | HTTP request timeout in seconds for external/local LLM chat completions. |
| `REDLINE_BATCH_CONCURRENCY` | — | `20` (`1`–`100`) | No | Maximum concurrent clause evaluations per document (`asyncio.Semaphore`). |
| `REDLINE_MAX_RETRIES` | — | `2` (`0`–`10`) | No | Number of automatic retry attempts on malformed LLM JSON before fallback. |
| `CELERY_BROKER_URL` | — | `"redis://localhost:6379/0"` | **Yes** | Redis broker & backend URL for Celery worker tasks. |
| `CELERY_TASK_ALWAYS_EAGER` | — | `True` | **Yes** (`False` in prod) | Executes Celery tasks synchronously in-process when `True` (local/test) or dispatches to Redis workers when `False`. |
| `RATE_LIMIT_ENABLED` | — | `True` | **Yes** (`True`) | Enables [`SlidingWindowRateLimitMiddleware`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/presentation/middleware/rate_limiter.py#L36-L88). |
| `RATE_LIMIT_REQUESTS_PER_MINUTE` | — | `240` (`1`–`10000`) | No | Maximum requests allowed per client bucket within `RATE_LIMIT_WINDOW_SECONDS` before returning HTTP `429`. |
| `RATE_LIMIT_WINDOW_SECONDS` | — | `60` (`1`–`3600`) | No | Sliding window duration in seconds for rate limiting. |

### 4.2 Frontend Environment Variables (`frontend/src/services/apiClient.ts`)

| Variable Name | Default Value | Required in Prod? | Description |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | `"http://127.0.0.1:8000/api/v1"` | **Yes** (e.g., `"https://redline.example.com/api/v1"` or `"/api/v1"`) | Base URL used by [`apiClient.ts`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/services/apiClient.ts#L19-L20) and [`useDocumentStream.ts`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/hooks/useDocumentStream.ts#L31) for REST and SSE requests. |

---

## 5. Developer Customization & Extension Manual (How to Modify the Project)

### 5.1 AI Provider Architecture: Cloud, Local LLMs, and Custom Provider Plugins

The backend implements a vendor-agnostic **Plugin Registry Architecture** strictly inside the Infrastructure layer ([`backend/src/infrastructure/ai/provider_registry.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/ai/provider_registry.py) and [`backend/src/infrastructure/vector/provider_registry.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/provider_registry.py)). The Domain and Application layers depend exclusively on [`ClauseAuditorPort`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/domain/ports/ai_ports.py) and [`EmbeddingGeneratorPort`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/domain/ports/playbook_ports.py#L11-L21), allowing you to switch between offline deterministic evaluation, cloud APIs (Groq, OpenAI, Anthropic), **100% private local models (Ollama, vLLM, LM Studio, llama.cpp)**, or custom enterprise gateways via environment variables alone.

#### 5.1.1 Supported Built-in Providers Matrix

##### A. Built-in LLM Inference Providers (`LLM_PROVIDER`)

| `LLM_PROVIDER` Value | Adapter Class | Default Endpoint (`LLM_BASE_URL`) | Recommended Models (`LLM_MODEL_NAME`) | API Key Required? |
| :--- | :--- | :--- | :--- | :--- |
| `"deterministic"` *(default)* | [`PolicyAwareDeterministicChatModel`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/ai/redline_chain.py#L249-L440) | In-process (Offline / CI) | N/A | **No** |
| `"groq"` | [`OpenAICompatibleChatRunnable`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/ai/provider_registry.py#L94-L198) | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile`, `qwen-qwq-32b`, `mixtral-8x7b-32768` | **Yes** (`LLM_API_KEY` or `GROQ_API_KEY`) |
| `"openai"` | [`OpenAICompatibleChatRunnable`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/ai/provider_registry.py#L94-L198) | `https://api.openai.com/v1` | `gpt-4o-mini`, `gpt-4o` | **Yes** (`LLM_API_KEY` or `OPENAI_API_KEY`) |
| `"anthropic"` | [`AnthropicMessagesChatRunnable`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/ai/provider_registry.py#L201-L289) | `https://api.anthropic.com` (`/v1/messages`) | `claude-3-5-sonnet-latest`, `claude-3-5-haiku-latest` | **Yes** (`LLM_API_KEY` or `ANTHROPIC_API_KEY`) |
| `"gemini"` | [`GeminiGenerateContentChatRunnable`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/ai/provider_registry.py) | `https://generativelanguage.googleapis.com/v1beta` | `gemini-2.5-flash`, `gemini-2.5-pro` | **Yes** (`LLM_API_KEY` or `GEMINI_API_KEY`) |
| `"ollama"` *(100% Local)* | [`OllamaChatRunnable`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/ai/provider_registry.py#L292-L360) | `http://localhost:11434` (`/api/chat`) | `llama3.1:8b`, `qwen2.5:14b`, `mistral:7b`, `deepseek-r1:14b` | **No** |
| `"openai_compatible"` *(Local vLLM / LM Studio / llama.cpp)* | [`OpenAICompatibleChatRunnable`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/ai/provider_registry.py#L94-L198) | `http://localhost:8000/v1` (vLLM) or `http://localhost:1234/v1` (LM Studio) | `Qwen/Qwen2.5-14B-Instruct`, `meta-llama/Llama-3.1-8B-Instruct` | Optional (`LLM_API_KEY` if gated) |

##### B. Built-in Vector Embedding Providers (`EMBEDDING_PROVIDER`)

| `EMBEDDING_PROVIDER` Value | Adapter Class | Default Endpoint (`EMBEDDING_BASE_URL`) | Recommended Models (`EMBEDDING_MODEL_NAME`) | Native Dim -> Adapted DB Dim |
| :--- | :--- | :--- | :--- | :--- |
| `"deterministic"` *(default)* | [`DeterministicHashEmbeddingAdapter`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/embedding_service.py#L265-L348) | In-process (`BLAKE2b` + Legal Stemming) | N/A | `1536 -> 1536` |
| `"openai"` | [`OpenAICompatibleEmbeddingAdapter`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/provider_registry.py#L84-L202) | `https://api.openai.com/v1` (`/v1/embeddings`) | `text-embedding-3-small` (`1536-d`), `text-embedding-3-large` (`3072-d`) | `1536/3072 -> 1536` |
| `"gemini"` | [`GeminiEmbeddingAdapter`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/provider_registry.py) | `https://generativelanguage.googleapis.com/v1beta` | `text-embedding-004` (`768-d`), `gemini-embedding-001` (`768-d`) | `768 -> 1536` |
| `"ollama"` *(100% Local)* | [`OllamaEmbeddingAdapter`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/provider_registry.py#L205-L310) | `http://localhost:11434` (`/api/embed`) | `nomic-embed-text` (`768-d`), `mxbai-embed-large` (`1024-d`), `bge-m3` (`1024-d`), `all-minilm` (`384-d`) | `384/768/1024 -> 1536` |
| `"openai_compatible"` *(Local TEI / vLLM / LM Studio)* | [`OpenAICompatibleEmbeddingAdapter`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/provider_registry.py#L84-L202) | `http://localhost:8080/v1` (`/v1/embeddings`) | `BAAI/bge-large-en-v1.5` (`1024-d`), `sentence-transformers/all-MiniLM-L6-v2` (`384-d`) | `384/1024 -> 1536` |

---

#### 5.1.2 Configuration Recipes (`.env` Examples)

##### Recipe 1: Groq Cloud (Ultra-Fast Cloud Inference) + OpenAI Embeddings
```dotenv
LLM_PROVIDER=groq
LLM_MODEL_NAME=llama-3.3-70b-versatile
GROQ_API_KEY=gsk_your_groq_api_key_here
LLM_TEMPERATURE=0.0

EMBEDDING_PROVIDER=openai
EMBEDDING_MODEL_NAME=text-embedding-3-small
OPENAI_API_KEY=sk-proj-your_openai_api_key_here
EMBEDDING_DIMENSION=1536
```

##### Recipe 2: 100% Local & Private AI with Ollama (Zero Data Leaves Your Machine)
First, pull a local reasoning LLM and a local embedding model with Ollama:
```bash
# Install & start Ollama on your workstation or GPU server, then pull models:
ollama pull llama3.1:8b          # or: ollama pull qwen2.5:14b
ollama pull nomic-embed-text     # 768-d local legal/technical semantic embedder
```
Then configure `backend/.env`:
```dotenv
LLM_PROVIDER=ollama
LLM_MODEL_NAME=llama3.1:8b
LLM_BASE_URL=http://localhost:11434
LLM_TEMPERATURE=0.0
LLM_TIMEOUT_SECONDS=120.0

EMBEDDING_PROVIDER=ollama
EMBEDDING_MODEL_NAME=nomic-embed-text
EMBEDDING_BASE_URL=http://localhost:11434
EMBEDDING_DIMENSION=1536
```

##### Recipe 3: Local vLLM / LM Studio / llama.cpp (`openai_compatible`)
```dotenv
# Example: Local LM Studio server on port 1234 or vLLM server on port 8000
LLM_PROVIDER=openai_compatible
LLM_MODEL_NAME=Qwen/Qwen2.5-14B-Instruct
LLM_BASE_URL=http://localhost:1234/v1
LLM_TEMPERATURE=0.0

EMBEDDING_PROVIDER=openai_compatible
EMBEDDING_MODEL_NAME=BAAI/bge-large-en-v1.5
EMBEDDING_BASE_URL=http://localhost:1234/v1
EMBEDDING_DIMENSION=1536
```

##### Recipe 4: Anthropic Claude 3.5 Sonnet + Deterministic Offline Embeddings
```dotenv
LLM_PROVIDER=anthropic
LLM_MODEL_NAME=claude-3-5-sonnet-latest
ANTHROPIC_API_KEY=sk-ant-your_anthropic_api_key_here
LLM_TEMPERATURE=0.0

EMBEDDING_PROVIDER=deterministic
EMBEDDING_DIMENSION=1536
```

##### Recipe 5: Google Gemini (Full Gemini Stack: LLM + Embeddings)
```dotenv
LLM_PROVIDER=gemini
LLM_MODEL_NAME=gemini-2.5-flash
GEMINI_API_KEY=your_gemini_api_key_here
LLM_TEMPERATURE=0.0
LLM_TIMEOUT_SECONDS=60.0

EMBEDDING_PROVIDER=gemini
EMBEDDING_MODEL_NAME=text-embedding-004
EMBEDDING_DIMENSION=1536
```

---

#### 5.1.3 How Automatic Vector Dimension Adaptation Works (`adapt_and_normalize_vector`)

PostgreSQL stores Playbook embeddings in a `vector(1536)` column (`playbook_rules.embedding`), whereas local open-weights embedding models output varying dimensions (`384-d` for `all-MiniLM-L6-v2`, `768-d` for `nomic-embed-text`, `1024-d` for `mxbai-embed-large` / `bge-m3`).

To allow **any** local or cloud embedding model to work immediately without destructive database migrations, [`adapt_and_normalize_vector`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/provider_registry.py#L36-L74) in [`backend/src/infrastructure/vector/provider_registry.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/provider_registry.py) automatically adapts every vector before persistence or similarity search:
1. **Isometric Zero-Padding ($d < 1536$):** Maps $v \in \mathbb{R}^d \hookrightarrow \mathbb{R}^{1536}$ via $(v_1, \dots, v_d, 0, \dots, 0)$, which is a strict mathematical isometry ($\langle \iota(u), \iota(v) \rangle = \langle u, v \rangle$), preserving **100% of pairwise cosine similarity** across 384-d, 768-d, and 1024-d models.
2. **Deterministic Feature Folding ($d > 1536$):** Folds higher-dimensional embeddings (such as `3072-d` `text-embedding-3-large`) modulo `1536` (`adapted[idx % 1536] += val`).
3. **Unit L2-Normalization ($\|\tilde{v}\|_2 = 1.0$):** Normalizes every adapted vector to unit length so inner products equal cosine similarity.

---

#### 5.1.4 Step-by-Step Developer Guide: How to Register a Brand-New Custom AI Provider

You can add a new AI vendor (e.g., **Mistral AI**, **Cohere**, **Azure OpenAI**, **AWS Bedrock**, or an internal corporate AI gateway) in **3 steps** using the `@register_llm_provider` and `@register_embedding_provider` decorators without modifying a single line of `domain/` or `application/`:

1. **Step 1 — Create Your Adapter Module** (e.g. `backend/src/infrastructure/ai/custom_mistral_plugin.py`):

   ```python
   # backend/src/infrastructure/ai/custom_mistral_plugin.py
   import httpx
   from langchain_core.runnables import Runnable

   from src.domain.ports.playbook_ports import EmbeddingGeneratorPort
   from src.infrastructure.ai.provider_registry import (
       OpenAICompatibleChatRunnable,
       register_llm_provider,
   )
   from src.infrastructure.config import Settings
   from src.infrastructure.vector.provider_registry import (
       OpenAICompatibleEmbeddingAdapter,
       register_embedding_provider,
   )


   @register_llm_provider("mistral")
   def build_mistral_llm(
       settings: Settings,
       http_client: httpx.AsyncClient | None = None,
   ) -> Runnable[object, str]:
       """Register Mistral AI chat completions under LLM_PROVIDER='mistral'."""
       return OpenAICompatibleChatRunnable(
           provider_label="mistral",
           model_name=settings.LLM_MODEL_NAME,
           base_url=settings.LLM_BASE_URL or "https://api.mistral.ai/v1",
           api_key=settings.resolve_llm_api_key(),
           temperature=settings.LLM_TEMPERATURE,
           timeout_seconds=settings.LLM_TIMEOUT_SECONDS,
           require_api_key=True,
           http_client=http_client,
       )


   @register_embedding_provider("mistral")
   def build_mistral_embeddings(
       settings: Settings,
       http_client: httpx.AsyncClient | None = None,
   ) -> EmbeddingGeneratorPort:
       """Register Mistral embeddings (1024-d -> auto-adapted to 1536-d) under EMBEDDING_PROVIDER='mistral'."""
       return OpenAICompatibleEmbeddingAdapter(
           model_name=settings.EMBEDDING_MODEL_NAME,
           base_url=settings.EMBEDDING_BASE_URL or "https://api.mistral.ai/v1",
           api_key=settings.resolve_embedding_api_key(),
           dimension=settings.EMBEDDING_DIMENSION,
           timeout_seconds=settings.EMBEDDING_TIMEOUT_SECONDS,
           require_api_key=True,
           http_client=http_client,
       )
   ```

2. **Step 2 — Import the Plugin Module at Startup** in [`backend/src/infrastructure/ai/__init__.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/ai/__init__.py) so the decorators execute when the package loads.
3. **Step 3 — Select Your New Provider in `.env`:**
   ```dotenv
   LLM_PROVIDER=mistral
   LLM_MODEL_NAME=mistral-large-latest
   LLM_API_KEY=your_mistral_api_key

   EMBEDDING_PROVIDER=mistral
   EMBEDDING_MODEL_NAME=mistral-embed
   EMBEDDING_API_KEY=your_mistral_api_key
   ```

---

#### 5.1.5 How to Customize the Legal/Technical System Prompt or `RedlineOutput` Schema

Edit [`RedlineOutput`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/ai/redline_chain.py#L31-L44) and [`SYSTEM_PROMPT`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/ai/redline_chain.py#L46-L49) in [`backend/src/infrastructure/ai/redline_chain.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/ai/redline_chain.py):

```python
# backend/src/infrastructure/ai/redline_chain.py
SYSTEM_PROMPT: Final[str] = """You are a Principal Legal and Technical Contract Auditor.
Compare the provided contract clause against the retrieved Company Playbook Rules.
If the clause violates policy or introduces unmitigated risk, generate a precise surgical redline
that protects the company while remaining commercially reasonable."""
```

---

### 5.2 How to Customize Playbook Categories & Hybrid Search Weights

The Playbook vector & lexical retrieval pipeline is implemented in [`backend/src/infrastructure/vector/embedding_service.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/embedding_service.py) and [`backend/src/infrastructure/vector/hybrid_retriever.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/hybrid_retriever.py):

1. **Add New Legal/Technical Concept Clusters:**
   Add domain vocabulary to [`LEGAL_CONCEPT_CLUSTERS`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/embedding_service.py#L62-L211) in [`backend/src/infrastructure/vector/embedding_service.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/embedding_service.py):

   ```python
   # backend/src/infrastructure/vector/embedding_service.py
   "cluster_export_control_sanctions": frozenset(
       {"ofac", "itar", "ear", "sanctions", "embargo", "export", "reexport", "bis"}
   ),
   ```

2. **Tune Hybrid Search Weights (`Cosine` vs. `BM25`) and `TOP_K`:**
   In [`HybridPlaybookRetriever.retrieve_top_rules`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/hybrid_retriever.py#L129-L161), the final score is computed as:
   $$\text{combined\_score} = (w_{\text{vec}} \times \text{cosine\_sim}) + (w_{\text{kw}} \times \text{bm25\_score})$$
   Adjust `HYBRID_VECTOR_WEIGHT`, `HYBRID_KEYWORD_WEIGHT`, and `PLAYBOOK_DEFAULT_TOP_K` via environment variables or in [`backend/src/infrastructure/config.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/config.py#L112-L114):

   ```bash
   # Favor exact statutory/keyword matches more heavily:
   export HYBRID_VECTOR_WEIGHT=0.55
   export HYBRID_KEYWORD_WEIGHT=0.45
   export PLAYBOOK_DEFAULT_TOP_K=5
   ```

---

### 5.3 How to Add a New Database Column or Table & Run Async Alembic Migrations

Database models follow a strict separation between pure domain dataclasses in [`backend/src/domain/entities/`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/domain/entities/__init__.py) and SQLAlchemy 2.0 ORM models in [`backend/src/infrastructure/db/models.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/db/models.py):

1. **Add the field to the Domain Entity** in [`backend/src/domain/entities/__init__.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/domain/entities/__init__.py).
2. **Add the mapped column to the SQLAlchemy Model** in [`backend/src/infrastructure/db/models.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/db/models.py):

   ```python
   # Example: Adding jurisdiction to DocumentModel in backend/src/infrastructure/db/models.py
   jurisdiction: Mapped[str | None] = mapped_column(String(128), nullable=True)
   ```

3. **Update `_to_domain()` in the Repository** (e.g., [`backend/src/infrastructure/db/repositories/document_repository.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/db/repositories/document_repository.py)).
4. **Generate and Apply the Async Alembic Migration** using [`backend/alembic.ini`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/alembic.ini):

   ```bash
   cd /home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend
   source .venv/bin/activate

   # Autogenerate a new migration script in src/infrastructure/db/migrations/versions/
   alembic revision --autogenerate -m "add_document_jurisdiction_column"

   # Apply the migration to PostgreSQL
   alembic upgrade head
   ```

---

### 5.4 How to Modify the Split-Screen UI, TipTap `ClauseNode`, or Risk Heatmap Colors

1. **Customize the TipTap ProseMirror `clauseBlock` Node:**
   Edit [`ClauseNodeExtension`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/editor/ClauseNodeExtension.ts#L23-L84) in [`frontend/src/components/editor/ClauseNodeExtension.ts`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/editor/ClauseNodeExtension.ts) to add custom HTML attributes (`data-*`) or node rendering classes.
2. **Customize the Risk Heatmap Gutter Colors:**
   Edit [`HEATMAP_COLOR_MAP`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/editor/RiskHeatmapGutter.tsx#L13-L42) in [`frontend/src/components/editor/RiskHeatmapGutter.tsx`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/editor/RiskHeatmapGutter.tsx):

   ```tsx
   // frontend/src/components/editor/RiskHeatmapGutter.tsx
   const HEATMAP_COLOR_MAP: Record<ClauseRiskBadge, { bg: string; label: string; tone: string }> = {
     CRITICAL: {
       bg: "bg-rose-500 border-rose-400 shadow-rose-500/40",
       label: "Critical Risk (Crimson)",
       tone: "crimson",
     },
     // ...
   };
   ```

3. **Customize the Inline Word-Level Diff Preview or Default Split Ratio:**
   - Edit [`InlineDiffPreview.tsx`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/diff/InlineDiffPreview.tsx#L12-L72) and [`wordDiff.ts`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/components/diff/wordDiff.ts) to change how deletions (`diff-token-delete`) and insertions (`diff-token-insert`) are tokenized and styled.
   - Edit `splitRatio` in [`useWorkspaceStore`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/src/store/workspaceStore.ts#L132) (`frontend/src/store/workspaceStore.ts`) to change the default left/right pane percentage (`55% / 45%`).

---

### 5.5 How to Customize the Native Microsoft Word (`.docx`) Track-Changes Export Formatting

The OpenXML `.docx` reconstruction engine is located in [`backend/src/infrastructure/parsers/docx_exporter.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/parsers/docx_exporter.py):

- [`_append_tracked_deletion`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/parsers/docx_exporter.py#L46-L66) constructs native Word `<w:del w:id="..." w:author="..." w:date="..."><w:r><w:delText xml:space="preserve">...</w:delText></w:r></w:del>` nodes.
- [`_append_tracked_insertion`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/parsers/docx_exporter.py#L69-L89) constructs native Word `<w:ins w:id="..." w:author="..." w:date="..."><w:r><w:t xml:space="preserve">...</w:t></w:r></w:ins>` nodes.
- [`NativeWordDocxExporter.generate_docx`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/parsers/docx_exporter.py#L106-L237) iterates over `ordered_clauses`, diffs `clause.original_text` against `clause.current_text` using `difflib.SequenceMatcher`, and appends bold/italic callout paragraphs for AI rationales and threaded reviewer comments in `ExportMode.TRACK_CHANGES`.

---

## 6. Complete API Manual & End-to-End `curl` Walkthrough

### 6.1 Endpoint Summary Table (`/api/v1`)

| # | HTTP Method & Route | Allowed RBAC Roles | Status Code | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `GET /api/v1/health` | Public | `200 OK` | Service readiness & health probe |
| 2 | `POST /api/v1/auth/register-org` | Public | `201 Created` | Onboard new tenant organization + initial `ADMIN` user + JWT |
| 3 | `POST /api/v1/auth/login` | Public | `200 OK` | Authenticate email/password and issue tenant-scoped JWT |
| 4 | `POST /api/v1/auth/logout` | All Authenticated Roles | `200 OK` | Revoke current JWT `jti` |
| 5 | `POST /api/v1/users` | `ADMIN` | `201 Created` | Provision a user (`ADMIN`, `LEGAL_COUNSEL`, `TECHNICAL_LEAD`, `VIEWER`) in `org_id` |
| 6 | `GET /api/v1/users` | All Authenticated Roles | `200 OK` | List users in the caller's organization |
| 7 | `GET /api/v1/users/{user_id}` | All Authenticated Roles | `200 OK` | Fetch a single user in the caller's organization |
| 8 | `POST /api/v1/playbooks/rules` | `ADMIN`, `LEGAL_COUNSEL` | `201 Created` | Create a Playbook Rule + auto-generate 1536-d vector embedding |
| 9 | `GET /api/v1/playbooks/rules` | All Authenticated Roles | `200 OK` | List Playbook Rules in `org_id` (optional `?category=` filter) |
| 10 | `GET /api/v1/playbooks/rules/{rule_id}` | All Authenticated Roles | `200 OK` | Fetch a single Playbook Rule in `org_id` |
| 11 | `PUT /api/v1/playbooks/rules/{rule_id}` | `ADMIN`, `LEGAL_COUNSEL` | `200 OK` | Update Playbook Rule & re-index 1536-d vector embedding |
| 12 | `DELETE /api/v1/playbooks/rules/{rule_id}` | `ADMIN`, `LEGAL_COUNSEL` | `204 No Content` | Delete a Playbook Rule in `org_id` |
| 13 | `POST /api/v1/playbooks/search` | All Authenticated Roles | `200 OK` | Run hybrid vector (`0.7`) + BM25 (`0.3`) search across tenant playbook |
| 14 | `POST /api/v1/documents/upload` | `ADMIN`, `LEGAL_COUNSEL`, `TECHNICAL_LEAD` | `201 Created` | Upload `.docx`/`.pdf`, segment into semantic clauses, log `DOCUMENT_INGESTED` |
| 15 | `GET /api/v1/documents` | All Authenticated Roles | `200 OK` | List all documents in the caller's organization |
| 16 | `GET /api/v1/documents/{document_id}/workspace` | All Authenticated Roles | `200 OK` | Fetch full workspace (document, ordered clauses, redlines, comments, audit logs) |
| 17 | `POST /api/v1/documents/{document_id}/analyze` | `ADMIN`, `LEGAL_COUNSEL`, `TECHNICAL_LEAD` | `200 OK` | Run concurrent AI clause auditing & persist `RedlineSuggestion` records |
| 18 | `GET /api/v1/documents/{document_id}/stream` | All Authenticated Roles | `200 OK` (`text/event-stream`) | Stream real-time `clause_audited` and `completed` SSE events |
| 19 | `POST /api/v1/suggestions/{suggestion_id}/resolve` | `ADMIN`, `LEGAL_COUNSEL`, `TECHNICAL_LEAD` | `200 OK` (`409` on version mismatch) | Atomically `ACCEPT`, `MODIFY`, or `REJECT` suggestion with `expected_clause_version` |
| 20 | `POST /api/v1/clauses/{clause_id}/comments` | All Authenticated Roles | `201 Created` | Post a threaded comment on a clause & log `COMMENT_CREATED` |
| 21 | `GET /api/v1/clauses/{clause_id}/comments` | All Authenticated Roles | `200 OK` | List chronological comments on a clause |
| 22 | `GET /api/v1/documents/{document_id}/audit-trail` | All Authenticated Roles | `200 OK` | Retrieve chronological immutable compliance audit trail for `document_id` |
| 23 | `GET /api/v1/documents/{document_id}/export` | All Authenticated Roles | `200 OK` (`.docx` binary) | Export `.docx` in `mode=track_changes` (`<w:ins>`/`<w:del>`) or `mode=clean` |

---

### 6.2 Sequential End-to-End `curl` Walkthrough

With the backend running on `http://127.0.0.1:8000`, run the following copy-pasteable bash script to execute the entire 11-step contract redlining lifecycle from tenant onboarding to native Word Track-Changes export:

```bash
export API_URL="http://127.0.0.1:8000/api/v1"

# -----------------------------------------------------------------------------
# 1. Register a New Organization & Provision Initial ADMIN User
# -----------------------------------------------------------------------------
REGISTER_RESP=$(curl -sS -X POST "${API_URL}/auth/register-org" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_name": "Acme Global Legal & Procurement",
    "admin_email": "admin@acme-legal.io",
    "admin_password": "StrongAdminPassword!2026"
  }')
echo "${REGISTER_RESP}"

# -----------------------------------------------------------------------------
# 2. Log In & Export the ADMIN Bearer JWT Token
# -----------------------------------------------------------------------------
LOGIN_RESP=$(curl -sS -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@acme-legal.io",
    "password": "StrongAdminPassword!2026"
  }')
export ADMIN_TOKEN=$(echo "${LOGIN_RESP}" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# -----------------------------------------------------------------------------
# 3. Create Team Users (LEGAL_COUNSEL, TECHNICAL_LEAD, VIEWER)
# -----------------------------------------------------------------------------
curl -sS -X POST "${API_URL}/users" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"email": "counsel@acme-legal.io", "password": "CounselPassword!2026", "role": "LEGAL_COUNSEL"}'

curl -sS -X POST "${API_URL}/users" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"email": "techlead@acme-legal.io", "password": "TechLeadPassword!2026", "role": "TECHNICAL_LEAD"}'

curl -sS -X POST "${API_URL}/users" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"email": "viewer@acme-legal.io", "password": "ViewerPassword!2026", "role": "VIEWER"}'

# -----------------------------------------------------------------------------
# 4. Seed a Company Playbook Policy Rule (Auto-Generates 1536-d Vector Embedding)
# -----------------------------------------------------------------------------
curl -sS -X POST "${API_URL}/playbooks/rules" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Limitation of Liability",
    "standard_position": "Each party aggregate cumulative liability shall not exceed twelve (12) months of fees paid, excluding indirect or consequential damages.",
    "fallback_position": "Mutual super-cap at two (2x) times annual contract value.",
    "unacceptable_triggers": "uncapped, unlimited liability, exceed $500, consequential damages"
  }'

# -----------------------------------------------------------------------------
# 5. Search the Playbook Hybrid Vector + BM25 Knowledge Base
# -----------------------------------------------------------------------------
curl -sS -X POST "${API_URL}/playbooks/search" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "query_text": "Vendor aggregate liability shall not exceed $500 while Customer has uncapped liability.",
    "top_k": 3
  }'

# -----------------------------------------------------------------------------
# 6. Generate a Sample .docx Contract & Upload for Semantic Clause Ingestion
# -----------------------------------------------------------------------------
python3 - << 'EOF'
from docx import Document
doc = Document()
doc.add_heading("Master Cloud Services Agreement", level=1)
doc.add_heading("1. Limitation of Liability", level=2)
doc.add_paragraph("1.1 Vendor aggregate liability shall not exceed $500, and Customer shall have uncapped liability for all consequential damages.")
doc.add_heading("2. Governing Law", level=2)
doc.add_paragraph("2.1 This Agreement shall be governed by the laws of the State of Delaware.")
doc.save("/tmp/sample_msa.docx")
EOF

UPLOAD_RESP=$(curl -sS -X POST "${API_URL}/documents/upload" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -F "file=@/tmp/sample_msa.docx;type=application/vnd.openxmlformats-officedocument.wordprocessingml.document" \
  -F "title=Master Cloud Services Agreement")
echo "${UPLOAD_RESP}"
export DOC_ID=$(echo "${UPLOAD_RESP}" | python3 -c "import sys,json; print(json.load(sys.stdin)['document_id'])")

# -----------------------------------------------------------------------------
# 7. Trigger Concurrent AI Clause Analysis & Stream Real-Time SSE Progress
# -----------------------------------------------------------------------------
curl -sS -X POST "${API_URL}/documents/${DOC_ID}/analyze" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}"

curl -sS -N -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${API_URL}/documents/${DOC_ID}/stream"

# Fetch Workspace to extract Clause ID and Redline Suggestion ID
WORKSPACE_JSON=$(curl -sS -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${API_URL}/documents/${DOC_ID}/workspace")
export SUGGESTION_ID=$(echo "${WORKSPACE_JSON}" | python3 -c "import sys,json; print(json.load(sys.stdin)['redlines'][0]['id'])")
export CLAUSE_ID=$(echo "${WORKSPACE_JSON}" | python3 -c "import sys,json; print(json.load(sys.stdin)['redlines'][0]['clause_id'])")

# -----------------------------------------------------------------------------
# 8. Resolve the AI Redline Suggestion with Optimistic Concurrency Control
# -----------------------------------------------------------------------------
curl -sS -X POST "${API_URL}/suggestions/${SUGGESTION_ID}/resolve" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "ACCEPT",
    "expected_clause_version": 1
  }'

# -----------------------------------------------------------------------------
# 9. Post a Threaded Reviewer Comment on the Clause
# -----------------------------------------------------------------------------
curl -sS -X POST "${API_URL}/clauses/${CLAUSE_ID}/comments" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "Accepted mutual 12-month fee cap per corporate playbook policy."
  }'

# -----------------------------------------------------------------------------
# 10. Inspect the Immutable Compliance Audit Trail
# -----------------------------------------------------------------------------
curl -sS -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${API_URL}/documents/${DOC_ID}/audit-trail"

# -----------------------------------------------------------------------------
# 11. Export the Reviewed Contract as Native Word Track Changes & Clean .docx
# -----------------------------------------------------------------------------
curl -sS -L -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${API_URL}/documents/${DOC_ID}/export?mode=track_changes" \
  -o /tmp/reviewed_contract_track_changes.docx

curl -sS -L -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  "${API_URL}/documents/${DOC_ID}/export?mode=clean" \
  -o /tmp/reviewed_contract_clean.docx

ls -lh /tmp/reviewed_contract_*.docx
```

---

## 7. Quality Gates, Testing & Troubleshooting Guide

### 7.1 Backend Static Analysis & Test Suite (`ruff`, `mypy --strict`, `pytest`)

```bash
cd /home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend

# 1. Lint & Security Checks (pycodestyle, pyflakes, isort, bugbear, bandit)
./.venv/bin/ruff check .

# 2. Strict Static Type Checking (92 source & test files)
./.venv/bin/mypy --strict src tests

# 3. Full Unit & Multi-Tenant Integration Test Suite (49 tests)
./.venv/bin/pytest -v
```

### 7.2 Frontend Static Analysis, Unit Tests, Production Build & Playwright E2E

```bash
cd /home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend

# 1. Strict TypeScript Type Checking (via native Linux Node runtime)
node ./node_modules/.bin/tsc --noEmit

# 2. Next.js ESLint Verification
node ./node_modules/.bin/next lint

# 3. Vitest + React Testing Library Suite (6 test files, 20 tests)
node ./node_modules/.bin/vitest run

# 4. Next.js 15 Standalone Production Build Verification (/, /playbooks, /documents/[id], /help)
node ./node_modules/.bin/next build
```

### 7.3 Troubleshooting Guide

| Symptom / HTTP Error | Root Cause | Resolution |
| :--- | :--- | :--- |
| **`Bind for 0.0.0.0:80 failed: port is already allocated`** | `docker-compose.prod.yml` configured `replicas: 2` on the `nginx` service while publishing host ports `80` and `443` on a single Docker host. | Keep `nginx.deploy.replicas: 1` in [`docker-compose.prod.yml`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/docker-compose.prod.yml). Single-host Docker Compose cannot bind multiple container replicas to the same host port. Stateless app containers (`backend`, `frontend`, `celery-worker`) scale to multiple replicas while Nginx acts as the single edge ingress proxy. |
| **`PermissionError: [Errno 13] Permission denied: '/run/secrets/jwt_secret_key'`** | Host secret files in `deploy/secrets/*.txt` were created with `0600` permissions (root/owner only), but the backend container runs as non-root user `redline` (`UID 10001`). | Run `chmod 644 deploy/secrets/*.txt` (or `chown 10001:10001 deploy/secrets/*.txt`) on the host, or run [`bash deploy/scripts/bootstrap-prod-local.sh`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/deploy/scripts/bootstrap-prod-local.sh) which automatically applies `0644`. |
| **Celery Worker marked `unhealthy` by Docker** | `celery-worker` inherited the Dockerfile HTTP healthcheck (`curl http://127.0.0.1:8000/api/v1/health`), but the Celery worker process handles background tasks and does not bind port 8000. | Override the healthcheck in [`docker-compose.prod.yml`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/docker-compose.prod.yml#L98-L100) with `healthcheck: disable: true`. |
| **Bash syntax errors when sourcing `.env` (e.g. `syntax error near unexpected token '['`)** | Sourcing `.env` directly in Bash (`. ./.env`) treats JSON array values (`CORS_ALLOWED_ORIGINS=["..."]`) as shell glob syntax. | Do not use `source .env`. Pass the environment file directly to Docker Compose via `docker compose --env-file .env.production -f docker-compose.prod.yml up -d`. |
| **`409 Conflict` (`CONCURRENCY_CONFLICT`)** when accepting, modifying, or rejecting a redline | Another user (or tab) modified the target clause, incrementing `document_clauses.version` past your `expected_clause_version`. | Click **Dismiss** on the red `409 Conflict` banner in the Studio header and re-fetch the workspace (`GET /api/v1/documents/{id}/workspace`) so your editor reflects the latest `version`. |
| **`429 Too Many Requests` (`RATE_LIMIT_EXCEEDED`)** | Client exceeded `RATE_LIMIT_REQUESTS_PER_MINUTE` (default `240` requests per `60s` sliding window). | Respect the `Retry-After` HTTP response header, or increase `RATE_LIMIT_REQUESTS_PER_MINUTE` in `.env` / [`config.py`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/config.py#L134). |
| **SSE Audit Stream (`GET /api/v1/documents/{id}/stream`) arrives all at once instead of incrementally** | Reverse proxy in front of FastAPI is buffering `text/event-stream` responses. | Ensure Nginx includes `proxy_buffering off;`, `proxy_cache off;`, and `add_header X-Accel-Buffering "no" always;` on `/api/v1/documents/*/stream` as configured in [`deploy/nginx/nginx.conf`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/deploy/nginx/nginx.conf#L55-L71). |
| **CORS Preflight Error in Browser Console** | Frontend origin is not listed in `CORS_ALLOWED_ORIGINS`, or wildcard `"*"` was used. | Add the exact scheme, host, and port (e.g. `["https://redline.example.com", "http://localhost:3000"]`) to `CORS_ALLOWED_ORIGINS`. Wildcard `"*"` is blocked by design for security. |
| **`RuntimeError: CRITICAL: JWT_SECRET_KEY or JWT_SECRET_KEY_FILE must be configured in production`** | `APP_ENV=production` is set without a configured `JWT_SECRET_KEY` environment variable or `/run/secrets/jwt_secret_key` file mount. | Mount `/run/secrets/jwt_secret_key` and set `JWT_SECRET_KEY_FILE=/run/secrets/jwt_secret_key` (or export `JWT_SECRET_KEY`). |
| **`UnsupportedAIProviderError` (`UNSUPPORTED_AI_PROVIDER`)** | `LLM_PROVIDER` or `EMBEDDING_PROVIDER` is set to a provider name not registered in [`LLMProviderRegistry`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/ai/provider_registry.py) or [`EmbeddingProviderRegistry`](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/src/infrastructure/vector/provider_registry.py). | Use one of the built-in providers (`deterministic`, `groq`, `openai`, `anthropic`, `gemini`, `ollama`, `openai_compatible`) or register your custom plugin with `@register_llm_provider` / `@register_embedding_provider`. |
