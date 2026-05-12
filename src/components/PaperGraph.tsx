import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Paper } from '../types';

interface PaperGraphProps {
  recommended: Paper[];
  reading: Paper[];
  queue: Paper[];
}

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  section: 'recommended' | 'reading' | 'queue';
  link: string;
  authors: string[];
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  reason: 'author' | 'topic';
}

const SECTION_COLOR: Record<NodeDatum['section'], string> = {
  reading: '#22c55e',
  queue: '#3b82f6',
  recommended: '#9ca3af',
};

const STOPWORDS = new Set([
  'with', 'based', 'using', 'from', 'that', 'this', 'for', 'and', 'the',
  'via', 'over', 'into', 'deep', 'large', 'learning', 'model', 'neural',
]);

function buildGraph(recommended: Paper[], reading: Paper[], queue: Paper[]) {
  const seen = new Set<string>();
  const entries: { paper: Paper; section: NodeDatum['section'] }[] = [];

  for (const [list, section] of [
    [reading, 'reading'],
    [queue, 'queue'],
    [recommended, 'recommended'],
  ] as [Paper[], NodeDatum['section']][]) {
    for (const paper of list) {
      if (!seen.has(paper.link)) {
        seen.add(paper.link);
        entries.push({ paper, section });
      }
    }
  }

  const nodes: NodeDatum[] = entries.map(({ paper, section }) => ({
    id: paper.link,
    title: paper.title,
    section,
    link: paper.link,
    authors: paper.authors,
  }));

  const links: LinkDatum[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      if (a.authors.some(au => b.authors.includes(au))) {
        links.push({ source: a.id, target: b.id, reason: 'author' });
        continue;
      }
      const aWords = new Set(
        a.title.toLowerCase().split(/\W+/).filter(w => w.length > 4 && !STOPWORDS.has(w))
      );
      const overlap = b.title.toLowerCase().split(/\W+/).filter(w => w.length > 4 && !STOPWORDS.has(w) && aWords.has(w));
      if (overlap.length >= 2) {
        links.push({ source: a.id, target: b.id, reason: 'topic' });
      }
    }
  }

  return { nodes, links };
}

export default function PaperGraph({ recommended, reading, queue }: PaperGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const { nodes, links } = buildGraph(recommended, reading, queue);
    if (nodes.length === 0) return;

    const width = svgEl.clientWidth || 800;
    const height = 500;

    const simulation = d3.forceSimulation<NodeDatum>(nodes)
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(links).id(d => d.id).distance(90))
      .force('charge', d3.forceManyBody<NodeDatum>().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<NodeDatum>(18));

    const g = svg.append('g');

    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 4])
        .on('zoom', e => g.attr('transform', e.transform))
    );

    const link = g.append('g')
      .selectAll<SVGLineElement, LinkDatum>('line')
      .data(links)
      .join('line')
      .attr('stroke', d => d.reason === 'author' ? '#f59e0b' : '#d1d5db')
      .attr('stroke-width', d => d.reason === 'author' ? 2 : 1)
      .attr('stroke-opacity', 0.7);

    const node = g.append('g')
      .selectAll<SVGCircleElement, NodeDatum>('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 9)
      .attr('fill', d => SECTION_COLOR[d.section])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGCircleElement, NodeDatum>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on('click', (_, d) => window.open(d.link, '_blank'))
      .on('mouseover', (event, d) => {
        const tip = tooltipRef.current;
        if (!tip) return;
        tip.textContent = d.title;
        tip.style.display = 'block';
        tip.style.left = `${event.offsetX + 12}px`;
        tip.style.top = `${event.offsetY - 10}px`;
      })
      .on('mousemove', event => {
        const tip = tooltipRef.current;
        if (tip) { tip.style.left = `${event.offsetX + 12}px`; tip.style.top = `${event.offsetY - 10}px`; }
      })
      .on('mouseout', () => {
        if (tooltipRef.current) tooltipRef.current.style.display = 'none';
      });

    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NodeDatum).x!)
        .attr('y1', d => (d.source as NodeDatum).y!)
        .attr('x2', d => (d.target as NodeDatum).x!)
        .attr('y2', d => (d.target as NodeDatum).y!);
      node.attr('cx', d => d.x!).attr('cy', d => d.y!);
    });

    return () => { simulation.stop(); };
  }, [recommended, reading, queue]);

  return (
    <section className="mb-10">
      <div className="flex items-center gap-4 mb-4 border-b pb-2 flex-wrap">
        <h2 className="text-xl font-bold">Paper Relationship Graph</h2>
        <div className="flex gap-4 text-xs text-gray-500 ml-auto flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Reading
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Queue
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" /> Recommended
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 bg-yellow-400 inline-block" /> Same author
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-0.5 bg-gray-300 inline-block" /> Related topic
          </span>
        </div>
      </div>
      <div className="relative border rounded-lg overflow-hidden bg-white">
        <svg ref={svgRef} className="w-full" style={{ height: 500 }} />
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none bg-gray-900 text-white text-xs px-2 py-1 rounded max-w-xs leading-tight hidden"
          style={{ zIndex: 10 }}
        />
        <p className="absolute bottom-2 right-3 text-xs text-gray-400 select-none">
          drag · scroll to zoom · click to open
        </p>
      </div>
    </section>
  );
}
