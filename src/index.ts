/** Orchestrate timeline data collection, Markdown reporting, and merged report identity. */
import type {
  Reporter,
  TestCase,
  TestResult,
  FullConfig,
  FullResult,
  Suite,
} from '@playwright/test/reporter';
import {
  resolveOptions,
  TimelineReporterOptions,
  TimelineReporterOptionsResolved,
} from './options.js';
import { MergeReports } from './merge-reports.js';
import { DataCollector } from './data-collector.js';
import { MarkdownReporter } from './markdown/reporter.js';

export type { TimelineReporterOptions };

export default class TimelineReporter implements Reporter {
  protected options: TimelineReporterOptionsResolved;
  protected mergeReports = new MergeReports();
  protected currentMergeReportId?: string;
  protected dataCollector?: DataCollector;
  private isMerging = process.argv.includes('merge-reports');
  private markdownReporter?: MarkdownReporter;

  constructor(options?: TimelineReporterOptions) {
    this.options = resolveOptions(options);
    this.dataCollector = new DataCollector(this.mergeReports, this.options);
    if (this.options.markdownFile || this.options.markdownCI) {
      this.markdownReporter = new MarkdownReporter(this.mergeReports, this.options);
    }
  }

  printsToStdio() {
    return false;
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.mergeReports.tryProcessReportFiles();
    this.dataCollector?.onBegin(config);
    this.markdownReporter?.onBegin(config, suite, this.isMerging);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (this.mergeReports.error) return;
    if (result.status === 'skipped') return;
    const mergeReportId = this.resolveMergeReportId(result);
    if (this.mergeReports.error) return;
    this.markdownReporter?.onTestEnd(test, result, mergeReportId);
    this.dataCollector?.onTestEnd(test, result, mergeReportId);
  }

  async onEnd(result: FullResult) {
    await this.dataCollector?.onEnd(result);
    this.markdownReporter?.onEnd(result);
  }

  private resolveMergeReportId(result: TestResult) {
    if (!this.isMerging) return;
    const reportId = this.mergeReports.resolveMergeReportId(result);
    if (reportId !== undefined) this.currentMergeReportId = reportId;
    // Results without a worker have no execution identity; retain their existing HTML attribution.
    return result.workerIndex < 0 ? this.currentMergeReportId : reportId;
  }
}
