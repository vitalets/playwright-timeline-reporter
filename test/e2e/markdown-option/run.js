import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanupReports, getReportDir, runPlaywright } from '../_helpers/playwright.js';
import { SUMMARY_BUDGET } from '../../../dist/markdown/github-summary.js';

const configDir = fileURLToPath(new URL('./', import.meta.url));

// Node runs these tests sequentially; they share the default report directory.
before(() => cleanupReports(configDir));

test('disabled Markdown options write only HTML', (t) => {
  const reportDir = getReportDir(configDir, t);
  runPlaywright(configDir, reportDir, { MARKDOWN_ENABLED: '0' });

  assertHtml(path.join(reportDir, 'index.html'));
  assert.equal(fs.existsSync(path.join(reportDir, 'index.md')), false);
});

test('markdownFile writes HTML and Markdown without publishing a summary', (t) => {
  const reportDir = getReportDir(configDir, t);
  const summaryFile = path.join(reportDir, 'summary.md');
  runPlaywright(configDir, reportDir, { GITHUB_STEP_SUMMARY: summaryFile });

  assertMarkdown(path.join(reportDir, 'index.md'));
  assertHtml(path.join(reportDir, 'index.html'));
  assert.equal(fs.existsSync(summaryFile), false);
});

test('markdownCI publishes a summary without a Markdown file', (t) => {
  const reportDir = getReportDir(configDir, t);
  const summaryFile = path.join(reportDir, 'summary.md');
  runPlaywright(configDir, reportDir, {
    MARKDOWN_ENABLED: '0',
    PLAYWRIGHT_TIMELINE_MARKDOWN_CI: 'true',
    PLAYWRIGHT_TIMELINE_OUTPUT_FILE: path.join(reportDir, 'index.html'),
    GITHUB_STEP_SUMMARY: summaryFile,
  });

  assertMarkdown(summaryFile);
  assertHtml(path.join(reportDir, 'index.html'));
  assert.equal(fs.existsSync(path.join(reportDir, 'index.md')), false);
});

for (const value of ['false', '0', 'true', '1']) {
  test(`Markdown environment value ${value} overrides the config boolean`, (t) => {
    const reportDir = getReportDir(configDir, t);
    const enabled = value === 'true' || value === '1';
    runPlaywright(configDir, reportDir, {
      MARKDOWN_ENABLED: enabled ? '0' : '1',
      PLAYWRIGHT_TIMELINE_MARKDOWN_FILE: value,
    });

    assertHtml(path.join(reportDir, 'index.html'));
    const markdownFile = path.join(reportDir, 'index.md');
    if (enabled) assertMarkdown(markdownFile);
    else assert.equal(fs.existsSync(markdownFile), false);
    assert.equal(fs.existsSync(path.join(configDir, value)), false);
  });
}

test('Markdown output environment variable overrides a disabled option independently of HTML', (t) => {
  const reportDir = getReportDir(configDir, t);
  const markdownFile = path.join(reportDir, 'custom.md');
  const htmlFile = path.join(reportDir, 'custom.html');
  runPlaywright(configDir, reportDir, {
    MARKDOWN_ENABLED: '0',
    PLAYWRIGHT_TIMELINE_MARKDOWN_FILE: markdownFile,
    PLAYWRIGHT_TIMELINE_OUTPUT_FILE: htmlFile,
  });

  assertMarkdown(markdownFile);
  assertHtml(htmlFile);
  assert.equal(fs.existsSync(path.join(reportDir, 'index.md')), false);
  assert.equal(fs.existsSync(path.join(reportDir, 'index.html')), false);
});

test('GitHub summary preserves existing content and appends the full report', (t) => {
  const prefix = 'Existing summary: café\n';
  const { summary, markdown } = runWithSummary(t, prefix);
  assert.equal(summary, prefix + '\n\n' + markdown);
});

test('disabled Markdown CI publishing preserves the summary and writes the local report', (t) => {
  const prefix = 'Existing summary\n';
  const { summary, markdown } = runWithSummary(t, prefix, {
    PLAYWRIGHT_TIMELINE_MARKDOWN_CI: 'false',
  });

  assert.match(markdown, /^### Playwright timeline report\n\n```mermaid/);
  assert.equal(summary, prefix);
});

test('sharing the report and GitHub summary path preserves content and appends once', (t) => {
  const reportDir = getReportDir(configDir, t);
  const summaryFile = path.join(reportDir, 'summary.md');
  const prefix = 'Existing summary\n';
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(summaryFile, prefix);
  runPlaywright(configDir, reportDir, {
    GITHUB_STEP_SUMMARY: summaryFile,
    PLAYWRIGHT_TIMELINE_MARKDOWN_FILE: summaryFile,
    MARKDOWN_CI_ENABLED: '1',
    PLAYWRIGHT_TIMELINE_OUTPUT_FILE: path.join(reportDir, 'index.html'),
  });

  const summary = fs.readFileSync(summaryFile, 'utf8');
  assert.ok(summary.startsWith(prefix + '\n\n'));
  assert.equal((summary.match(/### Playwright timeline report/g) ?? []).length, 1);
  assert.match(summary, /```mermaid/);
});

test('GitHub summary explains when the chart does not fit', (t) => {
  const prefix = 'x'.repeat(SUMMARY_BUDGET - 200);
  const { summary, markdown } = runWithSummary(t, prefix);

  assert.ok(summary.startsWith(prefix + '\n\n'));
  assert.match(summary, /Diagram omitted: GitHub step summary size budget exceeded/);
  assert.doesNotMatch(summary, /Total test time:/);
  assert.doesNotMatch(summary, /```mermaid/);
  assert.ok(Buffer.byteLength(summary) <= SUMMARY_BUDGET);
  assert.match(markdown, /```mermaid/);
  assert.match(markdown, /```\n$/);
  assert.doesNotMatch(markdown, /GitHub step summary size budget exceeded/);
});

test('a full GitHub summary remains unchanged while the local report is written', (t) => {
  const prefix = 'é'.repeat(SUMMARY_BUDGET / 2);
  const { summary, markdown } = runWithSummary(t, prefix);

  assert.equal(summary, prefix);
  assert.match(markdown, /```mermaid/);
});

function runWithSummary(t, prefix, env = {}) {
  const reportDir = getReportDir(configDir, t);
  fs.mkdirSync(reportDir, { recursive: true });
  const summaryFile = path.join(reportDir, 'summary.md');
  const markdownFile = path.join(reportDir, 'index.md');
  fs.writeFileSync(summaryFile, prefix);
  runPlaywright(configDir, reportDir, {
    GITHUB_STEP_SUMMARY: summaryFile,
    PLAYWRIGHT_TIMELINE_MARKDOWN_FILE: markdownFile,
    PLAYWRIGHT_TIMELINE_OUTPUT_FILE: path.join(reportDir, 'index.html'),
    MARKDOWN_CI_ENABLED: '1',
    ...env,
  });
  return {
    summary: fs.readFileSync(summaryFile, 'utf8'),
    markdown: fs.readFileSync(markdownFile, 'utf8'),
  };
}

function assertMarkdown(file) {
  const markdown = fs.readFileSync(file, 'utf8');
  assert.match(markdown, /^### Playwright timeline report\n\n```mermaid/);
  assert.match(markdown, /```\n$/);
  assert.equal((markdown.match(/ :done,/g) ?? []).length, 1);
}

function assertHtml(file) {
  const html = fs.readFileSync(file, 'utf8');
  assert.match(html, /<html/);
  assert.match(html, /passing attempt/);
}
