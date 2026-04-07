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
  private projectLaneLimits = new Map<string, number>();

  constructor(
    private tests: TestTimings[],
    private fullyParallel?: boolean,
  ) {
    this.sortTests();
    this.initLastInWorker();
    this.initProjectLaneLimits();
  }

  build() {
    let tests = [...this.tests];
    let test: TestTimings | undefined;
    while ((test = tests.shift())) {
      const lane = this.getLaneForTest(test);
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

  private getLaneForTest(test: TestTimings) {
    return this.getLaneByWorkerIndex(test) || this.getLaneFromPending(test);
  }

  private getLaneByWorkerIndex(test: TestTimings) {
    return this.lanes.find((lane) => lane.lastWorkerIndex === test.workerIndex);
  }

  private getLaneFromPending(test: TestTimings) {
    const pendingLanes = this.getPendingLanes(test);
    const projectLanes = pendingLanes.filter(
      (lane) => lane.lastTest?.projectName === test.projectName,
    );
    const projectLaneLimit = this.projectLaneLimits.get(test.projectName) ?? 1;
    const candidates = projectLanes.length >= projectLaneLimit ? projectLanes : pendingLanes;

    if (candidates.length > 0) {
      candidates.sort((a, b) => a.lastTestEndTime - b.lastTestEndTime);
      return candidates[0];
    }

    if (projectLanes.length >= projectLaneLimit) {
      throw new Error(
        `Could not find lane for test "${test.testBody.title}" in project "${test.projectName}"`,
      );
    }

    const lane = new WorkerLane();
    this.lanes.push(lane);
    return lane;
  }

  private getPendingLanes(test: TestTimings) {
    return this.lanes
      .filter((lane) => !lane.lastTest || this.lastTestInWorker.has(lane.lastTest))
      .filter((lane) => lane.lastTestEndTime <= test.startTime);
  }

  private getSameFileTests(tests: TestTimings[], test: TestTimings) {
    const { projectName } = test;
    const { file } = test.testBody.location;
    return tests.filter((t) => t.projectName === projectName && t.testBody.location.file === file);
  }

  private sortTests() {
    return this.tests.sort((a, b) => a.startTime - b.startTime);
  }

  private initLastInWorker() {
    const lastInWorker = new Map<number, TestTimings>();
    this.tests.forEach((test) => lastInWorker.set(test.workerIndex, test));
    this.lastTestInWorker = new Set(lastInWorker.values());
  }

  private initProjectLaneLimits() {
    const projectParallelIndexes = new Map<string, Set<number>>();

    this.tests.forEach((test) => {
      const indexes = projectParallelIndexes.get(test.projectName) ?? new Set<number>();
      if (test.parallelIndex >= 0) indexes.add(test.parallelIndex);
      projectParallelIndexes.set(test.projectName, indexes);
    });

    projectParallelIndexes.forEach((indexes, projectName) => {
      this.projectLaneLimits.set(projectName, Math.max(indexes.size, 1));
    });
  }
}

/**
 * Helper class to store lane tests and provide easy access to the lane's last test.
 */
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
