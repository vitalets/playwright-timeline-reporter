/**
 * Serializable run info based on Playwright's FullResult with dates converted to timestamps.
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import getOsName from 'os-name';
import type { FullConfig, FullResult } from '@playwright/test/reporter';

export type RunInfo = {
  reporterVersion: string;
  reporterError?: string;
  debug?: boolean;
  status: FullResult['status'];
  startTime: number;
  duration: number;
  fullyParallel?: boolean;
  playwrightVersion: string;
  nodeVersion: string;
  osName: string;
  mergeReports: Record<string, MergeReportInfo>;
};

export type MergeReportInfo = {
  reportId: string;
  startTime: number;
  duration: number;
  status: FullResult['status'];
  shardIndex?: number; // shard index is optional, e.g. full run on win/linux
  fullyParallel?: boolean;
  userAgent?: string;
  tag?: string;
};

// eslint-disable-next-line max-params
export function getRunInfo(
  result: FullResult,
  config: FullConfig,
  mergeReports: Record<string, MergeReportInfo>,
  reporterError?: string,
  debug?: boolean,
): RunInfo {
  return {
    reporterVersion: getReporterVersion(),
    reporterError,
    debug,
    status: result.status,
    startTime: result.startTime.getTime(),
    duration: result.duration,
    // This info might be splitted per shards.
    // See: https://github.com/microsoft/playwright/issues/38962
    fullyParallel: config.fullyParallel,
    playwrightVersion: config.version,
    nodeVersion: process.version,
    osName: getOsName(),
    mergeReports,
  };
}

function getReporterVersion() {
  const pkgPath = fileURLToPath(new URL('../package.json', import.meta.url));
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  return pkg.version;
}
