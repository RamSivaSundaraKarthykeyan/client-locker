# Project Implementation Documentation

This document maintains a chronological record of all features, architecture setups, workflows, and changes implemented in the **client-locker** repository.

---

## Chronological Implementation Log

### 2026-11-05: Initial Repository Creation
- **Commit**: `5f89f9f`
- **Scope**: Repository initialization.
- **Details**:
  - Initialized git repository.
  - Added base `.gitignore` and default repository structure.

---

### 2026-11-05: Project Setup & Next.js Initialization
- **Commit**: `28ec0c3`
- **Scope**: Core frontend framework setup and configuration.
- **Details**:
  - **Framework**: Initialized Next.js 16.4.5 with Turbopack and React 19.3.0.
  - **TypeScript**: Configured strict typing with TypeScript 5 (`tsconfig.json`).
  - **Styling**: Configured Tailwind CSS v4 (`@tailwindcss/turbopack`, `app/globals.css`).
  - **Linting**: Configured ESLint 9 using Flat Config (`eslint.config.mjs`, `eslint-config-next`).
  - **Application Structure**:
    - [`app/layout.tsx`](file:///Users/karthy/Programs/client-locker/app/layout.tsx): Root layout with metadata and Geist font definitions.
    - [`app/page.tsx`](file:///Users/karthy/Programs/client-locker/app/page.tsx): Main landing page boilerplate.
    - [`next.config.ts`](file:///Users/karthy/Programs/client-locker/next.config.ts): Next.js configuration enabling cache components, partial prefetching, and agent feedback experiments.

---

### 2026-11-05: CI/CD Pipeline & Secret Scanning Automation
- **Commit**: `761e9c7`
- **Scope**: Continuous Integration and automated secret scanning with GitHub Actions.
- **File**: [`.github/workflows/ci.yml`](file:///Users/karthy/Programs/client-locker/.github/workflows/ci.yml)
- **Details**:
  - **Triggers**: Automated runs on every `push` and `pull_request` against all branches.
  - **Job 1: Gitleaks Scan (`gitleaks`)**:
    - Checks out the repository using `actions/checkout@v4` with `fetch-depth: 0` to scan full git history.
    - Uses `gitleaks/gitleaks-action@v2` to audit codebase and commit logs for hardcoded API keys, JWTs, private keys, and secrets.
    - Passes `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` to enable PR annotations.
  - **Job 2: Build Project (`build`)**:
    - Runs on `ubuntu-latest`.
    - Configures Node.js v22 using `actions/setup-node@v4` with automatic `npm` dependency caching.
    - Installs dependencies deterministically via `npm ci`.
    - Executes `npm run build` to validate compilation and Next.js production bundle generation.

---

### 2026-11-12: Milestone 2 (M2) — Private Vault, Multi-Role Auth & File Flow Implementation
- **Scope**: Core M2 delivery featuring database schema, seed automation, server-enforced authentication, private storage integration, and document upload/list/view flows.
- **Key Modules Implemented**:
  1. **Database Schema & Storage Architecture** ([`supabase/schema.sql`](../supabase/schema.sql)):
     - Tables: `firms`, `people`, `clients`, `client_access`, `files`, `checklist_items`.
     - Constraints: UUID primary keys, role enum validation (`partner`, `staff`, `client`), cascade deletions.
     - Storage Bucket: Created `client-vault` as a strictly **private** Supabase storage bucket (`public = false`, 4 MB file limit, restricted to PDF, JPG, PNG).
  2. **Automated Seed Script** ([`scripts/seed.ts`](../scripts/seed.ts)):
     - Seeds 1 firm (*Apex Accounting & Advisory LLP*).
     - Seeds 2 partners (*Elena Rostova*, *Marcus Vance*).
     - Seeds 6 staff members (including 1 trainee: *Leo Martin*).
     - Seeds 10 realistic corporate clients (*NovaTech Dynamics*, *BlueWave Logistics*, etc.), each mapped with primary contact accounts and 5 checklist items.
     - Automatically uploads a mock PDF file to the private storage bucket and registers it in the `files` table.
     - Script executable with `npm run seed`.
  3. **Role-Based Authentication & Session Management** ([`lib/auth.ts`](../lib/auth.ts), [`app/actions/auth.ts`](../app/actions/auth.ts)):
     - Email & password authentication using `bcryptjs` password hashing.
     - Session state preserved in secure HTTP-only cookies (`cl_session`).
     - **Strict server-side role resolution**: Roles are resolved dynamically from database records and never trusted from client-side inputs.
     - Route separation:
       - `/partner/dashboard`: Executive firm overview, metrics, and client list.
       - `/staff/dashboard`: Client portfolio, checklist tracking, and access to individual client vaults.
       - `/client/dashboard`: Client portal showing assigned checklist tasks and firm-shared documents only.
  4. **Private File Upload & Streaming** ([`app/actions/files.ts`](../app/actions/files.ts), [`app/api/files/[fileId]/view/route.ts`](../app/api/files/[fileId]/view/route.ts)):
     - Accepts PDF, JPG, and PNG files up to 4 MB.
     - Uploads directly into private storage bucket `client-vault` via authenticated server action.
     - Files are served via `/api/files/[fileId]/view` streaming route which verifies user session permissions before downloading from private storage.

---

## Technical Stack Summary

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router, Turbopack) | `16.4.5` | React full-stack framework |
| **UI Library** | React / React DOM | `19.3.0` | Declarative UI rendering |
| **Styling** | Tailwind CSS | `^4.0.0` | Utility-first styling engine |
| **Language** | TypeScript | `^5.0.0` | Static typing |
| **Linting** | ESLint | `^9.0.0` | Code quality and syntax standards |
| **Deployment** | Vercel | Production | Official live deployment at [client-locker-ohhb.vercel.app](https://client-locker-ohhb.vercel.app/) |
| **CI / Automation**| GitHub Actions | v4 | Automated builds on push/PR |
| **Security** | Gitleaks Action | v2 | Leaked secret and credential detection |

