/**
 * Custom Playwright reporter that actually performs the timing assertions —
 * each test's computed timings are compared against the expected comment block.
 */
import { readFileSync } from 'node:fs';
import type {
  FullConfig,
  Reporter,
  TestCase,
  TestError,
  TestResult,
  TestStep,
} from '@playwright/test/reporter';
import { expect } from '@playwright/test';
import { TestTimingsBuilder } from '../../src/test-timings/index.js';
import { renderTimings, round } from './helpers.js';

const logger = console;

export default class TimelineReporter implements Reporter {
  private tests = 0;
  private pwVersion = '';
  private errors: { test: TestCase; result: TestResult; error: Error; stepsOutput: string }[] = [];

  onBegin(config: FullConfig) {
    this.pwVersion = config.version;
  }

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
    const stepsOutput = buildStepsOutput(test, result);
    roundDurations(result);
    const data = new TestTimingsBuilder(test, result, {
      configDir: process.cwd(),
      pwVersion: this.pwVersion,
    }).build();
    const expected = extractExpected(test.location.file, test.title);
    const testPath = test.titlePath().filter(Boolean).join(' > ');
    try {
      expect(renderTimings(data)).toEqual(expected);
      logger.log(`✅ ${testPath}`);
    } catch (e) {
      const error = e as Error;
      this.errors.push({ test, result, stepsOutput, error });
      logger.log(`❌ ${testPath}`);
    }
  }

  onEnd() {
    this.errors.forEach(({ test, result, error, stepsOutput }) => {
      logger.log(`TEST: ${test.titlePath().filter(Boolean).join(' > ')}`);
      logger.log(error.message);
      logger.log('\nACTUAL OUTPUT:\n');
      // @ts-expect-error actual property exists
      logger.log(error.matcherResult?.actual);
      logger.log(`\nSTEPS:\n`);
      logger.log(stepsOutput);
      // if (process.env.DEBUG) logger.dir(result, { depth: null });
      logger.log('');
    });
    logger.log(`Tests: ${this.tests}, failed: ${this.errors.length}.`);
    process.exit(this.errors.length);
  }
}

function buildStepsOutput(test: TestCase, result: TestResult) {
  return [`${test.title} (${result.duration}ms)`, ...formatSteps(result.steps, 2)].join('\n');
}

function formatSteps(steps: TestStep[] = [], indent = 0): string[] {
  return steps.flatMap((step) => [
    `${' '.repeat(indent)} ${step.category} ${step.title} (${step.duration}ms)`,
    ...formatSteps(step.steps, indent + 2),
  ]);
}

function roundDurations(item: { duration: number; steps?: TestStep[] }) {
  item.duration = round(item.duration);
  item.steps?.forEach(roundDurations);
}

/**
 * Reads the spec file and extracts the expected YAML string.
 * /* EXPECTED: {title}
 * ...
 * EXPECTED-END *\/
 */
function extractExpected(filePath: string, testTitle: string): string {
  const fileContent = readFileSync(filePath, 'utf-8');
  const escapedTitle = testTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = fileContent.match(
    new RegExp(`\\/\\* EXPECTED: ${escapedTitle}\\n([\\s\\S]*?)EXPECTED-END \\*\\/`),
  );
  if (!match) throw new Error(`Expected output not found for test: "${testTitle}" in ${filePath}`);
  return match[1].trim();
}
