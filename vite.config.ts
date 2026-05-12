import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const repo = env.VITE_GITHUB_REPO || '';
  const repoName = repo.split('/')[1] || '';
  const base = repoName ? `/${repoName}/` : '/';
  return { plugins: [react()], base };
});
