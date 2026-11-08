/** Public options and config-relative output path for the Markdown reporter. */
import path from 'node:path';
import type { FullConfig } from '@playwright/test/reporter';

const DEFAULT_MARKDOWN_FILE = 'timeline-report/index.md';

export type MarkdownReporterOptions = {
  /** Enable Markdown at the default path, or specify a config-relative destination. */
  markdownFile?: boolean | string;
  /** Append the Markdown timeline to the GitHub Actions workflow summary. */
  markdownCI?: boolean;
};

export function resolveMarkdownOutputFile(config: FullConfig, options: MarkdownReporterOptions) {
  const dir = config.configFile ? path.dirname(config.configFile) : process.cwd();
  const file =
    typeof options.markdownFile === 'string' ? options.markdownFile : DEFAULT_MARKDOWN_FILE;
  return path.resolve(dir, file);
}
