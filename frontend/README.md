# Interactive Contract & RFP Redlining Studio — Frontend

This directory houses the Next.js 15 / TypeScript frontend workspace scheduled for **Phase 5 (Split-Screen Interactive Editor & Clause Binding)**.

## Planned Structure (Phase 5+)
- `src/app/`: Next.js 15 App Router layouts and routes
- `src/components/editor/`: Custom TipTap extensions and `ClauseNode` views
- `src/components/inspector/`: Right-pane AI redline cards and comment threads
- `src/components/diff/`: Inline word-level diff renderer
- `src/hooks/`: Custom hooks for SSE streaming and selection sync
- `src/services/`: Typed API client and DTO mappers
- `src/store/`: Zustand workspace state (`activeClauseId`, `filterMode`)

