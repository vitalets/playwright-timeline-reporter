/**
 * Builds chart test/span view data and shared identifiers for report interactions.
 */
import type { TestTimings, Span } from '../../test-timings/types.js';

export type ChartTest = {
  test: TestTimings;
  relStartTime: number;
  spans: ChartSpan[];
};

export type ChartSpan = {
  laneIndex: number;
  title: string;
  duration: number;
  spanId: string; // for highlighting a single span execution
  spanGroupId: string; // for highlighting all executions of the same hook/fixture
  test: TestTimings;
  span: Span;
  invocations?: number;
};

export function buildWorkerTests(tests: TestTimings[], laneIndex: number, runStartTime: number) {
  return tests.map((test) => ({
    test,
    relStartTime: test.startTime - runStartTime,
    spans: buildTestSpans(test, laneIndex),
  }));
}

function buildTestSpans(test: TestTimings, laneIndex: number) {
  const workerFixturesSetup = test.beforeFixtures.filter((s) => s.scope === 'worker');
  const beforeAll = test.beforeHooks.filter((s) => s.scope === 'worker');
  const testFixturesSetup = test.beforeFixtures.filter((s) => s.scope === 'test');
  const beforeEach = test.beforeHooks.filter((s) => s.scope === 'test');
  const afterEach = test.afterHooks.filter((s) => s.scope === 'test');
  const testFixturesTeardown = test.afterFixtures.filter((s) => s.scope === 'test');
  const afterAll = test.afterHooks.filter((s) => s.scope === 'worker');
  const workerFixturesTeardown = test.afterFixtures.filter((s) => s.scope === 'worker');

  const spans = [
    ...workerFixturesSetup,
    ...beforeAll,
    ...testFixturesSetup,
    ...beforeEach,
    test.testBody,
    ...afterEach,
    ...testFixturesTeardown,
    ...afterAll,
    ...workerFixturesTeardown,
  ];

  return spans.map((span) => {
    return {
      title: buildTitle(span),
      duration: span.duration,
      laneIndex,
      spanId: buildSpanId(test, span),
      spanGroupId: buildSpanGroupId(span),
      test,
      span,
    };
  });
}

function buildTitle(span: Span) {
  if (span.type === 'testBody') {
    return span.title[span.title.length - 1];
  }

  if (span.type === 'fixture') {
    return [span.title, `(${span.executedPart})`].join(' ');
  }

  return span.title;
}

function buildSpanId(test: TestTimings, span: Span) {
  const { file, line, column } = span.location;
  const spanTitle = span.type === 'testBody' ? span.title.join(' > ') : span.title;
  return [test.testId, span.type, file, line, column, spanTitle, span.startTime].join(':');
}

/**
 * This step id is used to highlight all executioins of the same hook/fixture/test across run.
 */
function buildSpanGroupId(span: Span) {
  const { file, line, column } = span.location;
  if (span.type === 'testBody') {
    return [...span.title, file, line, column].join(':');
  }

  const { type, scope, stage, title } = span;
  return [type, scope, type === 'hook' ? stage : '', title, file, line, column].join(':');
}
