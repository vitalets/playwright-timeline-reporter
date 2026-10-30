import { test as base, expect } from '@playwright/test';
import { setTimeout } from 'node:timers/promises';

const test = base.extend<{}, { workerSetting: number }>({
  workerSetting: [0, { scope: 'worker', option: true }],
});

test('passing attempt', async () => {
  await setTimeout(100);
});

test('second passing attempt in the same worker', async () => {
  await setTimeout(100);
});

test('retry attempt', async ({}, testInfo) => {
  await setTimeout(100);
  expect(testInfo.retry).toBe(2);
});

test('passing attempt after successful retry', async () => {
  await setTimeout(100);
});

test('expected failure attempt', async () => {
  test.fail();
  await setTimeout(100);
  expect(1).toBe(2);
});

test.skip('skipped attempt', async () => {});

// Different worker-scoped options force restarts even when all tests pass.
for (const workerSetting of [1, 2]) {
  const workerTest = base.extend<{}, { workerSetting: number }>({
    workerSetting: [workerSetting, { scope: 'worker', option: true }],
  });

  for (const index of [1, 2]) {
    workerTest(
      `worker ${workerSetting} passing attempt ${index}`,
      async ({ workerSetting: actual }) => {
        expect(actual).toBe(workerSetting);
        await setTimeout(100);
      },
    );
  }
}
