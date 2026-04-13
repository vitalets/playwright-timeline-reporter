/**
 * Worker-lanes algorithm: distributes Playwright test timings into visual timeline lanes.
 *
 * See README.md for the full algorithm description and rationale.
 */
import { TestTimings } from '../../../../test-timings/types.js';
import { WorkerLanesDebug } from './debug.js';
import {
  analyzeParallelWorkers,
  type ParallelWorkersAnalysis,
} from './analyze-parallel-workers.js';
import { TestAssigner, type TestAssignerParams } from './test-assigner.js';

export class WorkerLanesByRestartDuration {
  private readonly analysis: ParallelWorkersAnalysis;
  private readonly sortedTests: TestTimings[];
  private readonly debug: WorkerLanesDebug;
  private readonly fullyParallel: boolean;

  constructor(
    tests: TestTimings[],
    { debug = false, fullyParallel = false }: { debug?: boolean; fullyParallel?: boolean } = {},
  ) {
    this.debug = new WorkerLanesDebug(debug);
    this.fullyParallel = fullyParallel;
    this.sortedTests = [...tests].sort((a, b) => a.startTime - b.startTime);
    this.analysis = analyzeParallelWorkers(this.sortedTests);
  }

  build(): { tests: TestTimings[] }[] {
    this.logAnalysisResults();
    const params = this.buildContext();
    const lanePool = this.analysis.lanePool.map((l) => l.clone());
    const result = new TestAssigner(this.sortedTests, lanePool, params).run();
    if (!result) {
      throw new Error(
        'WorkerLanes: failed to assign all tests — all candidate branches were discarded.',
      );
    }
    return result.filter((lane) => lane.tests.length > 0).map((lane) => ({ tests: lane.tests }));
  }

  private buildContext(): TestAssignerParams {
    return {
      lastTestInWorker: this.analysis.lastTestInWorker,
      maxParallelWorkers: this.analysis.maxParallelWorkers,
      fullyParallel: this.fullyParallel,
      maxParallelWorkersPerProject: this.analysis.maxParallelWorkersPerProject,
      debug: this.debug,
    };
  }

  private logAnalysisResults() {
    this.debug.logAnalysisSummary(
      this.analysis.maxParallelWorkers,
      this.analysis.maxParallelWorkersPerProject,
    );
  }
}
