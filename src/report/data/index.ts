/**
 * Builds the report chart data model used by the interactive timeline view.
 */
import type { RunInfo } from '../../run-info.js';
import type { TestTimings } from '../../test-timings/types.js';
import { WorkerData } from './workers.js';
import { WorkerRestart } from './worker-restarts.js';
import { buildWorkerTests } from './tests.js';
import { buildWorkerRestarts } from './worker-restarts.js';
import { WorkerLanes } from './workers.js';
import { buildProjects, type ProjectData } from './projects.js';
import { groupBy } from '../../utils/group-by.js';

export type ChartData = {
  runInfo: RunInfo;
  workers: WorkerData[];
  restarts: WorkerRestart[];
  projects: ProjectData[];
  isMergeReports: boolean;
};

export function buildChartData(allTests: TestTimings[], runInfo: RunInfo): ChartData {
  const projects = buildProjects(allTests, runInfo.startTime);
  const allWorkers: WorkerData[] = [];
  const restarts: WorkerRestart[] = [];

  const shards = groupByMergeReportId(allTests);
  sortShards(shards, runInfo);

  shards.map(({ mergeReportId, tests }) => {
    const workerLanes = new WorkerLanes(tests, runInfo.fullyParallel).build();
    sortWorkersWithinShard(workerLanes);

    workerLanes.forEach(({ tests }, index) => {
      const laneIndex = allWorkers.length;
      const workerIndex = workerLanes.length - index;
      const workerTests = buildWorkerTests(tests, laneIndex, runInfo.startTime);
      allWorkers.push({ laneIndex, workerIndex, tests: workerTests, mergeReportId });
      restarts.push(...buildWorkerRestarts(tests, laneIndex, runInfo.startTime));
    });
  });

  // currently not used
  // attachSpanInvocations(allWorkers);

  return {
    runInfo,
    workers: allWorkers,
    restarts,
    projects,
    isMergeReports: Object.keys(runInfo.mergeReports).length > 0,
  };
}

function groupByMergeReportId(tests: TestTimings[]) {
  return [...groupBy(tests, (t) => t.mergeReportId).entries()].map(([mergeReportId, tests]) => ({
    mergeReportId,
    tests,
  }));
}

function sortShards(reports: { mergeReportId?: string }[], runInfo: RunInfo) {
  // if shardIndexes exist: sort by shardIndex; otherwise sort by startTime
  // eslint-disable-next-line visual/complexity
  reports.sort((a, b) => {
    const aReport = a.mergeReportId ? runInfo.mergeReports[a.mergeReportId] : null;
    const bReport = b.mergeReportId ? runInfo.mergeReports[b.mergeReportId] : null;
    const aShardIndex = aReport?.shardIndex;
    const bShardIndex = bReport?.shardIndex;
    if (aShardIndex !== undefined && bShardIndex !== undefined) {
      return bShardIndex - aShardIndex;
    }
    return (bReport?.startTime ?? 0) - (aReport?.startTime ?? 0);
  });
}

function sortWorkersWithinShard(lanes: { tests: TestTimings[] }[]) {
  // sort to show really first worker at the top (lowest workerIndex in the first test)
  lanes.sort((a, b) => b.tests[0].workerIndex - a.tests[0].workerIndex);
}
