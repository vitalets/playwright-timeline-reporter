/**
 * Sequential spans of Playwrght test.
 */

import type { TestStatus } from '@playwright/test/reporter';

export type TestTimings = {
  testId: string;
  projectName: string;
  tags: string[];
  workerIndex: number;
  parallelIndex: number;
  mergeReportId?: string;
  status: TestStatus;
  retry: number;
  // start time of the first span in the test
  startTime: number;
  // total duration of the test including hooks
  totalDuration: number;
  // spans
  beforeHooks: HookSpan[];
  beforeFixtures: FixtureSpan[];
  testBody: TestBodySpan;
  afterHooks: HookSpan[];
  afterFixtures: FixtureSpan[];
};

export type Span = TestBodySpan | HookSpan | FixtureSpan;

export type SpanScope = 'test' | 'worker';
export type SpanStage = 'setup' | 'teardown';

export type BaseSpan = {
  title: string;
  startTime: number;
  duration: number;
  location: SpanLocation;
  error?: SpanError;
};

export type TestBodySpan = Omit<BaseSpan, 'title'> & {
  type: 'testBody';
  title: string[];
};

export type HookSpan = BaseSpan & {
  type: 'hook';
  scope: SpanScope;
  stage: SpanStage;
};

export type FixtureSpan = BaseSpan & {
  type: 'fixture';
  scope: SpanScope;
  stage: SpanStage;
  // Why executedPart is needed:
  // 1. When beforeAll hook references test fixture:
  // { stage: 'setup', executedPart: 'full-run' }
  // 2. When afterEach hook references worker fixture in multi-test file:
  // { stage: 'teardwon', executedPart: 'setup' }
  executedPart: 'setup' | 'teardown' | 'full-run';
  fromHook?: boolean;
  // Setup duration. For full-run fixtures this is the setup phase only; for setup-only it equals duration.
  setupDuration: number;
  // Teardown duration. For full-run fixtures this is the teardown phase only; for teardown-only it equals duration.
  teardownDuration: number;
};

export type SpanError = {
  message: string;
  location: SpanLocation;
};

export type SpanLocation = {
  file: string;
  line: number;
  column: number;
};
