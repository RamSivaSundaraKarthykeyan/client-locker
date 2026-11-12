import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Home() {
  const session = await getSession();

  if (session) {
    if (session.role === 'partner') redirect('/partner/dashboard');
    if (session.role === 'staff') redirect('/staff/dashboard');
    redirect('/client/dashboard');
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-between">
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm">
            CL
          </div>
          <span className="font-semibold text-zinc-900 dark:text-white">Client Locker</span>
        </div>
        <Link
          href="/login"
          className="text-xs font-semibold px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition"
        >
          Sign In
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          M2 Release • Private File Vault & Multi-Role Access
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white mb-6">
          Encrypted Client Document Locker for Advisory Firms
        </h1>

        <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto mb-10">
          Securely upload, organize, and access confidential client files in an encrypted private vault with server-enforced role access for partners, staff, and clients.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="px-6 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 font-semibold text-sm shadow-md transition"
          >
            Access Secure Portal →
          </Link>
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-400">
        © 2026 Client Locker • Milestone 2 Implementation
      </footer>
    </div>
  );
}
