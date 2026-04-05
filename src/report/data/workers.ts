/**
 * Distribute tests into lanes based on worker lifecycle.
 */
import { TestTimings } from '../../test-timings/types.js';
import { ChartTest } from './tests.js';

export type WorkerData = {
  laneIndex: number;
  workerIndex: number; // worker index within the shard / merge report
  tests: ChartTest[];
  mergeReportId?: string;
};

export class WorkerLanes {
  private lanes: WorkerLane[] = [];
  private lastTestInWorker = new Set<TestTimings>();

  constructor(
    private tests: TestTimings[],
    private fullyParallel?: boolean,
  ) {
    this.sortTests();
    this.initLanes();
    this.initLastInWorker();
  }

  build() {
    let tests = [...this.tests];
    let test: TestTimings | undefined;
    while ((test = tests.shift())) {
      const lane = this.findLaneForTest(test);
      lane.tests.push(test);
      if (!this.fullyParallel) {
        // In non-fully-parallel mode, Playwright assigns the entire file to a worker,
        // so all tests from the same project+file belong to the same lane.
        const sameFileTests = this.getSameFileTests(tests, test);
        lane.tests.push(...sameFileTests);
        tests = tests.filter((t) => !sameFileTests.includes(t));
      }
    }
    return this.lanes.map((lane) => ({ tests: lane.tests }));
  }

  private findLaneForTest(test: TestTimings) {
    return this.findLaneByWorkerIndex(test) || this.findLaneForNewWorker(test);
  }

  private findLaneByWorkerIndex(test: TestTimings) {
    return this.lanes.find((lane) => lane.lastWorkerIndex === test.workerIndex);
  }

  private findLaneForNewWorker(test: TestTimings) {
    const candidates = this.lanes
      .filter((lane) => !lane.lastTest || this.lastTestInWorker.has(lane.lastTest))
      .filter((lane) => lane.lastTestEndTime <= test.startTime);

    if (candidates.length === 0) {
      throw new Error(`Could not find worker for test "${test.testBody.title}"`);
    }

    candidates.sort((a, b) => a.lastTestEndTime - b.lastTestEndTime);

    return candidates[0];
  }

  private getSameFileTests(tests: TestTimings[], test: TestTimings) {
    const { projectName } = test;
    const { file } = test.testBody.location;
    return tests.filter((t) => t.projectName === projectName && t.testBody.location.file === file);
  }

  private sortTests() {
    return this.tests.sort((a, b) => a.startTime - b.startTime);
  }

  private initLanes() {
    const lanesCount = new Set(this.tests.map((t) => t.parallelIndex)).size;
    this.lanes = Array.from({ length: lanesCount }, () => new WorkerLane());
  }

  private initLastInWorker() {
    const lastInWorker = new Map<number, TestTimings>();
    this.tests.forEach((test) => lastInWorker.set(test.workerIndex, test));
    this.lastTestInWorker = new Set(lastInWorker.values());
  }
}

class WorkerLane {
  tests: TestTimings[] = [];

  get lastTest(): TestTimings | undefined {
    return this.tests[this.tests.length - 1];
  }

  get lastWorkerIndex() {
    return this.lastTest?.workerIndex;
  }

  get lastTestFile() {
    return this.lastTest?.testBody.location.file;
  }

  get lastTestEndTime() {
    return this.lastTest ? this.lastTest.startTime + this.lastTest.totalDuration : 0;
  }
}
