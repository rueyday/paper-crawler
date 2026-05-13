const REPO = import.meta.env.VITE_GITHUB_REPO as string;
const BRANCH = 'main';
const IS_DEV = import.meta.env.DEV;

// File paths in the repo (under public/ so Vite also serves them locally)
const DATA_DIR = 'public/data';

const BASE = import.meta.env.BASE_URL as string; // e.g. '/paper-crawler/'

const DEFAULTS: Record<string, unknown> = {
  'reading.json':     { papers: [], last_updated: '' },
  'queue.json':       { papers: [], last_updated: '' },
  'recommended.json': { papers: [], last_updated: '' },
  'keywords.json':    { keywords: ['reinforcement learning', 'manipulation', 'adaptive control', 'imitation learning', 'robot learning'] },
  'graph.json':       { nodes: [], edges: [] },
};

export function getPAT(): string | null {
  return localStorage.getItem('github_pat');
}

export function setPAT(pat: string): void {
  localStorage.setItem('github_pat', pat);
}

export async function fetchData<T>(filename: string): Promise<T> {
  // In dev, Vite serves public/ at BASE_URL — fetch locally
  if (IS_DEV) {
    const res = await fetch(`${BASE}data/${filename}?t=${Date.now()}`);
    if (res.status === 404) return DEFAULTS[filename] as T ?? {} as T;
    if (!res.ok) throw new Error(`Fetch failed for ${filename}: HTTP ${res.status}`);
    return res.json();
  }

  if (!REPO) throw new Error('VITE_GITHUB_REPO is not configured in the build environment.');
  const url = `https://raw.githubusercontent.com/${REPO}/${BRANCH}/${DATA_DIR}/${filename}?t=${Date.now()}`;
  const res = await fetch(url);
  if (res.status === 404) return DEFAULTS[filename] as T ?? {} as T;
  if (!res.ok) throw new Error(`Fetch failed for ${filename}: HTTP ${res.status}`);
  return res.json();
}

export async function updateData<T>(filename: string, data: T): Promise<void> {
  const pat = getPAT();
  if (!pat) throw new Error('No GitHub PAT configured — click Settings to add one.');
  if (!REPO) throw new Error('VITE_GITHUB_REPO is not configured.');

  const path = `${DATA_DIR}/${filename}`;
  const apiUrl = `https://api.github.com/repos/${REPO}/contents/${path}`;
  const headers = {
    Authorization: `Bearer ${pat}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  const getRes = await fetch(apiUrl, { headers });
  let sha: string | undefined;
  if (getRes.ok) {
    sha = (await getRes.json()).sha as string;
  }

  const json = JSON.stringify(data, null, 2);
  const bytes = new TextEncoder().encode(json);
  const content = btoa(Array.from(bytes, b => String.fromCharCode(b)).join(''));

  const body: Record<string, unknown> = { message: `Update ${filename} via web`, content, branch: BRANCH };
  if (sha) body.sha = sha;

  const putRes = await fetch(apiUrl, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!putRes.ok) {
    const err = await putRes.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message || `Failed to update ${filename}`);
  }
}
