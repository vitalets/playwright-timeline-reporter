/** Markdown-only entry point using the shared reporter without HTML timing reconstruction. */
import TimelineReporter from '../index.js';
import type { MarkdownReporterOptions } from './options.js';

export type { MarkdownReporterOptions } from './options.js';

export default class MarkdownReporter extends TimelineReporter {
  constructor(options: MarkdownReporterOptions = {}) {
    super({
      markdownFile: options.markdownFile ?? true,
      markdownCI: options.markdownCI ?? true,
    });
    this.dataCollector = undefined;
  }
}
