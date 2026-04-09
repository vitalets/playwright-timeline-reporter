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
    const child = spawn(command, args, {
      stdio: ['inherit', 'pipe', 'pipe'],
      cwd,
      env: { ...process.env, ...env },
    });
    let output = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
      process.stdout.write(chunk);
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
      process.stderr.write(chunk);
    });
    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0 || !output.includes('node:internal')) {
        resolve();
        return;
      }

      const details = signal ? `signal ${signal}` : `exit code ${code ?? 'unknown'}`;
      reject(new Error(`Command failed: ${command} ${args.join(' ')} (${details})`));
    });
  });
}
