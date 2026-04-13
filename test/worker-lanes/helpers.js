/**
 * Harness helpers for worker-lane snapshot tests: spawns Playwright in a scenario dir,
 * reads the generated lanes.json, and returns lanes data for assertion.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { expect } from '@playwright/test';

const env = {
  ...process.env,
  FORCE_COLOR: '0',
  PLAYWRIGHT_FORCE_TTY: '0',
};

export function runPlaywright(scenarioDir) {
  const result = spawnSync('npx', ['playwright', 'test', '-c', 'playwright.config.ts'], {
    cwd: scenarioDir,
    encoding: 'utf8',
    env,
  });

  if (result.error) {
    throw new Error(`Failed to spawn playwright: ${result.error.message}`);
  }

  const validExitCodes = [0, 1];
  if (!validExitCodes.includes(result.status)) {
    const output = (result.stdout ?? '') + (result.stderr ?? '');
    throw new Error(`Playwright exited with code ${result.status}.\n${output}`);
  }

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
