import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  workers: 3,
  reporter: [['../../../dist/index.js']],
  projects: [
    {
      name: 'project1',
    },
    {
      name: 'project2',
      workers: 1,
      dependencies: ['project1'],
    },
    {
      name: 'project3',
      dependencies: ['project2'],
    },
  ],
});
