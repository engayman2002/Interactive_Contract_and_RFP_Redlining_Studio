# Interactive Contract & RFP Redlining Studio

An enterprise-grade, multi-tenant **LegalTech & B2B SaaS Redlining Studio** that ingests complex third-party contracts and RFPs (`.docx` and `.pdf`), segments them into structured semantic clauses, benchmarks every clause concurrently against a vector-indexed **Company Playbook** (`pgvector` + BM25 hybrid retrieval), streams real-time **LangChain LCEL** risk evaluations and proposed redlines via Server-Sent Events (SSE), and provides a **Split-Screen Interactive TipTap/ProseMirror Editor** with one-click optimistic concurrency resolution, threaded clause discussions, immutable compliance audit logging, and **Native Microsoft Word OpenXML Track-Changes (`.docx`) Export**.

---

## Architecture & Repository Blueprint

The monorepo strictly enforces **Clean Architecture (Hexagonal / Ports & Adapters)** with inward-only dependency rules (`Presentation -> Application -> Domain <- Infrastructure`):

```text
Interactive_Contract_and_RFP_Redlining_Studio/
├── DOCS.md                             # Complete System Architecture & Specification
├── README.md                           # Engineering Setup, API Reference & Verification Guide
├── docker-compose.yml                  # PostgreSQL 16 (pgvector) + Redis 7 Infrastructure
├── backend/
│   ├── pyproject.toml                  # Python 3.12+, FastAPI, SQLAlchemy 2.0, LangChain, Mypy/Ruff
│   ├── alembic.ini                     # Database Migration Configuration
│   ├── src/
│   │   ├── main.py                     # FastAPI App Factory, CORS, Security & Rate-Limit Middleware
│   │   ├── domain/                     # Pure Business Logic (Zero Framework/ORM Imports)
│   │   │   ├── entities/               # Organization, User, Document, DocumentClause, PlaybookRule,
│   │   │   │                           # RedlineSuggestion, ClauseComment, AuditLogEntry
│   │   │   ├── enums/                  # UserRole, RiskLevel, SuggestionStatus, ExportMode, AuditAction
│   │   │   ├── exceptions/             # DomainError, ConcurrencyConflictError, TenantIsolationError
│   │   │   └── ports/                  # Protocol Interfaces (Repositories, UnitOfWork, Parsers, AI, Export)
│   │   ├── application/                # Orchestration Layer, Immutable DTOs & RBAC Services
│   │   │   ├── dtos/                   # Frozen Pydantic v2 Request/Response DTOs
│   │   │   ├── services/               # JwtTokenService, PasswordService (bcrypt), RbacGuardService
│   │   │   └── use_cases/              # Onboarding, Auth, Ingestion, Playbook, AI Audit, Collaboration, Export
│   │   ├── infrastructure/             # Concrete External Adapters
│   │   │   ├── config.py               # Pydantic Settings & Multi-Tiered Secret Resolution
│   │   │   ├── db/                     # SQLAlchemy 2.0 Async Models, Repositories, UnitOfWork & Migrations
│   │   │   ├── parsers/                # DOCX/PDF Structural Parsers, Semantic Segmenter & OpenXML Exporter
│   │   │   ├── vector/                 # 1536-d Embedding Adapter & Hybrid Vector + BM25 Playbook Retriever
│   │   │   └── ai/                     # LangChain LCEL Clause Auditing Chain & Celery Batch Worker
│   │   └── presentation/               # Delivery Layer
│   │       ├── api/v1/                 # FastAPI Routers (auth, users, documents, playbooks, collaboration)
│   │       ├── dependencies/           # Dependency Injection & Declarative RBAC Guards
│   │       └── middleware/             # Correlation ID, Security Headers & Sliding-Window Rate Limiter
│   └── tests/
│       ├── unit/                       # Domain, Architecture, RBAC, Parsers, Embeddings, LangChain & DOCX Exporter
│       └── integration/                # End-to-End Multi-Tenant API, SSE, Concurrency, Audit & Rate-Limit Tests
└── frontend/
    ├── package.json                    # Next.js 15, TypeScript, TipTap/ProseMirror, Zustand, Zod, Vitest
    ├── playwright.config.ts            # Playwright End-to-End Test Configuration
    ├── e2e/
    │   └── redliningStudio.spec.ts     # End-to-End Redlining Studio Lifecycle Specification
    └── src/
        ├── app/                        # Next.js 15 App Router Workspace Entrypoint
        ├── components/
        │   ├── workspace/              # RedliningStudioWorkspace (Resizable Split-Screen + Export Controls)
        │   ├── editor/                 # Custom TipTap ClauseNode, RiskHeatmapGutter, InlineWordDiffPreview
        │   └── inspector/              # AiInspectorPanel, RedlineCard, ClauseCommentThread, AuditTrailPanel
        ├── hooks/                      # useDocumentStream (Real-Time SSE Hook)
        ├── services/                   # Zod Contracts, API Client & Word-Level Diff Engine
        ├── store/                      # Zustand Workspace Store with Optimistic Concurrency & Rollback
        └── __tests__/                  # Vitest + React Testing Library Component & Store Suites
```

---

## Phase-by-Phase Capabilities

| Phase | Module | Key Engineering Highlights |
| :--- | :--- | :--- |
| **Phase 1** | **Foundation, Multi-Tenancy & RBAC Core** | Strict `org_id` tenant isolation on all repository queries; 4 RBAC roles (`ADMIN`, `LEGAL_COUNSEL`, `TECHNICAL_LEAD`, `VIEWER`); stateless JWT (`HS256`) with revocation & `bcrypt` password hashing. |
| **Phase 2** | **Document Ingestion & Semantic Clause Parser** | Structural `.docx` (`python-docx`) & `.pdf` (`pypdf`) parsers with Zip-Slip, XXE, and header/footer stripping guards; state-machine semantic clause splitter preserving section hierarchies. |
| **Phase 3** | **Company Playbook & Vector Knowledge Base** | `playbook_rules` with 1536-d vector embeddings (`pgvector`) + BM25 keyword scoring (`0.7 * cosine + 0.3 * bm25`) returning top-3 governing playbook rules per clause in `<150ms`. |
| **Phase 4** | **LangChain Redlining Engine & Async Worker Pipeline** | Deterministic (`temperature=0.0`) LangChain LCEL pipeline enforcing `RedlineOutput` schema validation, automatic retry recovery, bounded `asyncio.Semaphore(20)` concurrency, and SSE streaming. |
| **Phase 5** | **Split-Screen Interactive Editor & Clause Binding** | Custom TipTap/ProseMirror `ClauseNode` with persistent `data-clause-id`, Risk Heatmap Gutter, bidirectional scroll/focus sync, and hover-triggered inline word-level diff preview (`<del>` / `<ins>`). |
| **Phase 6** | **Collaboration, Threaded Comments & One-Click Resolution** | Atomic `ACCEPT`, `MODIFY`, and `REJECT` resolution with optimistic concurrency (`expected_clause_version`), automatic `409 Conflict` state rollback banner, and threaded clause comments. |
| **Phase 7** | **Export Engine, Audit Trail & Production Hardening** | Native Microsoft Word OpenXML Track-Changes (`<w:ins>` and `<w:del>` with `w:author` & `w:date`) and Clean `.docx` export, append-only compliance `audit_logs`, and sliding-window rate limiting (`429`). |

---

## Quickstart & Local Development

### 1. Start Infrastructure Services (PostgreSQL 16 + `pgvector` & Redis 7)

```bash
docker compose up -d
```

### 2. Backend Setup, Database Migrations & Server Startup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Apply Alembic migrations
alembic upgrade head

# Launch FastAPI server on 127.0.0.1:8000
uvicorn src.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/api/v1/docs`.

### 3. Frontend Setup & Next.js 15 Studio Startup

```bash
cd frontend
npm install
npm run dev -- -H 127.0.0.1 -p 3000
```

Open `http://127.0.0.1:3000` in your browser to launch the split-screen **Interactive Contract & RFP Redlining Studio**.

---

## Core REST & SSE API Reference (`/api/v1`)

| Method & Path | Allowed Roles | Description |
| :--- | :--- | :--- |
| `POST /api/v1/auth/register-org` | Public | Onboard a new tenant organization and provision its initial `ADMIN` user + JWT. |
| `POST /api/v1/auth/login` | Public | Authenticate user credentials and issue a tenant-scoped JWT (`sub`, `org_id`, `role`). |
| `POST /api/v1/users` | `ADMIN` | Provision a new user (`ADMIN`, `LEGAL_COUNSEL`, `TECHNICAL_LEAD`, `VIEWER`) in the caller's organization. |
| `POST /api/v1/documents/upload` | `ADMIN`, `LEGAL_COUNSEL`, `TECHNICAL_LEAD` | Upload a `.docx` or `.pdf` contract/RFP, segment into semantic clauses, and record `DOCUMENT_INGESTED`. |
| `GET /api/v1/documents/{id}/workspace` | All Roles | Retrieve document metadata, ordered clauses, AI redline suggestions, threaded comments, and audit logs. |
| `POST /api/v1/documents/{id}/analyze` | `ADMIN`, `LEGAL_COUNSEL`, `TECHNICAL_LEAD` | Concurrently audit all document clauses against the Company Playbook and record `DOCUMENT_ANALYZED`. |
| `GET /api/v1/documents/{id}/stream` | All Roles | Stream real-time `clause_audited` and `completed` Server-Sent Events (`text/event-stream`). |
| `POST /api/v1/playbooks/rules` | `ADMIN`, `LEGAL_COUNSEL` | Create a Company Playbook rule and automatically index its 1536-dimensional vector embedding. |
| `POST /api/v1/playbooks/rules/search` | All Roles | Execute hybrid vector cosine similarity + BM25 keyword retrieval across tenant playbook rules. |
| `POST /api/v1/suggestions/{id}/resolve` | `ADMIN`, `LEGAL_COUNSEL`, `TECHNICAL_LEAD` | Atomically `ACCEPT`, `MODIFY`, or `REJECT` a redline with `expected_clause_version` optimistic locking (`409` on conflict). |
| `POST /api/v1/clauses/{id}/comments` | All Roles | Append a threaded comment to a specific clause and record `COMMENT_CREATED`. |
| `GET /api/v1/documents/{id}/export` | All Roles | Download `.docx` in `mode=track_changes` (native `<w:ins>` / `<w:del>` OpenXML revisions) or `mode=clean`. |
| `GET /api/v1/documents/{id}/audit-trail` | All Roles | Retrieve the chronological immutable compliance audit trail for the document within `org_id`. |

---

## Quality Gates & Verification Commands

### Backend Verification (`ruff`, `mypy --strict`, `pytest`)

```bash
cd backend
./.venv/bin/ruff check .
./.venv/bin/mypy --strict src tests
./.venv/bin/pytest -v
```

### Frontend Verification (`tsc --noEmit`, `next lint`, `vitest`, `next build`)

```bash
cd frontend
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/next lint
./node_modules/.bin/vitest run
./node_modules/.bin/next build
```

---

## Production Beta Deployment (Docker Swarm, Kubernetes & Nginx TLS 1.3)

### 1. Provision Secrets & Environment Variables

Copy [.env.production.example](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/.env.production.example) to `.env.production` and populate mounted secret files for `JWT_SECRET_KEY`, `GROQ_API_KEY`, `OPENAI_API_KEY`, and `POSTGRES_PASSWORD`:

```bash
mkdir -p deploy/secrets deploy/nginx/certs
openssl rand -hex 32 > deploy/secrets/jwt_secret_key.txt
echo "gsk_your_production_groq_key" > deploy/secrets/groq_api_key.txt
echo "sk-your_production_openai_key" > deploy/secrets/openai_api_key.txt
openssl rand -hex 24 > deploy/secrets/postgres_password.txt
chmod 600 deploy/secrets/*.txt
```

### 2. Deploy with Docker Compose / Docker Swarm

[docker-compose.prod.yml](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/docker-compose.prod.yml) orchestrates:
- **Nginx Reverse Proxy** ([deploy/nginx/nginx.conf](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/deploy/nginx/nginx.conf)) with TLS 1.2/1.3 termination, HSTS, `25M` upload ceiling, and zero-buffering Server-Sent Events (`proxy_buffering off;`) on `/api/v1/documents/*/stream`.
- **Next.js 15 Standalone Frontend** ([frontend/Dockerfile](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/frontend/Dockerfile)) running as non-root `nextjs` user (`uid 10001`).
- **FastAPI Backend & Celery Workers** ([backend/Dockerfile](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/backend/Dockerfile)) running as non-root `redline` user (`uid 10001`) reading mounted secrets from `/run/secrets/*`.
- **PostgreSQL 16 (`pgvector`) & Redis 7** with persistent volumes and healthchecks.

```bash
# Docker Compose Production Mode
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Or Docker Swarm Stack Deployment
docker stack deploy -c docker-compose.prod.yml redlining-studio
```

### 3. Deploy to Kubernetes (`deploy/k8s/`)

Apply the manifests in [deploy/k8s/](file:///home/ayman/Interactive_Contract_and_RFP_Redlining_Studio/deploy/k8s/) in order:

```bash
kubectl apply -f deploy/k8s/00-namespace-and-config.yaml
kubectl apply -f deploy/k8s/01-postgres-and-redis.yaml
kubectl apply -f deploy/k8s/02-backend-and-worker.yaml
kubectl apply -f deploy/k8s/03-frontend-and-nginx.yaml
```


