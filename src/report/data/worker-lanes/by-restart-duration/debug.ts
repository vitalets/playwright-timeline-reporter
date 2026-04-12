/**
 * Debug helpers for the worker-lanes backtracking algorithm.
 */
import { TestTimings } from '../../../../test-timings/types.js';

/**
 * Compact single-line representation of a test for debug output.
 * Format: W<workerIndex>/P<parallelIndex> <project> "<title>" [<status>] @<start>+<duration>ms
 */
export function testRef(t: TestTimings): string {
  const title = t.testBody.title.join(' > ');
  return [
    `W${t.workerIndex}/P${t.parallelIndex}`,
    t.projectName,
    `"${title}"`,
    `[${t.status}]`,
    `@${t.startTime}+${t.totalDuration}ms`,
  ].join(' ');
}

export function debug(...args: unknown[]) {
  console.log('[worker-lanes]', ...args);
}
