import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { TopicGraphData, TopicNode, TopicEdge } from '../types';
import { getNodeDegrees } from '../lib/arxiv';

interface Props {
  graph: TopicGraphData;
  editable: boolean;
  onUpdate: (g: TopicGraphData) => Promise<void>;
}

type SimNode = TopicNode & d3.SimulationNodeDatum;
type SimLink = { source: string | SimNode; target: string | SimNode; srcId: string; tgtId: string };

export default function TopicGraph({ graph, editable, onUpdate }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  // Persist positions across rebuilds so nodes don't jump
  const posRef = useRef<Record<string, { x: number; y: number }>>({});
  // Refs for latest values inside d3 closures
  const graphRef = useRef(graph);
  graphRef.current = graph;
  const selectedRef = useRef<string | null>(null);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const [selected, setSelected] = useState<string | null>(null);
  const [addLabel, setAddLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [hint, setHint] = useState('');

  const degrees = useMemo(() => getNodeDegrees(graph.nodes, graph.edges), [graph]);

  const save = useCallback(async (next: TopicGraphData) => {
    setSaving(true);
    try { await onUpdateRef.current(next); }
    finally { setSaving(false); }
  }, []);

  // ── d3 simulation ──────────────────────────────────────────────────────────
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const width = svgEl.clientWidth || 700;
    const height = 420;
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    if (graph.nodes.length === 0) return () => {};

    const deg = getNodeDegrees(graph.nodes, graph.edges);

    const simNodes: SimNode[] = graph.nodes.map(n => ({
      ...n,
      x: posRef.current[n.id]?.x ?? n.x ?? width / 2 + (Math.random() - 0.5) * 300,
      y: posRef.current[n.id]?.y ?? n.y ?? height / 2 + (Math.random() - 0.5) * 200,
    }));

    const simLinks: SimLink[] = graph.edges.map(e => ({
      source: e.source, target: e.target,
      srcId: e.source, tgtId: e.target,
    }));

    const isFirst = simNodes.some(n => !posRef.current[n.id]);

    const simulation: d3.Simulation<SimNode, SimLink> = d3.forceSimulation<SimNode>(simNodes)
      .alpha(isFirst ? 1 : 0.08)
      .force('link', d3.forceLink<SimNode, SimLink>(simLinks).id(d => d.id).distance(130))
      .force('charge', d3.forceManyBody<SimNode>().strength(-280))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<SimNode>(d => nodeR(deg[d.id] ?? 0) + 18));

    const g = svg.append('g');
    svg.call(d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 3]).on('zoom', e => g.attr('transform', e.transform)));

    // Click background → deselect
    svg.on('click', () => { selectedRef.current = null; setSelected(null); setHint(''); });

    // ── Links ────────────────────────────────────────────────────────────────
    const linkSel = g.append('g')
      .selectAll<SVGLineElement, SimLink>('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', '#cbd5e1')
      .attr('stroke-width', 2)
      .attr('cursor', editable ? 'pointer' : 'default');

    if (editable) {
      linkSel.on('click', (event: MouseEvent, d: SimLink) => {
        event.stopPropagation();
        const cur = graphRef.current;
        save({ ...cur, edges: cur.edges.filter(e => !(e.source === d.srcId && e.target === d.tgtId) && !(e.source === d.tgtId && e.target === d.srcId)) });
      });
    }

    // ── Nodes ────────────────────────────────────────────────────────────────
    const nodeG = g.append('g')
      .selectAll<SVGGElement, SimNode>('g')
      .data(simNodes)
      .join('g')
      .attr('cursor', 'pointer');

    nodeG.append('circle')
      .attr('r', d => nodeR(deg[d.id] ?? 0))
      .attr('fill', d => d.id === selected ? '#3b82f6' : '#f1f5f9')
      .attr('stroke', d => d.id === selected ? '#1d4ed8' : '#94a3b8')
      .attr('stroke-width', 2);

    nodeG.append('text')
      .text(d => d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', d => -(nodeR(deg[d.id] ?? 0) + 5))
      .attr('font-size', '11px')
      .attr('fill', '#374151')
      .attr('pointer-events', 'none');

    // Degree badge
    nodeG.filter(d => (deg[d.id] ?? 0) > 0)
      .append('text')
      .text(d => String(deg[d.id]))
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#374151')
      .attr('pointer-events', 'none');

    // Node click: select or connect
    nodeG.on('click', (event, d) => {
      event.stopPropagation();
      const cur = selectedRef.current;
      if (cur === d.id) {
        selectedRef.current = null; setSelected(null); setHint('');
      } else if (cur && cur !== d.id) {
        const { edges } = graphRef.current;
        const exists = edges.some(e => (e.source === cur && e.target === d.id) || (e.source === d.id && e.target === cur));
        if (!exists) save({ ...graphRef.current, edges: [...edges, { source: cur, target: d.id }] });
        selectedRef.current = null; setSelected(null); setHint('');
      } else if (editable) {
        selectedRef.current = d.id; setSelected(d.id);
        setHint(`"${d.label}" selected — click another node to connect, or Remove below.`);
      }
    });

    // Drag
    if (editable) {
      nodeG.call(
        d3.drag<SVGGElement, SimNode>()
          .on('start', (ev, d) => { if (!ev.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag', (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
          .on('end', (ev, d) => {
            if (!ev.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
            // save positions
            const updatedNodes = graphRef.current.nodes.map(n => {
              const s = simNodes.find(s => s.id === n.id);
              return s ? { ...n, x: s.x, y: s.y } : n;
            });
            save({ ...graphRef.current, nodes: updatedNodes });
          })
      );
    }

    simulation.on('tick', () => {
      for (const n of simNodes) posRef.current[n.id] = { x: n.x!, y: n.y! };
      linkSel
        .attr('x1', d => (d.source as SimNode).x!)
        .attr('y1', d => (d.source as SimNode).y!)
        .attr('x2', d => (d.target as SimNode).x!)
        .attr('y2', d => (d.target as SimNode).y!);
      nodeG.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [graph, selected, editable]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const addNode = async () => {
    const label = addLabel.trim();
    if (!label) return;
    if (graph.nodes.some(n => n.label.toLowerCase() === label.toLowerCase())) {
      setAddLabel(''); return;
    }
    await save({ ...graph, nodes: [...graph.nodes, { id: Date.now().toString(), label }] });
    setAddLabel('');
  };

  const removeSelected = async () => {
    if (!selected) return;
    await save({
      nodes: graph.nodes.filter(n => n.id !== selected),
      edges: graph.edges.filter(e => e.source !== selected && e.target !== selected),
    });
    setSelected(null); selectedRef.current = null; setHint('');
  };

  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-3 border-b pb-2 flex-wrap">
        <h2 className="text-xl font-bold">Topic Graph</h2>
        <span className="text-xs text-gray-400">
          {graph.nodes.length} topics · {graph.edges.length} connections
        </span>
        {editable && (
          <span className="text-xs text-gray-400 ml-auto">
            more connections → higher recommendation priority
          </span>
        )}
      </div>

      {/* Toolbar (owner only) */}
      {editable && (
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <input
            value={addLabel}
            onChange={e => setAddLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addNode()}
            placeholder="New topic…"
            className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 w-40"
          />
          <button
            onClick={addNode}
            disabled={!addLabel.trim()}
            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-40"
          >
            Add Topic
          </button>
          {selected && (
            <button
              onClick={removeSelected}
              className="text-sm text-red-500 border border-red-200 px-3 py-1 rounded hover:bg-red-50"
            >
              Remove "{graph.nodes.find(n => n.id === selected)?.label}"
            </button>
          )}
          {saving && <span className="text-xs text-gray-400">saving…</span>}
        </div>
      )}

      {hint && <p className="text-xs text-blue-600 mb-2">{hint}</p>}

      <div className="border rounded-lg overflow-hidden bg-white relative">
        {graph.nodes.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            {editable ? 'Add a topic above to get started.' : 'No topics yet.'}
          </div>
        ) : (
          <svg ref={svgRef} className="w-full" style={{ height: 420 }} />
        )}
        {editable && graph.nodes.length > 0 && (
          <p className="absolute bottom-2 right-3 text-xs text-gray-400 select-none">
            drag · scroll to zoom · click node to select/connect · click edge to remove
          </p>
        )}
      </div>

      {/* Legend */}
      {graph.nodes.length > 0 && (
        <div className="flex gap-4 text-xs text-gray-400 mt-1 flex-wrap">
          <span>Node size = connection count</span>
          <span>Number inside = degree</span>
          {editable && <span className="text-blue-500">Select a node → click another to link them</span>}
        </div>
      )}
    </section>
  );
}

function nodeR(degree: number) {
  return 12 + degree * 6;
}
