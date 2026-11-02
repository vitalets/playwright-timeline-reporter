import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { cleanupReports } from '../_helpers/playwright.js';
import { MarkdownReporterData } from '../../../dist/markdown/reporter-data.js';
import { renderMarkdown } from '../../../dist/markdown/render.js';
import { formatDuration } from '../../../dist/markdown/format-duration.js';

import {
  buildMergeReports,
  expectGroups,
  expectUniqueMermaidIds,
  expectReportIdentities,
  expectOsTimings,
  readSections,
} from './helpers.js';

const configDir = fileURLToPath(new URL('./', import.meta.url));

before(() => cleanupReports(configDir));

test('multi-OS reports nest workers directly under each OS', (t) => {
  const report = buildMergeReports(t, 'data-multi-os');

  expectGroups(report, [
    'Ubuntu 24.04',
    '  Worker 1',
    '  Worker 2',
    '  Worker 3',
    'Windows 10.0',
    '  Worker 1',
    '  Worker 2',
    '  Worker 3',
  ]);
  expectUniqueMermaidIds(report);
  expectReportIdentities(report);
  expectOsTimings(report, ['Ubuntu 24.04', 'Windows 10.0']);
});

test('multi-OS shards nest shards and workers under each OS', (t) => {
  const report = buildMergeReports(t, 'data-shards-multi-os');

  expectGroups(report, [
    'Ubuntu 24.04',
    '  SHARD 1',
    '    Worker 1',
    '    Worker 2',
    '    Worker 3',
    '  SHARD 2',
    '    Worker 1',
    '    Worker 2',
    '    Worker 3',
    'Windows 10.0',
    '  SHARD 1',
    '    Worker 1',
    '    Worker 2',
    '    Worker 3',
    '  SHARD 2',
    '    Worker 1',
    '    Worker 2',
    '    Worker 3',
  ]);
  expectUniqueMermaidIds(report);
  expectReportIdentities(report);
  expectOsTimings(report, ['Ubuntu 24.04', 'Windows 10.0']);
});

test('Mermaid formats OS names and sanitizes labels', () => {
  for (const [os, expected] of [
    ['ubuntu 24.04', 'Ubuntu 24.04'],
    ['windows 10.0', 'Windows 10.0'],
    ['macOS 26.3', 'macOS 26.3'],
    [undefined, 'Unknown OS'],
    ['unknown', 'Unknown OS'],
    ['<>', 'Unknown OS'],
    ['ubuntu\nsection <b>24.04</b>', 'Ubuntu section b 24.04 b'],
  ]) {
    const markdown = renderMarkdown({
      span: 1000,
      shards: [os, 'Other OS'].map((name, index) => ({
        id: String(index + 1),
        os: name,
        grouped: true,
        start: 0,
        span: 1000,
        workers: [],
      })),
    });
    const sections = readSections(markdown);
    assert.equal(sections.length, 3);
    assert.ok(sections.includes(expected));
  }
});

test('repeated runs and unknown OS metadata retain distinct report groups', () => {
  const project = { project: () => ({ name: 'project' }) };
  const data = new MarkdownReporterData(
    {},
    { suites: [project] },
    {
      1: {
        reportId: '1',
        userAgent: 'Playwright/1 (x64; ubuntu 24.04)',
        startTime: 1000,
        duration: 3000,
      },
      2: {
        reportId: '2',
        userAgent: 'Playwright/1 (x64; ubuntu 24.04)',
        startTime: 2000,
        duration: 4000,
      },
      3: { reportId: '3', startTime: 3000, duration: 1000 },
    },
  );
  const markdown = renderMarkdown(data.build({ startTime: new Date(1000), duration: 5000 }));
  assert.deepEqual(readSections(markdown), [
    'TOTAL TIME',
    'Ubuntu 24.04',
    '  Report 1',
    '  Report 2',
    'Unknown OS',
  ]);
  assert.match(markdown, /5s :os0total, 2000-01-01 00:00:00.000, 5000ms/);
  assert.match(markdown, /1s :os1total, 2000-01-01 00:00:02.000, 1000ms/);
});

test('shards on the same OS preserve the existing layout', () => {
  const data = new MarkdownReporterData(
    {},
    { suites: [] },
    {
      1: {
        reportId: '1',
        shardIndex: 1,
        userAgent: 'Playwright/1 (x64; ubuntu 24.04)',
        startTime: 1000,
        duration: 2000,
      },
      2: {
        reportId: '2',
        shardIndex: 2,
        userAgent: 'Playwright/1 (x64; ubuntu 24.04)',
        startTime: 2000,
        duration: 2000,
      },
    },
  );
  const markdown = renderMarkdown(data.build({ startTime: new Date(1000), duration: 3000 }));
  assert.deepEqual(readSections(markdown), ['TOTAL TIME', 'SHARD 1', 'SHARD 2']);
  assert.doesNotMatch(markdown, /Ubuntu|os0total/);
});

test('worker numbering restarts at one in each shard while preserving totals and alignment', () => {
  const project = { project: () => ({ name: 'project' }) };
  const data = new MarkdownReporterData(
    {},
    { suites: [project] },
    {
      1: { reportId: '1', shardIndex: 2, startTime: 9000, duration: 2000 },
      2: { reportId: '2', shardIndex: 1, startTime: 18000, duration: 4000 },
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
  const markdown = renderMarkdown(data.build({ startTime: new Date(9000), duration: 13000 }));
  assert.match(markdown, /13s :active, runTotal, 2000-01-01 00:00:00.000, 13000ms/);
  assert.doesNotMatch(markdown, /:vert,|chartEnd/);
  assert.deepEqual(
    [...markdown.matchAll(/section (.+)/g)].map((match) =>
      match[1].replaceAll('\u200b', '').trim(),
    ),
    ['TOTAL TIME', 'SHARD 1', 'Worker 1', 'Worker 2', 'SHARD 2', 'Worker 1', 'Worker 2'],
  );
  const sections = [...markdown.matchAll(/section (.+)/g)].map((match) => match[1]);
  assert.equal(new Set(sections).size, sections.length);
  assert.match(markdown, /4s :s0total, 2000-01-01 00:00:09.000, 4000ms/);
  assert.match(markdown, /2s :s1total, 2000-01-01 00:00:00.000, 2000ms/);
  assert.match(markdown, /:done, s0w1t0, 2000-01-01 00:00:11.200, 500ms/);
  assert.match(markdown, /:done, s1w0t0, 2000-01-01 00:00:01.000, 100ms/);
});

test('projects and restarted workers share three parallel slots within each report', () => {
  const projects = ['first', 'second'].map((name) => ({ project: () => ({ name }) }));
  for (const reports of [undefined, { 1: { reportId: '1', shardIndex: 1 } }]) {
    const data = new MarkdownReporterData({}, { suites: projects }, reports);
    for (let phase = 0; phase < 3; phase++) {
      for (let slot = 0; slot < 3; slot++) {
        data.addTestResult(
          { parent: projects[Math.min(phase, 1)] },
          {
            status: phase === 1 ? 'failed' : 'passed',
            startTime: new Date(10000 + phase * 1000 + slot * 10),
            duration: 100,
            workerIndex: phase * 3 + slot,
            parallelIndex: slot,
          },
          reports ? '1' : undefined,
        );
      }
    }
    const result = data.build({ startTime: new Date(10000), duration: 2200 });
    assert.equal(result.shards[0].workers.length, 3);
    for (const [slot, blocks] of result.shards[0].workers.entries()) {
      assert.deepEqual(blocks, [
        { start: slot * 10, duration: 100, status: 'passed' },
        { start: 1000 + slot * 10, duration: 100, status: 'failed' },
        { start: 2000 + slot * 10, duration: 100, status: 'passed' },
      ]);
    }
    assert.deepEqual(
      [...renderMarkdown(result).matchAll(/section\s+Worker (\d+)/g)].map((match) => match[1]),
      ['1', '2', '3'],
    );
  }
});

test('a standalone shard and merged reports without shard metadata keep their identities', () => {
  const project = { project: () => ({ name: 'project' }) };
  for (const [config, reports, id, labels] of [
    [{ shard: { current: 3, total: 4 } }, undefined, undefined, ['SHARD 3', 'Worker 1']],
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
      [
        ...renderMarkdown(data.build({ startTime: new Date(9000), duration: 2000 })).matchAll(
          /section (.+)/g,
        ),
      ].map((match) => match[1].trim()),
      ['TOTAL TIME', ...labels],
    );
  }
});

test('standalone run boundaries include startup and teardown around worker activity', () => {
  const project = { project: () => ({ name: 'project' }) };
  const data = new MarkdownReporterData({}, { suites: [project] });
  data.addTestResult(
    { parent: project },
    {
      status: 'passed',
      startTime: new Date(12000),
      duration: 500,
      workerIndex: 0,
      parallelIndex: 0,
    },
  );
  const result = data.build({ startTime: new Date(10000), duration: 4000 });
  assert.equal(result.span, 4000);
  assert.equal(result.shards[0].span, 4000);
  assert.equal(result.shards[0].workers[0][0].start, 2000);
  const markdown = renderMarkdown(result);
  assert.match(
    markdown,
    /section TOTAL TIME\n    4s :active, runTotal, 2000-01-01 00:00:00.000, 4000ms/,
  );
  assert.doesNotMatch(markdown, /Total test time:|runStart|runEnd|runBounds|themeCSS/);
  assert.deepEqual(
    [...markdown.matchAll(/section (.+)/g)].map((match) => match[1].trim()),
    ['TOTAL TIME', 'Worker 1'],
  );
  assert.match(markdown, /:done, s0w0t0, 2000-01-01 00:00:02.000, 500ms/);
});

test('empty shards retain their run boundaries alongside active shards', () => {
  const project = { project: () => ({ name: 'project' }) };
  const data = new MarkdownReporterData(
    {},
    { suites: [project] },
    {
      1: { reportId: '1', shardIndex: 1, startTime: 10000, duration: 6000 },
      2: { reportId: '2', shardIndex: 2, startTime: 12000, duration: 2000 },
    },
  );
  data.addTestResult(
    { parent: project },
    {
      status: 'passed',
      startTime: new Date(12500),
      duration: 500,
      workerIndex: 0,
      parallelIndex: 0,
    },
    '2',
  );
  const result = data.build({ startTime: new Date(10000), duration: 6000 });
  assert.equal(result.span, 6000);
  const markdown = renderMarkdown(result);
  assert.match(markdown, /6s :s0total, 2000-01-01 00:00:00.000, 6000ms/);
  assert.match(markdown, /2s :s1total, 2000-01-01 00:00:02.000, 2000ms/);
});

test('durations use readable units at second, minute, and hour boundaries', () => {
  for (const [ms, expected] of [
    [0, '0ms'],
    [999, '999ms'],
    [1000, '1s'],
    [14435, '14s'],
    [33511, '34s'],
    [59999, '1m'],
    [60000, '1m'],
    [74435, '1m 14s'],
    [3599999, '1h'],
    [3600000, '1h'],
    [3674435, '1h 1m'],
    [3660000, '1h 1m'],
    [7199999, '2h'],
  ]) {
    assert.equal(formatDuration(ms), expected);
  }
});
