/**
 * Helpers used on nodejs level to run Playwright tests via child process.
 */
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { expect } from '@playwright/test';

export { test };

type WorkerLanes = string[][];

type RunPlaywrightOptions = {
  flags?: string;
  env?: NodeJS.ProcessEnv;
};

const env = {
  FORCE_COLOR: '0',
  PLAYWRIGHT_FORCE_TTY: '0',
  PLAYWRIGHT_TIMELINE_DEBUG: '1',
  // todo: provide custom paths for output files (multiple tests in a dir).
  // PLAYWRIGHT_TIMELINE_OUTPUT_FILE
};

export function getDir(importMeta: ImportMeta): string {
  return path.basename(importMeta.dirname);
}

export function runPlaywright(
  dir: string,
  { flags = '', env: extraEnv = {} }: RunPlaywrightOptions = {},
): WorkerLanes {
  const scenarioDir = path.join(import.meta.dirname, '..', dir);
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
      env: { ...process.env, ...env, ...extraEnv },
    },
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

  const lanesFile = path.join(scenarioDir, 'timeline-report', 'lanes.json');
  return JSON.parse(fs.readFileSync(lanesFile, 'utf8')) as WorkerLanes;
}

export function assertLanes(lanes: WorkerLanes, expected: WorkerLanes): void {
  try {
    expect(lanes).toEqual(expected);
  } catch (e) {
    throw new Error(e.message);
  }
}
