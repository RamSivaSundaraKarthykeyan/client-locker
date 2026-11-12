import Link from 'next/link';

export interface FileItem {
  id: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  created_at: string;
  uploader?: {
    full_name: string;
    email: string;
    role: string;
  };
}

export function FileListTable({ files }: { files: FileItem[] }) {
  if (files.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <p className="text-sm text-zinc-500">No documents have been uploaded for this client yet.</p>
      </div>
    );
  }

  function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatDate(isoString: string) {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="py-3.5 px-6">Document Name</th>
              <th className="py-3.5 px-6">Size</th>
              <th className="py-3.5 px-6">Uploaded By</th>
              <th className="py-3.5 px-6">Date Uploaded</th>
              <th className="py-3.5 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition">
                <td className="py-4 px-6 font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                  <span className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono text-xs">
                    {file.mime_type.includes('pdf') ? 'PDF' : 'IMG'}
                  </span>
                  <span>{file.file_name}</span>
                </td>
                <td className="py-4 px-6 text-zinc-500 font-mono text-xs">
                  {formatBytes(file.file_size_bytes)}
                </td>
                <td className="py-4 px-6">
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-900 dark:text-zinc-200">
                      {file.uploader?.full_name || 'Staff Member'}
                    </span>
                    <span className="text-xs text-zinc-400">{file.uploader?.email}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-zinc-500 text-xs">
                  {formatDate(file.created_at)}
                </td>
                <td className="py-4 px-6 text-right">
                  <Link
                    href={`/api/files/${file.id}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition shadow-sm"
                  >
                    Open File ↗
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

