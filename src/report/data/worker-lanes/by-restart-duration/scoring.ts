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

type PickBestBranchOptions = {
  fullyParallel?: boolean;
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
 * 1. If the run is not fully parallel, prefer a branch where every test file stays
 *    within a single lane for its project.
 * 2. Then prefer the branch with the lowest total same-project restart duration.
 */
export function pickBestBranch(
  results: WorkerLane[][],
  { fullyParallel = false }: PickBestBranchOptions = {},
): WorkerLane[] {
  let bestResult = results[0];
  let bestMetrics = getBranchMetrics(results[0]);
  for (let i = 1; i < results.length; i++) {
    const metrics = getBranchMetrics(results[i]);
    if (compareBranchMetrics(metrics, bestMetrics, { fullyParallel }) < 0) {
      bestMetrics = metrics;
      bestResult = results[i];
    }
  }
  return bestResult;
}

function getBranchMetrics(lanes: WorkerLane[]): BranchMetrics {
  return {
    restartDurationVariability: getRestartDurationVariability(lanes),
    totalRestartDuration: getTotalRestartDuration(lanes),
    splitFilesCount: getSplitFilesCount(lanes),
  };
}

/**
 * Returns restart-duration variability across all restart gaps, or only across the
 * last `windowSize` gaps per project when a pruning window is provided.
 */
export function getRestartDurationVariability(lanes: WorkerLane[], windowSize?: number): number {
  const gapsByProject = new Map<string, number[]>();
  for (const lane of lanes) {
    collectRestartGaps(lane.tests, gapsByProject);
  }
  return getRestartDurationVariabilityFromGaps(gapsByProject, windowSize);
}

export function getTotalRestartDuration(lanes: WorkerLane[]): number {
  const gapsByProject = new Map<string, number[]>();
  let total = 0;
  for (const lane of lanes) {
    total += collectRestartGaps(lane.tests, gapsByProject);
  }
  return total;
}

export function getSplitFilesCount(lanes: WorkerLane[]): number {
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

function getRestartDurationVariabilityFromGaps(
  gapsByProject: Map<string, number[]>,
  windowSize?: number,
): number {
  let total = 0;
  for (const gaps of gapsByProject.values()) {
    total += populationVariance(windowSize === undefined ? gaps : gaps.slice(-windowSize));
  }
  return total;
}

function compareBranchMetrics(
  a: BranchMetrics,
  b: BranchMetrics,
  { fullyParallel }: PickBestBranchOptions,
): number {
  return (
    preferLowerRestartDurationVariability(a, b) ||
    preferNoSplitFilesInNonFullyParallelRun(a, b, { fullyParallel }) ||
    preferLowerTotalRestartDuration(a, b) ||
    preferLowerSplitFilesCount(a, b)
  );
}

function preferLowerRestartDurationVariability(a: BranchMetrics, b: BranchMetrics): number {
  return a.restartDurationVariability - b.restartDurationVariability;
}

function preferNoSplitFilesInNonFullyParallelRun(
  a: BranchMetrics,
  b: BranchMetrics,
  { fullyParallel }: PickBestBranchOptions,
): number {
  if (fullyParallel) return 0;

  const aHasNoSplitFiles = a.splitFilesCount === 0;
  const bHasNoSplitFiles = b.splitFilesCount === 0;
  if (aHasNoSplitFiles === bHasNoSplitFiles) return 0;
  return aHasNoSplitFiles ? -1 : 1;
}

function preferLowerTotalRestartDuration(a: BranchMetrics, b: BranchMetrics): number {
  return a.totalRestartDuration - b.totalRestartDuration;
}

function preferLowerSplitFilesCount(a: BranchMetrics, b: BranchMetrics): number {
  return a.splitFilesCount - b.splitFilesCount;
}

/** Population variance: Σ(x − mean)² / n. Returns 0 for fewer than 2 values. */
function populationVariance(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  return values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
}
