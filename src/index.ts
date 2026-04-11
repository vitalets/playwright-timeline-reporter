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
} from '@playwright/test/reporter';
import { getRunInfo } from './run-info.js';
import { JsonStream } from './utils/json-stream.js';
import {
  resolveOptions,
  TimelineReporterOptions,
  TimelineReporterOptionsResolved,
} from './options.js';
import { MergeReports } from './merge-reports.js';
import { TestTimingsBuilder } from './test-timings/index.js';

export type { TimelineReporterOptions };

const logger = console;

export default class TimelineReporter implements Reporter {
  protected options: TimelineReporterOptionsResolved;
  protected configDir = '';
  protected config!: FullConfig;
  protected stream?: JsonStream;
  protected mergeReports = new MergeReports();
  protected currentMergeReportId?: string;

  constructor(options?: TimelineReporterOptions) {
    this.options = resolveOptions(options);
  }

  printsToStdio() {
    return false;
  }

  onBegin(config: FullConfig) {
    this.config = config;
    this.configDir = config.configFile ? path.dirname(config.configFile) : process.cwd();
    this.mergeReports.tryProcessReportFiles();
    this.openStream();
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (this.mergeReports.error) return;
    if (result.status === 'skipped') return;

    const data = new TestTimingsBuilder(test, result, {
      configDir: this.configDir,
      pwVersion: this.config.version,
    }).build();

    const mergeReportId = this.mergeReports.resolveMergeReportId(result);
    if (mergeReportId !== undefined) this.currentMergeReportId = mergeReportId;
    data.mergeReportId = this.currentMergeReportId;

    this.stream?.write(data);
  }

  async onEnd(result: FullResult) {
    const runInfo = getRunInfo(
      result,
      this.config!,
      this.mergeReports.reports,
      this.mergeReports.error,
    );
    await this.stream?.close({
      '// __RUN_INFO__': runInfo,
      '// __PROMPT_TEMPLATE__': this.getPromptTemplate() || '',
    });
  }

  private openStream() {
    const templatePath = fileURLToPath(new URL('./report/index.tpl.html', import.meta.url));
    const template = fs.readFileSync(templatePath, 'utf8');
    const filePath = this.resolveOutputFile();
    this.stream = new JsonStream({ template, filePath });
    this.stream.open();
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
}
