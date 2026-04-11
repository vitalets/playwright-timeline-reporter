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
  firstTestResult: TestResult;
  fullResult: FullResult;
};

function createPwMergeReportsCommand() {
  // Mirror the Playwright CLI shape for `merge-reports [dir]` so commander can
  // reliably distinguish the positional reports directory from known options.
  // See: https://github.com/microsoft/playwright/blob/main/packages/playwright/src/program.ts#L128
  return new Command()
    .exitOverride()
    .option('-c, --config <file>')
    .option('--reporter <reporter>')
    .argument('[dir]');
}

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
    const testResultId = getTestResultId(result);
    if (!testResultId) {
      // todo: set error or warning?
      return;
    }
    return this.testResultIdToReportId[testResultId];
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
    const testResultId = getTestResultId(events.firstTestResult);
    this.testResultIdToReportId[testResultId] = reportId;
    this.reports[reportId] = {
      reportId,
      startTime: getResultStartTime(events.fullResult),
      duration: events.fullResult.duration,
      shardIndex: events.metadata.shard?.current,
      userAgent: events.metadata.userAgent,
      fullyParallel: events.config.fullyParallel,
      status: events.fullResult.status,
    };
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

function getReportFiles(reportDir: string) {
  return fs
    .readdirSync(reportDir)
    .filter((entry) => entry.endsWith('.jsonl'))
    .map((entry) => path.join(reportDir, entry));
}

function extractReportEvents(filePath: string) {
  const state: Partial<ExtractedReportEvents> = {};
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

  if (event.method === 'onTestEnd' && event.params?.result && !state.firstTestResult) {
    state.firstTestResult = event.params.result as TestResult;
  }

  if (event.method === 'onEnd' && event.params?.result) {
    state.fullResult = event.params.result as FullResult;
  }
}

function getCompleteReportEvents(
  state: Partial<ExtractedReportEvents>,
): ExtractedReportEvents | undefined {
  const { metadata, config, firstTestResult, fullResult } = state;
  if (!metadata || !config || !firstTestResult || !fullResult) return;
  return { metadata, config, firstTestResult, fullResult };
}

function getResultStartTime(fullResult: FullResult) {
  const startTime = fullResult.startTime;
  return startTime instanceof Date ? startTime.getTime() : Number(startTime);
}

function getTestResultId(result: TestResult) {
  const resultWithIds = result as TestResult & { _id?: string; id?: string };
  return resultWithIds._id ?? resultWithIds.id ?? '';
}
