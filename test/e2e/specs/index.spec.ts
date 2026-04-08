import { test as base } from '@playwright/test';
import { setTimeout } from 'node:timers/promises';

const test = base.extend<{ testFixture1: void }>({
  testFixture1: async ({}, use) => {
    await setTimeout(100);
    await use();
    await setTimeout(200);
  },
});

test('test 1', async ({ testFixture1 }) => {
  await setTimeout(100);
});
