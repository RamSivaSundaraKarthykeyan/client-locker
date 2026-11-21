import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase';
import { AppNavbar } from '@/app/components/AppNavbar';
import Link from 'next/link';

export default async function PartnerDashboard() {
  const session = await getSession();

  if (!session) redirect('/login');
  if (session.role !== 'partner') {
    if (session.role === 'staff') redirect('/staff/dashboard');
    if (session.role === 'auditor') redirect('/auditor/dashboard');
    redirect('/client/dashboard');
  }

  const supabase = getServiceSupabase();

  const { count: staffCount } = await supabase
    .from('people')
    .select('id', { count: 'exact', head: true })
    .in('role', ['staff', 'partner', 'auditor']);

  const { count: clientCount } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true });

  const { count: filesCount } = await supabase
    .from('files')
    .select('id', { count: 'exact', head: true });

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

  // Fetch recent activity log
  const { data: logs } = await supabase
    .from('activity_log')
    .select(`
      id,
      action,
      blocked,
      details,
      created_at,
      person:people!activity_log_person_id_fkey(full_name, email, role),
      client:clients!activity_log_client_id_fkey(name)
    `)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-16">
      <AppNavbar session={session} title="Partner Overview & Audit Log" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Vaigai Vel & Associates — Firm Governance
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Supervisory portal for partner oversight, immediate staff access management, and live activity auditing.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <span className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">Active Clients</span>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-2">{clientCount || 0}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <span className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">Staff & Auditors</span>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-2">{staffCount || 0}</div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <span className="text-xs uppercase font-semibold text-zinc-500 tracking-wider">Vault Documents</span>
            <div className="text-3xl font-extrabold text-zinc-900 dark:text-white mt-2">{filesCount || 0}</div>
          </div>
        </div>

        {/* Live Immutable Activity Log */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Live Firm Activity Log (Immutable)
              </h2>
              <p className="text-xs text-zinc-400">
                Audited chronologically. Captures all opens, uploads, access adjustments, and blocked attempts.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              Partners Only
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">User</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {(logs || []).map((l) => {
                  const person = Array.isArray(l.person) ? l.person[0] : l.person;
                  return (
                    <tr key={l.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20">
                      <td className="py-3 px-6 text-zinc-400 font-mono">
                        {new Date(l.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3 px-6 font-medium text-zinc-800 dark:text-zinc-200">
                        {person?.full_name || 'System / Anonymous'}
                      </td>
                      <td className="py-3 px-6 font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                        {l.action}
                      </td>
                      <td className="py-3 px-6">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                            l.blocked
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {l.blocked ? 'BLOCKED 403' : 'ALLOWED'}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-zinc-500 truncate max-w-xs">{l.details}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Clients Directory */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">All Client Vaults</h2>
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
                    Manage Vault & Access →
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
