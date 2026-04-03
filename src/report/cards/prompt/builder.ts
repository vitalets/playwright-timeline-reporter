/**
 * Builds a compact copy-pasteable AI prompt with essential Playwright test timings.
 */
import type { ChartData } from '../../data/index.js';
import type { ChartSpan } from '../../data/tests.js';
import { DEFAULT_PROMPT } from './default-prompt.js';

export function buildPrompt(chartData: ChartData, promptTemplate: string) {
  const promptData = buildPromptData(chartData);
  return (promptTemplate || DEFAULT_PROMPT).replace('{data}', JSON.stringify(promptData));
}

function buildPromptData(chartData: ChartData) {
  return {
    summary: {
      runStartTime: toSeconds(chartData.runInfo.startTime),
      totalDuration: toSeconds(chartData.runInfo.duration),
      fullyParallel: chartData.runInfo.fullyParallel,
      mergeReports: chartData.runInfo.mergeReports,
      workers: chartData.workers.length,
      projects: chartData.projects.map((project) => project.name),
      workerRestarts: chartData.restarts.length,
    },
    workerLanes: chartData.workers.map((worker) =>
      buildWorkerLaneInsight(worker, chartData.restarts),
    ),
  };
}

function buildWorkerLaneInsight(
  worker: ChartData['workers'][number],
  restarts: ChartData['restarts'],
) {
  return {
    laneIndex: worker.laneIndex,
    tests: worker.tests.map((chartTest) => buildTestInsight(chartTest)),
    workerRestarts: restarts
      .filter((restart) => restart.laneIndex === worker.laneIndex)
      .map((restart) => ({
        time: toSeconds(restart.time),
      })),
  };
}

function buildTestInsight(chartTest: ChartData['workers'][number]['tests'][number]) {
  const { spans, relStartTime, test } = chartTest;
  const titlePath = test.testBody.title;

  return {
    title: titlePath.join(' > '),
    file: test.testBody.location.file,
    projectName: test.projectName || null,
    status: test.status,
    retry: test.retry,
    startTime: toSeconds(relStartTime),
    totalDuration: toSeconds(test.totalDuration),
    testBodyDuration: toSeconds(test.testBody.duration),
    fixtures: collectSpanTimings(spans, 'fixture'),
    hooks: collectSpanTimings(spans, 'hook'),
  };
}

function collectSpanTimings(spans: ChartSpan[], type: 'fixture' | 'hook') {
  return spans
    .filter((entry) => entry.span.type === type)
    .map(({ span }) => {
      if (span.type === 'testBody') {
        throw new Error(`Unexpected span type: ${span.type}`);
      }

      return {
        title: buildSpanTitle(span),
        location: buildSpanLocation(span),
        duration: toSeconds(span.duration),
      };
    });
}

function buildSpanTitle(span: Exclude<ChartSpan['span'], { type: 'testBody' }>) {
  const parts = [span.title];
  if (span.type === 'fixture') {
    parts.push(span.executedPart);
  }
  parts.push(span.scope, span.stage);
  return parts.join(' ');
}

function buildSpanLocation(span: Exclude<ChartSpan['span'], { type: 'testBody' }>) {
  const { file, line, column } = span.location;
  return `${file}:${line}:${column}`;
}

function toSeconds(value: number) {
  return Math.round(value) / 1000;
}
