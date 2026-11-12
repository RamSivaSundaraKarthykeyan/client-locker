import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase';
import { AppNavbar } from '@/app/components/AppNavbar';
import Link from 'next/link';

export default async function PartnerDashboard() {
  const session = await getSession();

  // Strict server-side verification: partners only
  if (!session) redirect('/login');
  if (session.role !== 'partner') {
    if (session.role === 'staff') redirect('/staff/dashboard');
    redirect('/client/dashboard');
  }

  const supabase = getServiceSupabase();

  // 1. Fetch Firm stats
  const { count: staffCount } = await supabase
    .from('people')
    .select('id', { count: 'exact', head: true })
    .in('role', ['staff', 'partner']);

  const { count: clientCount } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true });

  const { count: filesCount } = await supabase
    .from('files')
    .select('id', { count: 'exact', head: true });

  // 2. Fetch all clients
  const { data: clients } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      industry,
      files(count),
      checklist_items(count)
    `)
    .order('name', { ascending: true });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppNavbar session={session} title="Partner Overview" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Firm Executive Overview
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Supervisory view of firm clients, team members, and compliance document metrics.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <span className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">Active Clients</span>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-2">{clientCount || 0}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <span className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">Staff & Partners</span>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-2">{staffCount || 0}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <span className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">Vault Files Stored</span>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-2">{filesCount || 0}</div>
          </div>
        </div>

        {/* Clients Directory */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Client Portfolio</h2>
            <span className="text-xs text-zinc-400">Total: {clients?.length || 0} entities</span>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {clients?.map((c) => (
              <div key={c.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">{c.name}</h3>
                  <span className="text-xs text-zinc-400">{c.industry || 'General Client'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-zinc-500">
                    {c.files?.[0]?.count ?? 0} files • {c.checklist_items?.[0]?.count ?? 0} tasks
                  </span>
                  <Link
                    href={`/staff/clients/${c.id}`}
                    className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    View Details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

