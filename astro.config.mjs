import { defineConfig } from 'astro/config';
import awsAmplify from 'astro-aws-amplify';

export default defineConfig({
  output: 'server',
  adapter: awsAmplify(),
});
