# ADE Partner Hub v1.1

A secure B2B portal for 1031 exchange referral partners (CPAs, Real Estate Attorneys, CRE Brokers) to monitor client exchanges, track statutory deadlines, and generate co-branded client artifacts.

---

## Environment Setup

The AI explainer requires a Gemini API key. Create a `.env` file in the project root (this file is gitignored and never committed):

```bash
# ade-partner-hub/.env
GEMINI_API_KEY=your_key_here
```

Docker Compose will automatically pick it up from that file.

---

## Running Locally

### Option A — Docker (Recommended, works on Windows/Mac/Linux)

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
cd ade-partner-hub

# Production build (fully optimized)
docker-compose up --build

# Open in browser
# http://localhost:3000
```

To stop:
```bash
docker-compose down
```

---

### Option B — Node.js directly (requires Node 18+)

**Prerequisites:** [Node.js 18+](https://nodejs.org/)

```bash
cd ade-partner-hub

# Install dependencies
npm install

# Development mode (hot reload)
npm run dev
# Open: http://localhost:3000

# OR production build
npm run build
npm start
# Open: http://localhost:3000
```

---

## Features & Architecture

### 1. Partner Dashboard & 1:1 Isolation
- Summary metric cards: Active Exchanges, Nearing 45-Day Deadline, Completed YTD, Total Referrals.
- Interactive exchange table: filterable by stage, searchable by client name, sortable by urgency/deadlines.
- Visual countdown pills for 45/180-day windows and automated at-risk alert badges (<10 days remaining).
- **Server-Side Authorization**: Partner users are strictly isolated to their assigned organization via header-based identity resolution (`X-Role` and `X-Partner-Id`).

### 2. Exchange Detail View & Milestone Tracker
- Comprehensive timeline tracker from property sale to replacement acquisition.
- Escrow status tracker with fund movement notes and milestone visualization.

### 3. Co-Branded Artifact Generator & PDF Export
- One-click status report generation with live preview.
- **Dual Logo Branding**: Automatically fetches, rasterizes (via off-screen canvas), and embeds both the Atlanta Deferred Exchange (QI) logo and partner organization logo in crisp vector quality into the PDF header.
- "Copy Tokenized Live Link" and "Download PDF Report" (`jsPDF` + `jsPDF-AutoTable`).
- Analytics tracker logging every generate/copy/download action (`/api/artifact-logs`).

### 4. AI-Powered Plain-English Explainer
- Stage-aware, jargon-free client summaries powered by **Google Gemini (`gemini-3.1-flash-lite`)**.
- Strict anti-hallucination guardrails forbidding the derivation of unprovided numbers/dates.
- Compliance guardrail badge ("Checked against Rules Source-of-Truth").

### 5. Role Switching
- **Partner User**: Sees only assigned exchanges (default: Apex CPA Group).
- **QI Admin**: Sees all exchanges across all partners, plus partner management directory (`/partners`).

---

## Developer Steering & Documentation

This repository includes comprehensive steering documentation for human developers and AI assistants:
- **`./GEMINI.md`**: Root project architecture, directory map, tech stack, and security model.
- **`./src/GEMINI.md`**: Scoped guidelines for data access layer (`dal.ts`), server authentication, React context state management (`AppContext`), and UI components.

---

## Seed Data

- **1 QI Entity**: Atlanta Deferred Exchange
- **3 Partners**: Apex CPA Group (CPA), Meridian Real Estate Law (Attorney), Vanguard Commercial Brokerage (CRE Broker)
- **20 Exchanges**: Distributed across all 5 stages, with realistic deadlines relative to November 10, 2026
  - 5 at-risk exchanges with <10 days on a deadline
  - Mix of completed, active, and new intakes

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: SQLite (`better-sqlite3` in WAL mode)
- **AI Integration**: Google Generative AI (`@google/generative-ai`)
- **PDF Generation**: `jsPDF` + `jsPDF-AutoTable` + Canvas SVG Rasterization
- **Charts**: Recharts
- **Icons**: Lucide React
- **Containerization**: Docker + Docker Compose
