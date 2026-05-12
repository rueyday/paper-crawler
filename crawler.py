import json
import datetime
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from typing import List, Dict
import os

class AdaptiveRobotPaperCrawler:
    def __init__(self):
        self.headers = {'User-Agent': 'Mozilla/5.0'}
        self.nodes, self.edges = self._load_graph()

    def _load_graph(self):
        try:
            with open('public/data/graph.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get('nodes', []), data.get('edges', [])
        except (FileNotFoundError, json.JSONDecodeError):
            default_nodes = [
                {'id': '1', 'label': 'reinforcement learning'},
                {'id': '2', 'label': 'manipulation'},
                {'id': '3', 'label': 'adaptive control'},
            ]
            return default_nodes, []

    def _get_degrees(self) -> Dict[str, int]:
        degrees = {n['id']: 0 for n in self.nodes}
        for e in self.edges:
            degrees[e['source']] = degrees.get(e['source'], 0) + 1
            degrees[e['target']] = degrees.get(e['target'], 0) + 1
        return degrees

    def _build_query(self) -> str:
        degrees = self._get_degrees()
        sorted_nodes = sorted(self.nodes, key=lambda n: degrees.get(n['id'], 0), reverse=True)
        terms = ' OR '.join(f'"{n["label"]}"' for n in sorted_nodes[:8])
        return f'cat:cs.RO AND ({terms})'

    def search_arxiv_api(self, query: str, max_results: int = 50) -> List[Dict]:
        params = {
            'search_query': query,
            'start': 0,
            'max_results': max_results,
            'sortBy': 'submittedDate',
            'sortOrder': 'descending',
        }
        url = 'http://export.arxiv.org/api/query?' + urllib.parse.urlencode(params)
        try:
            req = urllib.request.Request(url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=30) as response:
                content = response.read().decode('utf-8')
            root = ET.fromstring(content)
        except Exception:
            return []

        papers = []
        for entry in root.findall('{http://www.w3.org/2005/Atom}entry'):
            try:
                arxiv_id = entry.find('{http://www.w3.org/2005/Atom}id').text.split('/')[-1]
                papers.append({
                    'title': entry.find('{http://www.w3.org/2005/Atom}title').text.strip(),
                    'summary': entry.find('{http://www.w3.org/2005/Atom}summary').text.strip(),
                    'published': entry.find('{http://www.w3.org/2005/Atom}published').text,
                    'authors': [
                        a.find('{http://www.w3.org/2005/Atom}name').text
                        for a in entry.findall('{http://www.w3.org/2005/Atom}author')
                    ],
                    'link': f'https://arxiv.org/abs/{arxiv_id}',
                    'pdf_link': f'https://arxiv.org/pdf/{arxiv_id}.pdf',
                    'relevance_score': 0,
                })
            except Exception:
                continue
        return papers

    def score_papers(self, papers: List[Dict]) -> List[Dict]:
        degrees = self._get_degrees()
        for p in papers:
            title_l = p['title'].lower()
            summary_l = p['summary'].lower()
            score = 0
            for node in self.nodes:
                weight = degrees.get(node['id'], 0) + 1
                label = node['label'].lower()
                if label in title_l:
                    score += weight * 2
                elif label in summary_l:
                    score += weight
            p['relevance_score'] = score
        return sorted(
            [p for p in papers if p['relevance_score'] > 0],
            key=lambda x: x['relevance_score'],
            reverse=True,
        )

    def run(self):
        query = self._build_query()
        raw = self.search_arxiv_api(query, 50)
        scored = self.score_papers(raw)
        os.makedirs('public/data', exist_ok=True)
        with open('public/data/recommended.json', 'w', encoding='utf-8') as f:
            json.dump({
                'last_updated': datetime.datetime.now(datetime.timezone.utc).isoformat(),
                'papers': scored[:25],
            }, f, indent=2)

if __name__ == '__main__':
    AdaptiveRobotPaperCrawler().run()
