/**
 * Custom Playwright reporter that actually performs the timing assertions —
 * each test's computed timings are compared against the expected annotation.
 */
import type {
  Reporter,
  TestCase,
  TestError,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';
import { expect } from '@playwright/test';
import { TestTimingsBuilder } from '../../src/test-timings/index.js';
import { renderTimings, round } from '../helpers.js';

const logger = console;

export default class TimelineReporter implements Reporter {
  private tests = 0;
  private errors: { test: TestCase; result: TestResult; error: Error }[] = [];

  onError(error: TestError) {
    // filter out synthetic errors from fixture teardown
    if (error.message?.includes('my error')) return;
    logger.log(error.message);
  }

  onStdOut(chunk: string | Buffer) {
    logger.log(chunk.toString());
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'skipped') return;
    this.tests++;
    roundDurations(result);
    const data = new TestTimingsBuilder(test, result, process.cwd()).build();
    const expected = result.annotations[0].description!.trim();
    const testPath = test.titlePath().filter(Boolean).join(' > ');
    try {
      expect(renderTimings(data)).toEqual(expected);
      logger.log(`✅ ${testPath}`);
    } catch (e) {
      this.errors.push({ test, result, error: e as Error });
      logger.log(`❌ ${testPath}`);
    }
  }

  onEnd() {
    this.errors.forEach(({ test, result, error }) => {
      logger.log(`TEST: ${test.titlePath().filter(Boolean).join(' > ')}`);
      logger.log(error.message);
      logger.log('\nACTUAL OUTPUT:\n');
      // @ts-expect-error actual property exists
      logger.log(error.matcherResult?.actual);
      logger.log(`\nSTEPS:\n`);
      logger.log(`${test.title} (${result.duration}ms)`);
      printSteps(result.steps, 2);
      if (process.env.DEBUG) logger.dir(result, { depth: null });
      logger.log('');
    });
    logger.log(`Tests: ${this.tests}, failed: ${this.errors.length}.`);
    process.exit(this.errors.length);
  }
}

function printSteps(steps: TestStep[], indent = 0) {
  for (const step of steps) {
    logger.log(`${' '.repeat(indent)} ${step.category} ${step.title}`, `(${step.duration}ms)`);
    if (step.steps?.length) printSteps(step.steps, indent + 2);
  }
}

function roundDurations(item: { duration: number; steps?: TestStep[] }) {
  item.duration = round(item.duration);
  item.steps?.forEach(roundDurations);
}
