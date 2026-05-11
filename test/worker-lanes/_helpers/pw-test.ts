/**
 * Helpers used inside Playwright tests.
 */
import { test, TestInfo } from '@playwright/test';
import path from 'node:path';

export { test };

/**
 * Test body that derives delay and pass/fail from the test name.
 * Name format: "test N" (succeeds) or "fail N" (throws), where N is the delay in ms.
 * The optional `error` argument overrides the name-based fail/pass logic when provided.
 */
export async function testBody(testInfo: TestInfo, error?: string) {
  const title = testInfo.title;
  const delay = Number(title.match(/\d+/)?.[0] ?? 0);
  await new Promise((resolve) => setTimeout(resolve, delay));
  const shouldFail = error !== undefined ? Boolean(error) : title.includes('fail');
  if (shouldFail || process.env.FAIL_TEST?.includes(buildTestTitle(testInfo))) {
    throw new Error(error || 'error');
  }
}

function buildTestTitle(testInfo: TestInfo) {
  const projectName = testInfo.project.name;
  const file = path.basename(testInfo.file).replace(/\..*$/, '');
  // slice(1) because it starts with test file, not project (compared to reporter API).
  const titlePath = testInfo.titlePath.slice(1);
  return [projectName, file, ...titlePath].filter(Boolean).join(' ');
}
