import { TestTimings } from '../../../test-timings/types.js';
import { ChartTest } from '../tests.js';
import { WorkerLanesByParallelIndex } from './by-parallal-index/index.js';
import { WorkerLanesByRestartDuration } from './by-restart-duration/index.js';

export type WorkerData = {
  laneIndex: number;
  workerIndex: number; // worker index within the shard / merge report
  tests: ChartTest[];
  mergeReportId?: string;
};

type WorkerLanesStrategy = 'parallel-index' | 'restart-duration';
const strategy: WorkerLanesStrategy = 'restart-duration';

export function buildWorkerLanes(
  tests: TestTimings[],
  { debug = false }: { debug?: boolean } = {},
) {
  if (strategy === 'parallel-index') {
    return new WorkerLanesByParallelIndex(tests).build();
  } else {
    return new WorkerLanesByRestartDuration(tests, { debug }).build();
  }
}
