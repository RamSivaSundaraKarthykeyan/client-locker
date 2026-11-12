import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase';
import { AppNavbar } from '@/app/components/AppNavbar';
import { FileListTable, FileItem } from '@/app/components/FileListTable';

export default async function ClientDashboard() {
  const session = await getSession();

  // Strict server-side verification: clients only
  if (!session) redirect('/login');
  if (session.role !== 'client') {
    if (session.role === 'partner') redirect('/partner/dashboard');
    redirect('/staff/dashboard');
  }

  const supabase = getServiceSupabase();

  // 1. Fetch Client company linked to this authenticated client person
  const { data: clientEntity } = await supabase
    .from('clients')
    .select('id, name, industry')
    .eq('primary_contact_person_id', session.id)
    .single();

  const clientId = clientEntity?.id;

  // 2. Fetch Checklist Items
  const { data: checklist } = clientId
    ? await supabase
        .from('checklist_items')
        .select('id, title, status, due_date')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true })
    : { data: [] };

  // 3. Fetch Stored Files for this client
  const { data: rawFiles } = clientId
    ? await supabase
        .from('files')
        .select(`
          id,
          file_name,
          file_size_bytes,
          mime_type,
          created_at,
          uploader:people!files_uploaded_by_person_id_fkey(full_name, email, role)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
    : { data: [] };

  const files: FileItem[] = (rawFiles || []).map((f) => ({
    id: f.id,
    file_name: f.file_name,
    file_size_bytes: f.file_size_bytes,
    mime_type: f.mime_type,
    created_at: f.created_at,
    uploader: Array.isArray(f.uploader) ? f.uploader[0] : f.uploader,
  }));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-16">
      <AppNavbar session={session} title="Client Portal" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Welcome, {session.fullName}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Account: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{clientEntity?.name || 'Company Portal'}</span> ({clientEntity?.industry || 'Client Entity'})
          </p>
        </div>

        {/* Client's Compliance Checklist */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Action Required: Compliance Checklist
            </h2>
            <span className="text-xs text-zinc-500">{checklist?.length || 0} items</span>
          </div>

          <div className="space-y-3">
            {checklist?.map((item) => {
              const statusStyles: Record<string, string> = {
                completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
                in_review: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
                pending: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
              };

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-sm"
                >
                  <span className="text-zinc-800 dark:text-zinc-200 font-medium">{item.title}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${statusStyles[item.status] || ''}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Client's Documents */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Your Shared Documents ({files.length})
              </h2>
              <p className="text-xs text-zinc-500">
                Encrypted documents shared securely between you and your advisory team.
              </p>
            </div>
          </div>

          <FileListTable files={files} />
        </div>
      </main>
    </div>
  );
}

