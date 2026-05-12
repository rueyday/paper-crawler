import { Paper, TopicNode, TopicEdge } from '../types';

export function getNodeDegrees(nodes: TopicNode[], edges: TopicEdge[]): Record<string, number> {
  const d: Record<string, number> = {};
  for (const n of nodes) d[n.id] = 0;
  for (const e of edges) {
    d[e.source] = (d[e.source] ?? 0) + 1;
    d[e.target] = (d[e.target] ?? 0) + 1;
  }
  return d;
}

export async function fetchRecommendations(
  nodes: TopicNode[],
  edges: TopicEdge[],
  maxResults = 50
): Promise<Paper[]> {
  if (nodes.length === 0) return [];

  const degrees = getNodeDegrees(nodes, edges);
  const sorted = [...nodes].sort((a, b) => (degrees[b.id] ?? 0) - (degrees[a.id] ?? 0));

  // Top 8 nodes by degree, quoted phrases for exact matching
  const terms = sorted
    .slice(0, 8)
    .map(n => (n.label.includes(' ') ? `"${n.label}"` : n.label))
    .join(' OR ');

  const query = `cat:cs.RO AND (${terms})`;
  const url =
    'https://export.arxiv.org/api/query?' +
    new URLSearchParams({
      search_query: query,
      start: '0',
      max_results: String(maxResults),
      sortBy: 'submittedDate',
      sortOrder: 'descending',
    });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`arxiv API error: ${res.status}`);

  const doc = new DOMParser().parseFromString(await res.text(), 'text/xml');
  const papers: Paper[] = [];

  for (const entry of doc.querySelectorAll('entry')) {
    try {
      const idText = entry.querySelector('id')?.textContent ?? '';
      const arxivId = idText.split('/').pop()!;
      const title = entry.querySelector('title')?.textContent?.trim() ?? '';
      const summary = entry.querySelector('summary')?.textContent?.trim() ?? '';
      const published = entry.querySelector('published')?.textContent ?? '';
      const authors = [...entry.querySelectorAll('author name')].map(a => a.textContent ?? '').filter(Boolean);

      const tl = title.toLowerCase();
      const sl = summary.toLowerCase();
      let score = 0;
      for (const node of nodes) {
        const w = (degrees[node.id] ?? 0) + 1;
        const lbl = node.label.toLowerCase();
        if (tl.includes(lbl)) score += w * 2;
        else if (sl.includes(lbl)) score += w;
      }
      if (score === 0) continue;

      papers.push({
        title, summary, published, authors,
        link: `https://arxiv.org/abs/${arxivId}`,
        pdf_link: `https://arxiv.org/pdf/${arxivId}.pdf`,
        relevance_score: score,
      });
    } catch { continue; }
  }

  return papers.sort((a, b) => b.relevance_score - a.relevance_score);
}
