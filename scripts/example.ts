/**
 * Run example tests, either as a plain run or in 2 shards with a 1-second shift and merge.
 *
 * Usage:
 *   npm run example          — plain run
 *   npm run example:shards   — shards run
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const EXAMPLE_DIR = 'example';
const BLOB_REPORT_PATH = 'blob-report';
const isShards = process.argv[2] === '--shards';

void main();

async function main() {
  if (isShards) {
    await runShards();
  } else {
    await runTests();
  }
}

async function runShards() {
  clearBlobReportsDir();

  const firstShard = runTests(['--shard=1/2'], { PWTEST_BLOB_DO_NOT_REMOVE: '1' });
  await delay(1000); // offset the start of the second shard
  const secondShard = runTests(['--shard=2/2'], { PWTEST_BLOB_DO_NOT_REMOVE: '1' });
  await Promise.all([firstShard, secondShard]);

  await mergeReports();
}

function mergeReports() {
  return spawnAsync(
    'npx',
    ['playwright', 'merge-reports', '-c', 'playwright.config.ts', BLOB_REPORT_PATH],
    EXAMPLE_DIR,
  );
}

function clearBlobReportsDir() {
  fs.rmSync(path.join(EXAMPLE_DIR, BLOB_REPORT_PATH), { recursive: true, force: true });
}

function runTests(extraArgs: string[] = [], env?: NodeJS.ProcessEnv) {
  return spawnAsync('npx', ['playwright', 'test', ...extraArgs], EXAMPLE_DIR, env);
}

function spawnAsync(command: string, args: string[], cwd?: string, env?: NodeJS.ProcessEnv) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', cwd, env: { ...process.env, ...env } });
    child.on('error', reject);
    child.on('close', () => resolve());
  });
}
