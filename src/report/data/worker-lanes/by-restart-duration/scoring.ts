/**
 * Branch scoring: pick the surviving branch with the lowest same-project restart-gap variance.
 */
import { TestTimings } from '../../../../test-timings/types.js';
import { WorkerLane } from './lane.js';

/**
 * Given multiple fully-assigned lane snapshots (each a valid solution), pick the one
 * with the smallest sum of per-project restart-gap variance.
 *
 * A "same-project restart gap" is the idle time between two consecutive tests in the
 * same lane that share a project but have different workerIndexes (worker was restarted,
 * typically after a failure). Cross-project transitions are excluded because they include
 * browser/context setup overhead that inflates the gap artificially.
 */
export function pickBestBranch(results: WorkerLane[][]): WorkerLane[] {
  let bestResult = results[0];
  let bestScore = scoreBranch(results[0]);
  for (let i = 1; i < results.length; i++) {
    const score = scoreBranch(results[i]);
    if (score < bestScore) {
      bestScore = score;
      bestResult = results[i];
    }
  }
  return bestResult;
}

export function scoreBranch(lanes: WorkerLane[]): number {
  const gapsByProject = new Map<string, number[]>();
  for (const lane of lanes) {
    collectRestartGaps(lane.tests, gapsByProject);
  }
  let total = 0;
  for (const gaps of gapsByProject.values()) {
    total += populationVariance(gaps);
  }
  return total;
}

/**
 * Like scoreBranch but only considers the last `windowSize` restart gaps per project.
 * Used during beam pruning so that scoring is sensitive to recent branching decisions
 * rather than diluted by the long shared history common to all beams.
 */
export function scoreRecentBranch(lanes: WorkerLane[], windowSize: number): number {
  const gapsByProject = new Map<string, number[]>();
  for (const lane of lanes) {
    collectRestartGaps(lane.tests, gapsByProject);
  }
  let total = 0;
  for (const gaps of gapsByProject.values()) {
    total += populationVariance(gaps.slice(-windowSize));
  }
  return total;
}

/**
 * Append same-project restart gaps from `tests` into `gapsByProject`.
 * A gap is only recorded when consecutive tests in the same lane share a project
 * but differ in workerIndex — i.e. the worker was restarted between them.
 */
function collectRestartGaps(tests: TestTimings[], gapsByProject: Map<string, number[]>): void {
  for (let i = 1; i < tests.length; i++) {
    const prev = tests[i - 1];
    const curr = tests[i];
    if (prev.projectName !== curr.projectName) continue;
    if (prev.workerIndex === curr.workerIndex) continue;
    const gap = curr.startTime - (prev.startTime + prev.totalDuration);
    const gaps = gapsByProject.get(curr.projectName) ?? [];
    gaps.push(gap);
    gapsByProject.set(curr.projectName, gaps);
  }
}

/** Population variance: Σ(x − mean)² / n. Returns 0 for fewer than 2 values. */
function populationVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
}
