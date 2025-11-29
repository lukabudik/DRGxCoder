# UI/UX Design: DRG Audit Web App

This document defines a linear, modern, and easily implementable design for a single-page frontend app that processes DRG (coding audit). It must be reusable across repositories and deployable across hospitals.

## Design Goals

- Clear hierarchy: input on the left, output on the right; minimal visual noise.
- Instant readability: high contrast, low ornament, keyboard-first (tab navigation).
- Transparency: hovering DRG fields highlights related input text (demo: random mapping).
- Quick state recognition: explicit loading, success, warning, and error states.

## Typography and Colors

- Font: “IBM Plex Sans” or “Source Sans 3”, 14–16 px base, 1.5 line-height.
- Palette: light neutral background (#f7f9fc), text #0f172a; action/blue #2563eb; warning #d97706; success #059669; error #dc2626. Use CSS variables.
- Text highlights: soft background (rgba(37,99,235,0.15)) + thin left bar for the active segment.

## Layout (Desktop & Tablet)

1. **Header bar**: app name, “Demo” badge, “Settings” button (placeholder).
2. **Main two-column**:
   - **Left (Input)**: textarea filling remaining height, label “Clinician text”, helper “Paste discharge/epicrisis”, character counter, primary “Analyze” button. Status messages below the button (loading/error).
   - **Right (Output)**: scrollable panel with cards.
     - **DRG Summary**: required fields `drgCode`, `drgName`, `reliabilityScore` (0–1), `los`, `rv`, `revenue`, `cost`, badge “AI suggestion”/“Coder”.
     - **Diagnoses (ICD-10)**: items with `id`, `code`, `name`, `probability`, `source` (ai/human), optional `severity`/`ccLevel`. Hover row → highlight text on the left (demo: random mapping).
     - **Procedures**: analogous `id`, `code`, `name`, `probability`, `source`.
     - **Metadata**: `patientAge`, `patientSex`, `admissionDate`, `dischargeDate`, `department`, `payer`, `treatmentType`, `status` (Closed/Blocked). Show in a two-column grid.
     - **AI Notes**: `notes` (short text), optional `riskScore` for mismatch.
3. **Footer strip**: small demo note and link to logs.

## Interaction and States

- Submit: click “Analyze” or Ctrl+Enter. Disable button after submit, show spinner inside.
- Errors: banner above output with text and CTA “Try again”.
- Hover audit: hovering DRG/ICD/procedure item highlights matching input segment (demo: random). Optionally, selecting input text can highlight related rows.
- Empty state: illustrated placeholder “Paste text and run analysis”.
- Loading output: skeleton blocks for cards and lists.

## Responsiveness

- Tablet: columns stack; input on top, output below, both 100% width.
- Mobile (if needed): vertical stack only, sticky “Analyze” button on top.

## Accessibility

- All interactive elements have focus states (2 px outline in primary color).
- ARIA roles for buttons, alerts, result lists.
- Contrast meets WCAG AA; text not conveyed by color alone (add icons/badges).

## Visual Components

- Cards with soft shadow (0 4px 12px rgba(15,23,42,0.08)), 12 px radius.
- Badges: solid (primary) for AI suggestion, outline for coder-provided values.
- Tables/lists: very light zebra rows, “i” icon for tooltips.

## Copy (EN)

- Primary button: “Analyze”; secondary: “Clear input”.
- Error: “We couldn’t fetch a result. Please try again.”
- Loading: “Analyzing text…”
- Empty: “Paste the epicrisis/discharge text and start analysis.”

## Demo Limitation

- Highlighting provenance runs randomly (frontend stub); show a clear note “Demo highlighting (mock)” near Diagnoses/Procedures.
