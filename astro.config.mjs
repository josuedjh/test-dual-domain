import { defineConfig } from 'astro/config';
import amplify from '@astrojs/aws-amplify';

export default defineConfig({
  output: 'server',
  adapter: amplify(),
});
