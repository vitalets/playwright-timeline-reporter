/**
 * Playwright config for generating shard-specific dev data with an intentionally uneven split.
 */
import path from 'node:path';
import { defineConfig } from '@playwright/test';

// Uncomment after moving to ESM
// import { fileURLToPath } from 'url';
// const projectRoot = fileURLToPath(new URL('../../', import.meta.url));
const projectRoot = path.resolve(__dirname, '../../');

// disable the removal of the blob report directory for shard runs
process.env.PWTEST_BLOB_DO_NOT_REMOVE = '1';

export default defineConfig({
  testDir: `${projectRoot}/example/tests`,
  workers: 3,
  reporter: [
    process.argv.includes('merge-reports')
      ? [
          `${projectRoot}/src/reporter.ts`,
          {
            outputFile: `${projectRoot}/src/report/with-shards.tpl.html`,
          },
        ]
      : [
          'blob',
          {
            outputDir: `${projectRoot}/dev-data/shards/blob-report`,
          },
        ],
  ],
  use: {
    baseURL: 'https://playwright.dev/',
  },
  projects: [
    {
      name: 'project 1',
    },
    {
      name: 'project 2',
      // to emulate not equal distribution of tests across shards
      testIgnore: ['**/docs.spec.ts', '**/landing.spec.ts'],
    },
  ],
});
