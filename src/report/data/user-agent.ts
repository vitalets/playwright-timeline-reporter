/**
 * Utilities for parsing Playwright's userAgent string.
 *
 * Playwright userAgent format:
 *   Playwright/${version} (${arch}; ${osIdentifier} ${osVersion}) ${embedder}/${embedderVersion}[ CI/1]
 *
 * Examples:
 *   Playwright/1.50.0 (arm64; macOS 15.2) node/22.9
 *   Playwright/1.50.0 (x64; windows 10.0) node/22.9
 *   Playwright/1.50.0 (x64; ubuntu 22.04) node/22.9
 *   Playwright/1.50.0 (x64; ubuntu 22.04) node/22.9 CI/1
 *   Playwright/unknown
 *
 * Source: https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/utils/userAgent.ts
 */

/**
 * Returns the parsed userAgent, with `os` set to the contents of the
 * parenthesised section (e.g. "arm64; macOS 15.2"), or "unknown" when the
 * format is not recognised.
 */
// eslint-disable-next-line visual/complexity
export function parsePlaywrightUserAgent(userAgent: string | undefined): { os: string } {
  if (!userAgent) return { os: 'unknown' };

  const open = userAgent.indexOf('(');
  const close = userAgent.indexOf(')');
  if (open === -1 || close === -1 || close <= open) return { os: 'unknown' };

  const os = userAgent.slice(open + 1, close).trim();
  return { os: os || 'unknown' };
}
