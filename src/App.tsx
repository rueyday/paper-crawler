import { useState, useEffect } from 'react';
import Login from './components/Login';
import paperDataImport from '../papers.json';
import { PaperData } from './types';

const data = paperDataImport as PaperData;

export default function App() {
  const [isAuth, setIsAuth] = useState(localStorage.getItem('auth') === 'true');

  if (!isAuth) return <Login onLogin={() => setIsAuth(true)} />;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold">Adaptive Robotics Dashboard</h1>
        <p className="text-gray-500 text-sm">Updated: {new Date(data.last_updated).toLocaleString()}</p>
      </header>
      <div className="space-y-6">
        {data.papers.map((paper, i) => (
          <div key={i} className="p-4 border rounded-lg hover:shadow-md transition shadow-sm bg-white">
            <div className="flex justify-between">
              <a href={paper.link} className="text-xl font-semibold text-blue-600 hover:underline">{paper.title}</a>
              <span className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">Score: {paper.relevance_score}</span>
            </div>
            <p className="text-sm text-gray-600 my-2 italic">{paper.authors.join(', ')}</p>
            <p className="text-sm text-gray-800 line-clamp-3">{paper.summary}</p>
            <div className="mt-4 flex gap-4 text-sm font-medium">
              <a href={paper.pdf_link} className="text-red-500">PDF</a>
              <span className="text-gray-400">{paper.published.split('T')[0]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}