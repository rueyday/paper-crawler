# crawler.py

import feedparser
import json
import datetime

def fetch_robot_manipulation_papers():
    feed_url = 'http://export.arxiv.org/rss/cs.RO'
    feed = feedparser.parse(feed_url)
    papers = []

    for entry in feed.entries:
        title = entry.title.lower()
        if 'manipulation' in title or 'grasp' in title or 'robot' in title:
            papers.append({
                'title': entry.title,
                'link': entry.link,
                'summary': entry.summary,
                'published': entry.published
            })
        if len(papers) >= 10:
            break

    return papers

def save_to_json(papers):
    with open('robot_papers.json', 'w') as f:
        json.dump({
            'last_updated': datetime.datetime.utcnow().isoformat(),
            'papers': papers
        }, f, indent=2)

if __name__ == "__main__":
    papers = fetch_robot_manipulation_papers()
    save_to_json(papers)
