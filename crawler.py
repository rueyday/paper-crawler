import json
import datetime
import time
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from typing import List, Dict

class AdaptiveRobotPaperCrawler:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        
        # Keywords derived from Ruey’s SOP: perception-driven, adaptive control, physical intelligence
        self.keywords = [
            # Core research direction
            'perception-driven control', 'adaptive control', 'learning-based control',
            'sensorimotor learning', 'physical intelligence', 'robot learning',
            'adaptive robotics', 'dynamic modeling', 'sensor fusion',
            
            # Contact & physical interaction
            'contact-rich manipulation', 'tactile perception', 'force control',
            'impedance control', 'contact dynamics', 'interaction control',
            
            # Embedded & efficient systems
            'embedded robotics', 'real-time control', 'resource-efficient robotics',
            'state estimation', 'kalman filter', 'closed-loop control',
            
            # Broader integration themes
            'perception and control', 'model-based reinforcement learning',
            'uncertain dynamics', 'multi-modal sensing', 'actuation feedback'
        ]

    # ---------------------------------------------------------------------
    # Search ArXiv API
    # ---------------------------------------------------------------------
    def search_arxiv_api(self, query: str, max_results: int = 50) -> List[Dict]:
        base_url = "http://export.arxiv.org/api/query?"
        params = {
            'search_query': query,
            'start': 0,
            'max_results': max_results,
            'sortBy': 'submittedDate',
            'sortOrder': 'descending'
        }
        
        url = base_url + urllib.parse.urlencode(params)
        print(f"🔍 Searching ArXiv API: {query}")
        
        try:
            req = urllib.request.Request(url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=30) as response:
                content = response.read().decode('utf-8')
            root = ET.fromstring(content)
        except Exception as e:
            print(f"Error searching ArXiv: {e}")
            return []
        
        papers = []
        for entry in root.findall('{http://www.w3.org/2005/Atom}entry'):
            try:
                title = entry.find('{http://www.w3.org/2005/Atom}title').text.strip()
                summary = entry.find('{http://www.w3.org/2005/Atom}summary').text.strip()
                published = entry.find('{http://www.w3.org/2005/Atom}published').text
                id_elem = entry.find('{http://www.w3.org/2005/Atom}id')
                arxiv_id = id_elem.text.split('/')[-1] if id_elem is not None else ''

                authors = [
                    a.find('{http://www.w3.org/2005/Atom}name').text
                    for a in entry.findall('{http://www.w3.org/2005/Atom}author')
                ]
                categories = [
                    c.get('term') for c in entry.findall('{http://www.w3.org/2005/Atom}category')
                ]

                papers.append({
                    'title': title,
                    'summary': summary,
                    'published': published,
                    'authors': authors,
                    'categories': categories,
                    'link': f"https://arxiv.org/abs/{arxiv_id}",
                    'pdf_link': f"https://arxiv.org/pdf/{arxiv_id}.pdf",
                    'source': 'ArXiv',
                    'arxiv_id': arxiv_id
                })
            except Exception as e:
                print(f"Error parsing entry: {e}")
                continue
        
        return papers

    # ---------------------------------------------------------------------
    # Filter and rank papers based on Ruey's interests
    # ---------------------------------------------------------------------
    def filter_adaptive_papers(self, papers: List[Dict]) -> List[Dict]:
        filtered = []
        for paper in papers:
            title_lower = paper['title'].lower()
            summary_lower = paper['summary'].lower()
            
            # Compute a relevance score
            score = 0
            for keyword in self.keywords:
                if keyword in title_lower:
                    score += 2
                if keyword in summary_lower:
                    score += 1
            
            if score > 0:
                paper['relevance_score'] = score
                filtered.append(paper)

        filtered.sort(key=lambda x: x['relevance_score'], reverse=True)
        return filtered

    # ---------------------------------------------------------------------
    # Fetch papers from multiple related categories
    # ---------------------------------------------------------------------
    def fetch_robot_papers(self, max_papers: int = 25) -> List[Dict]:
        all_papers = []
        
        search_queries = [
            # Robotics and control
            'cat:cs.RO AND (adaptive OR perception-driven OR control OR tactile OR "sensor fusion")',
            # Learning for robotics
            'cat:cs.LG AND (robot OR "reinforcement learning" OR "adaptive control")',
            # Embedded and systems
            'cat:eess.SY AND (robot OR control OR feedback)',
            # AI + perception-driven reasoning
            'cat:cs.AI AND (sensorimotor OR embodied OR "model-based control")'
        ]
        
        for query in search_queries:
            papers = self.search_arxiv_api(query, max_results=40)
            all_papers.extend(papers)
            time.sleep(1)

        # Remove duplicates
        unique_papers = {}
        for paper in all_papers:
            pid = paper.get('arxiv_id', '')
            if pid not in unique_papers:
                unique_papers[pid] = paper

        filtered_papers = self.filter_adaptive_papers(list(unique_papers.values()))
        return filtered_papers[:max_papers]

    # ---------------------------------------------------------------------
    # Save and summarize
    # ---------------------------------------------------------------------
    def save_to_json(self, papers: List[Dict], filename: str = 'adaptive_robotics_papers.json'):
        try:
            data = {
                'last_updated': datetime.datetime.now().isoformat(),
                'total_papers': len(papers),
                'papers': papers,
                'search_keywords': self.keywords
            }
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"✅ Saved {len(papers)} papers to {filename}")
            return True
        except Exception as e:
            print(f"Error saving to JSON: {e}")
            return False

    def print_summary(self, papers: List[Dict]):
        print(f"\n{'='*60}")
        print(f"ADAPTIVE ROBOTICS PAPERS SUMMARY")
        print(f"{'='*60}")
        print(f"Total papers found: {len(papers)}")
        if papers:
            print(f"\nTop 5 Most Relevant Papers:")
            print("-" * 40)
            for i, p in enumerate(papers[:5], 1):
                print(f"{i}. {p['title']}")
                print(f"   Authors: {', '.join(p['authors'][:3])}{'...' if len(p['authors']) > 3 else ''}")
                print(f"   Published: {p['published'][:10] if p['published'] else 'Unknown'}")
                print(f"   Relevance Score: {p.get('relevance_score', 0)}")
                print(f"   Link: {p['link']}\n")

def main():
    crawler = AdaptiveRobotPaperCrawler()
    print("\nFetching perception-driven adaptive robotics papers...")
    papers = crawler.fetch_robot_papers(max_papers=25)
    
    if papers:
        crawler.save_to_json(papers)
        crawler.print_summary(papers)
        print(f"\n✅ Successfully crawled {len(papers)} adaptive robotics papers!")
    else:
        print("No papers found. Check your internet connection or ArXiv API.")

if __name__ == "__main__":
    main()
