import { useState } from 'react';

interface Props {
  keywords: string[];
  onUpdate: (keywords: string[]) => Promise<void>;
}

export default function KeywordEditor({ keywords, onUpdate }: Props) {
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async (updated: string[]) => {
    setSaving(true);
    try { await onUpdate(updated); } finally { setSaving(false); }
  };

  const add = async () => {
    const kw = input.trim();
    if (!kw || keywords.includes(kw)) { setInput(''); return; }
    await save([...keywords, kw]);
    setInput('');
    setEditing(false);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Search keywords:</span>
        {keywords.map(kw => (
          <span key={kw} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-100">
            {kw}
            <button
              onClick={() => save(keywords.filter(k => k !== kw))}
              className="hover:text-red-500 leading-none font-bold"
            >
              ×
            </button>
          </span>
        ))}
        {editing ? (
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setEditing(false); }}
            onBlur={() => { add(); }}
            placeholder="add keyword…"
            className="text-xs border rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 w-36"
          />
        ) : (
          <button onClick={() => setEditing(true)} className="text-xs text-blue-500 hover:underline">+ add</button>
        )}
        {saving && <span className="text-xs text-gray-400">saving…</span>}
      </div>
      <p className="text-xs text-gray-400 mt-1">Keyword changes apply on the next weekly crawl (or trigger manually in Actions).</p>
    </div>
  );
}
