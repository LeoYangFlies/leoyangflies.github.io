// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { tocPlugin } from './src/lib/markdown-toc.mjs';

// The site's public address, used for the sitemap, RSS feed and link previews.
// On GitHub Pages it is worked out automatically from your GitHub username
// (this assumes the repository is named <username>.github.io).
// If you later add your own domain, set SITE_URL in .github/workflows/deploy.yml.
const owner = process.env.GITHUB_REPOSITORY_OWNER;
const site =
  process.env.SITE_URL ||
  (owner ? `https://${owner.toLowerCase()}.github.io` : 'http://localhost:4321');

export default defineConfig({
  site,
  integrations: [sitemap()],
  markdown: {
    // In-article menus become a contents box (see src/lib/markdown-toc.mjs).
    processor: satteri({ hastPlugins: [tocPlugin] }),
  },
  vite: {
    // The detailed world coastline (only loaded when someone zooms in close) is a large file by design.
    build: { chunkSizeWarningLimit: 700 },
  },
});
