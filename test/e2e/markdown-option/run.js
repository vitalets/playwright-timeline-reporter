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

test('disabled markdown option writes only HTML', (t) => {
  const reportDir = getReportDir(configDir, t);
  runPlaywright(configDir, reportDir, { MARKDOWN_ENABLED: '0' });

  assertHtml(path.join(reportDir, 'index.html'));
  assert.equal(fs.existsSync(path.join(reportDir, 'index.md')), false);
});

test('markdown option writes HTML and Markdown at default paths', (t) => {
  const reportDir = getReportDir(configDir, t);
  runPlaywright(configDir, reportDir);

  assertMarkdown(path.join(reportDir, 'index.md'));
  assertHtml(path.join(reportDir, 'index.html'));
});

test('markdown string sets a custom output path independently of HTML', (t) => {
  const reportDir = getReportDir(configDir, t);
  const markdownFile = path.join(reportDir, 'custom.md');
  const htmlFile = path.join(reportDir, 'custom.html');
  runPlaywright(configDir, reportDir, {
    MARKDOWN_OUTPUT_FILE: markdownFile,
    HTML_OUTPUT_FILE: htmlFile,
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

test('sharing the report and GitHub summary path preserves content and appends once', (t) => {
  const reportDir = getReportDir(configDir, t);
  const summaryFile = path.join(reportDir, 'summary.md');
  const prefix = 'Existing summary\n';
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(summaryFile, prefix);
  runPlaywright(configDir, reportDir, {
    GITHUB_STEP_SUMMARY: summaryFile,
    MARKDOWN_OUTPUT_FILE: summaryFile,
    HTML_OUTPUT_FILE: path.join(reportDir, 'index.html'),
  });

  const summary = fs.readFileSync(summaryFile, 'utf8');
  assert.ok(summary.startsWith(prefix + '\n\n'));
  assert.equal((summary.match(/### Playwright timeline report/g) ?? []).length, 1);
  assert.match(summary, /```mermaid/);
});

test('GitHub summary retains total time when the chart does not fit', (t) => {
  const prefix = 'x'.repeat(SUMMARY_BUDGET - 200);
  const { summary, markdown } = runWithSummary(t, prefix);

  assert.ok(summary.startsWith(prefix + '\n\n'));
  assert.match(summary, /Diagram omitted: GitHub step summary size budget exceeded/);
  assert.match(summary, /Total time: \*\*\d+ ms\*\*/);
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

function runWithSummary(t, prefix) {
  const reportDir = getReportDir(configDir, t);
  fs.mkdirSync(reportDir, { recursive: true });
  const summaryFile = path.join(reportDir, 'summary.md');
  const markdownFile = path.join(reportDir, 'index.md');
  fs.writeFileSync(summaryFile, prefix);
  runPlaywright(configDir, reportDir, {
    GITHUB_STEP_SUMMARY: summaryFile,
    MARKDOWN_OUTPUT_FILE: markdownFile,
    HTML_OUTPUT_FILE: path.join(reportDir, 'index.html'),
  });
  return {
    summary: fs.readFileSync(summaryFile, 'utf8'),
    markdown: fs.readFileSync(markdownFile, 'utf8'),
  };
}

function assertMarkdown(file) {
  const markdown = fs.readFileSync(file, 'utf8');
  assert.match(
    markdown,
    /^### Playwright timeline report\n\nTotal time: \*\*\d+ ms\*\*\n\n```mermaid/,
  );
  assert.match(markdown, /```\n$/);
  assert.equal((markdown.match(/ :done,/g) ?? []).length, 1);
}

function assertHtml(file) {
  const html = fs.readFileSync(file, 'utf8');
  assert.match(html, /<html/);
  assert.match(html, /passing attempt/);
}
