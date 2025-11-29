# Frontend Architecture & Tech (Single-Page App)

Clean structure for a SPA that calls a REST backend, processes and displays DRG data, and supports demo text highlighting. Goal: easy to extend and portable across hospitals and repositories.

## Stack

- Build: Vite + React 18 + TypeScript.
- Styling: CSS Modules or TailwindCSS; CSS variables for colors/typography per design.
- State & data: TanStack Query for REST calls (caching, loading/error states).
- Form: React Hook Form for text input and validation.
- Tests: Vitest + Testing Library.
- Lint/format: ESLint (typescript + react hooks), Prettier.

## Layered Structure (Clean-ish)

- `src/app`: bootstrap (providers, QueryClient, global CSS).
- `src/shared`: types, utils (e.g., random highlight map), UI atoms (Button, Card, Badge, Skeleton).
- `src/core`: domain models (CaseResult, Diagnosis, Procedure, HighlightSpan), DTO mapping from REST to domain.
- `src/services/api`: fetch client (axios/fetch wrapper), endpoints `analyzeText`, request/response types.
- `src/features/analyzer`: form (textarea + submit), request state, input parsing.
- `src/features/results`: components SummaryCard, DiagnosisList, ProcedureList, HighlightsOverlay; hover → highlight interaction.
- `src/pages/home`: layout composition (input panel left, results right); no routing needed.

## API Contract (Proposed)

- POST `/analyze` body `{ text: string }`.
- Response (expected fields for UI portability):
  - `drgCode`, `drgName`, `reliabilityScore`, `los`, `rv`, `revenue`, `cost`.
  - `diagnoses`: `[{ id, code, name, probability?, source?, severity?, ccLevel? }]`.
  - `procedures`: `[{ id, code, name, probability?, source? }]`.
  - `highlights?`: `[{ id, start, end }]` (offsets in the input text); for demo, generate randomly on the frontend.

## State & Interaction

- Mutation `useAnalyzeText` (TanStack Query `useMutation`), stores last result locally (`useState`/zustand if needed).
- Hover on Diagnosis/Procedure item: dispatch `activeHighlightId`, paint the corresponding range in the input (demo: random on result load).
- Loading: skeletons + disabled button; Error: alert banner with retry.

## Styling Conventions

- `:root` CSS variables for colors/spacing/typography; light theme default.
- Components are prop-driven; examples:
  - `DiagnosisList` props: `items: Array<{code: string; name: string; probability?: number; source?: string; id: string}>; onHover(id?)`.
  - `HighlightText`: input text + `activeRanges` (offset ranges) → render with `<mark>` wraps.

## Step-by-Step for Implementers

1. Init Vite React TS; add ESLint/Prettier/TanStack Query/React Hook Form.
2. Set global CSS variables and base layout (two panels).
3. Build UI atoms (Button, Textarea, Card, Badge, Banner, Skeleton).
4. Define domain types (`CaseResult`, `Diagnosis`, `Procedure`, `HighlightSpan`).
5. Implement API client and hook `useAnalyzeText` (dummy endpoint for demo).
6. Create `HighlightText` for the input area with visual highlights (overlay or inline `<pre>` + background).
7. Compose `AnalyzerForm` (textarea + submit + status) and `ResultsPanel` (SummaryCard + DiagnosisList + ProcedureList).
8. Add random highlight mapping on result load (split text into sentences/paragraphs and assign to items).
9. Wire empty/loading/error states and a demo note about mock highlighting.
10. Add basic tests: empty state render, loading, show result, hover triggers highlight class.

## Deployment & Portability

- Serve static build (Vite) behind a reverse proxy; single config: backend URL (`VITE_API_BASE_URL`).
- No hardcoded hospital data; texts in English, but add `i18n` hook for easy translation (optional).
