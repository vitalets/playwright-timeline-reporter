/**
 * Helpers used on nodejs level to run Playwright tests via child process.
 * Keep this file as js, because it works with globPatterns of node:test.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { expect } from '@playwright/test';

export { test };

const defaultEnv = {
  ...process.env,
  FORCE_COLOR: '0',
  PLAYWRIGHT_FORCE_TTY: '0',
  PLAYWRIGHT_TIMELINE_DEBUG: '1',
};

export function getDir(importMeta) {
  return path.basename(importMeta.dirname);
}

/** Compare numeric release versions, treating omitted parts as zero and ignoring prerelease suffixes. */
export function pwVersion(op, version) {
  const installedVersion = createRequire(import.meta.url)('@playwright/test/package.json').version;
  const current = installedVersion.split('-')[0].split('.').map(Number);
  const target = version.split('-')[0].split('.').map(Number);
  let difference = 0;
  for (let i = 0; i < Math.max(current.length, target.length); i++) {
    difference = (current[i] ?? 0) - (target[i] ?? 0);
    if (difference !== 0) break;
  }
  switch (op) {
    case '>':
      return difference > 0;
    case '>=':
      return difference >= 0;
    case '<':
      return difference < 0;
    case '<=':
      return difference <= 0;
    default:
      throw new Error(`Unsupported version operator: ${op}`);
  }
}

export function runPlaywright(t, { flags = '', env: extraEnv = {} } = {}) {
  const cwd = path.dirname(t.filePath);
  const reportDir = getReportDir(cwd, t.name);
  const outputFile = path.join(cwd, 'out', reportDir, 'index.html');
  const env = {
    PLAYWRIGHT_TIMELINE_OUTPUT_FILE: outputFile,
    ...defaultEnv,
    ...extraEnv,
  };
  const result = spawnSync(
    'npx',
    [
      'playwright',
      'test',
      '--config=playwright.config.ts',
      '--reporter=../_helpers/reporter.ts',
      ...flags.split(' ').filter(Boolean),
    ],
    { cwd, env },
  );

  if (result.error) {
    throw new Error(`Failed to spawn playwright: ${result.error.message}`);
  }

  if (result.status !== 0 && result.status !== 1) {
    const output = (result.stdout ?? '') + (result.stderr ?? '');
    throw new Error(`Playwright exited with code ${result.status}.\n${output}`);
  }

  // todo: add smart output when needed
  // console.log(result.stdout);

  const lanesFile = path.join(path.dirname(outputFile), 'lanes.json');
  return JSON.parse(fs.readFileSync(lanesFile, 'utf8'));
}

export function assertLanes(lanes, expected) {
  try {
    expect(lanes).toEqual(expected);
  } catch (e) {
    throw new Error(e.message);
  }
}

function getReportDir(cwd, testName) {
  const dir = path.basename(cwd);
  // strip directory name from the test name, because it is redundant and makes it too long.
  const truncatedTestName = testName.replace(dir, '').trim();
  return truncatedTestName ? filenamify(truncatedTestName) : '';
}

function filenamify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
