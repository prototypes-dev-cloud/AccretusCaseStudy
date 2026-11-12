# `src/` — Scoped Technical Guide

This document provides detailed architecture and convention guidelines for code located within `src/`.

---

## 1. Architectural Layers & Conventions

### A. Data Access Layer (`src/lib/dal.ts`)
- All direct SQLite interactions (`better-sqlite3`) must go through `dal.ts`.
- Functions must map raw database snake_case row objects to camelCase TypeScript interfaces defined in `src/types/index.ts`.
- Never execute raw SQL queries directly inside React components or API routes.

### B. Server Authorization (`src/lib/serverAuth.ts`)
- Every API route under `src/app/api/` (except asset streaming like logos) must invoke `resolveIdentity(req)`.
- If `auth.ok` is false, immediately return HTTP 401/403 with `{ error: auth.error }`.
- Use `getScopedPartnerId(auth.identity)` to determine whether queries should be filtered by `partner_id` or return all records (`QI Admin`).

### C. State Management (`src/store/AppContext.tsx`)
- Provides global React context (`AppProvider`, `useApp()`).
- Encapsulates bootstrap loading, automatic header injection (`authHeaders`), exchange refreshing, and artifact logging.
- Client components consume state through `useApp()`. Avoid prop drilling.

### D. UI Components (`src/components/`)
- Built using Tailwind CSS with a strict color palette (Navy `#0f1f35`, Gold `#f59e0b` / `#d97706`, and clean Slate neutrals).
- Reusable primitives are located in `src/components/ui/` (`Button`, `Card`, `Badge`, `Modal`, `CountdownPill`, `PartnerLogo`).
- Always maintain client-side interactivity (`'use client'`) where state or effects are required (Next.js App Router convention).

### E. AI Explainer Route (`src/app/api/explainer/route.ts`)
- Integrates Google Generative AI (`gemini-3.1-flash-lite`).
- Relies on strict anti-hallucination prompts forbidding the model from deriving unprovided numbers/dates.
- Automatically strips model-generated disclaimers and appends the standard regulatory disclaimer.

---

## 2. Coding & Style Rules

- **Types**: Strict TypeScript. Never use `any` or type casting hacks (`as unknown as ...`) unless absolutely unavoidable.
- **Imports**: Use `@/...` path aliases for clean imports (e.g. `import { Exchange } from '@/types';`).
- **Error Handling**: Gracefully catch and log API and database errors with informative prefixes (e.g., `[AppContext]`, `[explainer]`).
