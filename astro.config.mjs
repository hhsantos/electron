// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Necesario para los endpoints API
  site: 'https://electron.finance', // Your production domain
});
