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
  assert.match(markdown, /Total time: \*\*\d+ ms\*\*/);
  assert.deepEqual(
    [...markdown.matchAll(/section \u00a0\u00a0Worker (\d+)/g)].map((match) => match[1]),
    ['0', '1'],
  );
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
