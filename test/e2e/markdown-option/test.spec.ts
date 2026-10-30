import { test } from '@playwright/test';
import { setTimeout } from 'node:timers/promises';

test('passing attempt', async () => {
  await setTimeout(100);
});

test('another passing attempt', async () => {
  await setTimeout(100);
});
