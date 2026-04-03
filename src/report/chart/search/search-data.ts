/**
 * Builds a replaceable in-memory search index for the report command palette.
 */
import { ChartData } from '../../data/index.js';
import { ChartSpan } from '../../data/tests.js';
import type { TestTimings } from '../../../test-timings/types.js';

export type SearchResultGroup = 'Tests' | 'Files' | 'Hooks / Fixtures' | 'Errors';
export type SearchResultKind = 'test' | 'file' | 'hookFixture' | 'error';

export type SearchResult = {
  id: string;
  kind: SearchResultKind;
  group: SearchResultGroup;
  preHeader?: string;
  label: string;
  filePath?: string;
  tags?: string[];
  searchText: string;
  focusField: 'spanGroupId' | 'filePath' | 'testId' | 'spanId';
  focusValue: string;
};

type SearchResultBuckets = {
  tests: Map<string, SearchResult>;
  files: Map<string, SearchResult>;
  hookFixtures: Map<string, SearchResult>;
  errors: Map<string, SearchResult>;
};

type WorkerTestRun = ChartData['workers'][number]['tests'][number];

export function buildSearchResults(chartData: ChartData): SearchResult[] {
  const buckets = createSearchResultBuckets();
  chartData.workers.forEach((worker) => worker.tests.forEach((testRun) => addTestRunResults(buckets, testRun)));
  return flattenSearchResults(buckets);
}

export function searchResults(results: SearchResult[], query: string): SearchResult[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];
  return results.filter((result) => result.searchText.toLowerCase().includes(normalizedQuery));
}

function createSearchResultBuckets(): SearchResultBuckets {
  return {
    tests: new Map<string, SearchResult>(),
    files: new Map<string, SearchResult>(),
    hookFixtures: new Map<string, SearchResult>(),
    errors: new Map<string, SearchResult>(),
  };
}

function addTestRunResults(buckets: SearchResultBuckets, { test, spans }: WorkerTestRun) {
  buckets.tests.set(test.testId, createTestResult(test));
  addFileResult(buckets.files, test.testBody.location.file, test.projectName);
  spans.forEach((span) => addSpanResults(buckets, span, test.projectName));
}

function addSpanResults(buckets: SearchResultBuckets, span: ChartSpan, projectName: string) {
  addFileResult(buckets.files, span.span.location.file, projectName);
  addHookFixtureResult(buckets.hookFixtures, span);
  addErrorResult(buckets.errors, span);
}

function createTestResult(test: TestTimings): SearchResult {
  const testTitle = getTestTitle(test.testBody.title);
  const suiteTitle = getSuiteTitle(test.testBody.title);
  const filePath = test.testBody.location.file;
  const titlePath = [test.projectName, suiteTitle].filter(Boolean).join(' › ');

  return {
    id: `test:${test.testId}`,
    kind: 'test',
    group: 'Tests',
    preHeader: titlePath || undefined,
    label: testTitle,
    filePath: filePath || undefined,
    tags: test.tags.length ? test.tags : undefined,
    searchText: [
      test.testBody.title.join(' '),
      filePath,
      suiteTitle,
      test.projectName,
      test.tags.join(' '),
    ].join(' '),
    focusField: 'testId',
    focusValue: test.testId,
  };
}

function addFileResult(files: SearchResultBuckets['files'], filePath: string, projectName: string) {
  if (files.has(filePath)) return;
  files.set(filePath, createFileResult(filePath, projectName));
}

function createFileResult(filePath: string, projectName: string): SearchResult {
  return {
    id: `file:${filePath}`,
    kind: 'file',
    group: 'Files',
    preHeader: projectName || 'All projects',
    label: filePath,
    searchText: [filePath, projectName].join(' '),
    focusField: 'filePath',
    focusValue: filePath,
  };
}

function addHookFixtureResult(hookFixtures: SearchResultBuckets['hookFixtures'], span: ChartSpan) {
  if (span.span.type === 'testBody' || hookFixtures.has(span.spanGroupId)) return;
  hookFixtures.set(span.spanGroupId, createHookFixtureResult(span));
}

function addErrorResult(errors: SearchResultBuckets['errors'], span: ChartSpan) {
  if (!span.span.error || errors.has(span.spanId)) return;
  errors.set(span.spanId, createErrorResult(span));
}

function flattenSearchResults({ tests, files, hookFixtures, errors }: SearchResultBuckets): SearchResult[] {
  return [...tests.values(), ...files.values(), ...hookFixtures.values(), ...errors.values()];
}

function createHookFixtureResult(span: ChartSpan): SearchResult {
  const scope = 'scope' in span.span ? span.span.scope : 'test';
  const stage = 'stage' in span.span ? span.span.stage : '';

  return {
    id: `hook-fixture:${span.spanGroupId}`,
    kind: 'hookFixture',
    group: 'Hooks / Fixtures',
    preHeader: buildTestTitlePath(span.test),
    label: span.title,
    filePath: span.span.location.file || undefined,
    searchText: [span.title, span.span.location.file, scope, stage].join(' '),
    focusField: 'spanGroupId',
    focusValue: span.spanGroupId,
  };
}

function createErrorResult(span: ChartSpan): SearchResult {
  const message = span.span.error?.message?.split('\n')[0]?.trim() || 'Unknown error';
  const isTestBody = span.span.type === 'testBody';
  const titleParts = isTestBody
    ? [span.test.projectName, ...span.test.testBody.title]
    : [span.test.projectName, ...span.test.testBody.title, span.title];
  const preHeader = titleParts.filter(Boolean).join(' › ');

  return {
    id: `error:${span.spanId}`,
    kind: 'error',
    group: 'Errors',
    preHeader: preHeader || undefined,
    label: message,
    filePath: span.span.location.file || undefined,
    searchText: [message, span.title, span.span.location.file].join(' '),
    focusField: 'spanId',
    focusValue: span.spanId,
  };
}

function getSuiteTitle(titlePath: string[]) {
  return titlePath.slice(0, -1).join(' › ');
}

function getTestTitle(titlePath: string[]) {
  return titlePath[titlePath.length - 1] || titlePath.join(' › ');
}

function buildTestTitlePath(test: TestTimings): string {
  return [test.projectName, ...test.testBody.title].filter(Boolean).join(' › ');
}
