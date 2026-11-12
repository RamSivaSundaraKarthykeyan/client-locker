'use client';

import { useState } from 'react';
import { uploadClientFile } from '@/app/actions/files';

export function FileUploadCard({ clientId }: { clientId: string }) {
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatusMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file') as File;

    if (!file || file.size === 0) {
      setStatusMessage({ type: 'error', text: 'Please select a file to upload.' });
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'File exceeds 4 MB limit.' });
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadClientFile(clientId, formData);
      if (res.error) {
        setStatusMessage({ type: 'error', text: res.error });
      } else {
        setStatusMessage({ type: 'success', text: `Successfully uploaded ${file.name} to private storage!` });
        form.reset();
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'An unexpected error occurred during upload.' });
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
          ↑
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Upload Client Document</h3>
          <p className="text-xs text-zinc-500">Supports PDF, JPG, PNG up to 4 MB (Saved to private storage)</p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-4 p-3.5 rounded-xl text-sm ${
            statusMessage.type === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-300'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-300'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-2">
            Select Document
          </label>
          <input
            type="file"
            name="file"
            required
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="w-full text-sm text-zinc-600 dark:text-zinc-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-900 file:text-white hover:file:bg-zinc-800 dark:file:bg-white dark:file:text-zinc-900 cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium shadow transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Uploading to Private Vault...</span>
            </>
          ) : (
            'Upload to Private Vault'
          )}
        </button>
      </form>
    </div>
  );
}

