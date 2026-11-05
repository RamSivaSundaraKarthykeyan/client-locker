# Client Locker

Secure management, storage, and access control for sensitive client credentials and data.

🌐 **Live Deployment**: [https://client-locker-ohhb.vercel.app/](https://client-locker-ohhb.vercel.app/)

---

## Features & Architecture

- **Framework**: [Next.js](https://nextjs.org) 16 (App Router & Turbopack)
- **UI & Components**: React 19, Tailwind CSS v4
- **Language**: TypeScript (Strict typing)
- **CI / CD & Security**:
  - Automated build verification on every push and pull request via GitHub Actions.
  - Secret scanning via [Gitleaks](https://github.com/gitleaks/gitleaks-action) across full commit history to prevent credential leaks.

---

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v20+ recommended) and npm installed.

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/<your-username>/client-locker.git
cd client-locker
npm install
```

### Development Server

Run the development server locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server with Turbopack |
| `npm run build` | Builds optimized production bundle |
| `npm run start` | Starts production server locally |
| `npm run lint` | Runs ESLint 9 checks |

---

## Continuous Integration & Security

All commits and pull requests trigger automated checks defined in [`.github/workflows/ci.yml`](.github/workflows/ci.yml):
- **Gitleaks Scan**: Scans all branches and commits for exposed tokens, private keys, or API credentials.
- **Build Verification**: Runs a clean `npm ci` and `npm run build` using Node.js 22.

---

## Documentation

For a detailed changelog and implementation timeline, refer to [`DOCUMENTATION.md`](DOCUMENTATION.md).
