/**
 * Branch selection: rank surviving branches by restart-gaps variability and tie-break metrics.
 */
import { TestTimings } from '../../../../test-timings/types.js';
import { WorkerLane } from './lane.js';

export type BranchMetrics = {
  /** Number of same-project worker restarts in this branch's lane assignment. */
  restartGapsCount: number;
  restartGapsVariability: number;
  restartGapsSum: number;
  splitFilesCount: number;
};

type PickBestBranchOptions = {
  fullyParallel?: boolean;
};

/**
 * Given multiple fully-assigned lane snapshots (each a valid solution), pick the best one.
 *
 * The selection strategy depends on `maxRestartGapsCount` — the maximum in-project restart
 * count across all surviving branches:
 *
 *  - `>= 2` → `pickByRestartGapsVariability`: restrict to branches that share the maximum restart
 *    count, then rank by restart-gaps variability. Comparing only branches at the same
 *    restart count ensures the variability scores are on equal footing — a branch with fewer
 *    restarts would trivially score lower variance, not because it is a better assignment but
 *    because it has fewer data points.
 *
 *  - `<= 1` → `pickByHeuristic`: there are not enough restart gaps for
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
  const maxRestartGapsCount = Math.max(...branches.map((b) => b.restartGapsCount));
  if (maxRestartGapsCount >= 2) {
    return pickByRestartGapsVariability(branches, maxRestartGapsCount);
  } else {
    return pickByHeuristic(branches, fullyParallel);
  }
}

/**
 * Narrow to branches that share the maximum in-project restart count, then pick the one
 * with the lowest restart-gaps variability. Only branches with the same restart count
 * are compared — their restart-gap arrays have equal length, so their variability scores
 * reflect assignment quality rather than data quantity.
 *
 * Selection is by variability alone. A tie in variability should not occur in practice
 * (two distinct lane assignments almost never produce identical gap distributions), so the
 * first candidate is kept as-is when it does.
 */
function pickByRestartGapsVariability(
  branches: BranchMetrics[],
  maxRestartGapsCount: number,
): number {
  const candidates = branches
    .map((metrics, index) => ({ metrics, index }))
    .filter(({ metrics }) => metrics.restartGapsCount === maxRestartGapsCount);
  let best = candidates[0];
  for (let i = 1; i < candidates.length; i++) {
    if (candidates[i].metrics.restartGapsVariability < best.metrics.restartGapsVariability) {
      best = candidates[i];
    }
  }
  return best.index;
}

/**
 * Heuristic fallback used when maxRestartGapsCount <= 1. There are not enough restart gaps
 * for restart-gaps distribution analysis — a single gap always yields variance = 0
 * regardless of its duration. Pick by simpler metrics over all branches instead.
 */
function pickByHeuristic(branches: BranchMetrics[], fullyParallel: boolean): number {
  let bestIndex = 0;
  for (let i = 1; i < branches.length; i++) {
    if (compareByHeuristic(branches[i], branches[bestIndex], fullyParallel) < 0) {
      bestIndex = i;
    }
  }
  return bestIndex;
}

export function getBranchMetrics(lanes: WorkerLane[]): BranchMetrics {
  return {
    restartGapsCount: countRestartGaps(lanes),
    restartGapsVariability: getRestartGapsVariability(lanes),
    restartGapsSum: getRestartGapsSum(lanes),
    splitFilesCount: getSplitFilesCount(lanes),
  };
}

/**
 * Returns restart-gaps variability across all restart gaps, or only across the
 * last `windowSize` gaps per project when a pruning window is provided.
 */
export function getRestartGapsVariability(lanes: WorkerLane[], windowSize?: number): number {
  const gapsByProject = new Map<string, number[]>();
  for (const lane of lanes) {
    collectRestartGaps(lane.tests, gapsByProject);
  }
  return getRestartGapsVariabilityFromGaps(gapsByProject, windowSize);
}

export function getRestartGapsSum(lanes: WorkerLane[]): number {
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
    if (isRestartGap(lane.tests[i - 1], lane.tests[i])) count++;
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
    if (!isRestartGap(prev, curr)) continue;
    const gap = curr.startTime - (prev.startTime + prev.totalDuration);
    const gaps = gapsByProject.get(curr.projectName) ?? [];
    gaps.push(gap);
    gapsByProject.set(curr.projectName, gaps);
    totalDuration += gap;
  }
  return totalDuration;
}

/** Returns true when two consecutive lane tests represent a same-project worker restart. */
function isRestartGap(prev: TestTimings, curr: TestTimings): boolean {
  return prev.projectName === curr.projectName && prev.workerIndex !== curr.workerIndex;
  // return prev.workerIndex !== curr.workerIndex;
}

function getRestartGapsVariabilityFromGaps(
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
 * Used when maxRestartGapsCount <= 1 — a single restart gap always yields variance = 0
 * regardless of its duration, so variability cannot distinguish branches.
 *
 * In non-fully-parallel mode, branches where every file stays on a single lane
 * (splitFilesCount === 0) are strongly preferred over those with any splits, because
 * non-fully-parallel suites assign an entire file to one worker. After that binary
 * split-files gate, branches are ranked by total restart-gaps duration, and split
 * count is used only as a final tie-breaker.
 */
function compareByHeuristic(a: BranchMetrics, b: BranchMetrics, fullyParallel: boolean): number {
  return (
    (!fullyParallel && preferNoSplitFiles(a, b)) ||
    preferLowerRestartGapsSum(a, b) ||
    preferLowerSplitFilesCount(a, b)
  );
}

/** Prefer branches with zero split files over those with any splits (binary, not numeric). */
function preferNoSplitFiles(a: BranchMetrics, b: BranchMetrics): number {
  const aHasNoSplitFiles = a.splitFilesCount === 0;
  const bHasNoSplitFiles = b.splitFilesCount === 0;
  if (aHasNoSplitFiles === bHasNoSplitFiles) return 0;
  return aHasNoSplitFiles ? -1 : 1;
}

function preferLowerRestartGapsSum(a: BranchMetrics, b: BranchMetrics): number {
  return a.restartGapsSum - b.restartGapsSum;
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
