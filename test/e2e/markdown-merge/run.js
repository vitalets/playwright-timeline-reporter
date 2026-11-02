import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cleanupReports, getReportDir } from '../_helpers/playwright.js';

const configDir = fileURLToPath(new URL('./', import.meta.url));
const cli = fileURLToPath(new URL('../../../node_modules/playwright/cli.js', import.meta.url));
const blobs = path.join(configDir, 'reports', 'blobs');

before(() => {
  cleanupReports(configDir);
  for (const shard of [1, 2]) {
    playwright(['test', '--reporter=blob', `--shard=${shard}/2`], {
      PLAYWRIGHT_BLOB_OUTPUT_FILE: path.join(blobs, `${shard}.zip`),
    });
  }
});

test('merging preserves separate shards and HTML attempt identities', (t) => {
  const reportDir = getReportDir(configDir, t);
  merge(reportDir);

  const markdown = fs.readFileSync(path.join(reportDir, 'index.md'), 'utf8');
  assert.match(markdown, /section TOTAL TIME\n    [\d.]+(?:ms|s) :active, runTotal,/);
  assert.doesNotMatch(markdown, /Total test time:|runStart|runEnd/);
  assert.match(markdown, /    title Test distribution by shard and worker\n/);
  assert.deepEqual(
    [...markdown.matchAll(/section (.+)/g)].map((match) =>
      match[1].replaceAll('\u200b', '').trim(),
    ),
    ['TOTAL TIME', 'SHARD 1', 'Worker 1', 'SHARD 2', 'Worker 1'],
  );
  const totals = [
    ...markdown.matchAll(/[\d.]+(?:ms|s) :(s\d+total), (2000-01-01 [\d:.]+), ([\d.]+)ms/g),
  ];
  assert.equal(totals.length, 2);
  assert.notEqual(totals[0][2], totals[1][2]);
  const durations = [...markdown.matchAll(/ :done, s\d+w0t0, (2000-01-01 [\d:.]+), (\d+)ms/g)];
  for (const [index, total] of totals.entries()) {
    assert.ok(total[2] < durations[index][1]);
    assert.ok(Number(total[3]) > Number(durations[index][2]));
  }
  const ids = [...markdown.matchAll(/ :(?:done, |crit, )?(s\w+),/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal((markdown.match(/ :done,/g) ?? []).length, 2);
  assert.match(markdown, /```\n$/);
  const html = fs.readFileSync(path.join(reportDir, 'index.html'), 'utf8');
  const attempts = readHtmlData(html, 'timeline-data');
  const reports = Object.values(readHtmlData(html, 'run-info').mergeReports).sort(
    (a, b) => a.shardIndex - b.shardIndex,
  );
  assert.deepEqual(
    totals.map((match) => Number(match[3])),
    reports.map((report) => report.duration),
  );
  assert.equal(attempts.length, 4);
  assert.deepEqual(attempts.map((attempt) => attempt.mergeReportId).sort(), ['1', '1', '2', '2']);
  assert.equal(readHtmlData(html, 'run-info').reporterError, undefined);
});

test('unresolved merge identity stops HTML writes and omits the Markdown timeline', (t) => {
  const reportDir = getReportDir(configDir, t);
  merge(reportDir, { CORRUPT_REPORT_ID: '1' });

  const html = fs.readFileSync(path.join(reportDir, 'index.html'), 'utf8');
  assert.equal(readHtmlData(html, 'timeline-data').length, 1);
  assert.match(readHtmlData(html, 'run-info').reporterError, /Report identity unavailable/);
  const markdown = fs.readFileSync(path.join(reportDir, 'index.md'), 'utf8');
  assert.match(markdown, /Timeline omitted: Report identity unavailable/);
  assert.doesNotMatch(markdown, /```mermaid/);
});

for (const identity of ['', 'unknown']) {
  test(`internal collector reports ${identity || 'missing'} merge identity`, (t) => {
    const reportDir = getReportDir(configDir, t);
    const markdownFile = path.join(reportDir, 'index.md');
    playwright(['test', '--reporter=./internal-reporter.js'], {
      PLAYWRIGHT_TIMELINE_MARKDOWN: markdownFile,
      INTERNAL_REPORT_ID: identity,
    });

    const markdown = fs.readFileSync(markdownFile, 'utf8');
    assert.match(markdown, /Timeline omitted: Report identity unavailable/);
    assert.doesNotMatch(markdown, /```mermaid/);
  });
}

function merge(reportDir, env = {}) {
  playwright(['merge-reports', blobs, '--config=playwright.config.ts'], {
    PLAYWRIGHT_TIMELINE_OUTPUT_FILE: path.join(reportDir, 'index.html'),
    PLAYWRIGHT_TIMELINE_MARKDOWN: path.join(reportDir, 'index.md'),
    ...env,
  });
}

function playwright(args, env = {}) {
  return execFileSync(process.execPath, [cli, ...args], {
    cwd: configDir,
    timeout: 20000,
    env: {
      ...process.env,
      GITHUB_STEP_SUMMARY: '',
      PLAYWRIGHT_TIMELINE_OUTPUT_FILE: '',
      PLAYWRIGHT_TIMELINE_MARKDOWN: '',
      CORRUPT_REPORT_ID: '',
      ...env,
    },
    stdio: 'pipe',
  });
}

function readHtmlData(html, id) {
  return JSON.parse(html.match(new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)</script>`))[1]);
}
