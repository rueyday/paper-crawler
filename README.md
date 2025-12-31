# Paper Crawler

This repo automatically collects the latest topic-related papers from arXiv (category: cs.RO), filters them by relevant keywords, and updates the results weekly.

## Automation

- Powered by [GitHub Actions](.github/workflows/crawl.yml)

## Latest Papers

Check [`robot_manipulation_papers.json`](robot_manipulation_papers.json) for the most recent list of papers.

## Setup Locally

```bash
git clone https://github.com/YOUR_USERNAME/robot-paper-crawler.git
cd robot-paper-crawler
pip install feedparser
python crawler.py
