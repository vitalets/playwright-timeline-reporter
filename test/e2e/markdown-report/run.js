import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanupReports, getReportDir, runPlaywright } from '../_helpers/playwright.js';

const configDir = fileURLToPath(new URL('./', import.meta.url));

before(() => cleanupReports(configDir));

test('worker report combines successes and keeps failed retries separate without HTML', (t) => {
  const reportDir = getReportDir(configDir, t);
  runPlaywright(configDir, reportDir);

  const markdown = fs.readFileSync(path.join(reportDir, 'index.md'), 'utf8');
  assert.match(markdown, /```mermaid/);
  assert.equal((markdown.match(/ :done,/g) ?? []).length, 4);
  assert.equal((markdown.match(/ :crit,/g) ?? []).length, 3);
  assert.match(
    markdown,
    /^### Playwright timeline report\n\nTotal test time: \*\*[\d.]+(?:ms|s)\*\*/,
  );
  assert.match(markdown, /    title Test distribution by worker\n/);
  assert.match(markdown, /section \u00a0\u00a0Worker 1/);
  assert.match(markdown, /```\n$/);
  assert.doesNotMatch(markdown, /\|.*\||Each shard starts|Worker.*\//);
  const colors = [...markdown.matchAll(/ :(done|crit),/g)].map((match) => match[1]);
  assert.deepEqual(colors, ['done', 'crit', 'crit', 'done', 'crit', 'done', 'done']);
  // Each green bar covers two successful executions, not a single test.
  const greenDurations = [...markdown.matchAll(/ :done,.*?, ([\d.]+)ms/g)].map((match) =>
    Number(match[1]),
  );
  assert.ok(greenDurations.every((duration) => duration >= 200));
  assert.doesNotMatch(
    markdown,
    /passing attempt|retry attempt|expected failure attempt|skipped attempt/,
  );
  assert.equal(fs.existsSync(path.join(reportDir, 'index.html')), false);
});

test('standalone entry point uses markdown for its custom output path', (t) => {
  const reportDir = getReportDir(configDir, t);
  const markdownFile = path.join(reportDir, 'custom.md');
  runPlaywright(configDir, reportDir, { MARKDOWN_OUTPUT_FILE: markdownFile });

  const markdown = fs.readFileSync(markdownFile, 'utf8');
  assert.match(markdown, /```mermaid/);
  assert.deepEqual(fs.readdirSync(reportDir), ['custom.md']);
  assert.equal(fs.existsSync(path.join(configDir, 'timeline-report')), false);
});
