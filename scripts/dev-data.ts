/**
 * Regenerate local dev report fixtures from scenario configs under `dev-data`.
 *
 * Usage:
 *   npm run dev-data
 *   npm run dev-data -- basic
 *   npm run dev-data -- projects
 *   npm run dev-data -- projects-deps
 *   npm run dev-data -- shards
 */
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const DEV_DATA_DIR = 'dev-data';
const requestedDirectory = process.argv[2];
const configPaths = getConfigPaths(requestedDirectory);

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

function getConfigPaths(directoryName?: string) {
  return fs
    .readdirSync(DEV_DATA_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => !directoryName || entry.name === directoryName)
    .map((entry) => `${DEV_DATA_DIR}/${entry.name}/playwright.config.ts`)
    .filter((config) => fs.existsSync(config))
    .sort();
}

async function runTests(configPath: string, extraArgs: string[] = []) {
  await spawnAsync('npx', ['playwright', 'test', '-c', configPath, ...extraArgs]);
}

async function runShards(configPath: string) {
  const firstShard = runTests(configPath, ['--shard=1/2']);
  // shift shard runs on 1s
  await delay(1000);
  const secondShard = runTests(configPath, ['--shard=2/2']);
  await Promise.all([firstShard, secondShard]);

  const shardsPath = configPath.replace('playwright.config.ts', 'blob-report');
  await spawnAsync('npx', ['playwright', 'merge-reports', '-c', configPath, shardsPath]);
}

function spawnAsync(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', () => resolve());
  });
}
