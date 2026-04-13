/**
 * Wrapper reporter for worker-lane harness testing: extends TimelineReporter to also
 * write a lanes.json file with worker lane data for snapshot assertions.
 */
import fs from 'node:fs';
import path from 'node:path';
import TimelineReporter from '../../dist/index.js';
import { buildChartData, type ChartData } from '../../src/report/data/index.js';
import type { RunInfo } from '../../src/run-info.js';
import type { TestTimings } from '../../src/test-timings/types.js';

export default class WorkerLanesReporter extends TimelineReporter {
  testTimings: TestTimings[] = [];

  override writeStream(data: TestTimings) {
    super.writeStream(data);
    this.testTimings.push(data);
  }

  override async closeStream(runInfo: RunInfo) {
    await super.closeStream(runInfo);
    this.saveLanes(runInfo);
  }

  private saveLanes(runInfo: RunInfo) {
    const chartData = buildChartData(this.testTimings, runInfo);
    const lanes = buildLanesData(chartData);
    const outputDir = path.resolve(this.configDir, path.dirname(this.options.outputFile));
    const json = `[\n${lanes.map((lane) => `  ${JSON.stringify(lane)}`).join(',\n')}\n]`;
    fs.writeFileSync(path.join(outputDir, 'lanes.json'), json);
  }
}

function buildLanesData(chartData: ChartData): string[][] {
  const sortedWorkers = [...chartData.workers].sort((a, b) => a.workerIndex - b.workerIndex);

  return sortedWorkers.map((worker) =>
    worker.tests.map(({ test }) => {
      const file = path.basename(test.testBody.location.file).replace(/\..*$/, '');
      return [test.projectName, file, ...test.testBody.title].filter(Boolean).join(' ');
    }),
  );
}
