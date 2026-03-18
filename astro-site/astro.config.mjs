// astro-site/astro.config.mjs
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  output: 'static',
  site: 'https://ajmena92.github.io',
  base: '/sites-didacticos',
  integrations: [svelte()],
});
