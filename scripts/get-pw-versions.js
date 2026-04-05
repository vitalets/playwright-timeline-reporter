/**
 * Fetches available @playwright/test versions from npm, filters and groups them
 * by major.minor, and outputs a JSON array of the latest version per minor series.
 * Excludes rc and alpha pre-releases; includes beta.
 *
 * Usage: node scripts/get-pw-versions.js <minVersion>
 * Example: node scripts/get-pw-versions.js 1.45
 */
import { execSync } from 'node:child_process';

const minVersion = process.argv[2];
if (!minVersion || !/^\d+\.\d+$/.test(minVersion)) {
  console.error('Usage: node scripts/get-pw-versions.js <major.minor>  (e.g. 1.45)');
  process.exit(1);
}

const [minMajor, minMinor] = minVersion.split('.').map(Number);

const raw = execSync('npm view @playwright/test versions --json', { encoding: 'utf8' });
const allVersions = JSON.parse(raw);

/**
 * Returns the minor key string "major.minor" for a version string.
 * For beta versions like "1.45.0-beta-1", uses the base version's minor.
 */
function minorKey(version) {
  const base = version.replace(/-.*$/, '');
  const [major, minor] = base.split('.').map(Number);
  return `${major}.${minor}`;
}

/**
 * Returns true if the version's major.minor is >= minVersion.
 */
function isAboveMin(version) {
  const base = version.replace(/-.*$/, '');
  const [major, minor] = base.split('.').map(Number);
  if (major !== minMajor) return major > minMajor;
  return minor >= minMinor;
}

/**
 * Compares two version strings. Stable versions sort before beta of the same base.
 * Within beta, higher beta index wins.
 */
function compareVersions(a, b) {
  const baseA = a.replace(/-.*$/, '');
  const baseB = b.replace(/-.*$/, '');
  const partsA = baseA.split('.').map(Number);
  const partsB = baseB.split('.').map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  // same base version: stable > beta
  const isBetaA = a.includes('-');
  const isBetaB = b.includes('-');
  if (isBetaA !== isBetaB) return isBetaA ? -1 : 1;
  // both beta: compare by beta index
  const betaIdxA = Number(a.split('-').at(-1));
  const betaIdxB = Number(b.split('-').at(-1));
  return betaIdxA - betaIdxB;
}

const filtered = allVersions.filter((v) => {
  if (v.includes('-rc') || v.includes('-alpha')) return false;
  return isAboveMin(v);
});

// Group by major.minor, keep latest per group
const groups = new Map();
for (const v of filtered) {
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
