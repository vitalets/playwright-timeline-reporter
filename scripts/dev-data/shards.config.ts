/**
 * Playwright config for generating shard-specific dev data with an intentionally uneven split.
 */
import { fileURLToPath } from 'url';
import { defineConfig } from '@playwright/test';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

// disable the removal of the blob report directory for shard runs
process.env.PWTEST_BLOB_DO_NOT_REMOVE = '1';

export default defineConfig({
  testDir: `${projectRoot}/example/tests`,
  workers: 3,
  reporter: [
    ['dot'],
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
            outputDir: `${projectRoot}/scripts/dev-data/shards-blob-report`,
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
