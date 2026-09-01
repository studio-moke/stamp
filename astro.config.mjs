// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://stamp-moke.jp',
  trailingSlash: 'always',
  experimental: {
    // Reuse previously rendered static pages when neither their data
    // nor their dependency graph has changed.
    incrementalBuild: true,
  },
});
