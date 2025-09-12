// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Necesario para los endpoints API
  site: 'https://electron.finance', // Your production domain
  adapter: node({
    mode: 'standalone' // Crea un servidor standalone
  })
});
