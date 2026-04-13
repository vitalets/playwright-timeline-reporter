/**
 * Branch selection: rank surviving branches by restart-duration variability and tie-break metrics.
 */
import { TestTimings } from '../../../../test-timings/types.js';
import { WorkerLane } from './lane.js';

type BranchMetrics = {
  restartDurationVariability: number;
  totalRestartDuration: number;
  splitFilesCount: number;
};

/**
 * Given multiple fully-assigned lane snapshots (each a valid solution), pick the one
 * with the lowest restart-duration variability across projects.
 *
 * A "same-project restart gap" is the idle time between two consecutive tests in the
 * same lane that share a project but have different workerIndexes (worker was restarted,
 * typically after a failure). Cross-project transitions are excluded because another
 * project can have its own worker limit, so large gaps there are expected and are not
 * useful for lane selection.
 *
 * When restart-duration variability ties:
 * 1. Prefer a branch where every test file stays within a single lane for its project.
 * 2. Otherwise prefer the branch with the lowest total same-project restart duration.
 */
export function pickBestBranch(results: WorkerLane[][]): WorkerLane[] {
  let bestResult = results[0];
  let bestMetrics = getBranchMetrics(results[0]);
  for (let i = 1; i < results.length; i++) {
    const metrics = getBranchMetrics(results[i]);
    if (compareBranchMetrics(metrics, bestMetrics) < 0) {
      bestMetrics = metrics;
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
 * Used during branch pruning so that restart-duration variability stays sensitive to
 * recent branching decisions rather than diluted by the long shared history common to
 * all candidate branches.
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

function getBranchMetrics(lanes: WorkerLane[]): BranchMetrics {
  const gapsByProject = new Map<string, number[]>();
  let totalRestartDuration = 0;
  for (const lane of lanes) {
    totalRestartDuration += collectRestartGaps(lane.tests, gapsByProject);
  }
  return {
    restartDurationVariability: sumProjectVariances(gapsByProject),
    totalRestartDuration,
    splitFilesCount: countSplitFiles(lanes),
  };
}

/**
 * Append same-project restart gaps from `tests` into `gapsByProject`.
 * A gap is only recorded when consecutive tests in the same lane share a project
 * but differ in workerIndex — i.e. the worker was restarted between them.
 */
function collectRestartGaps(tests: TestTimings[], gapsByProject: Map<string, number[]>): number {
  let totalDuration = 0;
  for (let i = 1; i < tests.length; i++) {
    const prev = tests[i - 1];
    const curr = tests[i];
    if (prev.projectName !== curr.projectName) continue;
    if (prev.workerIndex === curr.workerIndex) continue;
    const gap = curr.startTime - (prev.startTime + prev.totalDuration);
    const gaps = gapsByProject.get(curr.projectName) ?? [];
    gaps.push(gap);
    gapsByProject.set(curr.projectName, gaps);
    totalDuration += gap;
  }
  return totalDuration;
}

function sumProjectVariances(gapsByProject: Map<string, number[]>): number {
  let total = 0;
  for (const gaps of gapsByProject.values()) {
    total += populationVariance(gaps);
  }
  return total;
}

function countSplitFiles(lanes: WorkerLane[]): number {
  const projectFiles = new Map<string, Map<string, Set<number>>>();
  lanes.forEach((lane, laneIndex) => {
    for (const test of lane.tests) {
      const file = test.testBody.location.file;
      const files = projectFiles.get(test.projectName) ?? new Map<string, Set<number>>();
      const laneIndexes = files.get(file) ?? new Set<number>();
      laneIndexes.add(laneIndex);
      files.set(file, laneIndexes);
      projectFiles.set(test.projectName, files);
    }
  });
  let splitFilesCount = 0;
  for (const files of projectFiles.values()) {
    for (const laneIndexes of files.values()) {
      if (laneIndexes.size > 1) splitFilesCount++;
    }
  }
  return splitFilesCount;
}

function compareBranchMetrics(a: BranchMetrics, b: BranchMetrics): number {
  if (a.restartDurationVariability !== b.restartDurationVariability) {
    return a.restartDurationVariability - b.restartDurationVariability;
  }

  const aHasNoSplitFiles = a.splitFilesCount === 0;
  const bHasNoSplitFiles = b.splitFilesCount === 0;
  if (aHasNoSplitFiles !== bHasNoSplitFiles) return aHasNoSplitFiles ? -1 : 1;

  if (a.totalRestartDuration !== b.totalRestartDuration) {
    return a.totalRestartDuration - b.totalRestartDuration;
  }

  return a.splitFilesCount - b.splitFilesCount;
}

/** Population variance: Σ(x − mean)² / n. Returns 0 for fewer than 2 values. */
function populationVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
}
