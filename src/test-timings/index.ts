/**
 * Parse Playwright test result and build timings.
 */
import { stripVTControlCharacters } from 'node:util';
import { TestCase, TestError, TestResult, TestStep } from '@playwright/test/reporter';
import {
  FixtureSpan,
  HookSpan,
  SpanError,
  SpanScope,
  SpanStage,
  TestBodySpan,
  TestTimings,
} from './types.js';
import {
  findAfterHooksStep,
  findBeforeHooksStep,
  findWorkerCleanupStep,
  totalDuration,
  stepsByCategory,
  toLocationObject,
  minStartTime,
} from './helpers.js';
import { groupBy } from '../utils/group-by.js';
import { checkVersion } from '../utils/check-version.js';

/* eslint-disable max-lines */

const logger = console;

type TestTimingsOptions = {
  configDir: string;
  pwVersion: string;
};

export class TestTimingsBuilder {
  private beforeHooks: HookSpan[] = [];
  private beforeFixtures = new Map<string, FixtureSpan>();
  // All before fixture spans (including extra full-run of test-fixtures referenced in beforeAll).
  // Calculated as: beforeFixtures + beforeFixturesFullRuns.
  private allBeforeFixtures: FixtureSpan[] = [];

  private afterHooks: HookSpan[] = [];
  private afterFixtures = new Map<string, FixtureSpan>();
  // All after fixture spans (including extra full-run of test-fixtures referenced in afterAll).
  // Calculated as: afterFixtures + afterFixturesFullRuns.
  private allAfterFixtures: FixtureSpan[] = [];

  // Extra runs of test fixtures, referenced in beforeAll / afterAll hooks.
  // Keep them as separate array, because there can be multiple runs of the same fixture.
  private testFixturesExtraRuns: FixtureSpan[] = [];

  private testStartTime: number;
  private testBody: TestBodySpan;
  private errors = new Set<string /* error stack */>();
  private pwFeatures: { workerFixturesInTestDuration: boolean };

  constructor(
    private test: TestCase,
    private result: TestResult,
    private options: TestTimingsOptions,
  ) {
    this.pwFeatures = buildPwFeatures(options.pwVersion);
    // Call order here is important (to distinguish worker-scoped / test-scoped fixtures).
    this.handleWorkerCleanup();
    this.handleAfterStage();
    this.handleBeforeStage();
    this.removeFakeTeardowns();
    this.allBeforeFixtures = [
      ...this.beforeFixtures.values(),
      ...this.testFixturesExtraRuns.filter((f) => f.stage === 'setup'),
    ];
    this.allAfterFixtures = [
      ...this.afterFixtures.values(),
      ...this.testFixturesExtraRuns.filter((f) => f.stage === 'teardown'),
    ];
    this.testStartTime = this.calcTestStartTime();
    this.testBody = this.buildTestBodySpan();
  }

  build(): TestTimings {
    const { test, result } = this;

    return {
      testId: test.id,
      projectName: this.getProjectName(),
      tags: test.tags ?? [],
      workerIndex: result.workerIndex,
      parallelIndex: result.parallelIndex,
      status: result.status,
      retry: result.retry,
      startTime: this.testStartTime,
      totalDuration: this.calcTestTotalDuration(),
      beforeHooks: this.beforeHooks,
      beforeFixtures: this.allBeforeFixtures,
      testBody: this.testBody,
      afterHooks: this.afterHooks,
      afterFixtures: this.allAfterFixtures,
    };
  }

  private getProjectName(): string {
    return this.test.parent.project()?.name ?? '';
  }

  private handleWorkerCleanup() {
    // "Worker Cleanup" step is not visible for successfull tests yet.
    // See: https://github.com/microsoft/playwright/issues/38350
    const workerCleanupStep = findWorkerCleanupStep(this.result);
    stepsByCategory(workerCleanupStep, 'fixture').forEach((fixture) => {
      const stepId = buildStepId(fixture);
      this.addFixtureSpan(stepId, 'worker', 'teardown', fixture);
    });
  }

  private handleAfterStage() {
    const afterHooksStep = findAfterHooksStep(this.result);

    // All test-scoped fixture teardowns, referenced from anywhere (hooks, test, other fixtures).
    stepsByCategory(afterHooksStep, 'fixture').forEach((fixture) => {
      const stepId = buildStepId(fixture);
      this.addFixtureSpan(stepId, 'test', 'teardown', fixture);
    });

    stepsByCategory(afterHooksStep, 'hook').forEach((hook) => {
      // Todo: better distinguish afterEach and afterAll hooks
      // See: https://github.com/microsoft/playwright/issues/38747
      const isWorkerHook = hook.title.includes('afterAll');
      if (isWorkerHook) {
        this.handleWorkerHook('teardown', hook);
      } else {
        this.handleAfterEachHook(hook);
      }
    });
  }

  private handleBeforeStage() {
    const beforeHooksStep = findBeforeHooksStep(this.result);

    // Top level fixture entries are for fixture setups, referenced from test (not from hooks).
    stepsByCategory(beforeHooksStep, 'fixture').forEach((setup) => {
      this.handleFixtureSetup(setup);
    });

    stepsByCategory(beforeHooksStep, 'hook').forEach((hook) => {
      // Todo: better distinguish beforeEach and beforeAll hooks
      // See: https://github.com/microsoft/playwright/issues/38747
      const isWorkerHook = hook.title.includes('beforeAll');
      if (isWorkerHook) {
        this.handleWorkerHook('setup', hook);
      } else {
        this.handleBeforeEachHook(hook);
      }
    });
  }

  /**
   * Handle beforeAll / afterAll hooks.
   */
  private handleWorkerHook(stage: SpanStage, hook: TestStep) {
    const fixtures = stepsByCategory(hook, 'fixture');
    const fixturesMap = groupBy(fixtures, (f) => buildStepId(f));
    fixturesMap.forEach((fixtureSteps, stepId) => {
      // If beforeAll/afterAll references a test-scoped fixture,
      // this fixture has extra full execution.
      // The hook contains 2 steps for this fixture: setup and teardown.
      // The fixture execution time is NOT attributed to the test result duration.
      if (fixtureSteps.length === 2) {
        this.addTestFixtureExtraRun(stage, fixtureSteps);
        return;
      }

      // handle worker fixture setup
      const setup = fixtureSteps[0];
      const existingTeardown = this.afterFixtures.get(stepId);

      // Upgrade to full run, if worker fixture is first time refereced in teardown.
      if (stage === 'teardown' && existingTeardown && !setup.error) {
        this.upgradeToFullRun(existingTeardown, setup, true);
      } else {
        this.addFixtureSpan(stepId, 'worker', stage, setup, true);
      }
    });

    this.addHookSpan('worker', stage, hook, fixtures);
  }

  private handleBeforeEachHook(hook: TestStep) {
    // All these entries are fixture setups
    const fixtures = stepsByCategory(hook, 'fixture');
    fixtures.forEach((setup) => this.handleFixtureSetup(setup));
    this.addHookSpan('test', 'setup', hook, fixtures);
  }

  private handleAfterEachHook(hook: TestStep) {
    // Fixture entries here are setups for uniquely referenced fixtures in afterEach hook,
    // without references from before hooks and test.
    // All these entries should convert existing fixture teardowns into full-runs.
    const fixtures = stepsByCategory(hook, 'fixture');

    fixtures.forEach((setup) => {
      const stepId = buildStepId(setup);
      const existingTeardown = this.afterFixtures.get(stepId);

      if (!existingTeardown) {
        // This should not happen normally, because each test fixture setup
        // should have a teardown detected earlier.
        // todo: add fixture setup entry anyway? What scope?
        logger.error('No matching fixture teardown for setup:', setup.title);
        return;
      }

      if (existingTeardown.executedPart === 'full-run') {
        // This should not happen normally.
        // todo: add fixture setup entry anyway? What scope?
        logger.error('Found extra setup for full-run fixture:', setup.title);
        return;
      }

      // Convert existing teardown into full-run
      this.upgradeToFullRun(existingTeardown, setup);
    });

    this.addHookSpan('test', 'teardown', hook, fixtures);
  }

  private handleFixtureSetup(setup: TestStep) {
    const stepId = buildStepId(setup);
    const existingTeardown = this.afterFixtures.get(stepId);
    const isTestFixture = existingTeardown?.scope === 'test';
    const scope = isTestFixture ? 'test' : 'worker';
    this.addFixtureSpan(stepId, scope, 'setup', setup);
  }

  /**
   * In case of error in fixture setup, teardown does not run,
   * although there are 0-duration entries.
   * Remove this entries to avoid confusion.
   */
  private removeFakeTeardowns() {
    this.afterFixtures.forEach((entry, stepId) => {
      const setup = this.beforeFixtures.get(stepId);
      if (entry.duration === 0 && entry.executedPart === 'teardown' && setup?.error) {
        this.afterFixtures.delete(stepId);
      }
    });
  }

  /**
   * Test start time is the earliest start time among:
   * - test result start time
   * - all beforeEach hook spans
   * - all before fixture spans
   */
  private calcTestStartTime() {
    const allSpansStartTimes = [...this.beforeHooks, ...this.allBeforeFixtures].map(
      (span) => span.startTime,
    );

    return Math.min(this.result.startTime.getTime(), ...allSpansStartTimes);
  }

  /**
   * Test total duration: sum of all spans.
   */
  private calcTestTotalDuration() {
    return totalDuration([
      ...this.beforeHooks,
      ...this.allBeforeFixtures,
      this.testBody,
      ...this.afterHooks,
      ...this.allAfterFixtures,
    ]);
  }

  private buildTestBodySpan(): TestBodySpan {
    return {
      type: 'testBody',
      // first 3 items are root "", project name and file name.
      // todo: compare configs with and without projects.
      // See: https://github.com/microsoft/playwright/pull/38949/files
      title: this.test.titlePath().slice(3),
      startTime: this.calcTestBodyStartTime(),
      duration: this.calcTestBodyDuration(),
      location: toLocationObject(this.options.configDir, this.test.location),
      error: this.buildTestBodyError(),
    };
  }

  /**
   * Test body duration: result.duration - test-scoped stuff.
   */
  private calcTestBodyDuration() {
    const hasErrorInSetup = [...this.beforeHooks, ...this.allBeforeFixtures].some(
      (span) => span.error,
    );

    // If there is an error in setup, test body is not executed.
    if (hasErrorInSetup) return 0;

    const testScopedDuration = totalDuration([
      ...this.beforeHooks.filter((f) => f.scope === 'test'),
      ...this.afterHooks.filter((f) => f.scope === 'test'),
      ...Array.from(this.beforeFixtures.values()).filter((f) => f.scope === 'test'),
      ...Array.from(this.afterFixtures.values()).filter((f) => f.scope === 'test'),
    ]);
    let testBodyDuration = this.result.duration - testScopedDuration;

    // In older PW versions, worker fixture setups are included in test result duration
    if (this.pwFeatures.workerFixturesInTestDuration) {
      const workerFixtureSetups = Array.from(this.beforeFixtures.values()).filter(
        (f) => f.scope === 'worker' && !f.fromHook,
      );
      testBodyDuration -= totalDuration(workerFixtureSetups);

      // Also subtract setup portion of worker fixtures first referenced in afterEach hooks,
      // which are stored in afterFixtures as full-run entries with setupDuration set.
      const afterWorkerSetups = Array.from(this.afterFixtures.values())
        .filter((f) => f.scope === 'worker' && !f.fromHook)
        .map((f) => ({ duration: f.setupDuration }));
      testBodyDuration -= totalDuration(afterWorkerSetups);
    }

    if (testBodyDuration < 0) {
      const testTitle = this.test.titlePath().filter(Boolean).join(' › ');
      logger.warn(
        `Calculated negative test body duration (${testBodyDuration}) for test: ${testTitle}`,
      );
    }

    return testBodyDuration;
  }

  /**
   * Test body start time:
   * test start time + durations of all before hooks and fixture setups.
   */
  private calcTestBodyStartTime() {
    return this.testStartTime + totalDuration([...this.beforeHooks, ...this.allBeforeFixtures]);
  }

  /**
   * If there is error not registered in any hook or fixture, it's from the test body.
   */
  private buildTestBodyError() {
    const { result } = this;
    return result.error && !this.errors.has(result.error.stack || '')
      ? this.toSpanError(this.result.error)
      : undefined;
  }

  private addHookSpan(
    scope: 'test' | 'worker',
    stage: 'setup' | 'teardown',
    hook: TestStep,
    fixtures: TestStep[],
  ) {
    const errorInFixtures = fixtures.some((f) => f.error);
    const target = stage === 'setup' ? this.beforeHooks : this.afterHooks;
    target.push({
      type: 'hook',
      title: hook.title,
      scope,
      stage,
      startTime: hook.startTime.getTime(),
      duration: hook.duration - totalDuration(fixtures),
      location: this.toLocationObject(hook),
      // if hook's fixture has error, don't show the error in the hook
      error: errorInFixtures ? undefined : this.toSpanError(hook.error),
    });
  }

  // eslint-disable-next-line max-params
  private addFixtureSpan(
    stepId: string,
    scope: SpanScope,
    stage: SpanStage,
    step: TestStep,
    fromHook?: boolean,
  ) {
    const target = stage === 'setup' ? this.beforeFixtures : this.afterFixtures;
    target.set(stepId, {
      type: 'fixture',
      scope,
      stage,
      executedPart: stage,
      title: step.title,
      startTime: step.startTime.getTime(),
      duration: step.duration,
      location: this.toLocationObject(step),
      error: this.toSpanError(step.error),
      fromHook,
      setupDuration: stage === 'setup' ? step.duration : 0,
      teardownDuration: stage === 'teardown' ? step.duration : 0,
    });
  }

  private upgradeToFullRun(existingSpan: FixtureSpan, fixtureSetup: TestStep, fromHook?: boolean) {
    // warn for incorrect scope
    // warn for incorrect stage
    existingSpan.teardownDuration = existingSpan.duration;
    existingSpan.duration += fixtureSetup.duration;
    existingSpan.startTime = Math.min(existingSpan.startTime, fixtureSetup.startTime.getTime());
    existingSpan.executedPart = 'full-run';
    existingSpan.setupDuration = fixtureSetup.duration;
    existingSpan.fromHook = fromHook;
    // don't assign error, because in case of error in setup, teardown is not executed.
  }

  private addTestFixtureExtraRun(stage: 'setup' | 'teardown', [setup, teardown]: TestStep[]) {
    this.testFixturesExtraRuns.push({
      type: 'fixture',
      scope: 'test',
      stage,
      // In case of error in the fixture setup, there is a 0-duration teardown entry,
      // but actual teardown is not executed. So mark executedPart as 'setup' in this case.
      executedPart: setup.error ? 'setup' : 'full-run',
      title: setup.title,
      startTime: minStartTime([setup, teardown]),
      duration: totalDuration([setup, teardown]),
      setupDuration: setup.duration,
      teardownDuration: teardown.duration,
      location: this.toLocationObject(setup),
      error: this.toSpanError(setup.error || teardown.error),
    });
  }

  private toLocationObject(step: TestStep | TestCase | TestError) {
    return toLocationObject(this.options.configDir, step.location);
  }

  private toSpanError(error?: TestError): SpanError | undefined {
    if (!error) return;
    this.errors.add(error.stack || '');
    const { message = '' } = error;
    return {
      message: stripVTControlCharacters(message),
      location: this.toLocationObject(error),
      // snippet: snippet ? stripVTControlCharacters(snippet) : undefined,
    };
  }
}

function buildStepId(step: TestStep) {
  const { file, line, column } = step.location || {};
  return [step.category, step.title, file, line, column].join(':');
}

function buildPwFeatures(pwVersion: string) {
  return {
    // In PW <= 1.57, worker fixture setups directly referenced by the test
    // (not via a hook) are included in result.duration.
    workerFixturesInTestDuration: checkVersion(pwVersion, '<= 1.57.x'),
  };
}
