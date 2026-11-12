import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase';
import { AppNavbar } from '@/app/components/AppNavbar';
import { FileUploadCard } from '@/app/components/FileUploadCard';
import { FileListTable, FileItem } from '@/app/components/FileListTable';
import Link from 'next/link';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const session = await getSession();

  // Strict server-side verification: only staff and partners can access this workspace
  if (!session) redirect('/login');
  if (session.role !== 'staff' && session.role !== 'partner') {
    redirect('/client/dashboard');
  }

  const { clientId } = await params;
  const supabase = getServiceSupabase();

  // 1. Fetch Client info
  const { data: client, error: clientErr } = await supabase
    .from('clients')
    .select(`
      id,
      name,
      industry,
      primary_contact:people!clients_primary_contact_person_id_fkey(full_name, email)
    `)
    .eq('id', clientId)
    .single();

  if (clientErr || !client) {
    notFound();
  }

  // 2. Fetch Checklist Items
  const { data: checklist } = await supabase
    .from('checklist_items')
    .select('id, title, status, due_date')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });

  // 3. Fetch Files with uploader info
  const { data: rawFiles } = await supabase
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
    .order('created_at', { ascending: false });

  const files: FileItem[] = (rawFiles || []).map((f) => ({
    id: f.id,
    file_name: f.file_name,
    file_size_bytes: f.file_size_bytes,
    mime_type: f.mime_type,
    created_at: f.created_at,
    uploader: Array.isArray(f.uploader) ? f.uploader[0] : f.uploader,
  }));

  const contact = Array.isArray(client.primary_contact) ? client.primary_contact[0] : client.primary_contact;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-16">
      <AppNavbar session={session} title={client.name} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href="/staff/dashboard"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
            >
              ← Back to Client Accounts
            </Link>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {client.name}
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              Industry: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{client.industry || 'N/A'}</span> • Contact: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{contact?.full_name}</span> ({contact?.email})
            </p>
          </div>
        </div>

        {/* Upload + Checklist Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Upload Component */}
          <div className="lg:col-span-1">
            <FileUploadCard clientId={client.id} />
          </div>

          {/* Checklist Items */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Client Compliance Checklist</h3>
              <span className="text-xs text-zinc-400">{checklist?.length || 0} items tracked</span>
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
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-sm"
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
        </div>

        {/* Files Table Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Stored Private Documents ({files.length})
              </h2>
              <p className="text-xs text-zinc-500">
                All documents are kept in encrypted private storage and served through authenticated sessions.
              </p>
            </div>
          </div>

          <FileListTable files={files} />
        </div>
      </main>
    </div>
  );
}

