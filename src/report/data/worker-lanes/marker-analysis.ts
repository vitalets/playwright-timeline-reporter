/**
 * Phase 1: scan test timings to derive peak concurrency limits and pre-create lane pool.
 */
import { TestTimings } from '../../../test-timings/types.js';
import { WorkerLane } from './lane.js';

/** Shared result produced by Phase 1 and consumed by Phase 2. */
export type MarkerAnalysisResult = {
  /** Global peak concurrency observed across all tests in the run. */
  maxParallelWorkers: number;
  /** Per-project peak concurrency, used by the lane consolidation rule in Phase 2. */
  maxParallelWorkersPerProject: Map<string, number>;
  /**
   * The last TestTimings for each distinct workerIndex (in startTime order).
   * A lane is eligible for reuse only if its last test is in this set,
   * meaning its worker has no further tests scheduled.
   */
  lastTestInWorker: Set<TestTimings>;
  /** Pre-created pool of empty lanes — one slot per maxParallelWorkers. */
  lanePool: WorkerLane[];
};

/**
 * Analyse timing markers from `sortedTests` (pre-sorted by startTime) and return
 * the peak concurrency data and pre-created lane pool for Phase 2.
 */
export function analyzeMarkers(sortedTests: TestTimings[]): MarkerAnalysisResult {
  const markers = buildSortedMarkers(sortedTests);
  const peaks = walkMarkers(markers);
  const lastTestInWorker = buildLastTestInWorker(sortedTests);
  const lanePool = Array.from({ length: peaks.maxParallelWorkers }, () => new WorkerLane());
  return { ...peaks, lastTestInWorker, lanePool };
}

// ─── Internal types ────────────────────────────────────────────────────────────

type Marker = {
  type: 'start' | 'end';
  time: number;
  parallelIndex: number;
  projectName: string;
};

type PeakResult = {
  maxParallelWorkers: number;
  maxParallelWorkersPerProject: Map<string, number>;
};

// ─── Marker construction ───────────────────────────────────────────────────────

/**
 * Emit a "start" and "end" marker per test, then sort them by time.
 *
 * Tie-breaking: "end" markers sort before "start" at the same timestamp.
 * Rationale: if test A ends at T=100 and test B starts at T=100, processing
 * "start" first would momentarily add B's parallelIndex while A's is still present,
 * making them look concurrent and inflating maxParallelWorkers. End-first ensures
 * non-overlapping boundary tests are never double-counted.
 */
function buildSortedMarkers(tests: TestTimings[]): Marker[] {
  const markers: Marker[] = [];
  for (const test of tests) {
    markers.push({
      type: 'start',
      time: test.startTime,
      parallelIndex: test.parallelIndex,
      projectName: test.projectName,
    });
    markers.push({
      type: 'end',
      time: test.startTime + test.totalDuration,
      parallelIndex: test.parallelIndex,
      projectName: test.projectName,
    });
  }
  markers.sort((a, b) => a.time - b.time || (a.type === 'end' ? -1 : 1));
  return markers;
}

// ─── Marker walk ───────────────────────────────────────────────────────────────

/**
 * Walk sorted markers while maintaining two parallel tracking structures:
 *   - globalActive: Set<parallelIndex> — all currently running tests across all projects.
 *   - projectActive: Map<project, Set<parallelIndex>> — per-project active workers.
 *
 * We need both because a project with workers:1 may only ever use parallelIndex=0
 * even while other projects concurrently use 0/1/2. The per-project peak is used
 * in Phase 2 (lane consolidation) to prevent a single-worker project from spreading.
 */
function walkMarkers(markers: Marker[]): PeakResult {
  const globalActive = new Set<number>();
  const projectActive = new Map<string, Set<number>>();
  let maxParallelWorkers = 0;
  const maxParallelWorkersPerProject = new Map<string, number>();
  for (const marker of markers) {
    updateActiveSets(marker, globalActive, projectActive);
    if (globalActive.size > maxParallelWorkers) maxParallelWorkers = globalActive.size;
    updateProjectPeak(marker.projectName, projectActive, maxParallelWorkersPerProject);
  }
  return { maxParallelWorkers: Math.max(maxParallelWorkers, 1), maxParallelWorkersPerProject };
}

function updateActiveSets(
  marker: Marker,
  globalActive: Set<number>,
  projectActive: Map<string, Set<number>>,
): void {
  let projSet = projectActive.get(marker.projectName);
  if (!projSet) {
    projSet = new Set();
    projectActive.set(marker.projectName, projSet);
  }
  if (marker.type === 'start') {
    globalActive.add(marker.parallelIndex);
    projSet.add(marker.parallelIndex);
  } else {
    globalActive.delete(marker.parallelIndex);
    projSet.delete(marker.parallelIndex);
  }
}

function updateProjectPeak(
  projectName: string,
  projectActive: Map<string, Set<number>>,
  peaks: Map<string, number>,
): void {
  const size = projectActive.get(projectName)?.size ?? 0;
  const current = peaks.get(projectName) ?? 0;
  if (size > current) peaks.set(projectName, size);
}

// ─── Last-test-in-worker set ───────────────────────────────────────────────────

/**
 * For each distinct workerIndex, find the last test in startTime order.
 * A lane is eligible for reuse only if its last test is in this set — meaning
 * the Playwright worker process owning that lane has no further tests to run.
 */
function buildLastTestInWorker(sortedTests: TestTimings[]): Set<TestTimings> {
  const lastInWorker = new Map<number, TestTimings>();
  for (const test of sortedTests) {
    lastInWorker.set(test.workerIndex, test);
  }
  return new Set(lastInWorker.values());
}
