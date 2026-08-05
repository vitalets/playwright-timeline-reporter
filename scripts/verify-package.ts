/** Verifies that the packed npm package resolves its published dist entry point for a consumer. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const PACKAGE_NAME = 'playwright-timeline-reporter';

main();

function main() {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'playwright-timeline-reporter-'),
  );

  try {
    const tarballPath = packProject(temporaryDirectory);
    const consumerDirectory = path.join(temporaryDirectory, 'consumer');
    installPackage(consumerDirectory, tarballPath, temporaryDirectory);
    assertConsumerResolvesEntryPoint(consumerDirectory);
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function packProject(temporaryDirectory: string) {
  const packageDirectory = path.join(temporaryDirectory, 'package');
  fs.mkdirSync(packageDirectory);
  const output = runNpm(
    [
      'pack',
      '--json',
      '--pack-destination',
      packageDirectory,
      '--cache',
      path.join(temporaryDirectory, 'cache'),
    ],
    PROJECT_ROOT,
  );
  const [{ filename }] = JSON.parse(output) as [{ filename: string }];
  const tarballPath = path.join(packageDirectory, filename);
  assert.ok(fs.existsSync(tarballPath), `npm pack did not create ${tarballPath}`);
  return tarballPath;
}

function installPackage(
  consumerDirectory: string,
  tarballPath: string,
  temporaryDirectory: string,
) {
  fs.mkdirSync(consumerDirectory);
  runNpm(['init', '--yes'], consumerDirectory);
  runNpm(
    [
      'install',
      '--ignore-scripts',
      '--no-package-lock',
      '--cache',
      path.join(temporaryDirectory, 'cache'),
      tarballPath,
    ],
    consumerDirectory,
  );
}

function assertConsumerResolvesEntryPoint(consumerDirectory: string) {
  const entryPoint = execFileSync(
    process.execPath,
    ['--input-type=commonjs', '--eval', `process.stdout.write(require.resolve('${PACKAGE_NAME}'))`],
    { cwd: consumerDirectory, encoding: 'utf8' },
  );
  assert.match(entryPoint, /node_modules\/playwright-timeline-reporter\/dist\/index\.js$/);
  assert.ok(fs.existsSync(entryPoint), `Consumer entry point does not exist: ${entryPoint}`);
}

function runNpm(args: string[], cwd: string) {
  return execFileSync('npm', args, { cwd, encoding: 'utf8' });
}
