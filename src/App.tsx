import { useState, useEffect } from 'react';
import Login from './components/Login';
import PATModal from './components/PATModal';
import PaperSection from './components/PaperSection';
import PaperGraph from './components/PaperGraph';
import KeywordEditor from './components/KeywordEditor';
import { fetchData, updateData, setPAT } from './lib/github';
import { Paper, PaperList, RecommendedData, KeywordsData } from './types';

export default function App() {
  const [isAuth, setIsAuth] = useState(localStorage.getItem('auth') === 'true');
  const [showLogin, setShowLogin] = useState(false);
  const [showPAT, setShowPAT] = useState(false);

  const [recommended, setRecommended] = useState<Paper[]>([]);
  const [reading, setReading] = useState<Paper[]>([]);
  const [queue, setQueue] = useState<Paper[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [rec, rd, qu, kw] = await Promise.all([
          fetchData<RecommendedData>('recommended.json'),
          fetchData<PaperList>('reading.json'),
          fetchData<PaperList>('queue.json'),
          fetchData<KeywordsData>('keywords.json'),
        ]);
        setRecommended(rec.papers ?? []);
        setLastUpdated(rec.last_updated ?? '');
        setReading(rd.papers ?? []);
        setQueue(qu.papers ?? []);
        setKeywords(kw.keywords ?? []);
      } catch (e) {
        setLoadError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const act = async (fn: () => Promise<void>) => {
    try {
      setActionError(null);
      await fn();
    } catch (e) {
      setActionError((e as Error).message);
    }
  };

  const now = () => new Date().toISOString();

  const addToQueue = (paper: Paper) => act(async () => {
    if (queue.some(p => p.link === paper.link)) return;
    const updated = [...queue, { ...paper, added_at: now() }];
    setQueue(updated);
    await updateData<PaperList>('queue.json', { papers: updated, last_updated: now() });
  });

  const moveToReading = (paper: Paper) => act(async () => {
    const newQueue = queue.filter(p => p.link !== paper.link);
    const newReading = [...reading, paper];
    setQueue(newQueue);
    setReading(newReading);
    await Promise.all([
      updateData<PaperList>('queue.json', { papers: newQueue, last_updated: now() }),
      updateData<PaperList>('reading.json', { papers: newReading, last_updated: now() }),
    ]);
  });

  const removeFrom = (paper: Paper, section: 'reading' | 'queue') => act(async () => {
    if (section === 'reading') {
      const updated = reading.filter(p => p.link !== paper.link);
      setReading(updated);
      await updateData<PaperList>('reading.json', { papers: updated, last_updated: now() });
    } else {
      const updated = queue.filter(p => p.link !== paper.link);
      setQueue(updated);
      await updateData<PaperList>('queue.json', { papers: updated, last_updated: now() });
    }
  });

  const saveKeywords = async (kws: string[]) => {
    setKeywords(kws);
    await updateData<KeywordsData>('keywords.json', { keywords: kws });
  };

  const inQueue = new Set(queue.map(p => p.link));
  const inReading = new Set(reading.map(p => p.link));

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <header className="mb-8 border-b pb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Robot Papers</h1>
          {lastUpdated && (
            <p className="text-gray-400 text-xs mt-1">
              Recommendations updated {new Date(lastUpdated).toLocaleDateString()}
            </p>
          )}
        </div>
        <div className="flex gap-3 text-sm mt-1">
          {isAuth ? (
            <>
              <button onClick={() => setShowPAT(true)} className="text-gray-500 hover:underline">
                Settings
              </button>
              <button
                onClick={() => { localStorage.removeItem('auth'); setIsAuth(false); }}
                className="text-gray-500 hover:underline"
              >
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => setShowLogin(true)} className="text-gray-500 hover:underline">
              Owner Login
            </button>
          )}
        </div>
      </header>

      {showLogin && !isAuth && (
        <Login onLogin={() => { setIsAuth(true); setShowLogin(false); }} onBack={() => setShowLogin(false)} />
      )}
      {showPAT && (
        <PATModal onSave={p => { setPAT(p); setShowPAT(false); }} onClose={() => setShowPAT(false)} />
      )}

      {actionError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex justify-between items-center">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="ml-3 font-bold text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-16">Loading papers…</p>
      ) : loadError ? (
        <p className="text-red-500 text-center py-16">{loadError}</p>
      ) : (
        <>
          {/* Owner-only: Currently Reading + Queue */}
          {isAuth && (
            <>
              <PaperSection
                title="Currently Reading"
                papers={reading}
                badge="active"
                badgeColor="bg-green-100 text-green-700"
                emptyMessage="Nothing here yet — move a paper from your queue."
                renderActions={paper => (
                  <button
                    onClick={() => removeFrom(paper, 'reading')}
                    className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded border border-red-200 hover:border-red-400"
                  >
                    Done
                  </button>
                )}
              />
              <PaperSection
                title="Reading Queue"
                papers={queue}
                badge="queued"
                badgeColor="bg-blue-100 text-blue-700"
                emptyMessage="Add papers from recommendations below."
                renderActions={paper => (
                  <>
                    <button
                      onClick={() => moveToReading(paper)}
                      className="text-xs text-green-600 hover:text-green-800 px-2 py-1 rounded border border-green-200 hover:border-green-400"
                    >
                      Start Reading
                    </button>
                    <button
                      onClick={() => removeFrom(paper, 'queue')}
                      className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded border hover:border-red-200"
                    >
                      ×
                    </button>
                  </>
                )}
              />
            </>
          )}

          {/* Recommended — always public */}
          <PaperSection
            title="Recommended Papers"
            papers={recommended}
            badge="weekly"
            badgeColor="bg-orange-100 text-orange-700"
            emptyMessage="No recommendations yet — trigger a crawl from GitHub Actions."
            extra={isAuth ? <KeywordEditor keywords={keywords} onUpdate={saveKeywords} /> : undefined}
            renderActions={isAuth ? (paper => {
              if (inReading.has(paper.link)) return <span className="text-xs text-green-600 font-medium px-1">Reading</span>;
              if (inQueue.has(paper.link)) return <span className="text-xs text-blue-600 font-medium px-1">In Queue</span>;
              return (
                <button
                  onClick={() => addToQueue(paper)}
                  className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:border-blue-400"
                >
                  + Queue
                </button>
              );
            }) : undefined}
          />

          {/* Graph — recommended only for public, all sections for owner */}
          <PaperGraph
            recommended={recommended}
            reading={isAuth ? reading : []}
            queue={isAuth ? queue : []}
          />
        </>
      )}
    </div>
  );
}
