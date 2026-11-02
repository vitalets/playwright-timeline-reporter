import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getReportDir } from '../_helpers/playwright.js';
import { parsePlaywrightUserAgent } from '../../../dist/report/data/user-agent.js';

const configDir = fileURLToPath(new URL('./', import.meta.url));
const cli = fileURLToPath(new URL('../../../node_modules/playwright/cli.js', import.meta.url));

export function buildMergeReports(t, fixture) {
  const reportDir = getReportDir(configDir, t);
  const fixtureDir = fileURLToPath(new URL(`../../merge-reports/${fixture}/`, import.meta.url));
  const blobDir = path.join(reportDir, 'blobs');
  fs.mkdirSync(blobDir, { recursive: true });
  for (const file of fs.readdirSync(fixtureDir).filter((file) => file.endsWith('.jsonl'))) {
    execFileSync('zip', ['-j', path.join(blobDir, `${file}.zip`), path.join(fixtureDir, file)], {
      timeout: 20000,
      stdio: 'pipe',
    });
  }
  merge(reportDir, blobDir);
  const markdown = fs.readFileSync(path.join(reportDir, 'index.md'), 'utf8');
  const html = fs.readFileSync(path.join(reportDir, 'index.html'), 'utf8');
  const run = readHtmlData(html, 'run-info');
  const attempts = readHtmlData(html, 'timeline-data');
  return { markdown, run, attempts };
}

export function expectGroups({ markdown }, expectedGroups) {
  assert.deepEqual(readSections(markdown), ['TOTAL TIME', ...expectedGroups]);
}

export function expectUniqueMermaidIds({ markdown }) {
  const rawSections = [...markdown.matchAll(/section (.+)/g)].map((match) => match[1]);
  assert.equal(new Set(rawSections).size, rawSections.length);
  const ids = [...markdown.matchAll(/ :(?:active, |done, |crit, )?(\w+),/g)].map(
    (match) => match[1],
  );
  assert.equal(new Set(ids).size, ids.length);
}

export function expectReportIdentities({ run, attempts }) {
  assert.equal(run.reporterError, undefined);
  assert.deepEqual(
    [...new Set(attempts.map((attempt) => attempt.mergeReportId))].sort(),
    Object.keys(run.mergeReports).sort(),
  );
}

export function expectOsTimings({ markdown, run }, expectedOS) {
  const reports = Object.values(run.mergeReports);
  const start = Math.min(...reports.map((report) => report.startTime));
  const osTotals = [...markdown.matchAll(/ :(os\d+total), (2000-01-01 [\d:.]+), ([\d.]+)ms/g)];
  assert.equal(osTotals.length, expectedOS.length);
  for (const [index, os] of expectedOS.entries()) {
    const group = reports.filter(
      (report) => parsePlaywrightUserAgent(report.userAgent).os.toLowerCase() === os.toLowerCase(),
    );
    const groupStart = Math.min(...group.map((report) => report.startTime));
    const groupEnd = Math.max(...group.map((report) => report.startTime + report.duration));
    assert.equal(
      osTotals[index][2],
      `2000-01-01 ${new Date(groupStart - start).toISOString().slice(11, 23)}`,
    );
    // Epoch-sized timestamps lose sub-millisecond precision during addition.
    assert.ok(Math.abs(Number(osTotals[index][3]) - (groupEnd - groupStart)) < 0.001);
  }
}

export function readSections(markdown) {
  return [...markdown.matchAll(/section (.+)/g)].map((match) =>
    match[1].replaceAll('\u200b', '').replaceAll('\u00a0', ' '),
  );
}

function merge(reportDir, blobs) {
  execFileSync(
    process.execPath,
    [cli, 'merge-reports', blobs, '--reporter=../../../dist/index.js'],
    {
      cwd: configDir,
      timeout: 20000,
      env: {
        ...process.env,
        GITHUB_STEP_SUMMARY: '',
        PLAYWRIGHT_TIMELINE_OUTPUT_FILE: path.join(reportDir, 'index.html'),
        PLAYWRIGHT_TIMELINE_MARKDOWN: path.join(reportDir, 'index.md'),
      },
      stdio: 'pipe',
    },
  );
}

function readHtmlData(html, id) {
  return JSON.parse(html.match(new RegExp(`<script[^>]*id="${id}"[^>]*>([\\s\\S]*?)</script>`))[1]);
}
