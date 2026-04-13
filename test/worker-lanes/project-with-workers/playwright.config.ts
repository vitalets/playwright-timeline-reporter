import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  workers: 3,
  reporter: [['../reporter.ts', { debug: true }]],
  projects: [
    {
      name: 'p1',
      testMatch: 'spec1.spec.ts',
    },
    {
      name: 'p2',
      testMatch: 'spec2.spec.ts',
      workers: 1, // <-- set workers for project
      dependencies: ['p1'],
    },
    {
      name: 'p3',
      testMatch: 'spec1.spec.ts',
      dependencies: ['p2'],
    },
  ],
});
