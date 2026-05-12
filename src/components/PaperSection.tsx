import { Paper } from '../types';
import PaperCard from './PaperCard';

interface PaperSectionProps {
  title: string;
  papers: Paper[];
  badge?: string;
  badgeColor?: string;
  renderActions?: (paper: Paper) => React.ReactNode;
  extra?: React.ReactNode;
  emptyMessage?: string;
}

export default function PaperSection({
  title, papers, badge, badgeColor = 'bg-gray-100 text-gray-600',
  renderActions, extra, emptyMessage,
}: PaperSectionProps) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4 border-b pb-2">
        <h2 className="text-xl font-bold">{title}</h2>
        {badge && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>}
        <span className="text-sm text-gray-400 ml-auto">
          {papers.length} paper{papers.length !== 1 ? 's' : ''}
        </span>
      </div>
      {extra}
      {papers.length === 0 ? (
        <p className="text-sm text-gray-400 italic mt-2">{emptyMessage ?? 'No papers here yet.'}</p>
      ) : (
        <div className="space-y-4">
          {papers.map((paper, i) => (
            <PaperCard key={paper.link || i} paper={paper} actions={renderActions?.(paper)} />
          ))}
        </div>
      )}
    </section>
  );
}
