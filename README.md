# Robot Papers

A personal robotics paper tracker with a graph-driven recommendation engine, hosted on GitHub Pages.

Public visitors see recommended papers and the topic graph. The owner can manage a reading list, edit the graph, and refresh recommendations on demand.

**Live site:** `https://<your-username>.github.io/paper-crawler/`

---

## How it works

You build a **topic dependency graph** — nodes are research topics (e.g. "manipulation", "sim-to-real"), edges connect related ones. Topics with more connections are weighted higher when scoring papers. Hit **Refresh** to search arXiv live and get recommendations ranked by your graph.

```
Topic Graph  →  weighted search  →  arXiv API  →  ranked recommendations
```

Changes to your reading list and graph are committed directly to the repo via the GitHub API.

---

## Features

| | Public | Owner (logged in) |
|---|---|---|
| View topic graph | ✓ | ✓ |
| View recommendations | ✓ | ✓ |
| Refresh recommendations | — | ✓ |
| Edit graph (add/connect/delete topics) | — | ✓ |
| Reading list dropdown | — | ✓ |
| Add topic from reading paper | — | ✓ |

---

## Setup

### 1. Fork and enable GitHub Pages

Fork this repo. In **Settings → Pages**, set source to **GitHub Actions**.

### 2. Add secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Value |
|---|---|
| `VITE_GITHUB_REPO` | `your-username/paper-crawler` |
| `VITE_USERNAME` | your login username |
| `VITE_PASSWORD_HASH` | SHA-256 hash of your password (see below) |

To get your password hash, run:
```bash
echo -n "your-password" | sha256sum
```

### 3. Add a GitHub Personal Access Token

After the site deploys, log in and click **Settings** in the top-right. Paste a [fine-grained PAT](https://github.com/settings/tokens) with **Contents: Read & Write** scoped to this repo. This lets the site save your reading list and graph back to GitHub.

### 4. Trigger the first deploy

Go to **Actions → Build and Deploy → Run workflow**.

---

## Local development

```bash
git clone https://github.com/your-username/paper-crawler
cd paper-crawler
npm install
```

Create `.env.local`:
```
VITE_GITHUB_REPO=your-username/paper-crawler
VITE_USERNAME=your-username
VITE_PASSWORD_HASH=<sha256 of your password>
```

```bash
npm run dev
```

To populate recommendations locally:
```bash
python crawler.py
```

---

## Topic graph

- **Add Topic** — type a topic name and press Enter
- **Connect topics** — click one node, then click another to draw an edge
- **Remove edge** — click directly on an edge
- **Remove topic** — select a node, then click the Remove button
- **Drag** to reposition nodes; positions are saved automatically

Node size reflects connection count. Topics with more connections rank higher in recommendations.

---

## Reading list

Open the **Reading List** dropdown (owner only) to:
- Mark a paper as **Done** (removes it from the list)
- Click **+ Graph** to extract a topic from a paper and add it as a new graph node

Add papers to the reading list by clicking **+ Reading** on any recommended paper.

---

## Automation

The weekly crawl ([`.github/workflows/crawl.yml`](.github/workflows/crawl.yml)) runs every Monday and commits updated recommendations to `public/data/recommended.json`, using your current topic graph to weight the search. A deploy is triggered automatically on every push to `main`.

---

## Data files

All persistent state lives in `public/data/`:

| File | Contents |
|---|---|
| `graph.json` | Topic nodes and edges |
| `reading.json` | Your current reading list |
| `queue.json` | Papers queued to read |
| `recommended.json` | Last saved recommendations |
| `keywords.json` | Legacy keyword list (unused by graph mode) |
