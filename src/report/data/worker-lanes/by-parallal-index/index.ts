/**
 * Distribute tests into lanes based on workerIndex / parallelIndex.
 */
import { TestTimings } from '../../../../test-timings/types.js';

export class WorkerLanesByParallelIndex {
  private lanes: WorkerLane[] = [];
  private maxLanes = 0;

  constructor(private tests: TestTimings[]) {
    this.sortTests();
    this.initMaxLanes();
  }

  build() {
    for (const test of this.tests) {
      const lane = this.getLaneForTest(test);
      lane.tests.push(test);
    }
    return this.lanes.map((lane) => ({ tests: lane.tests }));
  }

  private getLaneForTest(test: TestTimings) {
    const lane =
      this.getLaneByWorkerIndex(test) || this.getLaneByParallelIndex(test) || this.getFreeLane();

    if (!lane) {
      throw new Error(
        `Could not find lane for test "${test.testBody.title}" (WI: ${test.workerIndex}, PI: ${test.parallelIndex})`,
      );
    }

    return lane;
  }

  private getLaneByWorkerIndex(test: TestTimings) {
    return this.lanes.find((lane) => lane.lastWorkerIndex === test.workerIndex);
  }

  private getLaneByParallelIndex(test: TestTimings) {
    return this.lanes.find((lane) => lane.lastParallelIndex === test.parallelIndex);
  }

  private getFreeLane() {
    if (this.lanes.length < this.maxLanes) {
      const lane = new WorkerLane();
      this.lanes.push(lane);
      return lane;
    }
  }

  private sortTests() {
    return this.tests.sort((a, b) => a.startTime - b.startTime);
  }

  private initMaxLanes() {
    const parallelIndexes = new Set(this.tests.map((t) => t.parallelIndex).filter((i) => i >= 0));
    this.maxLanes = parallelIndexes.size;
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

  get lastParallelIndex() {
    return this.lastTest?.parallelIndex;
  }

  get lastTestFile() {
    return this.lastTest?.testBody.location.file;
  }

  get lastTestEndTime() {
    return this.lastTest ? this.lastTest.startTime + this.lastTest.totalDuration : 0;
  }
}
