'use client';

import { useActionState } from 'react';
import { loginAction, ActionState } from '@/app/actions/auth';
import { MagicLinkRequest } from '@/app/components/MagicLinkRequest';
import { Partner2FALogin } from '@/app/components/Partner2FALogin';

const initialState: ActionState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  const fillTestCredentials = (email: string) => {
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    if (emailInput && passwordInput) {
      emailInput.value = email;
      passwordInput.value = 'Password123!';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl p-8 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 items-center justify-center font-bold text-xl mb-4 shadow">
            CL
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Client Locker
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Sign in to access your secure documents
          </p>
        </div>

        {state?.error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300">
            {state.error}
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@apexadvisory.com"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-medium shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isPending ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Fill Buttons */}
        <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3 text-center">
            Demo Test Accounts (Password: Password123!)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillTestCredentials('partner.elena@apexadvisory.com')}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:border-purple-900/60 dark:bg-purple-950/40 dark:text-purple-300 transition"
            >
              Elena (Partner)
            </button>
            <button
              type="button"
              onClick={() => fillTestCredentials('staff.sarah@apexadvisory.com')}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 transition"
            >
              Sarah (Staff)
            </button>
            <button
              type="button"
              onClick={() => fillTestCredentials('client.novatech@clientlocker.test')}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 transition"
            >
              NovaTech (Client)
            </button>
          </div>
        </div>

        {/* Partner Two-Step Login (2FA) */}
        <Partner2FALogin />

        {/* Client Magic Link Section */}
        <MagicLinkRequest />
      </div>
    </div>
  );
}

