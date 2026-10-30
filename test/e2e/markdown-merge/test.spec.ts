import { test } from '@playwright/test';
import { setTimeout } from 'node:timers/promises';

for (let index = 1; index <= 4; index++) {
  test(`attempt ${index}`, async () => {
    await setTimeout(10);
  });
}
