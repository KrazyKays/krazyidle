import { defineConfig } from 'vitest/config';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

// base relative : fonctionne sur https://<user>.github.io/<repo>/ comme en local
export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  build: { target: 'es2020', outDir: 'dist', assetsInlineLimit: 0 },
  test: { environment: 'node' },
});
