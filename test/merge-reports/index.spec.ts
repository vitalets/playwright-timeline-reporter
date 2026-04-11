import path from 'node:path';
import { test, expect } from '@playwright/test';
import { MergeReports } from '../../src/merge-reports.js';

test.describe('MergeSharding', () => {
  test('success commands', () => {
    expectSuccess('playwright merge-reports ./test/merge-reports/data');
    expectSuccess('npx playwright merge-reports ./test/merge-reports/data');
    expectSuccess('npx playwright merge-reports -c playwright.config.ts ./test/merge-reports/data');
    expectSuccess(
      'npx playwright merge-reports --config playwright.config.ts ./test/merge-reports/data',
    );
    expectSuccess('npx playwright merge-reports ./test/merge-reports/data --reporter html');
    expectSuccess('npx playwright merge-reports ./test/merge-reports/data --reporter=html');
    expectSuccess(
      'npx playwright merge-reports ./test/merge-reports/data --config=playwright.config.ts',
    );
    expectSuccess('npx playwright merge-reports --reporter=html ./test/merge-reports/data');
    expectSuccess('npx playwright merge-reports --reporter html ./test/merge-reports/data');
    expectSuccess(
      'npx playwright merge-reports --config=playwright.config.ts ./test/merge-reports/data',
    );
    expectSuccess(
      'npx playwright merge-reports --config playwright.config.ts --reporter=html ./test/merge-reports/data',
    );
    withCwd(path.resolve('test/merge-reports/data'), () => {
      expectSuccess('playwright merge-reports');
      expectSuccess('playwright merge-reports --reporter=html');
      expectSuccess('playwright merge-reports --reporter html');
    });
  });

  test('error commands', () => {
    expectError('playwright merge-reports foo', 'The merge reports directory does not exist: foo');
    expectError(
      'playwright merge-reports --reporter html foo',
      'The merge reports directory does not exist: foo',
    );
    expectError(
      'playwright merge-reports',
      'No report files found in the merge reports directory: .',
    );
    withCwd(path.resolve('test/merge-reports/data-invalid'), () => {
      expectError(
        'playwright merge-reports',
        'Failed to extract shard info from the report file: report.jsonl',
      );
    });
  });
});

function expectSuccess(cmd: string) {
  const mr = new MergeReports();
  mr.tryProcessReportFiles(cmd.split(' '));

  expect(mr.reports).toEqual({
    '1': expect.objectContaining({
      reportId: '1',
      shardIndex: expect.any(Number),
    }),
    '2': expect.objectContaining({
      reportId: '2',
      shardIndex: expect.any(Number),
    }),
  });
  expect(mr.error).toBeUndefined();
}

function expectError(cmd: string, error: string) {
  const mr = new MergeReports();
  mr.tryProcessReportFiles(cmd.split(' '));

  expect(mr.error).toContain(error);
}

function withCwd(cwd: string, fn: () => void) {
  const originalCwd = process.cwd();
  process.chdir(cwd);
  try {
    fn();
  } finally {
    process.chdir(originalCwd);
  }
}
