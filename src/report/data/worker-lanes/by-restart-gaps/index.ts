/**
 * Worker-lanes algorithm: distributes Playwright test timings into visual timeline lanes.
 *
 * See README.md for the full algorithm description and rationale.
 */
import { TestTimings } from '../../../../test-timings/types.js';
import { WorkerLanesDebug } from './debug.js';
import { analyzeParallelWorkers, type ParallelWorkersAnalysis } from './analyze-workers.js';
import { TestAssigner, type TestAssignerParams } from './test-assigner.js';

type WorkerLanesByRestartGapsOptions = {
  debug?: boolean;
  fullyParallel?: boolean;
};

export class WorkerLanesByRestartGaps {
  private readonly analysis: ParallelWorkersAnalysis;
  private readonly sortedTests: TestTimings[];
  private readonly debug: WorkerLanesDebug;
  private readonly fullyParallel: boolean;

  constructor(
    tests: TestTimings[],
    { debug = false, fullyParallel = false }: WorkerLanesByRestartGapsOptions,
  ) {
    this.debug = new WorkerLanesDebug(debug);
    this.fullyParallel = fullyParallel;
    this.sortedTests = [...tests].sort((a, b) => a.startTime - b.startTime);
    this.analysis = analyzeParallelWorkers(this.sortedTests);
  }

  build(): { tests: TestTimings[] }[] {
    this.logAnalysisResults();
    const result = this.runTestAssignerWithRetry();
    if (!result) {
      throw new Error(
        'WorkerLanes: failed to assign all tests — all candidate branches were discarded.',
      );
    }
    return result.filter((lane) => lane.tests.length > 0).map((lane) => ({ tests: lane.tests }));
  }

  private runTestAssignerWithRetry() {
    const lanePool = this.analysis.lanePool.map((l) => l.clone());
    const params = this.buildTestAssignerParams();
    let result = new TestAssigner(this.sortedTests, lanePool, params).run();

    if (!result) {
      result = new TestAssigner(this.sortedTests, lanePool, {
        ...params,
        allowAttachToPassedTest: true,
      }).run();
    }

    return result;
  }

  private buildTestAssignerParams(): TestAssignerParams {
    return {
      lastTestInWorker: this.analysis.lastTestInWorker,
      maxParallelWorkers: this.analysis.maxParallelWorkers,
      fullyParallel: this.fullyParallel,
      maxParallelWorkersPerProject: this.analysis.maxParallelWorkersPerProject,
      debug: this.debug,
      allowAttachToPassedTest: false,
    };
  }

  private logAnalysisResults() {
    this.debug.logAnalysisSummary(
      this.analysis.maxParallelWorkers,
      this.analysis.maxParallelWorkersPerProject,
    );
  }
}
