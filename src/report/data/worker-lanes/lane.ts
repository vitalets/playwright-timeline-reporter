/**
 * WorkerLane: mutable lane state accumulated during backtracking assignment.
 */
import { TestTimings } from '../../../test-timings/types.js';

/** A single vertical lane in the timeline chart, accumulating tests during backtracking. */
export class WorkerLane {
  tests: TestTimings[] = [];

  /** Return a shallow copy so each backtracking branch has its own isolated state. */
  clone(): WorkerLane {
    const c = new WorkerLane();
    c.tests = [...this.tests];
    return c;
  }

  get lastTest(): TestTimings | undefined {
    return this.tests[this.tests.length - 1];
  }

  get lastWorkerIndex(): number | undefined {
    return this.lastTest?.workerIndex;
  }

  get lastTestEndTime(): number {
    return this.lastTest ? this.lastTest.startTime + this.lastTest.totalDuration : 0;
  }
}

/** Deep-clone a lane array so each backtracking branch operates on its own state. */
export function cloneLanes(lanes: WorkerLane[]): WorkerLane[] {
  return lanes.map((l) => l.clone());
}
