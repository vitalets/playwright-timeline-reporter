/**
 * Worker-lanes algorithm: distributes Playwright test timings into visual timeline lanes.
 *
 * See README.md for the full algorithm description and rationale.
 */
import { TestTimings } from '../../../test-timings/types.js';
import { analyzeMarkers, type MarkerAnalysisResult } from './marker-analysis.js';
import { TestAssigner, type AssignContext } from './assign-test.js';
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
    const result = new TestAssigner(this.sortedTests, lanePool, ctx).assign();
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
