import { test } from '@playwright/test';
import { setTimeout } from 'node:timers/promises';

// test.describe.configure({ mode: 'parallel' });

test('test 1', async () => {
  await setTimeout(900);
  // throw new Error('Test error');
});

test('test 2', async ({}, testInfo) => {
  await setTimeout(100);
  // throw new Error('Test error');
  // if (testInfo.project.name === 'project2') {
  //   throw new Error('Test error');
  // }
});

test('test 3', async () => {
  await setTimeout(100);
  // throw new Error('Test error');
});
