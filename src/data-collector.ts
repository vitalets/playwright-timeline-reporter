/** Collect test timings and stream the self-contained HTML timeline report. */
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { FullConfig, FullResult, TestCase, TestResult } from '@playwright/test/reporter';
import { getRunInfo, type RunInfo } from './run-info.js';
import type { MergeReports } from './merge-reports.js';
import { JsonStream } from './utils/json-stream.js';
import type { TimelineReporterOptionsResolved } from './options.js';
import { TestTimingsBuilder } from './test-timings/index.js';
import type { TestTimings } from './test-timings/types.js';

const TEMPLATE_PATH = fileURLToPath(new URL('./report/index.tpl.html', import.meta.url));

const logger = console;

export class DataCollector {
  protected configDir = '';
  private config!: FullConfig;
  private stream?: JsonStream;

  constructor(
    private mergeReports: MergeReports,
    protected options: TimelineReporterOptionsResolved,
  ) {}

  onBegin(config: FullConfig) {
    this.config = config;
    this.configDir = config.configFile ? path.dirname(config.configFile) : process.cwd();
    this.openStream();
  }

  onTestEnd(test: TestCase, result: TestResult, mergeReportId?: string) {
    const data = new TestTimingsBuilder(test, result, {
      configDir: this.configDir,
      pwVersion: this.config.version,
    }).build();
    data.mergeReportId = mergeReportId;
    this.writeStream(data);
  }

  async onEnd(result: FullResult) {
    const runInfo = getRunInfo(
      result,
      this.config,
      this.mergeReports.reports,
      this.mergeReports.error,
      this.options.debug,
    );
    await this.closeStream(runInfo);
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
}
