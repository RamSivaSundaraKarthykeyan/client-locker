import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase';
import { AppNavbar } from '@/app/components/AppNavbar';
import Link from 'next/link';

export default async function AuditorDashboard() {
  const session = await getSession();

  // Strict server-side verification: auditors only
  if (!session) redirect('/login');
  if (session.role !== 'auditor') {
    if (session.role === 'partner') redirect('/partner/dashboard');
    if (session.role === 'staff') redirect('/staff/dashboard');
    redirect('/client/dashboard');
  }

  const supabase = getServiceSupabase();

  // Auditor has access to exactly assigned clients
  const { data: accessRows } = await supabase
    .from('client_access')
    .select('client_id')
    .eq('person_id', session.id);

  const clientIds = (accessRows || []).map((r) => r.client_id);

  const { data: clients } = clientIds.length > 0
    ? await supabase
        .from('clients')
        .select(`
          id,
          name,
          industry,
          created_at,
          primary_contact:people!clients_primary_contact_person_id_fkey(full_name, email),
          files(count),
          checklist_items(count)
        `)
        .in('id', clientIds)
        .order('name')
    : { data: [] };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppNavbar session={session} title="Auditor Workspace (View-Only)" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-semibold mb-3">
            <span>🛡 View-Only Statutory Auditor Access</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Assigned Audit Entities
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            You are authorized to inspect documents for exactly {clients?.length || 0} assigned client organizations. Upload permissions are disabled.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clients?.map((client) => {
            const fileCount = client.files?.[0]?.count ?? 0;
            const checklistCount = client.checklist_items?.[0]?.count ?? 0;
            const contact = Array.isArray(client.primary_contact) ? client.primary_contact[0] : client.primary_contact;

            return (
              <div
                key={client.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs uppercase font-semibold text-blue-600 dark:text-blue-400">
                      {client.industry || 'Client Entity'}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {fileCount} {fileCount === 1 ? 'file' : 'files'}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                    {client.name}
                  </h2>

                  <div className="text-xs text-zinc-500 mb-4">
                    Contact: <span className="text-zinc-800 dark:text-zinc-200 font-medium">{contact?.full_name}</span> ({contact?.email})
                  </div>

                  <div className="py-2 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between mb-4">
                    <span>Audit Checklist Items</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{checklistCount}</span>
                  </div>
                </div>

                <Link
                  href={`/staff/clients/${client.id}`}
                  className="w-full text-center py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold shadow-sm transition"
                >
                  View Files & Audit Items →
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
