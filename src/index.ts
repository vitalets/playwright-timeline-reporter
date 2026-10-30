/**
 * Playwright reporter that generates an interactive timeline visualization of test execution.
 */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type {
  Reporter,
  TestCase,
  TestResult,
  FullConfig,
  FullResult,
  Suite,
} from '@playwright/test/reporter';
import { getRunInfo, RunInfo } from './run-info.js';
import { JsonStream } from './utils/json-stream.js';
import {
  resolveOptions,
  TimelineReporterOptions,
  TimelineReporterOptionsResolved,
} from './options.js';
import { MergeReports } from './merge-reports.js';
import { TestTimingsBuilder } from './test-timings/index.js';
import { TestTimings } from './test-timings/types.js';
import { MarkdownReporter } from './markdown/reporter.js';

export type { TimelineReporterOptions };

const TEMPLATE_PATH = fileURLToPath(new URL('./report/index.tpl.html', import.meta.url));

const logger = console;

export default class TimelineReporter implements Reporter {
  protected options: TimelineReporterOptionsResolved;
  protected configDir = '';
  protected config!: FullConfig;
  protected stream?: JsonStream;
  protected mergeReports = new MergeReports();
  protected currentMergeReportId?: string;
  protected htmlEnabled = true;
  private isMerging = process.argv.includes('merge-reports');
  private markdownReporter?: MarkdownReporter;

  constructor(options?: TimelineReporterOptions) {
    this.options = resolveOptions(options);
    if (this.options.markdown) {
      this.markdownReporter = new MarkdownReporter(this.options);
    }
  }

  printsToStdio() {
    return false;
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.config = config;
    this.configDir = config.configFile ? path.dirname(config.configFile) : process.cwd();
    this.mergeReports.tryProcessReportFiles();
    if (this.htmlEnabled) this.openStream();
    this.markdownReporter?.onBegin(
      config,
      suite,
      this.isMerging ? this.mergeReports.reports : undefined,
    );
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (this.mergeReports.error) return;
    if (result.status === 'skipped') return;
    const mergeReportId = this.resolveMergeReportId(result);
    if (this.mergeReports.error) return;
    this.markdownReporter?.onTestEnd(test, result, mergeReportId);
    if (!this.htmlEnabled) return;

    const data = new TestTimingsBuilder(test, result, {
      configDir: this.configDir,
      pwVersion: this.config.version,
    }).build();

    data.mergeReportId = mergeReportId;

    this.writeStream(data);
  }

  async onEnd(result: FullResult) {
    if (this.htmlEnabled) {
      const runInfo = getRunInfo(
        result,
        this.config!,
        this.mergeReports.reports,
        this.mergeReports.error,
        this.options.debug,
      );
      await this.closeStream(runInfo);
    }
    this.markdownReporter?.onEnd(this.mergeReports.error);
  }

  private resolveMergeReportId(result: TestResult) {
    if (!this.isMerging) return;
    const reportId = this.mergeReports.resolveMergeReportId(result);
    if (reportId !== undefined) this.currentMergeReportId = reportId;
    // Results without a worker have no execution identity; retain their existing HTML attribution.
    return result.workerIndex < 0 ? this.currentMergeReportId : reportId;
  }

  private openStream() {
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    const outputFile = this.resolveOutputFile();
    this.stream = new JsonStream({ template, filePath: outputFile });
    this.stream.open();
  }

  protected writeStream(data: TestTimings) {
    this.stream?.write(data);
  }

  protected async closeStream(runInfo: RunInfo) {
    await this.stream?.close({
      '// __RUN_INFO__': runInfo,
      '// __PROMPT_TEMPLATE__': this.getPromptTemplate() || '',
    });
  }

  private getPromptTemplate() {
    const { promptTemplateFile } = this.options;
    if (!promptTemplateFile) return;

    try {
      const promptFilePath = path.resolve(this.configDir, promptTemplateFile);
      const prompt = fs.readFileSync(promptFilePath, 'utf8');

      if (!prompt.includes('{data}')) {
        this.warn(
          `Custom prompt template should include the "{data}" placeholder. Provided template: ${promptTemplateFile}`,
        );
      }

      return prompt;
    } catch (e) {
      this.warn(
        `Failed to read prompt template file: ${promptTemplateFile}.\nError: ${e?.message}`,
      );
    }
  }

  private resolveOutputFile() {
    // Resolve reporter output file from the Playwright config dir.
    // Playwright does the same for built-in reporters.
    // The only difference: for default values, Playwright resolves
    // against the closest package.json. This value isn't exposed via
    // the reporter API, so we follow a simple approach—always resolve from the config dir.
    // See: https://github.com/microsoft/playwright/blob/main/packages/playwright/src/util.ts#L246
    return path.resolve(this.configDir, this.options.outputFile);
  }

  private warn(message: string) {
    logger.warn(`[timeline-reporter]: ${message}`);
  }

  // for future use
  // private debug(message: string, data?: unknown) {
  //   if (!this.options.debug) return;
  //   logger.log('[timeline-reporter:debug]', message, data ?? '');
  // }
}
