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
 * Returns architecture and OS/version separately, with "unknown" for missing
 * fields or an unrecognised user-agent format.
 */
export function parsePlaywrightUserAgent(userAgent: string | undefined): {
  arch: string;
  os: string;
} {
  const match = userAgent?.match(/\(([^;()]*);\s*([^()]*)\)/);
  return {
    arch: match?.[1].trim() || 'unknown',
    os: match?.[2].trim() || 'unknown',
  };
}
