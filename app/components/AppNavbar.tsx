import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import { AuthSession } from '@/lib/auth';

interface NavbarProps {
  session: AuthSession;
  title?: string;
}

export function AppNavbar({ session, title }: NavbarProps) {
  const roleBadgeColors: Record<string, string> = {
    partner: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    staff: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    client: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  };

  return (
    <header className="border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-bold text-sm shadow-sm">
              CL
            </div>
            <span className="font-semibold tracking-tight text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
              Client Locker
            </span>
          </Link>
          {title && (
            <>
              <span className="text-zinc-300 dark:text-zinc-700">/</span>
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{title}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{session.fullName}</span>
            <span className="text-xs text-zinc-500">{session.email}</span>
          </div>
          <span className={`text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${roleBadgeColors[session.role] || ''}`}>
            {session.role}
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs font-medium text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 px-3 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

