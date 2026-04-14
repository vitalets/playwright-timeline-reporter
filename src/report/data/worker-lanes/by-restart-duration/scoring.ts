/**
 * Branch selection: rank surviving branches by restart-duration variability and tie-break metrics.
 */
import { TestTimings } from '../../../../test-timings/types.js';
import { WorkerLane } from './lane.js';

export type BranchMetrics = {
  /** Number of same-project worker restarts in this branch's lane assignment. */
  inProjectRestarts: number;
  restartDurationVariability: number;
  totalRestartDuration: number;
  splitFilesCount: number;
};

type PickBestBranchOptions = {
  fullyParallel?: boolean;
};

/**
 * Given multiple fully-assigned lane snapshots (each a valid solution), pick the best one.
 *
 * The selection strategy depends on `maxInProjectRestarts` — the maximum in-project restart
 * count across all surviving branches:
 *
 *  - `>= 2` → `pickByVariabilityStrategy`: restrict to branches that share the maximum restart
 *    count, then rank by restart-duration variability. Comparing only branches at the same
 *    restart count ensures the variability scores are on equal footing — a branch with fewer
 *    restarts would trivially score lower variance, not because it is a better assignment but
 *    because it has fewer data points.
 *
 *  - `<= 1` → `pickByRestartDurationHeuristic`: there are not enough restart gaps for
 *    distribution analysis (population variance needs at least 2 data points). Fall back
 *    to a simpler heuristic over all branches.
 *
 * A "same-project restart gap" is the idle time between two consecutive tests in the same
 * lane that share a project but have different workerIndexes (worker was restarted, typically
 * after a failure). Cross-project transitions are excluded because another project can have
 * its own worker limit, so large gaps there are expected and are not useful for lane selection.
 */
export function pickBestBranchIndex(
  branches: BranchMetrics[],
  { fullyParallel = false }: PickBestBranchOptions = {},
) {
  const maxInProjectRestarts = Math.max(...branches.map((b) => b.inProjectRestarts));
  if (maxInProjectRestarts >= 2) {
    return pickByRestartGapsVariability(branches, maxInProjectRestarts);
  } else {
    return pickByHeuristic(branches, fullyParallel);
  }
}

/**
 * Narrow to branches that share the maximum in-project restart count, then pick the one
 * with the lowest restart-duration variability. Only branches with the same restart count
 * are compared — their restart-gap arrays have equal length, so their variability scores
 * reflect assignment quality rather than data quantity.
 *
 * Selection is by variability alone. A tie in variability should not occur in practice
 * (two distinct lane assignments almost never produce identical gap distributions), so the
 * first candidate is kept as-is when it does.
 */
function pickByRestartGapsVariability(
  branches: BranchMetrics[],
  maxInProjectRestarts: number,
): number {
  const candidates = branches
    .map((metrics, index) => ({ metrics, index }))
    .filter(({ metrics }) => metrics.inProjectRestarts === maxInProjectRestarts);
  let best = candidates[0];
  for (let i = 1; i < candidates.length; i++) {
    if (
      candidates[i].metrics.restartDurationVariability < best.metrics.restartDurationVariability
    ) {
      best = candidates[i];
    }
  }
  return best.index;
}

/**
 * Heuristic fallback used when maxInProjectRestarts <= 1. There are not enough restart gaps
 * for restart-duration distribution analysis — a single gap always yields variance = 0
 * regardless of its duration. Pick by simpler metrics over all branches instead.
 */
function pickByHeuristic(branches: BranchMetrics[], fullyParallel: boolean): number {
  let bestIndex = 0;
  for (let i = 1; i < branches.length; i++) {
    if (compareByRestartDurationStrategy(branches[i], branches[bestIndex], fullyParallel) < 0) {
      bestIndex = i;
    }
  }
  return bestIndex;
}

export function getBranchMetrics(lanes: WorkerLane[]): BranchMetrics {
  return {
    inProjectRestarts: countRestartGaps(lanes),
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
 * Count same-project worker-restart gap events across all lanes in a branch.
 * Each event is a consecutive test pair in the same lane that share a project
 * but have different workerIndexes — i.e. the worker was restarted between them.
 */
export function countRestartGaps(lanes: WorkerLane[]): number {
  return lanes.reduce((sum, lane) => sum + countLaneRestartGaps(lane), 0);
}

function countLaneRestartGaps(lane: WorkerLane): number {
  let count = 0;
  for (let i = 1; i < lane.tests.length; i++) {
    const prev = lane.tests[i - 1];
    const curr = lane.tests[i];
    if (prev.projectName === curr.projectName && prev.workerIndex !== curr.workerIndex) count++;
  }
  return count;
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

/**
 * Fallback strategy: rank by restart duration only, skipping variability.
 * Used when maxInProjectRestarts <= 1 — a single restart gap always yields variance = 0
 * regardless of its duration, so variability cannot distinguish branches.
 */
function compareByRestartDurationStrategy(
  a: BranchMetrics,
  b: BranchMetrics,
  fullyParallel: boolean,
): number {
  return (
    preferNoSplitFilesInNonFullyParallelRun(a, b, fullyParallel) ||
    preferLowerTotalRestartDuration(a, b) ||
    preferLowerSplitFilesCount(a, b)
  );
}

function preferNoSplitFilesInNonFullyParallelRun(
  a: BranchMetrics,
  b: BranchMetrics,
  fullyParallel: boolean,
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
