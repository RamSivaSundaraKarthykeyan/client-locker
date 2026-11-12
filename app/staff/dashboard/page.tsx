import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase';
import { AppNavbar } from '@/app/components/AppNavbar';
import Link from 'next/link';

export default async function StaffDashboard() {
  const session = await getSession();

  // Strict server-side role check
  if (!session) redirect('/login');
  if (session.role !== 'staff' && session.role !== 'partner') {
    redirect('/client/dashboard');
  }

  const supabase = getServiceSupabase();

  // Fetch clients from real database
  const { data: clients } = await supabase
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
    .order('name', { ascending: true });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppNavbar session={session} title="Staff Workspace" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Assigned Client Accounts
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Select a client to view and upload files or review checklist requirements.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-3 py-1.5 rounded-full font-medium">
              Total Clients: {clients?.length || 0}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients?.map((client) => {
            const fileCount = client.files?.[0]?.count ?? 0;
            const checklistCount = client.checklist_items?.[0]?.count ?? 0;
            const contact = Array.isArray(client.primary_contact) ? client.primary_contact[0] : client.primary_contact;

            return (
              <div
                key={client.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs uppercase font-semibold text-blue-600 dark:text-blue-400 tracking-wider">
                      {client.industry || 'Client'}
                    </span>
                    <span className="text-xs text-zinc-400">
                      {fileCount} {fileCount === 1 ? 'doc' : 'docs'}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                    {client.name}
                  </h2>

                  <div className="text-xs text-zinc-500 mb-4">
                    Contact: <span className="text-zinc-800 dark:text-zinc-300 font-medium">{contact?.full_name || 'Assigned Rep'}</span>
                    <br />
                    <span className="text-zinc-400">{contact?.email}</span>
                  </div>

                  <div className="py-2 px-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-600 dark:text-zinc-400 flex items-center justify-between mb-4">
                    <span>Checklist items</span>
                    <span className="font-semibold text-zinc-900 dark:text-white">{checklistCount}</span>
                  </div>
                </div>

                <Link
                  href={`/staff/clients/${client.id}`}
                  className="w-full text-center py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-semibold shadow-sm transition"
                >
                  Manage Files & Vault →
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

