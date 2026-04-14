/**
 * Assign tests to lanes via iterative branch exploration.
 */
import { TestTimings } from '../../../../test-timings/types.js';
import { WorkerLane, cloneLanes } from './lane.js';
import { WorkerLanesDebug } from './debug.js';
import {
  countRestartGaps,
  getBranchMetrics,
  getRestartGapsVariability,
  pickBestBranchIndex,
} from './scoring.js';

/**
 * Number of most-recent restart gaps per project to use when ranking branches during pruning.
 * Using only recent gaps makes the pruning signal sensitive to the latest decisions instead
 * of being diluted by the long history of identical early gaps shared by all branches.
 * Pruning is also deferred until this many gaps have accumulated — before that the
 * restart-gaps variability signal is too weak to distinguish branches reliably.
 *
 * This constant also determines the branch budget via:
 * `maxBranches = RESTARTS_COUNT_UNTIL_PRUNING_BRANCHES * maxParallelWorkers`.
 */
const RESTARTS_COUNT_UNTIL_PRUNING_BRANCHES = 4;

/**
 * Minimum idle gap required to consider a worker restart physically plausible.
 * An effectively instant handoff is too short to represent a real worker restart,
 * so such lanes are excluded from restart candidates.
 */
const MIN_RESTART_GAP_MS = 50;

/** Parameters passed unchanged through the assignment loop. */
export type TestAssignerParams = {
  /** Set of tests that are the last test for their workerIndex in the run. */
  lastTestInWorker: Set<TestTimings>;
  /** Global peak concurrency — hard upper bound on simultaneous lanes. */
  maxParallelWorkers: number;
  /** Whether Playwright config enabled fully parallel mode for this run/shard. */
  fullyParallel: boolean;
  /** Per-project peak concurrency, used for lane consolidation. */
  maxParallelWorkersPerProject: Map<string, number>;
  /** Debug logger wrapper that handles enabled/disabled mode internally. */
  debug: WorkerLanesDebug;
};

/** A single partial lane-assignment branch tracked during search. */
type Branch = { lanes: WorkerLane[] };

/**
 * Assigns test timings to lanes via iterative branch exploration.
 *
 * For each test (in startTime order), every tracked branch is expanded into one or
 * more successor branches (one per candidate lane). After expansion the pool is pruned
 * back to `maxBranches` by recent restart-gaps variability — but only once enough
 * gaps have accumulated to make that signal meaningful.
 *
 * Returns the best-ranked lanes on completion, or null if all branches were discarded
 * (constraint violation — should not occur with valid input).
 */
export class TestAssigner {
  private branches: Branch[];
  private currentBranch: Branch | null = null;
  private currentTest: TestTimings | null = null;

  constructor(
    private readonly tests: TestTimings[],
    initialLanes: WorkerLane[],
    private readonly params: TestAssignerParams,
  ) {
    this.branches = [{ lanes: initialLanes }];
  }

  run(): WorkerLane[] | null {
    for (const test of this.tests) {
      this.currentTest = test;
      const nextBranches = this.expandCurrentTest();
      if (nextBranches.length === 0) return null;
      this.branches = this.pruneBranches(nextBranches);
    }
    const branches = this.branches.map((branch) => branch.lanes);
    const branchMetrics = branches.map((lanes) => getBranchMetrics(lanes));
    const bestBranchIndex = pickBestBranchIndex(branchMetrics, {
      fullyParallel: this.params.fullyParallel,
    });
    this.logFinalBranchDecision(branchMetrics, bestBranchIndex);
    return branches[bestBranchIndex];
  }

  // ─── Branch expansion ────────────────────────────────────────────────────────

  /**
   * Expand every active branch for the current test.
   *
   * Step A: if an existing lane already tracks this workerIndex, the test continues
   *   that worker — exactly one successor, no branching.
   * Step B/C: new workerIndex — branch into each eligible candidate lane or open a
   *   fresh slot from the pre-created pool.
   */
  private expandCurrentTest(): Branch[] {
    const nextBranches: Branch[] = [];
    for (const branch of this.branches) {
      this.currentBranch = branch;
      this.expandCurrentBranch(nextBranches);
    }
    return nextBranches;
  }

  /** Expand the current branch for a test whose expansion context is already set. */
  private expandCurrentBranch(out: Branch[]): void {
    const laneIdx = this.currentLanes.findIndex(
      (lane) => lane.lastWorkerIndex === this.test.workerIndex,
    );
    if (laneIdx >= 0) {
      const next = cloneLanes(this.currentLanes);
      next[laneIdx].tests.push(this.test);
      out.push({ lanes: next });
      return;
    }
    this.expandForNewWorker(out);
  }

  /** Expand the current branch for a test whose workerIndex has not been seen yet. */
  private expandForNewWorker(out: Branch[]): void {
    const candidates = this.getCandidateLanes();
    if (candidates.length === 0) {
      const freshBranch = this.tryFreshLane();
      if (freshBranch) out.push(freshBranch);
      return;
    }
    if (candidates.length > 1) {
      this.params.debug.logBranchFanOut(
        this.test,
        candidates,
        this.currentLanes,
        out.length + candidates.length,
      );
    }
    for (const candidate of candidates) {
      const next = cloneLanes(this.currentLanes);
      next[this.currentLanes.indexOf(candidate)].tests.push(this.test);
      out.push({ lanes: next });
    }
  }

  // ─── Branch pruning ─────────────────────────────────────────────────────────

  /**
   * Prune the branch pool to `maxBranches` branches.
   * Branches are ranked by getRestartGapsVariability with the pruning window
   * applied to the last gaps per project, so pruning decisions reflect the most
   * recent assignments rather than the long shared history.
   * Pruning is skipped until at least minWorkerRestartsBeforePruning gaps exist in any branch.
   */
  private pruneBranches(branches: Branch[]): Branch[] {
    if (branches.length <= this.maxBranches) return branches;
    const restartsCount = Math.max(...branches.map((branch) => countRestartGaps(branch.lanes)));
    if (restartsCount < RESTARTS_COUNT_UNTIL_PRUNING_BRANCHES) return branches;
    branches.sort(
      (a, b) =>
        getRestartGapsVariability(a.lanes, RESTARTS_COUNT_UNTIL_PRUNING_BRANCHES) -
        getRestartGapsVariability(b.lanes, RESTARTS_COUNT_UNTIL_PRUNING_BRANCHES),
    );
    const pruned = branches.slice(0, this.maxBranches);
    this.params.debug.logBranchesPruned(branches.length, pruned.length);
    return pruned;
  }

  // ─── Candidate lane collection ──────────────────────────────────────────────

  /** Collect lanes eligible to receive a test whose workerIndex has not been seen yet. */
  private getCandidateLanes(): WorkerLane[] {
    // Candidate lane must be idle, worker must be done, gap must be plausible,
    // and the lane must not have a passed test from the same project (otherwise why workerIndex changed?).
    let candidates = this.currentLanes.filter(
      (lane) =>
        lane.lastTest !== undefined &&
        this.params.lastTestInWorker.has(lane.lastTest) &&
        this.getRestartGap(lane) >= MIN_RESTART_GAP_MS &&
        !this.isSameProjectPassedLane(lane),
    );
    // Lane consolidation: if the project is already at its per-project lane ceiling,
    // restrict to lanes that already contain tests from this project. Prevents a project with
    // own workers limit from spreading across other lanes.
    const projectLanesUsed = this.currentLanes.filter((lane) =>
      lane.tests.some((laneTest) => laneTest.projectName === this.test.projectName),
    ).length;
    const maxForProject = this.params.maxParallelWorkersPerProject.get(this.test.projectName) ?? 1;
    if (projectLanesUsed >= maxForProject) {
      candidates = candidates.filter((lane) =>
        lane.tests.some((laneTest) => laneTest.projectName === this.test.projectName),
      );
    }
    // Switched-away exclusion: prefer lanes that have not switched away from this
    // project. Returning a project to a lane that already moved on would create an interleaved
    // sequence (project A - project B - project A). Fall back to all candidates if every one has switched away.
    const notSwitchedAway = candidates.filter((lane) => !this.hasSwitchedFromProject(lane));
    if (notSwitchedAway.length > 0) candidates = notSwitchedAway;
    candidates.sort((a, b) => a.lastTestEndTime - b.lastTestEndTime);

    return candidates;
  }

  private isSameProjectPassedLane(lane: WorkerLane): boolean {
    return (
      lane.lastTest?.projectName === this.test.projectName && lane.lastTest.status === 'passed'
    );
  }

  /** Returns true when the lane previously ran tests from the current project but its last
   *  test belongs to a different project — i.e. the lane has switched away from this project. */
  private hasSwitchedFromProject(lane: WorkerLane): boolean {
    if (lane.lastTest?.projectName === this.test.projectName) return false;
    return lane.tests.some((t) => t.projectName === this.test.projectName);
  }

  private getRestartGap(lane: WorkerLane): number {
    return this.test.startTime - lane.lastTestEndTime;
  }

  /**
   * No eligible candidate lanes — try opening a fresh slot from the pre-created pool.
   * Returns null (this branch is discarded) if opening a new slot would exceed
   * the peak concurrency observed during analysis.
   */
  private tryFreshLane(): Branch | null {
    const activeLanes = this.currentLanes.filter(
      (lane) => lane.lastTestEndTime > this.test.startTime,
    );
    if (activeLanes.length >= this.params.maxParallelWorkers) return null;
    const unusedLane = this.currentLanes.find((lane) => lane.tests.length === 0);
    if (!unusedLane) return null;
    const next = cloneLanes(this.currentLanes);
    next[this.currentLanes.indexOf(unusedLane)].tests.push(this.test);
    return { lanes: next };
  }

  private logFinalBranchDecision(
    branches: ReturnType<typeof getBranchMetrics>[],
    bestBranchIndex: number,
  ): void {
    this.params.debug.logFinalBranchScoring({
      fullyParallel: this.params.fullyParallel,
      branches,
      selectedIndex: bestBranchIndex,
    });
  }

  private get currentLanes(): WorkerLane[] {
    if (!this.currentBranch) throw new Error('TestAssigner: currentBranch is not set');
    return this.currentBranch.lanes;
  }

  private get maxBranches(): number {
    return RESTARTS_COUNT_UNTIL_PRUNING_BRANCHES * this.params.maxParallelWorkers;
  }

  private get test(): TestTimings {
    if (!this.currentTest) throw new Error('TestAssigner: currentTest is not set');
    return this.currentTest;
  }
}
