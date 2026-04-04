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
  private lastInWorker = new Set<TestTimings>();

  constructor(
    private tests: TestTimings[],
    private fullyParallel?: boolean,
  ) {
    this.sortTests();
    this.initLanes();
    this.initLastInWorker();
  }

  build() {
    this.tests.forEach((test) => {
      const lane = this.findLaneForTest(test);
      lane.tests.push(test);
    });
    return this.lanes.map((lane) => ({ tests: lane.tests }));
  }

  private findLaneForTest(test: TestTimings) {
    return this.findLaneByWorkerIndex(test) || this.findLaneByWorkerRestart(test);
  }

  private findLaneByWorkerIndex(test: TestTimings) {
    return this.lanes.find((lane) => lane.lastWorkerIndex === test.workerIndex);
  }

  private findLaneByWorkerRestart(test: TestTimings) {
    const candidates = this.lanes
      .filter((lane) => !lane.lastTest || this.lastInWorker.has(lane.lastTest))
      .filter((lane) => lane.lastTestEndTime <= test.startTime);

    if (candidates.length === 0) {
      throw new Error(`Could not find worker for test "${test.testBody.title}"`);
    }

    // In non-fully-parallel mode, try keep tests from the same file in the same lane.
    // Case: worker 1 finished all the work, worker 2 get one of the tests in a file failed.
    // Without this code, the next test in a file will be assigned to worker 1, which is not correct,
    // because actually worker 2 executes this test.
    if (!this.fullyParallel) {
      const { file } = test.testBody.location;
      const lane = candidates.find((lane) => lane.lastTestFile === file);
      if (lane) return lane;
    }

    candidates.sort((a, b) => a.lastTestEndTime - b.lastTestEndTime);

    return candidates[0];
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
    this.lastInWorker = new Set(lastInWorker.values());
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
