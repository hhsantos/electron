// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Necesario para los endpoints API
  site: 'https://electron.finance', // Your production domain
  // The site does not use astro:assets. Passthrough disables sharp processing in /_image,
  // which closes the AVIF RCE (GHSA-26w7-cxv4-gfx2) and the sharp/libvips advisories until Astro 7.
  image: { service: passthroughImageService() },
  adapter: node({
    mode: 'standalone' // Crea un servidor standalone
  })
});
