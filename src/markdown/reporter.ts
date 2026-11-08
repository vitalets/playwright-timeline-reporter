/** Collect worker activity and save the Markdown timeline at the end of a run. */
import fs from 'node:fs';
import path from 'node:path';
import type {
  FullConfig,
  FullResult,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import { MarkdownReporterData } from './reporter-data.js';
import type { MergeReports } from '../merge-reports.js';
import { resolveMarkdownOutputFile, type MarkdownReporterOptions } from './options.js';
import { renderMarkdown } from './render.js';
import { appendGitHubSummary } from './github-summary.js';

export class MarkdownReporter {
  private data!: MarkdownReporterData;
  private outputFile = '';

  constructor(
    private mergeReports: MergeReports,
    private options: MarkdownReporterOptions,
  ) {}

  onBegin(config: FullConfig, suite: Suite, isMerging: boolean) {
    this.outputFile = resolveMarkdownOutputFile(config, this.options);
    this.data = new MarkdownReporterData(
      config,
      suite,
      isMerging ? this.mergeReports.reports : undefined,
    );
  }

  onTestEnd(test: TestCase, result: TestResult, mergeReportId?: string) {
    this.data.addTestResult(test, result, mergeReportId);
  }

  onEnd(result: FullResult) {
    const markdown = renderMarkdown(this.data.build(result, this.mergeReports.error));
    if (this.options.markdownFile) this.saveFile(markdown);
    if (this.options.markdownCI) appendGitHubSummary(markdown);
  }

  private saveFile(markdown: string) {
    const summaryFile = process.env.GITHUB_STEP_SUMMARY;
    const sameFile = summaryFile && path.resolve(summaryFile) === path.resolve(this.outputFile);
    fs.mkdirSync(path.dirname(this.outputFile), { recursive: true });
    if (!sameFile) fs.writeFileSync(this.outputFile, markdown);
  }
}
