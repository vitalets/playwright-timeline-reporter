import { MarkdownReporter } from '../../../dist/markdown/reporter.js';

export default class Reporter extends MarkdownReporter {
  constructor() {
    super({ markdown: process.env.MARKDOWN_OUTPUT_FILE });
  }

  onBegin(config, suite) {
    super.onBegin(config, suite, {
      1: { reportId: '1', status: 'passed', startTime: 0, duration: 0 },
    });
  }

  onTestEnd(test, result) {
    // Exercise the collector boundary independently of the orchestrator's identity check.
    super.onTestEnd(test, result, process.env.INTERNAL_REPORT_ID || undefined);
  }

  onEnd(result) {
    super.onEnd(result);
  }
}
