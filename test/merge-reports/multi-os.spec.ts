import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import type { TestResult } from '@playwright/test/reporter';
import { MergeReports } from '../../src/merge-reports.js';

test.describe('MergeMultiOS', () => {
  test('merges Ubuntu and Windows reports without shards', () => {
    expectMultiOSReports('data-multi-os', {
      expectedOS: ['ubuntu 24.04', 'windows 10.0'],
      sharded: false,
    });
  });

  test('merges two shards per OS without mixing report identities', () => {
    expectMultiOSReports('data-shards-multi-os', {
      expectedOS: ['ubuntu 24.04', 'windows 10.0'],
      sharded: true,
    });
  });
});

function expectMultiOSReports(
  directory: string,
  { sharded, expectedOS }: { sharded: boolean; expectedOS: string[] },
) {
  const reportsDir = path.join('test/merge-reports', directory);
  const mr = new MergeReports();
  mr.tryProcessReportFiles(['npx', 'playwright', 'merge-reports', reportsDir]);

  const expected = expectedOS.flatMap((os) =>
    (sharded ? [1, 2] : [undefined]).map((shardIndex) => ({
      userAgent: `Playwright/1.58.2 (arm64; ${os}) node/20.20`,
      shardIndex,
      shardTotal: sharded ? 2 : undefined,
    })),
  );
  expect(mr.error).toBeUndefined();
  expect(Object.values(mr.reports)).toEqual(
    expected.map((report, index) =>
      expect.objectContaining({ ...report, reportId: String(index + 1) }),
    ),
  );

  const files = fs
    .readdirSync(reportsDir)
    .filter((file) => file.endsWith('.jsonl'))
    .sort();
  files.forEach((file, index) => {
    const events = fs.readFileSync(path.join(reportsDir, file), 'utf8').trim().split('\n');
    const results = events
      .map((line) => JSON.parse(line))
      .filter((event) => event.method === 'onTestEnd')
      .map((event) => event.params.result as TestResult);
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      if (result.status === 'skipped' || result.workerIndex < 0) continue;
      expect(mr.resolveMergeReportId(result)).toBe(String(index + 1));
    }
  });
  expect(mr.error).toBeUndefined();
}
