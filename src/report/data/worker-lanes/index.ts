import { TestTimings } from '../../../test-timings/types.js';
import { ChartTest } from '../tests.js';
import { WorkerLanesByParallelIndex } from './by-parallel-index/index.js';
import { WorkerLanesByRestartGaps } from './by-restart-gaps/index.js';

export type WorkerData = {
  laneIndex: number;
  workerIndex: number; // worker index within the shard / merge report
  tests: ChartTest[];
  mergeReportId?: string;
};

type WorkerLanesStrategy = 'parallel-index' | 'restart-gaps';
const strategy: WorkerLanesStrategy = 'restart-gaps';

type BuildWorkerLanesOptions = {
  debug?: boolean;
  fullyParallel?: boolean;
};

export function buildWorkerLanes(
  tests: TestTimings[],
  { debug = false, fullyParallel = false }: BuildWorkerLanesOptions = {},
) {
  if (strategy === 'parallel-index') {
    return new WorkerLanesByParallelIndex(tests).build();
  } else {
    return new WorkerLanesByRestartGaps(tests, { debug, fullyParallel }).build();
  }
}
