/**
 * Computes run-wide invocation counts for hook and fixture spans shown in the chart.
 */
import type { WorkerData } from './index.js';
import type { ChartSpan } from './tests.js';

type FixtureCounters = {
  setup: number;
  teardown: number;
  fullRun: number;
};

export function attachSpanInvocations(workers: WorkerData[]) {
  const spans = workers.flatMap((worker) => worker.tests.flatMap((test) => test.spans));
  const hookCounts = countHookInvocations(spans);
  const fixtureCounts = countFixtureInvocations(spans);

  spans.forEach((chartSpan) => {
    if (chartSpan.span.type === 'testBody') return;
    chartSpan.invocations =
      chartSpan.span.type === 'hook'
        ? hookCounts.get(chartSpan.spanGroupId) || 0
        : fixtureCounts.get(chartSpan.spanGroupId) || 0;
  });
}

function countHookInvocations(spans: ChartSpan[]) {
  const counts = new Map<string, number>();
  spans.forEach((chartSpan) => {
    if (chartSpan.span.type !== 'hook') return;
    counts.set(chartSpan.spanGroupId, (counts.get(chartSpan.spanGroupId) || 0) + 1);
  });
  return counts;
}

function countFixtureInvocations(spans: ChartSpan[]) {
  const counters = new Map<string, FixtureCounters>();

  spans.forEach((chartSpan) => {
    if (chartSpan.span.type !== 'fixture') return;
    const current = counters.get(chartSpan.spanGroupId) || { setup: 0, teardown: 0, fullRun: 0 };

    if (chartSpan.span.executedPart === 'full-run') {
      current.fullRun += 1;
    } else if (chartSpan.span.executedPart === 'setup') {
      current.setup += 1;
    } else {
      current.teardown += 1;
    }

    counters.set(chartSpan.spanGroupId, current);
  });

  return new Map(
    Array.from(counters.entries()).map(([spanGroupId, counts]) => [
      spanGroupId,
      counts.fullRun + Math.max(counts.setup, counts.teardown),
    ]),
  );
}
