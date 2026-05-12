import { Paper } from '../types';

interface PaperCardProps {
  paper: Paper;
  actions?: React.ReactNode;
}

export default function PaperCard({ paper, actions }: PaperCardProps) {
  return (
    <div className="p-4 border rounded-lg hover:shadow-md transition shadow-sm bg-white">
      <div className="flex justify-between items-start gap-3">
        <a
          href={paper.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-semibold text-blue-600 hover:underline leading-tight"
        >
          {paper.title}
        </a>
        <span className="shrink-0 bg-gray-100 px-2 py-0.5 rounded text-xs font-mono text-gray-500">
          {paper.relevance_score}★
        </span>
      </div>
      <p className="text-xs text-gray-500 mt-1 italic">
        {paper.authors.slice(0, 4).join(', ')}{paper.authors.length > 4 ? ' …' : ''}
      </p>
      <p className="text-sm text-gray-700 mt-2 line-clamp-3">{paper.summary}</p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-3 text-xs">
          <a
            href={paper.pdf_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-red-500 font-medium hover:underline"
          >
            PDF
          </a>
          <span className="text-gray-400">{paper.published.split('T')[0]}</span>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </div>
  );
}
