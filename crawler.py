import json
import datetime
import time
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from typing import List, Dict
import os

class AdaptiveRobotPaperCrawler:
    def __init__(self):
        self.headers = {'User-Agent': 'Mozilla/5.0'}
        self.keywords = ['perception-driven control', 'adaptive control', 'physical intelligence', 'robot learning']

    def search_arxiv_api(self, query: str, max_results: int = 50) -> List[Dict]:
        base_url = "http://export.arxiv.org/api/query?"
        params = {'search_query': query, 'start': 0, 'max_results': max_results, 'sortBy': 'submittedDate', 'sortOrder': 'descending'}
        url = base_url + urllib.parse.urlencode(params)
        try:
            req = urllib.request.Request(url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=30) as response:
                content = response.read().decode('utf-8')
            root = ET.fromstring(content)
        except Exception as e:
            return []
        
        papers = []
        for entry in root.findall('{http://www.w3.org/2005/Atom}entry'):
            try:
                arxiv_id = entry.find('{http://www.w3.org/2005/Atom}id').text.split('/')[-1]
                papers.append({
                    'title': entry.find('{http://www.w3.org/2005/Atom}title').text.strip(),
                    'summary': entry.find('{http://www.w3.org/2005/Atom}summary').text.strip(),
                    'published': entry.find('{http://www.w3.org/2005/Atom}published').text,
                    'authors': [a.find('{http://www.w3.org/2005/Atom}name').text for a in entry.findall('{http://www.w3.org/2005/Atom}author')],
                    'link': f"https://arxiv.org/abs/{arxiv_id}",
                    'pdf_link': f"https://arxiv.org/pdf/{arxiv_id}.pdf",
                    'relevance_score': 0
                })
            except: continue
        return papers

    def filter_papers(self, papers: List[Dict]) -> List[Dict]:
        for p in papers:
            score = sum(2 if kw in p['title'].lower() else 1 if kw in p['summary'].lower() else 0 for kw in self.keywords)
            p['relevance_score'] = score
        return sorted([p for p in papers if p['relevance_score'] > 0], key=lambda x: x['relevance_score'], reverse=True)

    def run(self):
        # Simplified query logic
        raw_papers = self.search_arxiv_api('cat:cs.RO AND (adaptive OR control)', 50)
        filtered = self.filter_papers(raw_papers)
        
        output = {
            'last_updated': datetime.datetime.now().isoformat(),
            'papers': filtered[:25]
        }
        # Save to the root so the frontend can import it
        with open('papers.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2)

if __name__ == "__main__":
    AdaptiveRobotPaperCrawler().run()