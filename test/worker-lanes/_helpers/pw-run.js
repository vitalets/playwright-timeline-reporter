/**
 * Helpers used on nodejs level to run Playwright tests via child process.
 */
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { expect } from '@playwright/test';

export { test };

const env = {
  ...process.env,
  FORCE_COLOR: '0',
  PLAYWRIGHT_FORCE_TTY: '0',
  PLAYWRIGHT_TIMELINE_DEBUG: '1',
  // todo: provide custom paths for output files (multiple tests in a dir).
  // PLAYWRIGHT_TIMELINE_OUTPUT_FILE
};

export function getDir(importMeta) {
  return path.basename(importMeta.dirname);
}

export function runPlaywright(dir, options = {}) {
  const scenarioDir = path.join(import.meta.dirname, '..', dir);
  const { flags = '', env: extraEnv = {} } = options;
  const result = spawnSync(
    'npx',
    [
      'playwright',
      'test',
      '--config=playwright.config.ts',
      '--reporter=../_helpers/reporter.ts',
      ...flags.split(' ').filter(Boolean),
    ],
    {
      cwd: scenarioDir,
      encoding: 'utf8',
      env: { ...env, ...extraEnv },
    },
  );

  if (result.error) {
    throw new Error(`Failed to spawn playwright: ${result.error.message}`);
  }

  const validExitCodes = [0, 1];
  if (!validExitCodes.includes(result.status)) {
    const output = (result.stdout ?? '') + (result.stderr ?? '');
    throw new Error(`Playwright exited with code ${result.status}.\n${output}`);
  }

  // todo: add smart output when needed
  // console.log(result.stdout);

  const lanesFile = path.join(scenarioDir, 'timeline-report', 'lanes.json');
  return JSON.parse(fs.readFileSync(lanesFile, 'utf8'));
}

export function assertLanes(lanes, expected) {
  try {
    expect(lanes).toEqual(expected);
  } catch (e) {
    throw new Error(e.message);
  }
}
