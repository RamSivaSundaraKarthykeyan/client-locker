'use client';

import { useState } from 'react';

export function AISuggestionCard({
  fileId,
  fileName,
  onConfirmed,
}: {
  fileId: string;
  fileName: string;
  onConfirmed?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [suggestion, setSuggestion] = useState<{
    itemId: string;
    itemTitle: string;
    confidence: string;
    reasoning: string;
  } | null>(null);
  const [openItems, setOpenItems] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGetSuggestion() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/files/${fileId}/suggest`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to get AI suggestion');
      } else if (data.suggestion) {
        setSuggestion(data.suggestion);
        setOpenItems(data.openItems || []);
        setSelectedItemId(data.suggestion.itemId);
      } else {
        setError(data.message || 'No open checklist items available.');
      }
    } catch {
      setError('AI suggestion service currently unreachable. You can select an item manually.');
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!selectedItemId) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch(`/api/files/${fileId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklistItemId: selectedItemId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setConfirmed(true);
        if (onConfirmed) onConfirmed();
      } else {
        setError(data.error || 'Failed to confirm checklist item');
      }
    } catch {
      setError('Confirmation failed. Please try again.');
    } finally {
      setConfirming(false);
    }
  }

  if (confirmed) {
    return (
      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
        <span>✓</span>
        <span>Checklist requirement linked and marked completed!</span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-md">
            AI Assistant
          </span>
          <span className="text-xs text-zinc-500 truncate max-w-[200px]">{fileName}</span>
        </div>
        {!suggestion && (
          <button
            type="button"
            onClick={handleGetSuggestion}
            disabled={loading}
            className="text-xs px-2.5 py-1 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Suggest Checklist Item ✦'}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
          {error}
        </p>
      )}

      {suggestion && (
        <div className="space-y-3 pt-2 border-t border-zinc-200 dark:border-zinc-700">
          <div className="text-xs">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">AI Recommendation: </span>
            <span className="text-purple-700 dark:text-purple-300 font-medium">{suggestion.itemTitle}</span>
            <p className="text-zinc-500 mt-0.5 text-[11px]">{suggestion.reasoning}</p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 text-zinc-800 dark:text-zinc-200 flex-1"
            >
              {openItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="text-xs px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition disabled:opacity-50"
            >
              {confirming ? 'Confirming...' : 'Confirm & Mark Done ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

