import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

/**
 * Test configuration. It EXTENDS vite.config.js (so tests compile the
 * same way the app does) rather than editing it.
 *
 *   jsdom      a pretend browser, so React components can render
 *   setupFiles runs before every test file (src/test/setup.js)
 *   include    tests live in src/__tests__/
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.js'],
      include: ['src/__tests__/**/*.test.{js,jsx}']
    }
  })
);