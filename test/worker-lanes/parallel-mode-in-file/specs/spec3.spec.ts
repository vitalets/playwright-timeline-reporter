import { test } from '@playwright/test';
import { setTimeout } from 'node:timers/promises';

test('test 1', async () => {
  await setTimeout(600);
  throw new Error('Test error');
});
