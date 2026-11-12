# ADE Partner Hub — Project Steering Guide

Welcome to the **ADE Partner Hub** codebase. This document serves as the primary technical steering guide for developers and AI agents navigating, maintaining, and extending this repository.

---

## 1. Project Overview & Domain Context

ADE Partner Hub is a B2B client portal for **Atlanta Deferred Exchange (ADE)**, a Qualified Intermediary (QI) specializing in IRS §1031 tax-deferred exchanges.
It bridges relinquished property sales with replacement property acquisitions across three referral partner types:
- **CPAs** (e.g., Apex CPA Group)
- **Real Estate Attorneys** (e.g., Meridian Real Estate Law)
- **CRE Brokers** (e.g., Vanguard Commercial Brokerage)

### Core Capabilities
1. **Partner Dashboard**: Real-time metrics (Active Exchanges, Nearing 45-Day Deadline, Completed YTD), filterable/searchable exchange tables, visual countdown pills, at-risk badges (<10 days), and 1:1 partner isolation.
2. **Exchange Detail View**: Milestone timeline tracker, escrow verification status, and property details.
3. **Co-Branded Artifact Generator**: Dual ADE + Partner branding, live preview, tokenized link generator, formatted PDF generation (`jsPDF` + `jsPDF-AutoTable`), and interaction logging analytics (`/api/artifact-logs`).
4. **AI-Powered Plain-English Explainer**: Gemini AI-driven stage-aware client summaries with strict anti-hallucination guardrails and source-of-truth verification badges (`/api/explainer`).
5. **Role & Partner Switching**: Toggle between `Partner User` (scoped to assigned partner) and `QI Admin` (full multi-partner visibility).

---

## 2. Tech Stack & Architecture

- **Framework**: Next.js 14 (App Router, Server & Client Components)
- **Language**: TypeScript (strict type safety)
- **Styling**: Tailwind CSS (`tailwind.config.ts`, custom colors like `navy-900`, `gold-500`, etc.)
- **Database**: SQLite (`better-sqlite3` in WAL mode, persistent at `./data/ade.db` or container volume `/data/ade.db`)
- **AI Integration**: `@google/generative-ai` (Gemini API via `/api/explainer`)
- **PDF Generation**: `jspdf` & `jspdf-autotable`
- **Containerization**: Docker & Docker Compose (`Dockerfile`, `Dockerfile.dev`, `docker-compose.yml`)

---

## 3. Directory Navigation & Map

```
ade-partner-hub/
├── data/                      # SQLite database storage (ade.db) - gitignored
├── public/
│   └── logos/                 # Partner & QI SVG/PNG logos
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout with db auto-bootstrap
│   │   ├── page.tsx           # Main application shell (AppProvider + views)
│   │   ├── globals.css        # Tailwind directives & global styling
│   │   └── api/               # Backend API Routes
│   │       ├── bootstrap/     # GET: Initial state (QI, partners, exchanges, logs)
│   │       ├── exchanges/     # GET: Scoped exchange list
│   │       ├── explainer/     # POST: Gemini AI plain-English summary generator
│   │       ├── artifact-logs/ # GET/POST: Audit trail for artifact generation/copies/downloads
│   │       ├── logos/[filename]/ # GET: Secure asset streaming route
│   │       └── partners/      # GET: Partner directory
│   ├── components/            # React UI Components
│   │   ├── artifacts/         # ArtifactModal & ArtifactAnalyticsPage
│   │   ├── dashboard/         # DashboardPage, ExchangeTable, MetricCard
│   │   ├── exchange/          # ExchangeDetail & PlainEnglishExplainer
│   │   ├── layout/            # Sidebar navigation & role switcher
│   │   ├── partners/          # PartnersPage
│   │   └── ui/                # Shared primitives (Button, Card, Badge, Modal, CountdownPill, PartnerLogo)
│   ├── lib/                   # Server-side data & auth logic
│   │   ├── db.ts              # SQLite singleton connection
│   │   ├── schema.ts          # Table creation & migrations
│   │   ├── seed.ts            # Default seed data (20 exchanges, 3 partners)
│   │   ├── dal.ts             # Data Access Layer (typed queries & writes)
│   │   ├── serverAuth.ts      # Header-based identity resolution & scoping
│   │   ├── startup.ts         # DB auto-initialization
│   │   └── utils.ts           # Formatting helpers & calculations
│   ├── store/                 # React Context
│   │   └── AppContext.tsx     # State management & API fetch wrappers
│   └── types/                 # TypeScript interfaces (Exchange, Partner, AppState, etc.)
├── Dockerfile
├── Dockerfile.dev
├── docker-compose.yml
├── package.json
└── README.md
```

---

## 4. Security & Authorization Model

### Server-Side Identity Enforcement (`src/lib/serverAuth.ts`)
- The backend **never** trusts client query parameters or request body fields for authorization scoping.
- Every API request must pass two custom headers:
  - `X-Role`: `"Partner User"` or `"QI Admin"`
  - `X-Partner-Id`: `"<partner-id>"` (required for Partner Users)
- **Partner Isolation**: A `Partner User` receives only exchanges belonging to their `partnerId`. Even if an ID belongs to another partner, backend checks reject unauthorized read/write attempts with 403 Forbidden.

---

## 5. Development & Run Commands

- **Local Development**:
  ```bash
  npm install
  npm run dev          # Starts Next.js on port 3000
  ```
- **Docker Production Build**:
  ```bash
  docker-compose up --build
  ```
- **Build / Lint**:
  ```bash
  npm run build
  npm run lint
  ```

---

*See `./src/GEMINI.md` for scoped component and backend implementation guidelines.*
