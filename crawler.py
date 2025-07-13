import json
import datetime
import time
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from typing import List, Dict, Any
import re

class RobotPaperCrawler:
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        self.manipulation_keywords = [
            'manipulation', 'grasp', 'grasping', 'pick', 'place', 'dexterous',
            'robotic arm', 'robot hand', 'end effector', 'object manipulation',
            'tactile', 'force control', 'impedance control', 'contact',
            'assembly', 'bin picking', 'sorting', 'stacking'
        ]
        
    def search_arxiv_api(self, query: str, max_results: int = 50) -> List[Dict]:
        """Search ArXiv using their API instead of RSS"""
        base_url = "http://export.arxiv.org/api/query?"
        
        params = {
            'search_query': query,
            'start': 0,
            'max_results': max_results,
            'sortBy': 'submittedDate',
            'sortOrder': 'descending'
        }
        
        url = base_url + urllib.parse.urlencode(params)
        print(f"Searching ArXiv API: {query}")
        
        try:
            req = urllib.request.Request(url, headers=self.headers)
            with urllib.request.urlopen(req, timeout=30) as response:
                content = response.read().decode('utf-8')
                
            # Parse XML response
            root = ET.fromstring(content)
            
            papers = []
            for entry in root.findall('{http://www.w3.org/2005/Atom}entry'):
                try:
                    title_elem = entry.find('{http://www.w3.org/2005/Atom}title')
                    summary_elem = entry.find('{http://www.w3.org/2005/Atom}summary')
                    published_elem = entry.find('{http://www.w3.org/2005/Atom}published')
                    
                    # Get the ArXiv ID and construct proper URL
                    id_elem = entry.find('{http://www.w3.org/2005/Atom}id')
                    arxiv_id = id_elem.text.split('/')[-1] if id_elem is not None else ''
                    
                    # Get authors
                    authors = []
                    for author in entry.findall('{http://www.w3.org/2005/Atom}author'):
                        name_elem = author.find('{http://www.w3.org/2005/Atom}name')
                        if name_elem is not None:
                            authors.append(name_elem.text)
                    
                    # Get categories
                    categories = []
                    for category in entry.findall('{http://www.w3.org/2005/Atom}category'):
                        term = category.get('term')
                        if term:
                            categories.append(term)
                    
                    if title_elem is not None:
                        paper = {
                            'title': title_elem.text.strip(),
                            'link': f"https://arxiv.org/abs/{arxiv_id}",
                            'pdf_link': f"https://arxiv.org/pdf/{arxiv_id}.pdf",
                            'summary': summary_elem.text.strip() if summary_elem is not None else '',
                            'published': published_elem.text if published_elem is not None else '',
                            'authors': authors,
                            'categories': categories,
                            'source': 'ArXiv',
                            'arxiv_id': arxiv_id
                        }
                        papers.append(paper)
                        
                except Exception as e:
                    print(f"Error parsing entry: {e}")
                    continue
                    
            return papers
            
        except Exception as e:
            print(f"Error searching ArXiv: {e}")
            return []
    
    def filter_manipulation_papers(self, papers: List[Dict]) -> List[Dict]:
        """Filter papers that are related to robot manipulation"""
        filtered = []
        
        for paper in papers:
            title_lower = paper['title'].lower()
            summary_lower = paper['summary'].lower()
            
            # Check if any manipulation keyword is in title or summary
            is_manipulation = any(
                keyword in title_lower or keyword in summary_lower 
                for keyword in self.manipulation_keywords
            )
            
            if is_manipulation:
                # Calculate relevance score
                score = 0
                for keyword in self.manipulation_keywords:
                    if keyword in title_lower:
                        score += 2  # Title matches are more important
                    if keyword in summary_lower:
                        score += 1
                
                paper['relevance_score'] = score
                filtered.append(paper)
        
        # Sort by relevance score
        filtered.sort(key=lambda x: x['relevance_score'], reverse=True)
        return filtered
    
    def fetch_robot_manipulation_papers(self, max_papers: int = 25) -> List[Dict]:
        """Fetch recent robot manipulation papers from multiple sources"""
        all_papers = []
        
        # Search queries for different aspects of robot manipulation
        search_queries = [
            'cat:cs.RO AND (manipulation OR grasp OR grasping)',
            'cat:cs.RO AND (robotic AND (arm OR hand OR gripper))',
            'cat:cs.RO AND (pick OR place OR assembly)',
            'cat:cs.RO AND (dexterous OR tactile OR force)',
            'cat:cs.CV AND (robot AND manipulation)',
            'cat:cs.AI AND (robot AND manipulation)'
        ]
        
        # Search each query
        for query in search_queries:
            papers = self.search_arxiv_api(query, max_results=30)
            all_papers.extend(papers)
            time.sleep(1)  # Be respectful to ArXiv API
        
        # Remove duplicates based on ArXiv ID
        unique_papers = {}
        for paper in all_papers:
            arxiv_id = paper.get('arxiv_id', '')
            if arxiv_id and arxiv_id not in unique_papers:
                unique_papers[arxiv_id] = paper
        
        papers_list = list(unique_papers.values())
        
        # Filter for manipulation relevance
        filtered_papers = self.filter_manipulation_papers(papers_list)
        
        # Limit to max_papers
        return filtered_papers[:max_papers]
    
    def get_conference_papers(self) -> List[Dict]:
        """Get recent papers from major robotics conferences (placeholder for future implementation)"""
        # This would require scraping conference websites like:
        # - ICRA (IEEE International Conference on Robotics and Automation)
        # - IROS (IEEE/RSJ International Conference on Intelligent Robots and Systems)
        # - RSS (Robotics: Science and Systems)
        # - CoRL (Conference on Robot Learning)
        
        # For now, return empty list but structure is ready for expansion
        conference_papers = []
        
        # Example structure for conference papers:
        # {
        #     'title': 'Paper Title',
        #     'authors': ['Author 1', 'Author 2'],
        #     'conference': 'ICRA 2024',
        #     'link': 'https://...',
        #     'pdf_link': 'https://...',
        #     'summary': 'Abstract...',
        #     'published': '2024-01-15',
        #     'source': 'Conference'
        # }
        
        return conference_papers
    
    def save_to_json(self, papers: List[Dict], filename: str = 'robot_manipulation_papers.json'):
        try:
            data = {
                'last_updated': datetime.datetime.now().isoformat(),
                'total_papers': len(papers),
                'papers': papers,
                'search_keywords': self.manipulation_keywords
            }
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Saved {len(papers)} papers to {filename}")
            return True
            
        except Exception as e:
            print(f"Error saving to JSON: {e}")
            return False
    
    def print_summary(self, papers: List[Dict]):
        """Print a summary of found papers"""
        print(f"\n{'='*60}")
        print(f"ROBOT MANIPULATION PAPERS SUMMARY")
        print(f"{'='*60}")
        print(f"Total papers found: {len(papers)}")
        
        if papers:
            print(f"\nTop 5 Most Relevant Papers:")
            print("-" * 40)
            
            for i, paper in enumerate(papers[:5], 1):
                print(f"{i}. {paper['title']}")
                print(f"   Authors: {', '.join(paper['authors'][:3])}{'...' if len(paper['authors']) > 3 else ''}")
                print(f"   Published: {paper['published'][:10] if paper['published'] else 'Unknown'}")
                print(f"   Relevance Score: {paper.get('relevance_score', 0)}")
                print(f"   Link: {paper['link']}")
                print()

def main():
    crawler = RobotPaperCrawler()
    
    print("\nFetching papers from ArXiv...")
    arxiv_papers = crawler.fetch_robot_manipulation_papers(max_papers=25)
    
    # Get conference papers (placeholder for future)
    print("\nFetching conference papers...")
    conference_papers = crawler.get_conference_papers()
    
    # Combine all papers
    all_papers = arxiv_papers + conference_papers
    
    if all_papers:
        crawler.save_to_json(all_papers)
        crawler.print_summary(all_papers)
        
        print(f"\n✅ Successfully crawled {len(all_papers)} robot manipulation papers!")
    else:
        print("No papers found. This might be due to:")

if __name__ == "__main__":
    main()