/** Builds, filters, and sorts view data for the report test-case table. */
import type { TestTimings } from '../../test-timings/types.js';

export type TestTableRow = {
  index: number;
  testId: string;
  title: string;
  status: string;
  duration: number;
  path: string;
  error?: string;
  projectName: string;
  retry: number;
  attempt: number;
  attempts: number;
  mergeReportId?: string;
};

export type SortColumn = 'name' | 'status' | 'duration';
export type SortDirection = 'ascending' | 'descending';
export type TableSort = { column: SortColumn; direction: SortDirection };

export function buildTestTableRows(timings: TestTimings[]): TestTableRow[] {
  const attemptCounts = getAttemptCounts(timings);
  return timings.map((timing, index) => ({
    index,
    testId: timing.testId,
    title: timing.testBody.title.filter(Boolean).join(' › '),
    status: timing.status,
    duration: timing.totalDuration,
    path: formatLocation(timing.testBody.location),
    error: getTestError(timing),
    projectName: timing.projectName,
    retry: timing.retry,
    attempt: timing.retry + 1,
    attempts: attemptCounts.get(timing.testId) ?? 1,
    mergeReportId: timing.mergeReportId,
  }));
}

export function filterAndSortTestTableRows(
  rows: TestTableRow[],
  {
    query,
    sort,
    statuses,
    minDuration,
  }: { query: string; sort: TableSort | null; statuses: string[]; minDuration: number },
): TestTableRow[] {
  const matchingRows = rows.filter(
    (row) =>
      row.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()) &&
      statuses.includes(row.status) &&
      row.duration >= minDuration,
  );
  if (!sort) return matchingRows;

  return matchingRows.toSorted((a, b) => compareRows(a, b, sort));
}

export function getNextSort(sort: TableSort | null, column: SortColumn): TableSort {
  return sort?.column === column
    ? { column, direction: sort.direction === 'ascending' ? 'descending' : 'ascending' }
    : { column, direction: 'ascending' };
}

export function getTableColumns(rows: TestTableRow[]) {
  return {
    error: rows.some((row) => row.error),
    project: new Set(rows.map((row) => row.projectName).filter(Boolean)).size > 1,
    retry: rows.some((row) => row.attempts > 1),
    mergeReport: rows.some((row) => row.mergeReportId),
  };
}

export function getStatusCounts(rows: TestTableRow[]) {
  return Map.groupBy(rows, (row) => row.status);
}

function formatLocation({ file, line, column }: TestTimings['testBody']['location']) {
  return file ? [file, line, column].join(':') : '';
}

function getTestError(timing: TestTimings) {
  return getTestSpans(timing).find((span) => span.error)?.error?.message;
}

function getTestSpans(timing: TestTimings) {
  return [
    ...timing.beforeHooks,
    ...timing.beforeFixtures,
    timing.testBody,
    ...timing.afterHooks,
    ...timing.afterFixtures,
  ];
}

function getAttemptCounts(timings: TestTimings[]) {
  return timings.reduce((counts, timing) => {
    counts.set(timing.testId, (counts.get(timing.testId) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
}

function compareRows(a: TestTableRow, b: TestTableRow, sort: TableSort) {
  const value = getSortValue(a, b, sort.column);
  const orderedValue = sort.direction === 'ascending' ? value : -value;
  return orderedValue || a.index - b.index;
}

function getSortValue(a: TestTableRow, b: TestTableRow, column: SortColumn) {
  switch (column) {
    case 'name':
      return a.title.localeCompare(b.title);
    case 'status':
      return a.status.localeCompare(b.status);
    case 'duration':
      return a.duration - b.duration;
  }
}
