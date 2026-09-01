// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://stamp-moke.jp',
  build: {
    // The site prerenders a large number of localized sticker pages.
    // A small amount of parallelism shortens builds without putting
    // too much pressure on Vercel Hobby memory limits.
    concurrency: 2,
  },
});
