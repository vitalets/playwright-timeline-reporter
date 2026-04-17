/**
 * Fetches stable @playwright/test versions from npm and outputs a JSON array
 * of unique major.minor versions above the given minimum.
 * Excludes any pre-release versions (beta, rc, alpha).
 *
 * Usage: node scripts/get-pw-versions.ts <major.minor>
 * Example: node scripts/get-pw-versions.ts 1.45
 */
import { execSync } from 'node:child_process';

type VersionInfo = { major: number; minor: number };

const minVersion = process.argv[2];
const logger = console;

if (!minVersion || !/^\d+\.\d+$/.test(minVersion)) {
  logger.error('Usage: node scripts/get-pw-versions.ts <major.minor>  (e.g. 1.45)');
  process.exit(1);
}

const { major: minMajor, minor: minMinor } = parseVersion(minVersion);
const cmdOutput = execSync('npm view @playwright/test versions --json', { encoding: 'utf8' });
const allVersions: string[] = JSON.parse(cmdOutput);
const versions = allVersions
  .filter(isStableVersion)
  .map(parseVersion)
  .filter(isAboveMinVersion)
  .sort(acsendingSorter)
  .map(stringifyVersion);
const uniqueVersions = [...new Set(versions)];

logger.log(JSON.stringify(uniqueVersions));

function isStableVersion(version: string) {
  // Exclude pre-release versions (e.g. 1.59.0-beta-1774995564000")
  return !version.includes('-');
}

function isAboveMinVersion({ major, minor }: VersionInfo) {
  return major > minMajor || (major === minMajor && minor >= minMinor);
}

function acsendingSorter(a: VersionInfo, b: VersionInfo) {
  return a.major === b.major ? a.minor - b.minor : a.major - b.major;
}

function parseVersion(version: string) {
  const [major, minor] = version.split('.').map(Number);
  return { major, minor };
}

function stringifyVersion({ major, minor }: VersionInfo) {
  return `${major}.${minor}`;
}
