'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AssignedPerson {
  accessId: string;
  personId: string;
  name: string;
  email: string;
  role: string;
  title: string;
  expiresAt?: string | null;
}

export function ClientAccessManager({
  clientId,
  assignedStaff,
  allStaff,
}: {
  clientId: string;
  assignedStaff: AssignedPerson[];
  allStaff: Array<{ id: string; full_name: string; email: string; role: string; title: string }>;
}) {
  const router = useRouter();
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isClientAccessExpired = (expiresAt?: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt).toISOString() < new Date().toISOString().split('T')[0];
  };

  const unassignedStaff = allStaff.filter(
    (s) => !assignedStaff.some((a) => a.personId === s.id)
  );

  async function handleGrant() {
    if (!selectedPersonId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          personId: selectedPersonId,
          expiresAt: expiryDate || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to grant access');
      } else {
        setSelectedPersonId('');
        setExpiryDate('');
        router.refresh();
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke(accessId: string) {
    if (!confirm('Are you sure you want to revoke this user access immediately?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/access/${accessId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to revoke access');
      } else {
        router.refresh();
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Access Control & Expiry Governance</span>
            <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold uppercase">
              M5 Stretch
            </span>
          </h3>
          <p className="text-xs text-zinc-500">
            Partners can give immediate access or set an automatic expiration date. Revocations cause live file vanishing without reload.
          </p>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

      {/* List assigned staff */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {assignedStaff.map((staff) => {
          const isExpired = isClientAccessExpired(staff.expiresAt);
          return (
            <div key={staff.accessId} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">{staff.name}</span>{' '}
                <span className="text-zinc-400">({staff.title || staff.role})</span>
                <div className="text-[11px] text-zinc-400">{staff.email}</div>
                {staff.expiresAt && (
                  <div className={`text-[10px] font-semibold mt-0.5 ${isExpired ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'}`}>
                    ⏱ {isExpired ? 'Access expired on: ' : 'Access ends on: '}
                    {new Date(staff.expiresAt).toLocaleDateString()}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(staff.accessId)}
                disabled={loading}
                className="px-2.5 py-1 text-xs rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40 transition disabled:opacity-50"
              >
                Remove Access ✕
              </button>
            </div>
          );
        })}
      </div>

      {/* Give access with optional expiration date */}
      {unassignedStaff.length > 0 && (
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
          <div className="text-[11px] font-medium text-zinc-500">Assign Member with Optional Expiration Date:</div>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedPersonId}
              onChange={(e) => setSelectedPersonId(e.target.value)}
              className="text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 flex-1"
            >
              <option value="">Select staff or auditor...</option>
              {unassignedStaff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.role} - {s.title})
                </option>
              ))}
            </select>

            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              title="Set end date (optional)"
              className="text-xs bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200"
            />

            <button
              type="button"
              onClick={handleGrant}
              disabled={!selectedPersonId || loading}
              className="text-xs px-4 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-xl font-medium disabled:opacity-50"
            >
              Grant Access +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
