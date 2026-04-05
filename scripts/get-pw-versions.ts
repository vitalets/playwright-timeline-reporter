/**
 * Fetches stable @playwright/test versions from npm, groups them by major.minor,
 * and outputs a JSON array of the latest stable patch per minor series.
 * Excludes any pre-release versions (beta, rc, alpha).
 *
 * Usage: npx tsx scripts/get-pw-versions.ts <minVersion>
 * Example: npx tsx scripts/get-pw-versions.ts 1.45
 */
import { execSync } from 'node:child_process';

const minVersion = process.argv[2];
if (!minVersion || !/^\d+\.\d+$/.test(minVersion)) {
  console.error('Usage: npx tsx scripts/get-pw-versions.ts <major.minor>  (e.g. 1.45)');
  process.exit(1);
}

const [minMajor, minMinor] = minVersion.split('.').map(Number);

const raw = execSync('npm view @playwright/test versions --json', { encoding: 'utf8' });
const allVersions: string[] = JSON.parse(raw);

function minorKey(version: string): string {
  const [major, minor] = version.split('.').map(Number);
  return `${major}.${minor}`;
}

function isAboveMin(version: string): boolean {
  const [major, minor] = version.split('.').map(Number);
  if (major !== minMajor) return major > minMajor;
  return minor >= minMinor;
}

function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

const stable = allVersions.filter((v) => !v.includes('-') && isAboveMin(v));

// Group by major.minor, keep latest patch per group
const groups = new Map<string, string>();
for (const v of stable) {
  const key = minorKey(v);
  const current = groups.get(key);
  if (!current || compareVersions(v, current) > 0) {
    groups.set(key, v);
  }
}

// Sort groups by minor key ascending
const sorted = [...groups.entries()]
  .sort(([a], [b]) => {
    const [ma, na] = a.split('.').map(Number);
    const [mb, nb] = b.split('.').map(Number);
    return ma !== mb ? ma - mb : na - nb;
  })
  .map(([, v]) => v);

console.log(JSON.stringify(sorted));
