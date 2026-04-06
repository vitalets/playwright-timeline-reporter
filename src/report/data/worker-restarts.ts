import { TestTimings } from '../../test-timings/types.js';

export type WorkerRestartReason = 'testFailure' | 'projectSwitch' | 'unknown';

export type WorkerRestart = {
  laneIndex: number;
  time: number; // relative to run start time
  prevWorkerIndex: number;
  nextWorkerIndex: number;
  reason: WorkerRestartReason;
};

export function buildWorkerRestarts(tests: TestTimings[], laneIndex: number, runStartTime: number) {
  const restarts: WorkerRestart[] = [];
  tests.forEach((test, index) => {
    const prevTest = tests[index - 1];
    if (prevTest && test.workerIndex !== prevTest.workerIndex) {
      restarts.push({
        laneIndex,
        time: (prevTest.startTime + prevTest.totalDuration + test.startTime) / 2 - runStartTime,
        prevWorkerIndex: prevTest.workerIndex,
        nextWorkerIndex: test.workerIndex,
        reason: getRestartReason(prevTest, test),
      });
    }
  });
  return restarts;
}

function getRestartReason(prevTest: TestTimings, nextTest: TestTimings): WorkerRestartReason {
  if (prevTest.status === 'failed' || prevTest.status === 'timedOut') return 'testFailure';
  if (prevTest.projectName !== nextTest.projectName) return 'projectSwitch';
  return 'unknown';
}
