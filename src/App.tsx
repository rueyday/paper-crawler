import { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import PATModal from './components/PATModal';
import PaperCard from './components/PaperCard';
import TopicGraph from './components/TopicGraph';
import ReadingDropdown from './components/ReadingDropdown';
import { fetchData, updateData, setPAT } from './lib/github';
import { fetchRecommendations, getNodeDegrees } from './lib/arxiv';
import { Paper, PaperList, RecommendedData, TopicGraphData } from './types';

export default function App() {
  const [isAuth, setIsAuth] = useState(localStorage.getItem('auth') === 'true');
  const [showLogin, setShowLogin] = useState(false);
  const [showPAT, setShowPAT] = useState(false);

  const [graph, setGraph] = useState<TopicGraphData>({ nodes: [], edges: [] });
  const [reading, setReading] = useState<Paper[]>([]);
  const [recommended, setRecommended] = useState<Paper[]>([]);
  const [lastUpdated, setLastUpdated] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [g, rd, rec] = await Promise.all([
          fetchData<TopicGraphData>('graph.json'),
          fetchData<PaperList>('reading.json'),
          fetchData<RecommendedData>('recommended.json'),
        ]);
        setGraph(g ?? { nodes: [], edges: [] });
        setReading(rd.papers ?? []);
        setRecommended(rec.papers ?? []);
        setLastUpdated(rec.last_updated ?? '');
      } catch (e) {
        setLoadError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const withError = async (fn: () => Promise<void>) => {
    try { setActionError(null); await fn(); }
    catch (e) { setActionError((e as Error).message); }
  };

  const now = () => new Date().toISOString();

  // ── Topic graph ────────────────────────────────────────────────────────────
  const saveGraph = useCallback(async (next: TopicGraphData) => {
    setGraph(next);
    await withError(() => updateData<TopicGraphData>('graph.json', next));
  }, []);

  const addTopicFromReading = async (label: string) => {
    if (graph.nodes.some(n => n.label.toLowerCase() === label.toLowerCase())) return;
    const next: TopicGraphData = {
      ...graph,
      nodes: [...graph.nodes, { id: Date.now().toString(), label }],
    };
    await saveGraph(next);
  };

  // ── Refresh recommendations ────────────────────────────────────────────────
  const refresh = async () => {
    if (graph.nodes.length === 0) {
      setActionError('Add at least one topic to the graph first.');
      return;
    }
    setRefreshing(true);
    setActionError(null);
    try {
      const papers = await fetchRecommendations(graph.nodes, graph.edges);
      setRecommended(papers);
      setLastUpdated(now());
      // Auto-save so public visitors see up-to-date recommendations
      if (isAuth) {
        setSaving(true);
        try {
          await updateData<RecommendedData>('recommended.json', { papers, last_updated: now() });
        } finally { setSaving(false); }
      }
    } catch (e) {
      setActionError((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  };

  // ── Reading list ───────────────────────────────────────────────────────────
  const removeFromReading = (paper: Paper) => withError(async () => {
    const updated = reading.filter(p => p.link !== paper.link);
    setReading(updated);
    await updateData<PaperList>('reading.json', { papers: updated, last_updated: now() });
  });

  // ── Queue: add from recommended ────────────────────────────────────────────
  const addToReading = (paper: Paper) => withError(async () => {
    if (reading.some(p => p.link === paper.link)) return;
    const updated = [...reading, { ...paper, added_at: now() }];
    setReading(updated);
    await updateData<PaperList>('reading.json', { papers: updated, last_updated: now() });
  });

  const inReading = new Set(reading.map(p => p.link));
  const degrees = getNodeDegrees(graph.nodes, graph.edges);
  const topTopic = [...graph.nodes].sort((a, b) => (degrees[b.id] ?? 0) - (degrees[a.id] ?? 0))[0];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* ── Header ── */}
      <header className="mb-8 border-b pb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Robot Papers</h1>
          {topTopic && (
            <p className="text-xs text-gray-400 mt-1">
              Top topic: <span className="font-medium text-gray-600">{topTopic.label}</span>
              {' '}({degrees[topTopic.id]} connections)
            </p>
          )}
        </div>
        <div className="flex gap-3 text-sm mt-1">
          {isAuth ? (
            <>
              <button onClick={() => setShowPAT(true)} className="text-gray-500 hover:underline">Settings</button>
              <button onClick={() => { localStorage.removeItem('auth'); setIsAuth(false); }} className="text-gray-500 hover:underline">Logout</button>
            </>
          ) : (
            <button onClick={() => setShowLogin(true)} className="text-gray-500 hover:underline">Owner Login</button>
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
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex justify-between items-start">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="ml-3 font-bold shrink-0">×</button>
        </div>
      )}

      {loading ? (
        <p className="text-gray-400 text-center py-16">Loading…</p>
      ) : loadError ? (
        <p className="text-red-500 text-center py-16">{loadError}</p>
      ) : (
        <>
          {/* ── Topic Graph ── */}
          <TopicGraph graph={graph} editable={isAuth} onUpdate={saveGraph} />

          {/* ── Reading List (owner) ── */}
          {isAuth && (
            <ReadingDropdown
              papers={reading}
              onRemove={removeFromReading}
              onAddToGraph={addTopicFromReading}
            />
          )}

          {/* ── Recommended ── */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4 border-b pb-2 flex-wrap">
              <h2 className="text-xl font-bold">Recommended Papers</h2>
              <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full">
                graph-driven
              </span>
              <span className="text-sm text-gray-400 ml-auto">
                {recommended.length} paper{recommended.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={refresh}
                disabled={refreshing || graph.nodes.length === 0}
                className="flex items-center gap-1.5 bg-blue-600 text-white text-sm px-3 py-1.5 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refreshing ? (
                  <><span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" /> Searching…</>
                ) : (
                  '↻ Refresh'
                )}
              </button>
              {saving && <span className="text-xs text-gray-400">saving…</span>}
            </div>

            {lastUpdated && (
              <p className="text-xs text-gray-400 mb-3">
                Last refreshed: {new Date(lastUpdated).toLocaleString()}
              </p>
            )}

            {recommended.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                {graph.nodes.length === 0
                  ? 'Add topics to the graph above, then hit Refresh.'
                  : 'Hit Refresh to fetch the latest papers based on your topic graph.'}
              </p>
            ) : (
              <div className="space-y-4">
                {recommended.map((paper, i) => (
                  <PaperCard
                    key={paper.link || i}
                    paper={paper}
                    actions={isAuth ? (
                      inReading.has(paper.link)
                        ? <span className="text-xs text-green-600 font-medium px-1">Reading</span>
                        : <button
                            onClick={() => addToReading(paper)}
                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 hover:border-blue-400"
                          >
                            + Reading
                          </button>
                    ) : undefined}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
