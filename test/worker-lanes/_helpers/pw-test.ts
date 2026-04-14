/**
 * Helpers used inside Playwright tests.
 */
import { test, TestInfo } from '@playwright/test';
import path from 'node:path';

export { test };

export async function testBody(testInfo: TestInfo, delay: number, error?: string) {
  await new Promise((resolve) => setTimeout(resolve, delay));
  if (error || process.env.FAIL_TEST?.includes(buildTestTitle(testInfo))) {
    throw new Error(error || `error`);
  }
}

function buildTestTitle(testInfo: TestInfo) {
  const projectName = testInfo.project.name;
  const file = path.basename(testInfo.file).replace(/\..*$/, '');
  // slice(1) because it starts with test file, not project (compared to reporter API).
  const titlePath = testInfo.titlePath.slice(1);
  return [projectName, file, ...titlePath].filter(Boolean).join(' ');
}
