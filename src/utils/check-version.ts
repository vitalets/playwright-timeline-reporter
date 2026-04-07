/**
 * Utility for comparing semver-like version strings against a constraint.
 */

/* eslint-disable visual/complexity */

type Operator = '<=' | '>=' | '<' | '>' | '=';

/**
 * Checks whether `version` satisfies `constraint`.
 * Use 'x' as a wildcard for any version part in the constraint.
 * @example checkVersion('1.54.2', '<= 1.54.x') // true
 * @example checkVersion('1.55.0', '<= 1.54.x') // false
 */
export function checkVersion(version: string, constraint: string): boolean {
  const match = constraint.match(/^(<=|>=|<|>|=)\s*(.+)$/);
  if (!match) throw new Error(`Invalid version constraint: "${constraint}"`);
  const operator = match[1] as Operator;
  const diff = compareVersions(version, match[2]);
  switch (operator) {
    case '<=':
      return diff <= 0;
    case '>=':
      return diff >= 0;
    case '<':
      return diff < 0;
    case '>':
      return diff > 0;
    case '=':
      return diff === 0;
  }
}

function compareVersions(a: string, b: string): number {
  const aParts = a.split('.').map((n) => parseInt(n, 10) || 0);
  const bParts = b.split('.');
  for (let i = 0; i < bParts.length; i++) {
    if (bParts[i] === 'x') return 0; // wildcard: treat remaining parts as equal
    const diff = (aParts[i] ?? 0) - (parseInt(bParts[i], 10) || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
