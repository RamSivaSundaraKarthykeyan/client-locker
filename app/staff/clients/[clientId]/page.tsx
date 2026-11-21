import { getSession } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { getServiceSupabase } from '@/lib/supabase';
import { checkClientAccess } from '@/lib/access';
import { AppNavbar } from '@/app/components/AppNavbar';
import { FileUploadCard } from '@/app/components/FileUploadCard';
import { FileListTable, FileItem } from '@/app/components/FileListTable';
import { ClientAccessManager, AssignedPerson } from '@/app/components/ClientAccessManager';
import Link from 'next/link';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const { clientId } = await params;

  // Strict server-side access check
  const hasAccess = await checkClientAccess(session, clientId);
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-900 rounded-2xl text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-950 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            403
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Access Denied</h2>
          <p className="text-xs text-zinc-500">
            You are not assigned to this client. This attempt has been logged for firm security audit.
          </p>
          <Link
            href={session.role === 'partner' ? '/partner/dashboard' : session.role === 'auditor' ? '/auditor/dashboard' : '/staff/dashboard'}
            className="inline-block px-4 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-xs font-medium rounded-xl"
          >
            ← Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

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

  if (clientErr || !client) notFound();

  // 2. Fetch Checklist Items
  const { data: checklist } = await supabase
    .from('checklist_items')
    .select('id, title, status, done, due_date')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });

  // 3. Fetch Files
  const { data: rawFiles } = await supabase
    .from('files')
    .select(`
      id,
      file_name,
      file_size_bytes,
      mime_type,
      checklist_item_id,
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
    checklist_item_id: f.checklist_item_id,
    created_at: f.created_at,
    uploader: Array.isArray(f.uploader) ? f.uploader[0] : f.uploader,
  }));

  // 4. If partner, fetch access rows and all staff to enable access management
  let assignedStaff: AssignedPerson[] = [];
  let allStaff: Array<{ id: string; full_name: string; email: string; role: string; title: string }> = [];

  if (session.role === 'partner') {
    const { data: accessRows } = await supabase
      .from('client_access')
      .select(`
        id,
        person_id,
        person:people!client_access_person_id_fkey(id, full_name, email, role, title)
      `)
      .eq('client_id', clientId);

    assignedStaff = (accessRows || []).map((r) => {
      const p = Array.isArray(r.person) ? r.person[0] : r.person;
      return {
        accessId: r.id,
        personId: r.person_id,
        name: p?.full_name || 'Staff Member',
        email: p?.email || '',
        role: p?.role || 'staff',
        title: p?.title || '',
      };
    });

    const { data: staffPeople } = await supabase
      .from('people')
      .select('id, full_name, email, role, title')
      .in('role', ['staff', 'auditor'])
      .order('full_name');

    allStaff = staffPeople || [];
  }

  const contact = Array.isArray(client.primary_contact) ? client.primary_contact[0] : client.primary_contact;
  const isAuditor = session.role === 'auditor';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-16">
      <AppNavbar session={session} title={client.name} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              href={session.role === 'partner' ? '/partner/dashboard' : session.role === 'auditor' ? '/auditor/dashboard' : '/staff/dashboard'}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline mb-2 inline-block"
            >
              ← Back to Overview
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
          {/* File Upload Component (Hidden and blocked for Auditor) */}
          <div className="lg:col-span-1">
            {!isAuditor ? (
              <FileUploadCard clientId={client.id} />
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-6 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                <span className="font-bold uppercase tracking-wider">Auditor Notice</span>
                <p>Auditors have read-only inspection access. Upload and file modifications are disabled on this account.</p>
              </div>
            )}
          </div>

          {/* Checklist Items */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Client Compliance Checklist</h3>
              <span className="text-xs text-zinc-400">{checklist?.length || 0} items tracked</span>
            </div>

            <div className="space-y-3">
              {checklist?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${item.done ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="text-zinc-800 dark:text-zinc-200 font-medium">{item.title}</span>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold uppercase ${item.done ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                    {item.done ? 'Completed' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Partner Access Control Panel (Demo Moment: Partner removes Trainee) */}
        {session.role === 'partner' && (
          <ClientAccessManager
            clientId={client.id}
            assignedStaff={assignedStaff}
            allStaff={allStaff}
          />
        )}

        {/* Files Table Section with AI Suggestion Feature */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Stored Private Documents ({files.length})
              </h2>
              <p className="text-xs text-zinc-500">
                Opening generates a secure 10-minute expiring download link checked on the server against current access permissions.
              </p>
            </div>
          </div>

          <FileListTable files={files} allowAiSuggestion={session.role === 'partner' || session.role === 'staff'} />
        </div>
      </main>
    </div>
  );
}
