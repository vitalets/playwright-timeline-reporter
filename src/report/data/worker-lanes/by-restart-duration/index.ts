/**
 * Worker-lanes algorithm: distributes Playwright test timings into visual timeline lanes.
 *
 * See README.md for the full algorithm description and rationale.
 */
import { TestTimings } from '../../../../test-timings/types.js';
import { debug } from './debug.js';
import {
  analyzeParallelWorkers,
  type ParallelWorkersAnalysis,
} from './analyze-parallel-workers.js';
import { TestAssigner, type AssignContext } from './test-assigner.js';

export class WorkerLanesByRestartDuration {
  private readonly analysis: ParallelWorkersAnalysis;
  private readonly sortedTests: TestTimings[];
  private readonly debug: boolean;
  private readonly fullyParallel: boolean;

  constructor(
    tests: TestTimings[],
    { debug = false, fullyParallel = false }: { debug?: boolean; fullyParallel?: boolean } = {},
  ) {
    this.debug = debug;
    this.fullyParallel = fullyParallel;
    this.sortedTests = [...tests].sort((a, b) => a.startTime - b.startTime);
    this.analysis = analyzeParallelWorkers(this.sortedTests);
  }

  build(): { tests: TestTimings[] }[] {
    this.logAnalysisResults();
    const ctx = this.buildContext();
    const lanePool = this.analysis.lanePool.map((l) => l.clone());
    const result = new TestAssigner(this.sortedTests, lanePool, ctx).run();
    if (!result) {
      throw new Error(
        'WorkerLanes: failed to assign all tests — all candidate branches were discarded.',
      );
    }
    return result.filter((lane) => lane.tests.length > 0).map((lane) => ({ tests: lane.tests }));
  }

  private buildContext(): AssignContext {
    const restartsCountUntilPruningBranches = 3;
    // If all workers become candidates at some decision point, keep enough branches
    // to repeat that full candidate fan-out across several restart windows and still
    // have a chance to converge on the best branch.
    const maxBranches = restartsCountUntilPruningBranches * this.analysis.maxParallelWorkers;
    return {
      lastTestInWorker: this.analysis.lastTestInWorker,
      maxParallelWorkers: this.analysis.maxParallelWorkers,
      fullyParallel: this.fullyParallel,
      maxParallelWorkersPerProject: this.analysis.maxParallelWorkersPerProject,
      maxBranches,
      restartsCountUntilPruningBranches,
      log: (...args: unknown[]) => this.log(...args),
    };
  }

  private log(...args: unknown[]) {
    if (this.debug) debug(...args);
  }

  private logAnalysisResults() {
    if (!this.debug) return;
    this.log(`maxParallelWorkers: ${this.analysis.maxParallelWorkers}`);
    const ppStr = JSON.stringify(Object.fromEntries(this.analysis.maxParallelWorkersPerProject));
    this.log(`maxParallelWorkersPerProject: ${ppStr}`);
  }
}
