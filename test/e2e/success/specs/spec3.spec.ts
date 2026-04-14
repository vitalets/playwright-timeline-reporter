import { test } from '@playwright/test';
import { setTimeout } from 'node:timers/promises';

test('test 1', async () => {
  await setTimeout(300);
});

test('test 2', async () => {
  await setTimeout(100);
});
