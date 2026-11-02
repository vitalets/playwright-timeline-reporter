import { test, expect } from '@playwright/test';
import { parsePlaywrightUserAgent } from '../../src/report/data/user-agent.js';

test('user-agent parsing separates architecture from OS and handles missing fields', () => {
  for (const [agent, expected] of [
    ['Playwright/1.58.2 (arm64; macOS 26.3) node/20.20', { arch: 'arm64', os: 'macOS 26.3' }],
    ['Playwright/1.58.2 (x64; windows 10.0) node/20.20 CI/1', { arch: 'x64', os: 'windows 10.0' }],
    ['Playwright/1.58.2 ( x64 ; ubuntu 24.04 )', { arch: 'x64', os: 'ubuntu 24.04' }],
    ['Playwright/1.58.2 (; ubuntu 24.04)', { arch: 'unknown', os: 'ubuntu 24.04' }],
    ['Playwright/1.58.2 (arm64; )', { arch: 'arm64', os: 'unknown' }],
    [undefined, { arch: 'unknown', os: 'unknown' }],
    ['Playwright/unknown', { arch: 'unknown', os: 'unknown' }],
    ['Playwright/1.58.2 (arm64; ubuntu 24.04', { arch: 'unknown', os: 'unknown' }],
  ] as const)
    expect(parsePlaywrightUserAgent(agent)).toEqual(expected);
});
