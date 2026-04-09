/**
 * Build static demo reports by reusing the existing example scripts.
 *
 * Usage:
 * npx tsx scripts/build-demos.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '..');
const EXAMPLE_REPORT_PATH = `${PROJECT_ROOT}/example/timeline-report/index.html`;
const DEMOS_DIR = `${PROJECT_ROOT}/docs/demos`;

main();

function main() {
  fs.mkdirSync(DEMOS_DIR, { recursive: true });

  execSync('npm run example', { cwd: PROJECT_ROOT, stdio: 'inherit' });
  copyReport(`${DEMOS_DIR}/index.html`);

  execSync('npm run example:shards', { cwd: PROJECT_ROOT, stdio: 'inherit' });
  copyReport(`${DEMOS_DIR}/shards.html`);
}

function copyReport(destinationPath: string) {
  fs.copyFileSync(EXAMPLE_REPORT_PATH, destinationPath);
}
