'use client';

import { useState } from 'react';

export function ExpiringLinkButton({ fileId }: { fileId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerateLink() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/files/${fileId}/link`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create link');
      } else {
        // Automatically open the expiring download link
        window.open(data.url, '_blank');
      }
    } catch {
      setError('Error generating secure link');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleGenerateLink}
        disabled={loading}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition shadow-sm disabled:opacity-50"
      >
        {loading ? 'Creating Link...' : 'Open Secure File ↗'}
      </button>
      <span className="text-[10px] text-zinc-400">10-min expiring link</span>
      {error && <span className="text-[10px] text-red-500">{error}</span>}
    </div>
  );
}
