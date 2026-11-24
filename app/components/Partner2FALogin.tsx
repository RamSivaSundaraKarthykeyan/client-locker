'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function Partner2FALogin() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('partner.kavitha@vaigaivel.test');
  const [password, setPassword] = useState('Password123!');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/partner-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Partner authentication failed');
      } else {
        setDemoCode(data.demoCode);
        setCode(data.demoCode); // pre-populate for smooth testing
        setStep(2);
      }
    } catch {
      setError('Network connection error');
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/partner-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid 2FA code');
      } else {
        router.push(data.redirect || '/partner/dashboard');
        router.refresh();
      }
    } catch {
      setError('Verification failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition flex items-center justify-between"
      >
        <span>🛡 Partner Two-Step Login (2FA)</span>
        <span className="text-[10px] bg-purple-200 dark:bg-purple-900 px-2 py-0.5 rounded-md">M5 Stretch</span>
      </button>

      {isOpen && (
        <div className="mt-3 p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 rounded-xl space-y-3 text-left">
          <p className="text-[11px] text-zinc-500">
            Partners can authenticate using heightened security with a secondary one-time verification token.
          </p>

          {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-500">Partner Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-500">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-medium shadow-sm transition disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Verify Step 1 & Generate 2FA Code →'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleStep2} className="space-y-2">
              {demoCode && (
                <div className="p-2 bg-purple-100 dark:bg-purple-950/60 rounded-lg text-xs text-purple-800 dark:text-purple-300">
                  <span className="font-bold">Generated OTP Token: </span>
                  <span className="font-mono text-sm tracking-widest">{demoCode}</span>
                </div>
              )}
              <div>
                <label className="block text-[10px] uppercase font-bold text-zinc-500">6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="123456"
                  className="w-full text-sm font-mono tracking-widest text-center p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-sm transition disabled:opacity-50"
              >
                {loading ? 'Verifying 2FA...' : 'Complete Two-Step Login ✓'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
