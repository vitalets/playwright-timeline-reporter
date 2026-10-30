/** Public options and config-relative output path for the Markdown reporter. */
import path from 'node:path';
import type { FullConfig } from '@playwright/test/reporter';

export type MarkdownReporterOptions = {
  /** Enable Markdown at the default path, or specify a config-relative destination. */
  markdown?: boolean | string;
};

export function resolveMarkdownOutputFile(config: FullConfig, options: MarkdownReporterOptions) {
  const dir = config.configFile ? path.dirname(config.configFile) : process.cwd();
  const file = typeof options.markdown === 'string' ? options.markdown : 'timeline-report/index.md';
  return path.resolve(dir, file);
}
