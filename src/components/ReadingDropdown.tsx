import { useState } from 'react';
import { Paper } from '../types';

interface Props {
  papers: Paper[];
  onRemove: (paper: Paper) => void;
  onAddToGraph: (label: string) => Promise<void>;
}

export default function ReadingDropdown({ papers, onRemove, onAddToGraph }: Props) {
  const [open, setOpen] = useState(false);
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [topicInput, setTopicInput] = useState('');
  const [saving, setSaving] = useState(false);

  const submitTopic = async (paperLink: string) => {
    const label = topicInput.trim();
    if (!label) { setAddingFor(null); return; }
    setSaving(true);
    try {
      await onAddToGraph(label);
    } finally {
      setSaving(false);
      setTopicInput('');
      setAddingFor(null);
    }
  };

  return (
    <div className="mb-8">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 border rounded px-3 py-2 bg-white hover:bg-gray-50 shadow-sm"
      >
        <span className="bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
          {papers.length}
        </span>
        Reading List
        <span className="text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-2 border rounded-lg bg-white shadow-sm overflow-hidden">
          {papers.length === 0 ? (
            <p className="text-sm text-gray-400 italic p-4">Nothing in your reading list yet.</p>
          ) : (
            <ul className="divide-y">
              {papers.map(paper => (
                <li key={paper.link} className="p-3">
                  <div className="flex items-start justify-between gap-3">
                    <a
                      href={paper.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline leading-snug line-clamp-2"
                    >
                      {paper.title}
                    </a>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => { setAddingFor(paper.link); setTopicInput(''); }}
                        className="text-xs text-purple-600 border border-purple-200 px-2 py-0.5 rounded hover:bg-purple-50"
                      >
                        + Graph
                      </button>
                      <button
                        onClick={() => onRemove(paper)}
                        className="text-xs text-red-400 border border-red-100 px-2 py-0.5 rounded hover:bg-red-50"
                      >
                        Done
                      </button>
                    </div>
                  </div>

                  {addingFor === paper.link && (
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        autoFocus
                        value={topicInput}
                        onChange={e => setTopicInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') submitTopic(paper.link);
                          if (e.key === 'Escape') setAddingFor(null);
                        }}
                        placeholder="Topic this paper covers…"
                        className="text-xs border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400 flex-1"
                      />
                      <button
                        onClick={() => submitTopic(paper.link)}
                        disabled={saving}
                        className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 disabled:opacity-50"
                      >
                        {saving ? '…' : 'Add'}
                      </button>
                      <button onClick={() => setAddingFor(null)} className="text-xs text-gray-400 hover:text-gray-600">×</button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
