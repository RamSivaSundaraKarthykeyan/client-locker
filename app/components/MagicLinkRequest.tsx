'use client';

import { useState } from 'react';

export function MagicLinkRequest() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicUrl, setMagicUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    setMessage(null);
    setMagicUrl(null);

    try {
      const res = await fetch('/api/auth/magic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to generate magic link');
      } else {
        setMessage(data.message);
        setMagicUrl(data.magicUrl);
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-left">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
        Client Passwordless Magic Link Login (M3 / M4)
      </h3>
      <p className="text-xs text-zinc-500 mb-3">
        Enter your registered client email to receive a secure, 15-minute single-use login link.
      </p>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg mb-2">{error}</p>}
      {message && <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg mb-2">{message}</p>}

      {magicUrl && (
        <div className="mb-3 p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs space-y-1">
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">Direct Magic Link:</span>
          <div>
            <a
              href={magicUrl}
              className="text-blue-600 dark:text-blue-400 font-mono break-all hover:underline"
            >
              {magicUrl}
            </a>
          </div>
          <span className="text-[10px] text-zinc-400">Click to instantly log in without password</span>
        </div>
      )}

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="client.novatech@clientlocker.test"
          required
          className="text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-900 dark:text-white flex-1"
        />
        <button
          type="submit"
          disabled={loading}
          className="text-xs px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Get Magic Link'}
        </button>
      </form>
    </div>
  );
}

