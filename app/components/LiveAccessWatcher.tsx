'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function LiveAccessWatcher({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [accessLost, setAccessLost] = useState(false);

  useEffect(() => {
    // Poll access check every 3 seconds for instant live vanish without manual refresh
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/clients/${clientId}/access-check`);
        if (res.ok) {
          const data = await res.json();
          if (!data.hasAccess) {
            setAccessLost(true);
            clearInterval(interval);
            setTimeout(() => {
              router.refresh();
            }, 1000);
          }
        } else if (res.status === 401 || res.status === 403) {
          setAccessLost(true);
          clearInterval(interval);
          setTimeout(() => {
            router.refresh();
          }, 1000);
        }
      } catch {
        // network glitch
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [clientId, router]);

  if (!accessLost) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 bg-red-100 dark:bg-red-950 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
          ✕
        </div>
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
          Access Revoked Live
        </h3>
        <p className="text-xs text-zinc-500">
          The Managing Partner has revoked your access to this client. All files and checklist data have vanished from your screen.
        </p>
      </div>
    </div>
  );
}
