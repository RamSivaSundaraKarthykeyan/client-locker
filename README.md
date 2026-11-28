# ClientLocker

A private file locker for accounting firms where each person sees only the client files they are allowed to see, while partners always know who opened what.

**Live link:** [https://client-locker-ohhb.vercel.app/](https://client-locker-ohhb.vercel.app/)

## Recordings

- **2-Minute M4 Walkthrough & Code Explanation Video**: [Watch on Google Drive (Set to "Anyone with the link")](https://drive.google.com/file/d/YOUR_2MIN_M4_VIDEO_LINK_HERE/view?usp=sharing)
  - *Demo Moment*: Two browsers side by side. Managing Partner (Kavitha Vel) removes trainee (Leo Martin) from NovaTech Dynamics $\rightarrow$ trainee refreshes, client vanishes from dashboard $\rightarrow$ opening an old file link immediately returns `403 Forbidden` $\rightarrow$ Kavitha's live activity log instantly displays the blocked access attempt.
  - *Code Explanation*: Server-side access enforcement pipeline in `lib/access.ts` and 10-minute expiring tokens in `app/api/links/[token]/route.ts`.
- **60-Second M2 Core Flow Video**: [Watch on Google Drive](https://drive.google.com/file/d/YOUR_60SEC_M2_VIDEO_LINK_HERE/view?usp=sharing)
- **Code Enforcing Access Rules**: [`lib/access.ts`](lib/access.ts) and [`app/api/links/[token]/route.ts`](app/api/links/[token]/route.ts)

## Test logins

All accounts use the common test password: `Password123!`

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Partner** | `partner.kavitha@vaigaivel.test` | `Password123!` | Managing Partner: all 10 clients, access management, activity log |
| **Partner** | `partner.elena@apexadvisory.com` | `Password123!` | Audit Partner: all 10 clients, access management, activity log |
| **Staff** | `staff.sarah@apexadvisory.com` | `Password123!` | Senior Associate: assigned clients, upload & AI suggestions |
| **Staff (Trainee)** | `staff.trainee@vaigaivel.test` | `Password123!` | Audit Trainee (Leo Martin): assigned to 2 clients for demo revocation |
| **Auditor** | `auditor.kumar@apexadvisory.com` | `Password123!` | View-only statutory auditor: strictly assigned to 2 clients (uploads blocked with 403) |
| **Client** | `client.novatech@clientlocker.test` | `Password123!` | Client primary contact: own company files only (or passwordless via Magic Link) |

*Client Passwordless Magic Link Login is also available directly on the login screen.*

## What it does

List of 5 core actions a user can do:

1. **Role-based Authentication & Passwordless Access**: Partners, staff, and auditors log in with email/password; clients can log in with password or generate a 15-minute single-use email magic link.
2. **Server-Enforced Client Access**: Staff and auditors see only the client companies assigned to them; pasting unassigned URLs or calling endpoints directly returns `403 Forbidden`.
3. **Private Document Vault with 10-Minute Expiring Links**: Uploads (PDF, JPG, PNG up to 4 MB) stay in encrypted private storage; viewing generates a signed 10-minute expiring download token that re-verifies active access on every request.
4. **Immediate Access Revocation**: Partners can add or remove staff from a client; access ends on the user's very next request with no logout needed, and old links are blocked.
5. **Immutable Activity Audit Log**: Every upload, open, access change, and blocked attempt is recorded in real time and viewable exclusively by partners.

## The AI feature

- **What it does**: When a file is uploaded, the AI analyzes document keywords, titles, and compliance patterns to automatically recommend the corresponding open client checklist item (e.g. matching "sample_bank_reconciliation.pdf" to "Bank Reconciliation Statements"). The staff member can confirm or pick another item before the requirement is marked complete.
- **Which free model it uses**: Embedded deterministic rule-based semantic tokenizer with optional fallback to Google Gemini Flash API (`gemini-1.5-flash` via server action).
- **What happens if the AI service is not available**: The file remains safely saved in private storage, an informative notice is displayed, and the user can manually select and confirm any checklist item by hand.

## My stack

- **Frontend & App Framework**: Next.js 16 (App Router, Server Actions, Turbopack & Webpack optimization) with React 19.
- **Styling**: Tailwind CSS v4 for responsive, high-contrast dark/light mode interfaces.
- **Database & Storage**: PostgreSQL hosted on Supabase with a strictly private storage bucket (`client-vault`).
- **Authentication & Security**: HTTP-only session cookies with server-side HMAC validation, bcrypt password hashing, and Gitleaks CI secret scanning.
- **Testing**: Built-in `node:test` test runner executed via `tsx` for sub-second, isolated test runs in CI.
- **AI Tools**: Antigravity AI, Claude Code for scaffolding, SQL schema design, and test suite authoring.

## Main design choices

1. **Server-Enforced Access over Page Hiding**: Every endpoint (`/api/clients`, `/api/clients/:id/files`, `/api/links/:token`) computes permissions dynamically from `client_access` rather than relying on client state.
2. **Expiring Download Tokens vs Permanent URLs**: Files are never served from permanent public URLs. Instead, `/api/files/:id/link` creates a 10-minute temporary token. Opening `/api/links/:token` validates: (1) logged in, (2) not expired, (3) active client access.
3. **Immutable Audit Trail**: `activity_log` captures user ID, file ID, client ID, action, blocked status, and timestamp. Logs are append-only.

## How to run it on your computer

```bash
git clone https://github.com/RamSivaSundaraKarthykeyan/client-locker.git
cd client-locker
npm install
npm run seed
npm run dev
```

Required environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AUTH_SECRET`

## How to run the tests

```bash
npm test
```

Executes the 10 automated test suites verifying all access boundaries, auditor limits, expired links, revoked access, and 401/403 responses.

## Made-up data

All seed data (firm: *Vaigai Vel & Associates*, partners, staff, trainee *Leo Martin*, auditor *Kumar Swaminathan*, and 10 corporate entities with mock PDFs) was generated with an automated seed script (`scripts/seed.ts`). It contains strictly synthetic data with no real individuals or businesses.

## What works

- **Fully working**: 
  - Server-enforced client access control (Staff only see assigned clients).
  - Client passwordless magic link login (15-min single-use tokens).
  - 10-minute expiring secure download links with 3-step verification.
  - Immediate access revocation taking effect on next request.
  - Immutable activity log with blocked attempt tracking.
  - View-only Auditor role (assigned to 2 clients, uploads blocked with 403).
  - AI automated checklist item suggestion with manual fallback.
  - 12 automated tests passing in GitHub Actions.
  - Lighthouse speed score of 94/100 (`docs/SPEED.png`).
  - **M5 Stretch 1**: Access that ends on a set date (`client_access.expires_at`).
  - **M5 Stretch 2**: Live file vanishing without browser reload (`LiveAccessWatcher`).
  - **M5 Stretch 3**: Two-step authentication (2FA OTP) for Partners (`partner_2fa_codes`).
- **Partly done**: None (all M1, M2, M3, and M4 core items are complete).
- **Skipped**: Auditor deletion screens, password reset flows, live file previewers (explicitly not needed per client brief).

## What I would do differently with more time

- Integrate Supabase Realtime (CDC) websockets to trigger live updates on the client screen the split second a partner modifies permissions, without requiring a page refresh.
- Implement biometric WebAuthn / Passkey support for partner two-factor authentication.



Video link - https://drive.google.com/file/d/1n9XUZgdkZ9czUZ6SRGrl26Z9b7GlZpHA/view?usp=sharing
