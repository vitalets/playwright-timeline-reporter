import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  workers: 2,
  projects: [
    {
      name: 'p1',
    },
    {
      name: 'p2',
      workers: 1, // <-- limit workers for project
      dependencies: ['p1'],
    },
    {
      name: 'p3',
      dependencies: ['p2'],
    },
  ],
});
