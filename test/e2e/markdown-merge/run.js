import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { cleanupReports, getReportDir } from '../_helpers/playwright.js';
import { MarkdownReporterData } from '../../../dist/markdown/reporter-data.js';
import { renderMarkdown } from '../../../dist/markdown/render.js';

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
  assert.match(markdown, /Total time: \*\*\d+ ms\*\*/);
  assert.deepEqual(
    [...markdown.matchAll(/section (.+)/g)].map((match) =>
      match[1].replaceAll('\u200b', '').trim(),
    ),
    ['Shard 1', 'Worker 1', 'Shard 2', 'Worker 1'],
  );
  const totals = [...markdown.matchAll(/Total :(s\d+total), 2000-01-01 00:00:00.000, (\d+)ms/g)];
  assert.equal(totals.length, 2);
  const durations = [...markdown.matchAll(/ :done, s\d+w0t0, 2000-01-01 00:00:00.000, (\d+)ms/g)];
  assert.deepEqual(
    totals.map((match) => match[2]),
    durations.map((match) => match[1]),
  );
  const ids = [...markdown.matchAll(/ :(?:done, |crit, )?(s\w+),/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal((markdown.match(/ :done,/g) ?? []).length, 2);
  assert.match(markdown, /```\n$/);
  const html = fs.readFileSync(path.join(reportDir, 'index.html'), 'utf8');
  const attempts = readHtmlData(html, 'timeline-data');
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
      MARKDOWN_OUTPUT_FILE: markdownFile,
      INTERNAL_REPORT_ID: identity,
    });

    const markdown = fs.readFileSync(markdownFile, 'utf8');
    assert.match(markdown, /Timeline omitted: Report identity unavailable/);
    assert.doesNotMatch(markdown, /```mermaid/);
  });
}

test('worker numbering restarts at one in each shard while preserving totals and alignment', () => {
  const project = { project: () => ({ name: 'project' }) };
  const data = new MarkdownReporterData(
    {},
    { suites: [project] },
    {
      1: { reportId: '1', shardIndex: 2 },
      2: { reportId: '2', shardIndex: 1 },
    },
  );
  for (const [id, start, duration, slot] of [
    ['1', 10000, 100, 0],
    ['1', 10050, 50, 1],
    ['2', 20000, 500, 0],
    ['2', 20200, 500, 1],
  ]) {
    data.addTestResult(
      { parent: project },
      {
        status: 'passed',
        startTime: new Date(start),
        duration,
        workerIndex: id === '1' ? slot + 10 : slot,
        parallelIndex: slot,
      },
      id,
    );
  }
  const markdown = renderMarkdown(data.build());
  assert.match(markdown, /Total time: \*\*700 ms\*\*/);
  assert.deepEqual(
    [...markdown.matchAll(/section (.+)/g)].map((match) =>
      match[1].replaceAll('\u200b', '').trim(),
    ),
    ['Shard 1', 'Worker 1', 'Worker 2', 'Shard 2', 'Worker 1', 'Worker 2'],
  );
  const sections = [...markdown.matchAll(/section (.+)/g)].map((match) => match[1]);
  assert.equal(new Set(sections).size, sections.length);
  assert.match(markdown, /Total :s0total, 2000-01-01 00:00:00.000, 700ms/);
  assert.match(markdown, /Total :s1total, 2000-01-01 00:00:00.000, 100ms/);
  assert.match(markdown, /:done, s0w1t0, 2000-01-01 00:00:00.200, 500ms/);
  assert.match(markdown, /:done, s1w0t0, 2000-01-01 00:00:00.000, 100ms/);
});

test('a standalone shard and merged reports without shard metadata keep their identities', () => {
  const project = { project: () => ({ name: 'project' }) };
  for (const [config, reports, id, labels] of [
    [{ shard: { current: 3, total: 4 } }, undefined, undefined, ['Shard 3', 'Worker 1']],
    [{}, { 7: { reportId: '7' } }, '7', ['Report 7', 'Worker 1']],
  ]) {
    const data = new MarkdownReporterData(config, { suites: [project] }, reports);
    data.addTestResult(
      { parent: project },
      {
        status: 'passed',
        startTime: new Date(10000),
        duration: 100,
        workerIndex: 0,
        parallelIndex: 0,
      },
      id,
    );
    assert.deepEqual(
      [...renderMarkdown(data.build()).matchAll(/section (.+)/g)].map((match) => match[1].trim()),
      labels,
    );
  }
});

function merge(reportDir, env = {}) {
  playwright(['merge-reports', blobs, '--config=playwright.config.ts'], {
    HTML_OUTPUT_FILE: path.join(reportDir, 'index.html'),
    MARKDOWN_OUTPUT_FILE: path.join(reportDir, 'index.md'),
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
      CORRUPT_REPORT_ID: '',
      ...env,
    },
    stdio: 'pipe',
  });
}

function readHtmlData(html, id) {
  return JSON.parse(html.match(new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)</script>`))[1]);
}
