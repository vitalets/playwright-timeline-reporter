/**
 * This is a workaround to get shard info from merged Playwright runs.
 * Detect shard boundaries by reading extracted blob JSONL files.
 *
 * Hopefully, Playwright will support it natively:
 * - https://github.com/microsoft/playwright/issues/39679
 * - https://github.com/microsoft/playwright/issues/38962
 */
import fs from 'node:fs';
import path from 'node:path';
import { Command } from 'commander';
import type { FullConfig, FullResult, TestResult } from '@playwright/test/reporter';
import type { MergeReportInfo } from './run-info.js';

type JsonLineEvent = { method: string; params?: Record<string, unknown> };
type BlobMetadata = Record<string, unknown> & {
  shard?: { current?: number; total?: number };
  userAgent?: string;
};

type ExtractedReportEvents = {
  metadata: BlobMetadata;
  config: FullConfig;
  testResultIds: string[];
  fullResult: FullResult;
};

export class MergeReports {
  public reports: Record<string /* report id */, MergeReportInfo> = {};
  public error?: string;
  private testResultIdToReportId: Record<
    string /* test result id */,
    string /* merge report id */
  > = {};

  tryProcessReportFiles(argv = process.argv) {
    try {
      this.processReportFiles(argv);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.setError(`Failed to process shard files: ${message}`);
    }
  }

  resolveMergeReportId(result: TestResult) {
    if (result.status === 'skipped' || result.workerIndex < 0) return;
    if (this.error) return;
    const testResultId = getTestResultId(result);
    const reportId = this.testResultIdToReportId[testResultId];
    if (!reportId) {
      this.setError('Report identity unavailable for an executed test result.');
    }
    return reportId;
  }

  private processReportFiles(argv: string[]) {
    const cmdIndex = argv.findIndex((arg) => arg === 'merge-reports');
    if (cmdIndex === -1) return;

    const reportsDirArg = this.extractReportsDirFromCli(argv, cmdIndex);
    const reportsDir = this.resolveReportsDir(reportsDirArg);
    if (!reportsDir) return;

    const jsonlFiles = getReportFiles(reportsDir);
    if (jsonlFiles.length === 0) {
      this.setError(`No report files found in the merge reports directory: ${reportsDirArg}`);
      return;
    }

    for (const filePath of jsonlFiles) {
      this.processMergeReportFile(filePath);
    }
  }

  private processMergeReportFile(filePath: string) {
    const events = extractReportEvents(filePath);
    if (!events) {
      this.setError(
        `Failed to extract shard info from the report file: ${path.basename(filePath)}`,
      );
      return;
    }
    const reportId = (Object.keys(this.reports).length + 1).toString();
    this.registerResultIds(events.testResultIds, reportId);
    this.reports[reportId] = {
      reportId,
      startTime: getResultStartTime(events.fullResult),
      duration: events.fullResult.duration,
      shardIndex: events.metadata.shard?.current,
      shardTotal: events.metadata.shard?.total,
      userAgent: events.metadata.userAgent,
      fullyParallel: events.config.fullyParallel,
      status: events.fullResult.status,
    };
  }

  private registerResultIds(resultIds: string[], reportId: string) {
    for (const id of resultIds) {
      if (!id || this.testResultIdToReportId[id]) {
        this.setError('Missing or duplicate blob result IDs; report identity is ambiguous.');
      }
      this.testResultIdToReportId[id] = reportId;
    }
  }

  private extractReportsDirFromCli(argv: string[], cmdIndex: number) {
    const command = createPwMergeReportsCommand();
    return command.parse(argv.slice(cmdIndex + 1), { from: 'user' }).args[0] || '.';
  }

  private resolveReportsDir(reportsDirArg: string) {
    const reportsDir = path.resolve(process.cwd(), reportsDirArg);
    const stats = fs.statSync(reportsDir, { throwIfNoEntry: false });

    if (stats?.isDirectory()) {
      return reportsDir;
    } else {
      // keep reportsDirArg in teh error to not expose the full path
      this.setError(`The merge reports directory does not exist: ${reportsDirArg}`);
    }
  }

  private setError(message: string) {
    this.error = message;
    // console.warn(message);
  }
}

function createPwMergeReportsCommand() {
  // Mirror Playwright's merge CLI to distinguish the directory from known options.
  return new Command()
    .exitOverride()
    .option('-c, --config <file>')
    .option('--reporter <reporter>')
    .argument('[dir]');
}

function getReportFiles(reportDir: string) {
  return fs
    .readdirSync(reportDir)
    .filter((entry) => entry.endsWith('.jsonl'))
    .sort()
    .map((entry) => path.join(reportDir, entry));
}

function extractReportEvents(filePath: string) {
  const state: Partial<ExtractedReportEvents> = { testResultIds: [] };
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

  for (const line of lines) {
    const event = parseJsonLine(line);
    if (!event) continue;
    handleEvent(state, event);
  }

  return getCompleteReportEvents(state);
}

function parseJsonLine(line: string): JsonLineEvent | null {
  if (!line.trim()) return null;
  return JSON.parse(line) as JsonLineEvent;
}

// eslint-disable-next-line visual/complexity
function handleEvent(state: Partial<ExtractedReportEvents>, event: JsonLineEvent) {
  if (event.method === 'onBlobReportMetadata' && event.params) {
    state.metadata = event.params as BlobMetadata;
  }

  if (event.method === 'onConfigure' && event.params?.config) {
    state.config = event.params.config as FullConfig;
  }

  if (event.method === 'onTestEnd' && event.params?.result) {
    state.testResultIds!.push(getTestResultId(event.params.result as TestResult));
  }

  if (event.method === 'onEnd' && event.params?.result) {
    state.fullResult = event.params.result as FullResult;
  }
}

function getCompleteReportEvents(
  state: Partial<ExtractedReportEvents>,
): ExtractedReportEvents | undefined {
  const { metadata, config, testResultIds, fullResult } = state;
  if (!metadata || !config || !testResultIds || !fullResult) return;
  return { metadata, config, testResultIds, fullResult };
}

function getResultStartTime(fullResult: FullResult) {
  const startTime = fullResult.startTime;
  return startTime instanceof Date ? startTime.getTime() : Number(startTime);
}

function getTestResultId(result: TestResult) {
  const resultWithIds = result as TestResult & { _id?: string; id?: string };
  return resultWithIds._id ?? resultWithIds.id ?? '';
}
