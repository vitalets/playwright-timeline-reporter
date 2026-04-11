/**
 * Worker-lanes algorithm: distributes tests into visual timeline lanes.
 *
 * The algorithm runs in two phases per shard.
 *
 * ── Phase 1: Marker analysis (marker-analysis.ts) ───────────────────────────
 * Each test contributes a "start" and "end" timing marker. Markers are sorted by
 * time (end-before-start on ties, to avoid counting boundary moments as concurrent)
 * and walked with a running Set<parallelIndex>. This yields:
 *   - maxParallelWorkers      – global peak concurrency (hard cap for Phase 2)
 *   - maxParallelWorkersPerProject – per-project peak (used for lane consolidation)
 *   - lastTestInWorker        – last TestTimings per workerIndex; a lane is free
 *                               for reuse only when its last test is in this set
 *   - lanePool                – N empty WorkerLane slots pre-created upfront
 *
 * ── Phase 2: Backtracking assignment (assign.ts) ─────────────────────────────
 * Tests are processed in startTime order. For each test:
 *
 *   Step A – Same workerIndex:
 *     If any lane's last test shares the test's workerIndex, the test comes from
 *     the same Playwright worker process. Append it to that lane with no branching.
 *
 *   Step B – New workerIndex, candidates exist:
 *     Collect eligible lanes (worker done + idle + consolidation rule, see below).
 *     - 1 candidate → assign directly.
 *     - 2+ candidates → try each as a separate branch; collect all non-null results;
 *       pick the best-scoring survivor (see scoring.ts).
 *
 *   Step C – New workerIndex, no candidates:
 *     The test needs a fresh slot. If the number of currently active lanes already
 *     equals maxParallelWorkers, this branch would exceed the observed physical
 *     concurrency peak — discard it (return null).
 *     Otherwise claim the next empty lane from the pre-created pool.
 *
 * Lane consolidation rule (Step B):
 *     Count projectLanesUsed = distinct lanes already containing tests from this
 *     project. If projectLanesUsed >= maxParallelWorkersPerProject[project], restrict
 *     candidates to those existing project lanes. This prevents a project with
 *     workers:1 (where every failing test bumps workerIndex) from spreading across
 *     multiple lanes — all must funnel into the one established project lane.
 *
 * ── Branch scoring (scoring.ts) ──────────────────────────────────────────────
 * When multiple branches survive, each is scored by the sum of per-project
 * population variance of same-project worker-restart gaps. Lower variance = more
 * evenly spaced restarts = visually correct lane layout. The lowest-scoring branch
 * wins; ties go to the first in traversal order.
 */
import { TestTimings } from '../../../test-timings/types.js';
import { analyzeMarkers, type MarkerAnalysisResult } from './marker-analysis.js';
import { assignTests, type AssignContext } from './assign.js';
import { type WorkerLane } from './lane.js';
import { testRef } from './debug.js';

export class WorkerLanes {
  private readonly analysis: MarkerAnalysisResult;
  private readonly sortedTests: TestTimings[];
  private readonly debug: boolean;

  constructor(tests: TestTimings[], { debug = false }: { debug?: boolean } = {}) {
    this.debug = debug;
    this.sortedTests = [...tests].sort((a, b) => a.startTime - b.startTime);
    this.analysis = analyzeMarkers(this.sortedTests);
  }

  build(): { tests: TestTimings[] }[] {
    this.logPhase1Results();
    const ctx = this.buildContext();
    const lanePool = this.analysis.lanePool.map((l) => l.clone());
    const result = assignTests(this.sortedTests, lanePool, ctx);
    if (!result) {
      throw new Error('WorkerLanes2: failed to assign all tests — all branches were discarded.');
    }
    this.logFinalLanes(result);
    return result.map((lane) => ({ tests: lane.tests }));
  }

  private buildContext(): AssignContext {
    return {
      lastTestInWorker: this.analysis.lastTestInWorker,
      maxParallelWorkers: this.analysis.maxParallelWorkers,
      maxParallelWorkersPerProject: this.analysis.maxParallelWorkersPerProject,
      log: (...args: unknown[]) => this.log(...args),
    };
  }

  private log(...args: unknown[]) {
    if (this.debug) console.log('[workers2]', ...args);
  }

  private logPhase1Results() {
    if (!this.debug) return;
    this.log('=== INPUT TESTS ===');
    this.sortedTests.forEach((t, i) => this.log(`  [${i}] ${testRef(t)}`));
    this.log('=== PHASE 1 RESULTS ===');
    this.log(`  maxParallelWorkers: ${this.analysis.maxParallelWorkers}`);
    const ppStr = JSON.stringify(Object.fromEntries(this.analysis.maxParallelWorkersPerProject));
    this.log(`  maxParallelWorkersPerProject: ${ppStr}`);
    const idxs = [...this.analysis.lastTestInWorker]
      .map((t) => t.workerIndex)
      .sort((a, b) => a - b);
    this.log(`  lastTestInWorker (workerIndexes): [${idxs.join(', ')}]`);
    this.log('=== PHASE 2 ASSIGNMENT ===');
  }

  private logFinalLanes(lanes: WorkerLane[]) {
    if (!this.debug) return;
    this.log('=== FINAL LANES ===');
    lanes.forEach((lane, i) => {
      const tests = lane.tests.map((t) => testRef(t)).join(' → ');
      this.log(`  lane[${i}]: ${tests || '(empty)'}`);
    });
  }
}
