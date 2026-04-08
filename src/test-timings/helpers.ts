import path from 'node:path';
import type { TestResult, TestStep, Location } from '@playwright/test/reporter';

export function findBeforeHooksStep(result: TestResult) {
  // "Before Hooks" title is hardcoded.
  // See: https://github.com/microsoft/playwright/blob/v1.57.0/packages/playwright/src/worker/workerMain.ts#L372
  return result.steps.find((s) => s.category === 'hook' && s.title === 'Before Hooks');
}

export function findAfterHooksStep(result: TestResult) {
  // "After Hooks" title is hardcoded.
  // See: https://github.com/microsoft/playwright/blob/v1.57.0/packages/playwright/src/worker/workerMain.ts#L406
  return result.steps.find((s) => s.category === 'hook' && s.title === 'After Hooks');
}

export function findWorkerCleanupStep(result: TestResult) {
  // "Worker Cleanup" title is hardcoded.
  // See: https://github.com/microsoft/playwright/blob/v1.57.0/packages/playwright/src/worker/workerMain.ts#L459
  return result.steps.find((s) => s.category === 'hook' && s.title === 'Worker Cleanup');
}

export function stepsByCategory(root: TestStep | undefined, category: 'hook' | 'fixture') {
  return (root?.steps || []).filter((s) => s.category === category);
}

export function totalDuration(items: { duration: number }[]) {
  return items.reduce((sum, step) => sum + step.duration, 0);
}

export function minStartTime(steps: TestStep[]) {
  return Math.min(...steps.map((s) => s.startTime.getTime()));
}

/**
 * Converts Location to a string like "relative/path/to/file.ts:10:5"
 */
export function toLocationString(baseDir: string, location?: Location) {
  if (!location) return '';
  const { file, line, column } = location;
  const relPath = path.relative(baseDir, file);
  return `${relPath}:${line}:${column}`;
}

/**
 * Converts Location to an object with relative file path.
 */
export function toLocationObject(baseDir: string, location?: Location) {
  if (!location) return { file: '', line: 0, column: 0 };
  const { file, line, column } = location;
  const relPath = path.relative(baseDir, file);
  return { file: relPath, line, column };
}
