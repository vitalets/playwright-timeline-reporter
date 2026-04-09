/**
 * Regenerate local dev report fixtures from scenario configs under `scripts/dev-data`.
 *
 * Usage:
 *   npm run dev-data
 *   npm run dev-data -- one-project
 *   npm run dev-data -- two-projects
 *   npm run dev-data -- many-projects
 *   npm run dev-data -- no-projects
 *   npm run dev-data -- projects-deps
 *   npm run dev-data -- shards
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const DEV_DATA_DIR = path.dirname(fileURLToPath(import.meta.url));
const requestedScenario = process.argv[2];
const configPaths = getConfigPaths(requestedScenario);

void main();

async function main() {
  for (const configPath of configPaths) {
    if (configPath.includes('shards')) {
      await runShards(configPath);
    } else {
      await runTests(configPath);
    }
  }
}

function getConfigPaths(scenarioName?: string) {
  return fs
    .readdirSync(DEV_DATA_DIR)
    .filter((name) => name.endsWith('.config.ts'))
    .filter((name) => !scenarioName || name === `${scenarioName}.config.ts`)
    .map((name) => `${DEV_DATA_DIR}/${name}`)
    .sort();
}

async function runTests(configPath: string, extraArgs: string[] = [], env = process.env) {
  await spawnAsync(
    'npx',
    [
      'playwright',
      'test',
      '-c',
      configPath,
      '--output',
      `${DEV_DATA_DIR}/test-results`,
      ...extraArgs,
    ],
    env,
  );
}

async function runShards(configPath: string) {
  const env = {
    ...process.env,
    PLAYWRIGHT_BLOB_OUTPUT_DIR: `${DEV_DATA_DIR}/blob-report`,
    PWTEST_BLOB_DO_NOT_REMOVE: '1',
  };
  const firstShard = runTests(configPath, ['--shard=1/2'], env);
  // shift shard runs on 1s
  await delay(1000);
  const secondShard = runTests(configPath, ['--shard=2/2'], env);
  await Promise.all([firstShard, secondShard]);

  await spawnAsync('npx', [
    'playwright',
    'merge-reports',
    env.PLAYWRIGHT_BLOB_OUTPUT_DIR,
    '-c',
    configPath,
  ]);
}

function spawnAsync(command: string, args: string[], env = process.env) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', env });
    child.on('error', reject);
    child.on('close', () => resolve());
  });
}
