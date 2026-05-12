import { useState } from 'react';
import { getPAT } from '../lib/github';

export default function PATModal({ onSave, onClose }: { onSave: (pat: string) => void; onClose: () => void }) {
  const [pat, setPat] = useState(getPAT() || '');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96">
        <h2 className="text-xl font-bold mb-2">GitHub Personal Access Token</h2>
        <p className="text-sm text-gray-500 mb-4">
          Required to save your reading/queue lists to the repo. Create a fine-grained PAT with{' '}
          <strong>Contents: Read & Write</strong> scoped to this repository.
        </p>
        <input
          type="password"
          value={pat}
          onChange={e => setPat(e.target.value)}
          placeholder="github_pat_..."
          className="w-full border rounded px-3 py-2 mb-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2">
          <button
            onClick={() => { if (pat.trim()) onSave(pat.trim()); }}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold"
          >
            Save
          </button>
          <button onClick={onClose} className="flex-1 border py-2 rounded hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
