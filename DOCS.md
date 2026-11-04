The **Interactive Contract & RFP Redlining Studio** is an enterprise-grade, AI-native workspace designed to parse legal contracts and technical Requests for Proposals (RFPs), benchmark every clause against internal company playbooks, and deliver actionable redline replacements inside a split-screen editor.

## 1. System Architecture & Technology Stack

The system follows **Clean Architecture** (Hexagonal Ports and Adapters) combined with an asynchronous task pipeline to ensure heavy LLM processing never blocks the user interface.

| Layer | Technology | Primary Role | Architectural Benefit |
| --- | --- | --- | --- |
| **Frontend** | Next.js 15, TypeScript | Split-screen UI | Server actions and streaming |
| **Rich Editor** | TipTap, ProseMirror | Clause-level DOM binding | Granular node UUID tracking |
| **State Sync** | TanStack Query, Zustand | Optimistic UI updates | Instant redline transitions |
| **Backend API** | FastAPI, Python 3.12 | Async REST and SSE | High-throughput concurrency |
| **AI Orchestration** | LangChain (LCEL) | Clause analysis pipeline | Deterministic structured outputs |
| **LLM Inference** | Groq API, OpenAI | Fast reasoning | Sub-second clause evaluation |
| **Database** | PostgreSQL 16 | Relational state and RBAC | ACID compliance for audits |
| **Vector Store** | pgvector, ChromaDB | Playbook semantic search | Hybrid keyword and dense retrieval |
| **Task Queue** | Celery, Redis | Background ingestion | Non-blocking document parsing |

The backend is structured as a modular monolith separated into four strict concentric layers:

* **Domain Layer:** Contains pure business entities, value objects, and state transition rules with zero external framework dependencies.
* **Application Layer:** Implements use cases, orchestrates LangChain interfaces, and enforces Role-Based Access Control (RBAC) policies.
* **Infrastructure Layer:** Houses PostgreSQL repositories, vector database adapters, S3 file storage, and LLM client implementations.
* **Presentation Layer:** Exposes versioned FastAPI routers, request validators, and Server-Sent Events (SSE) streams.

## 2. Clean Code Standards & Repository Blueprint

Developers must adhere to strict **SOLID principles**, explicit dependency injection, and 100% type annotations across Python and TypeScript.

```text
redlining-studio/
├── backend/
│   ├── src/
│   │   ├── domain/
│   │   │   ├── entities/          # Pure models: Document, Clause, Redline, PlaybookRule
│   │   │   ├── enums/             # RiskLevel, ClauseStatus, UserRole
│   │   │   ├── exceptions/        # Domain-specific exception hierarchy
│   │   │   └── ports/             # Abstract repository and AI service interfaces
│   │   ├── application/
│   │   │   ├── dtos/              # Immutable input/output data transfer objects
│   │   │   ├── services/          # RBAC guard, diff calculator, audit logger
│   │   │   └── use_cases/         # IngestDoc, AnalyzeClause, ApplyRedline
│   │   ├── infrastructure/
│   │   │   ├── db/                # SQLAlchemy 2.0 async models and migrations
│   │   │   ├── vector/            # pgvector / ChromaDB hybrid retriever
│   │   │   ├── ai/                # LangChain LCEL chains, prompts, parsers
│   │   │   └── parsers/           # PDF and DOCX structural parser adapters
│   │   └── presentation/
│   │       ├── api/v1/            # FastAPI routers: documents, clauses, playbooks
│   │       ├── dependencies/      # DI container wiring and JWT auth guards
│   │       └── middleware/        # Global error handling and correlation IDs
│   └── tests/                     # Unit, integration, and AI evaluation suites
└── frontend/
    ├── src/
    │   ├── app/                   # Next.js 15 App Router layouts and routes
    │   ├── components/
    │   │   ├── editor/            # Custom TipTap extensions and ClauseNode views
    │   │   ├── inspector/         # Right-pane AI redline cards and comment threads
    │   │   └── diff/              # Inline word-level diff renderer
    │   ├── hooks/                 # Custom hooks for SSE streaming and selection sync
    │   ├── services/              # Typed API client and DTO mappers
    │   └── store/                 # Zustand workspace state (activeClauseId, filterMode)

```

### Mandatory Engineering Rules

* **Dependency Rule:** Source code dependencies only point inward toward the Domain layer; the Domain never imports from Infrastructure or Presentation.
* **Repository Pattern:** Use cases interact exclusively with abstract Python Protocol interfaces rather than direct ORM queries.
* **Strict Validation:** Every API boundary and LLM output is validated through strict Pydantic v2 schemas and TypeScript Zod schemas.
* **Idempotency:** Applying or rejecting an AI suggestion must be idempotent and guarded by optimistic concurrency control using version numbers.

## 3. Database & Vector Schema Design

PostgreSQL serves as the single source of truth for document hierarchy, clause states, user permissions, and vector embeddings.

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

CREATE TYPE user_role AS ENUM ('ADMIN', 'LEGAL_COUNSEL', 'TECHNICAL_LEAD', 'VIEWER');
CREATE TYPE risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE suggestion_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'MODIFIED');

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'VIEWER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE playbook_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- e.g., Indemnification, SLA, IP Rights
    standard_position TEXT NOT NULL,
    fallback_position TEXT NOT NULL,
    unacceptable_triggers TEXT NOT NULL,
    embedding vector(1536) NOT NULL
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING',
    version INT NOT NULL DEFAULT 1,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE document_clauses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    clause_index INT NOT NULL,
    heading VARCHAR(255),
    original_text TEXT NOT NULL,
    current_text TEXT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    UNIQUE(document_id, clause_index)
);

CREATE TABLE redline_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clause_id UUID NOT NULL REFERENCES document_clauses(id) ON DELETE CASCADE,
    matched_rule_id UUID REFERENCES playbook_rules(id),
    risk risk_level NOT NULL,
    proposed_text TEXT NOT NULL,
    rationale TEXT NOT NULL,
    status suggestion_status NOT NULL DEFAULT 'PENDING',
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE clause_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clause_id UUID NOT NULL REFERENCES document_clauses(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

```

## 4. LangChain AI Redlining Architecture

The AI engine avoids naive chunking by using structural and semantic segmentation followed by a deterministic LangChain Expression Language (LCEL) pipeline.

### Pipeline Workflow

1. **Structural Ingestion:** Parses DOCX or PDF files while preserving section headers, numbering hierarchies, and paragraph boundaries.
2. **Semantic Clause Splitting:** Groups sub-clauses into self-contained legal or technical provisions so context is never severed mid-obligation.
3. **Hybrid Playbook Retrieval:** Executes a combined dense vector similarity search and BM25 keyword match to fetch the top 3 company playbook policies per clause.
4. **Structured Risk & Redline Generation:** Evaluates the clause against retrieved policies and outputs a strictly typed JSON object containing risk severity, replacement wording, and negotiation reasoning.

```python
from typing import Literal
from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough

class RedlineOutput(BaseModel):
    is_compliant: bool = Field(description="True if clause satisfies company policy")
    risk: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    category: str = Field(description="Clause domain such as Liability, SLA, or Payment")
    proposed_text: str = Field(description="Exact drop-in replacement text for the clause")
    rationale: str = Field(description="Clear legal or technical explanation for the redline")
    negotiation_talking_point: str = Field(description="Short justification to send to counterparty")

SYSTEM_PROMPT = """You are a Principal Legal and Technical Contract Auditor.
Compare the provided contract clause against the retrieved Company Playbook Rules.
If the clause violates policy or introduces unmitigated risk, generate a precise surgical redline
that protects the company while remaining commercially reasonable."""

def build_redline_chain(llm, retriever):
    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", "Company Playbook Rules:\n{playbook_context}\n\nContract Clause:\n{clause_text}")
    ])
    
    structured_llm = llm.with_structured_output(RedlineOutput)
    
    chain = (
        {
            "playbook_context": retriever,
            "clause_text": RunnablePassthrough()
        }
        | prompt
        | structured_llm
    )
    return chain

```

## 5. Interactive Split-Screen UI & State Synchronization

The core differentiator of this platform is the bidirectional synchronization between the left-hand document canvas and the right-hand AI inspection panel.

* **Custom ProseMirror Clause Node:** Every paragraph in the TipTap editor is wrapped in a custom node carrying a persistent `data-clause-id` attribute mapped directly to `document_clauses.id` in PostgreSQL.
* **Risk Heatmap Gutter:** A vertical gutter alongside the editor renders color-coded indicators (Crimson for Critical, Amber for High, Emerald for Compliant) aligned with each clause block.
* **Bidirectional Focus Sync:** Clicking a clause in the editor scrolls the right-hand inspector to the corresponding AI Redline Card; clicking a card in the inspector highlights and scrolls to the paragraph in the editor.
* **Inline Word-Level Diffing:** Hovering over the **Apply Redline** button renders a live inline preview inside the editor showing deletions in strikethrough red and insertions in highlighted green.
* **Atomic One-Click Resolution:** Clicking **Accept** triggers an optimistic mutation that replaces the node content in the editor, increments the clause version, records an audit log entry, and updates the suggestion status to `ACCEPTED`.

## 6. Phased Implementation Roadmap for Developers

The development lifecycle is broken into 7 sequential phases, each with strict deliverables and measurable acceptance criteria.

### Phase 1: Foundation, Multi-Tenancy & RBAC Core

* **Objective:** Establish the monorepo, database migrations, authentication, and role-based permission guards.
* **Deliverables:** Docker Compose environment (PostgreSQL with pgvector, Redis), SQLAlchemy async base, JWT authentication, and RBAC middleware supporting Admin, Legal Counsel, Technical Lead, and Viewer roles.
* **Acceptance Criteria:** Unit tests verify that Viewers cannot mutate clauses, and cross-organization data access is blocked at the repository level.

### Phase 2: Document Ingestion & Semantic Clause Parser

* **Objective:** Build the file upload pipeline that converts raw contracts or RFPs into structured database clauses.
* **Deliverables:** S3-compatible upload endpoint, DOCX/PDF layout parser, semantic clause segmenter, and persistence logic storing ordered records in `document_clauses`.
* **Acceptance Criteria:** Uploading a 30-page contract extracts 100% of clauses in exact sequential order without losing numbering or section hierarchy.

### Phase 3: Company Playbook & Vector Knowledge Base

* **Objective:** Enable organizations to manage internal legal/technical standards and index them for hybrid retrieval.
* **Deliverables:** CRUD endpoints for Playbook Rules, automated embedding generation pipeline, and hybrid search service combining vector similarity with metadata filtering.
* **Acceptance Criteria:** Querying the vector service with a sample limitation-of-liability clause returns the matching internal policy rule in under 150ms.

### Phase 4: LangChain Redlining Engine & Async Worker Pipeline

* **Objective:** Implement the LCEL auditing chain and background worker orchestration with real-time progress streaming.
* **Deliverables:** Structured LangChain redlining chain, Celery batch worker processing clauses concurrently, and an SSE endpoint streaming completed clause evaluations to the client.
* **Acceptance Criteria:** A 100-clause document completes full AI evaluation in under 25 seconds using batch concurrency, with zero malformed JSON outputs.

### Phase 5: Split-Screen Interactive Editor & Clause Binding

* **Objective:** Build the Next.js 15 workspace featuring the synchronized TipTap document editor and AI Inspector panel.
* **Deliverables:** Custom TipTap ClauseNode extension, split-pane resizable layout, synchronized scroll controller, and inline word-diff preview component.
* **Acceptance Criteria:** Selecting any clause highlights its matching AI card within 16ms (60 FPS) with zero layout shift.

### Phase 6: Collaboration, Threaded Comments & One-Click Resolution

* **Objective:** Connect interactive redline actions and multi-user threaded discussions to PostgreSQL with optimistic concurrency.
* **Deliverables:** Accept, Reject, and Modify suggestion endpoints, optimistic Zustand/TanStack state mutations, threaded clause comments, and version conflict detection.
* **Acceptance Criteria:** Accepting a redline immediately updates the editor DOM, persists the new text in PostgreSQL, and prevents stale overwrites if two users edit simultaneously.

### Phase 7: Export Engine, Audit Trail & Production Hardening

* **Objective:** Generate clean or track-changes DOCX exports, complete the compliance audit log, and finalize test coverage.
* **Deliverables:** DOCX reconstruction service supporting native Word Track Changes, immutable audit trail viewer, rate limiting, and end-to-end Playwright test suite.
* **Acceptance Criteria:** Exporting a reviewed contract produces a valid DOCX file where all accepted AI redlines and comments open natively in Microsoft Word.

## 7. Core API Contract Specification

| Method | Endpoint | Access Role | Description |
| --- | --- | --- | --- |
| **POST** | `/api/v1/playbooks/rules` | Admin, Legal | Create and embed a playbook policy rule |
| **POST** | `/api/v1/documents/upload` | Admin, Legal, Tech | Upload contract and trigger ingestion |
| **GET** | `/api/v1/documents/{id}/stream` | All Roles | SSE stream of real-time AI clause results |
| **GET** | `/api/v1/documents/{id}/workspace` | All Roles | Fetch ordered clauses, redlines, and comments |
| **POST** | `/api/v1/suggestions/{id}/resolve` | Admin, Legal, Tech | Accept, modify, or reject an AI redline |
| **POST** | `/api/v1/clauses/{id}/comments` | All Roles | Append a threaded comment to a specific clause |
| **GET** | `/api/v1/documents/{id}/export` | All Roles | Download final or redlined DOCX file |

## 8. Definition of Done (DoD) for Engineering Handoff

* **Test Coverage:** Minimum 85% unit and integration test coverage across Domain and Application layers using Pytest and Vitest.
* **Static Analysis:** Zero warnings from Ruff, MyPy (strict mode), and ESLint prior to merging any pull request.
* **AI Determinism:** LLM temperature set to 0.0 for clause classification and redline generation, backed by fallback retry parsers.
* **Observability:** Every LangChain execution traced via LangSmith or OpenTelemetry with token usage, latency, and organization ID metadata attached.