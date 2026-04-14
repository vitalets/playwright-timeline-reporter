import { test } from '@playwright/test';
import { setTimeout } from 'node:timers/promises';

test('test 1', async () => {
  await setTimeout(100);
});

test('test 2', async () => {
  await setTimeout(200);
  // throw new Error('Test error');
});

test('test 3', async () => {
  await setTimeout(400);
});
